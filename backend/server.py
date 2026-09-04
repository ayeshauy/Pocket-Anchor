"""Pocket Anchor - Backend
Provides auth, sanctuary onboarding, anchor public link, wall of hope,
private journal, mood pulses, guardian pulses, evidence/rebuilding plan,
survivor navigator AI chat, comfort AI, object-storage-backed uploads.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Header, Query, Cookie
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os, uuid, re, logging, requests, asyncio, hmac, io
from emailer import send_email, guardian_invite_html, weekly_summary_html, pulse_notify_html, owner_pulse_html

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

APP_URL = (os.environ.get("APP_PUBLIC_URL") or "").rstrip("/")
CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET", "")

import stripe
from fastapi.responses import RedirectResponse
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "pocket-anchor"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anchor")

# ---------------- Object Storage ----------------
_storage_key: Optional[str] = None

def init_storage(force: bool = False) -> Optional[str]:
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        return _storage_key
    except Exception as e:
        logger.error(f"storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(500, "Storage unavailable")
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------------- Models ----------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""
    sanctuary_name: Optional[str] = None
    sanctuary_slug: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)

class SessionInit(BaseModel):
    session_id: str

class OnboardingIn(BaseModel):
    sanctuary_name: str
    slug: Optional[str] = None

class MoodPulseIn(BaseModel):
    state: str  # grounded | hopeful | struggling
    intensity: int = 5
    note: Optional[str] = ""

class JournalIn(BaseModel):
    title: str
    body: str
    mood: str = "grounded"
    tags: List[str] = []
    is_private: bool = True

class HopeReasonIn(BaseModel):
    supporter_name: Optional[str] = "A kindred soul"
    kind: str = "text"  # text | photo | song | voice
    text: Optional[str] = ""
    media_path: Optional[str] = ""
    song_url: Optional[str] = ""

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: str = "comfort"  # comfort | survivor

class EvidenceIn(BaseModel):
    title: str
    description: str = ""
    incident_date: Optional[str] = None
    media_path: Optional[str] = ""
    tags: List[str] = []

class RebuildingGoalIn(BaseModel):
    track: str  # housing | financial | emotional | legal
    title: str
    done: bool = False

class GuardianInviteIn(BaseModel):
    email: str
    name: Optional[str] = None

class ToyPulseIn(BaseModel):
    guardian_email: Optional[str] = None
    note: Optional[str] = ""

class MemoryItemIn(BaseModel):
    title: str
    description: str = ""
    person: Optional[str] = ""  # name of loved one
    media_path: Optional[str] = ""
    kind: str = "photo"  # photo | voice | video | letter

# ---------------- Auth helpers ----------------
async def get_user_from_token(token: str) -> Optional[dict]:
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if isinstance(exp, str):
        exp = datetime.fromisoformat(exp)
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp and exp < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})

async def require_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("authorization") or ""
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return user

def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or f"anchor-{uuid.uuid4().hex[:6]}"

# ---------------- Auth endpoints ----------------
@api_router.post("/auth/session")
async def auth_session(payload: SessionInit, response: Response):
    # Exchange Emergent session_id for our session
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id}, timeout=15
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.error(f"session exchange failed: {e}")
        raise HTTPException(401, "Session exchange failed")

    email = data.get("email")
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture", "")
    session_token = data.get("session_token") or uuid.uuid4().hex

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name, "picture": picture,
            "sanctuary_name": None, "sanctuary_slug": None,
            "created_at": now_iso(),
        })
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at, "created_at": datetime.now(timezone.utc)
    })
    response.set_cookie("session_token", session_token, max_age=7*24*3600,
                        httponly=True, secure=True, samesite="none", path="/")
    return {"user": user_doc, "token": session_token}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await require_user(request)
    return user

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}

# ---------------- Onboarding / Sanctuary ----------------
@api_router.post("/onboarding")
async def onboarding(payload: OnboardingIn, request: Request):
    user = await require_user(request)
    base_slug = slugify(payload.slug or payload.sanctuary_name)
    slug = base_slug
    i = 1
    while await db.users.find_one({"sanctuary_slug": slug, "user_id": {"$ne": user["user_id"]}}, {"_id": 0}):
        i += 1
        slug = f"{base_slug}-{i}"
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"sanctuary_name": payload.sanctuary_name, "sanctuary_slug": slug}}
    )
    return {"sanctuary_name": payload.sanctuary_name, "sanctuary_slug": slug}

@api_router.get("/sanctuary/public/{slug}")
async def sanctuary_public(slug: str):
    u = await db.users.find_one({"sanctuary_slug": slug}, {"_id": 0, "email": 0})
    if not u:
        raise HTTPException(404, "Sanctuary not found")
    reasons_count = await db.hope_reasons.count_documents({"user_id": u["user_id"]})
    return {"name": u.get("sanctuary_name") or u["name"], "slug": slug, "reasons_count": reasons_count, "user_id": u["user_id"]}

# ---------------- Wall of Hope ----------------
@api_router.post("/hope/{slug}")
async def add_hope(slug: str, payload: HopeReasonIn):
    u = await db.users.find_one({"sanctuary_slug": slug}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Sanctuary not found")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": u["user_id"],
        "supporter_name": payload.supporter_name or "A kindred soul",
        "kind": payload.kind, "text": payload.text or "",
        "media_path": payload.media_path or "",
        "song_url": payload.song_url or "",
        "felt_count": 0, "is_favorite": False,
        "created_at": now_iso(),
    }
    await db.hope_reasons.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/hope")
async def list_hope(request: Request):
    user = await require_user(request)
    items = await db.hope_reasons.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.post("/hope/{item_id}/felt")
async def felt_hope(item_id: str, request: Request):
    user = await require_user(request)
    r = await db.hope_reasons.update_one({"id": item_id, "user_id": user["user_id"]}, {"$inc": {"felt_count": 1}})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api_router.post("/hope/{item_id}/favorite")
async def favorite_hope(item_id: str, request: Request):
    user = await require_user(request)
    item = await db.hope_reasons.find_one({"id": item_id, "user_id": user["user_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(404, "Not found")
    await db.hope_reasons.update_one({"id": item_id}, {"$set": {"is_favorite": not item.get("is_favorite", False)}})
    return {"ok": True}

@api_router.get("/hope/emergency")
async def emergency_archive(request: Request):
    user = await require_user(request)
    items = await db.hope_reasons.find(
        {"user_id": user["user_id"], "$or": [{"is_favorite": True}, {"felt_count": {"$gte": 1}}]},
        {"_id": 0}
    ).sort("felt_count", -1).to_list(50)
    if not items:
        items = await db.hope_reasons.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return items

# ---------------- Mood pulses ----------------
@api_router.post("/mood")
async def add_mood(payload: MoodPulseIn, request: Request):
    user = await require_user(request)
    doc = {"id": str(uuid.uuid4()), "user_id": user["user_id"],
           "state": payload.state, "intensity": payload.intensity,
           "note": payload.note or "", "created_at": now_iso()}
    await db.mood_pulses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/mood")
async def get_moods(request: Request):
    user = await require_user(request)
    items = await db.mood_pulses.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

# ---------------- Journal ----------------
@api_router.post("/journal")
async def add_journal(payload: JournalIn, request: Request):
    user = await require_user(request)
    doc = {"id": str(uuid.uuid4()), "user_id": user["user_id"],
           "title": payload.title, "body": payload.body, "mood": payload.mood,
           "tags": payload.tags, "is_private": payload.is_private,
           "created_at": now_iso()}
    await db.journal.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/journal")
async def list_journal(request: Request):
    user = await require_user(request)
    items = await db.journal.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.delete("/journal/{item_id}")
async def del_journal(item_id: str, request: Request):
    user = await require_user(request)
    await db.journal.delete_one({"id": item_id, "user_id": user["user_id"]})
    return {"ok": True}

# ---------------- Evidence Vault (Safety) ----------------
@api_router.post("/evidence")
async def add_evidence(payload: EvidenceIn, request: Request):
    user = await require_user(request)
    doc = {"id": str(uuid.uuid4()), "user_id": user["user_id"],
           "title": payload.title, "description": payload.description,
           "incident_date": payload.incident_date or now_iso(),
           "media_path": payload.media_path or "", "tags": payload.tags,
           "created_at": now_iso()}
    await db.evidence.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/evidence")
async def list_evidence(request: Request):
    user = await require_user(request)
    items = await db.evidence.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

# ---------------- Rebuilding plan ----------------
@api_router.post("/rebuilding")
async def add_goal(payload: RebuildingGoalIn, request: Request):
    user = await require_user(request)
    doc = {"id": str(uuid.uuid4()), "user_id": user["user_id"],
           "track": payload.track, "title": payload.title, "done": payload.done,
           "created_at": now_iso()}
    await db.rebuilding.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/rebuilding")
async def list_goals(request: Request):
    user = await require_user(request)
    items = await db.rebuilding.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return items

@api_router.patch("/rebuilding/{item_id}")
async def toggle_goal(item_id: str, request: Request):
    user = await require_user(request)
    g = await db.rebuilding.find_one({"id": item_id, "user_id": user["user_id"]}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Not found")
    await db.rebuilding.update_one({"id": item_id}, {"$set": {"done": not g.get("done", False)}})
    return {"ok": True}

# ---------------- Uploads ----------------
@api_router.post("/upload/public/{slug}")
async def upload_public(slug: str, file: UploadFile = File(...)):
    u = await db.users.find_one({"sanctuary_slug": slug}, {"_id": 0})
    if not u:
        raise HTTPException(404, "Sanctuary not found")
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin").lower()
    path = f"{APP_NAME}/public/{u['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "user_id": u["user_id"],
        "storage_path": result["path"], "original_filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "size": result.get("size", 0), "is_deleted": False,
        "visibility": "public", "created_at": now_iso()
    })
    return {"path": result["path"], "content_type": file.content_type}

@api_router.post("/upload")
async def upload_private(request: Request, file: UploadFile = File(...)):
    user = await require_user(request)
    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin").lower()
    path = f"{APP_NAME}/private/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["user_id"],
        "storage_path": result["path"], "original_filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "size": result.get("size", 0), "is_deleted": False,
        "visibility": "private", "created_at": now_iso()
    })
    return {"path": result["path"], "content_type": file.content_type}

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request, auth: Optional[str] = Query(None)):
    rec = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Not found")
    if rec.get("visibility") == "private":
        token = request.cookies.get("session_token") or auth
        if not token:
            hdr = request.headers.get("authorization") or ""
            if hdr.lower().startswith("bearer "):
                token = hdr.split(" ", 1)[1]
        user = await get_user_from_token(token or "")
        if not user or user["user_id"] != rec["user_id"]:
            raise HTTPException(401, "Not authorized")
    data, ct = get_object(path)
    return Response(content=data, media_type=rec.get("content_type") or ct)

# ---------------- AI: Comfort + Survivor Navigator ----------------
COMFORT_SYSTEM = (
    "You are Anchor, a gentle, trauma-informed companion for someone reaching out during a hard moment. "
    "Do not diagnose. Do not lecture. Do not moralize. Respond in 2-4 short sentences with warmth, "
    "acknowledgement, and one soft grounding suggestion (a breath, a sensory anchor, or naming a feeling). "
    "Never say 'I understand'. Never say 'sorry to hear'. Use plain, tender language."
)
SURVIVOR_SYSTEM = (
    "You are the Survivor Navigator - a trauma-informed guide for people navigating intimate-partner "
    "violence or crisis. You never pressure, never demand disclosure, never tell them what to do. "
    "Offer options in plain terms (safety planning, protective orders, hotline numbers, shelter search). "
    "Ask at most one gentle question. Keep replies under 5 sentences. If life is at risk, share 911 (US) "
    "and 988 (US crisis) without alarmism."
)

async def stream_ai(message: str, session_id: str, mode: str):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    system = SURVIVOR_SYSTEM if mode == "survivor" else COMFORT_SYSTEM
    chat = LlmChat(api_key=EMERGENT_KEY, session_id=session_id, system_message=system).with_model("anthropic", "claude-sonnet-4-6")
    try:
        async for ev in chat.stream_message(UserMessage(text=message)):
            if isinstance(ev, TextDelta):
                yield f"data: {ev.content}\n\n"
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logger.error(f"ai stream error: {e}")
        yield f"data: I'm here. Take one slow breath with me — in for 4, hold for 7, out for 8.\n\n"
    yield "data: [DONE]\n\n"

@api_router.post("/ai/chat")
async def ai_chat(payload: ChatIn, request: Request):
    sid = payload.session_id or uuid.uuid4().hex
    # Log message to db (best-effort)
    try:
        user = None
        token = request.cookies.get("session_token")
        if token:
            user = await get_user_from_token(token)
        await db.ai_messages.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["user_id"] if user else None,
            "session_id": sid, "mode": payload.mode,
            "role": "user", "text": payload.message,
            "created_at": now_iso(),
        })
    except Exception:
        pass
    return StreamingResponse(
        stream_ai(payload.message, sid, payload.mode),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

# ---------------- Guardians (Inner Circle) ----------------
@api_router.post("/guardians/invite")
async def invite_guardian(payload: GuardianInviteIn, request: Request):
    user = await require_user(request)
    if not payload.email or "@" not in payload.email:
        raise HTTPException(400, "Valid email required")
    existing = await db.guardians.find_one({"owner_user_id": user["user_id"], "guardian_email": payload.email.lower()}, {"_id": 0})
    if existing:
        return existing
    token = uuid.uuid4().hex + uuid.uuid4().hex
    doc = {
        "id": str(uuid.uuid4()),
        "owner_user_id": user["user_id"],
        "owner_slug": user.get("sanctuary_slug"),
        "guardian_email": payload.email.lower(),
        "guardian_name": payload.name or payload.email.split("@")[0],
        "status": "invited",  # invited | active
        "accept_token": token,
        "created_at": now_iso(),
    }
    await db.guardians.insert_one(doc)
    doc.pop("_id", None)
    # Email the invite (fixed template, recipient from server-side record — G4)
    accept_url = f"{APP_URL}/guardian/accept/{token}"
    circle_url = f"{APP_URL}/circle/{token}"
    subject, html = guardian_invite_html(user.get("name", ""), user.get("sanctuary_name") or user["name"], accept_url, circle_url)
    try:
        email_id = await send_email(to=payload.email.lower(), subject=subject, html=html)
        doc["emailed"] = bool(email_id)
    except Exception as e:
        logger.error(f"guardian invite email failed: {e}")
        doc["emailed"] = False
    return doc

@api_router.get("/guardians")
async def list_guardians(request: Request):
    user = await require_user(request)
    items = await db.guardians.find({"owner_user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return items

@api_router.delete("/guardians/{gid}")
async def remove_guardian(gid: str, request: Request):
    user = await require_user(request)
    await db.guardians.delete_one({"id": gid, "owner_user_id": user["user_id"]})
    return {"ok": True}

@api_router.post("/guardians/{gid}/pulse")
async def toy_pulse(gid: str, payload: ToyPulseIn, request: Request):
    user = await require_user(request)
    g = await db.guardians.find_one({"id": gid, "owner_user_id": user["user_id"]}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Guardian not found")
    # Record the pulse (notification feed on dashboard)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "kind": "toy_pulse",
        "guardian_id": gid,
        "guardian_name": g["guardian_name"],
        "note": payload.note or "",
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(doc)
    # Email the guardian their Thinking-of-You pulse
    try:
        owner_name = user.get("sanctuary_name") or user.get("name", "your person")
        circle_url = f"{APP_URL}/circle/{g['accept_token']}"
        subject, html = pulse_notify_html(g["guardian_name"], owner_name, payload.note or "", circle_url)
        await send_email(to=g["guardian_email"], subject=subject, html=html)
    except Exception as e:
        logger.error(f"pulse email to guardian failed: {e}")
    return {"ok": True, "message": f"Thinking-of-You sent to {g['guardian_name']}"}

@api_router.get("/guardians/feed")
async def guardian_feed(request: Request):
    """Supporter notifications: who left what, who sent a pulse."""
    user = await require_user(request)
    items = await db.notifications.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    # Also recent hope items as notifications
    recent = await db.hope_reasons.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(10)
    for r in recent:
        items.append({
            "id": f"hope-{r['id']}", "kind": "hope_reason",
            "guardian_name": r.get("supporter_name", "Someone"),
            "note": (r.get("text") or "")[:120],
            "created_at": r.get("created_at"),
        })
    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return items[:40]

# ---------------- Guardian accept + Circle (supporter portal) ----------------
@api_router.get("/guardians/accept/{token}")
async def accept_guardian(token: str):
    g = await db.guardians.find_one({"accept_token": token}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Invite not found")
    await db.guardians.update_one({"id": g["id"]}, {"$set": {"status": "active", "accepted_at": now_iso()}})
    owner = await db.users.find_one({"user_id": g["owner_user_id"]}, {"_id": 0, "email": 0})
    return {"ok": True, "guardian_name": g["guardian_name"],
            "sanctuary_name": (owner or {}).get("sanctuary_name") or (owner or {}).get("name", "your person"),
            "circle_url": f"/circle/{token}"}

@api_router.get("/circle/{token}")
async def circle_view(token: str):
    """Supporter portal: silent mood status of their person. Token-gated, no login."""
    g = await db.guardians.find_one({"accept_token": token, "status": "active"}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Circle not found or invite not yet accepted")
    owner = await db.users.find_one({"user_id": g["owner_user_id"]}, {"_id": 0, "email": 0})
    latest = await db.mood_pulses.find_one({"user_id": g["owner_user_id"]}, {"_id": 0}, sort=[("created_at", -1)])
    pulses_week = await db.mood_pulses.count_documents({
        "user_id": g["owner_user_id"],
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    reasons_week = await db.hope_reasons.count_documents({
        "user_id": g["owner_user_id"],
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    return {
        "guardian_name": g["guardian_name"],
        "sanctuary_name": (owner or {}).get("sanctuary_name") or (owner or {}).get("name", "your person"),
        "latest_mood": (latest or {}).get("state"),
        "pulses_this_week": pulses_week,
        "reasons_this_week": reasons_week,
        "owner_slug": g.get("owner_slug"),
    }

@api_router.post("/circle/{token}/pulse")
async def circle_pulse(token: str, payload: ToyPulseIn):
    g = await db.guardians.find_one({"accept_token": token, "status": "active"}, {"_id": 0})
    if not g:
        raise HTTPException(404, "Circle not found or invite not yet accepted")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": g["owner_user_id"],
        "kind": "toy_pulse",
        "guardian_id": g["id"],
        "guardian_name": g["guardian_name"],
        "note": payload.note or "",
        "created_at": now_iso(),
    }
    await db.notifications.insert_one(doc)
    # Email the owner that their guardian is thinking of them
    try:
        owner = await db.users.find_one({"user_id": g["owner_user_id"]}, {"_id": 0})
        if owner and owner.get("email"):
            subject, html = owner_pulse_html(owner.get("sanctuary_name") or owner.get("name", "friend"),
                                             g["guardian_name"], payload.note or "")
            await send_email(to=owner["email"], subject=subject, html=html)
    except Exception as e:
        logger.error(f"pulse email to owner failed: {e}")
    return {"ok": True}

# ---------------- Memory Vault (memorial archive) ----------------
@api_router.post("/memory")
async def add_memory(payload: MemoryItemIn, request: Request):
    user = await require_user(request)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "title": payload.title,
        "description": payload.description,
        "person": payload.person or "",
        "kind": payload.kind,
        "media_path": payload.media_path or "",
        "created_at": now_iso(),
    }
    await db.memory_vault.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/memory")
async def list_memory(request: Request):
    user = await require_user(request)
    items = await db.memory_vault.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.delete("/memory/{item_id}")
async def del_memory(item_id: str, request: Request):
    user = await require_user(request)
    await db.memory_vault.delete_one({"id": item_id, "user_id": user["user_id"]})
    return {"ok": True}

# ---------------- Health directory (Nomadic) ----------------
CLINICS = [
    {"id": "c1", "name": "Bumrungrad International", "city": "Bangkok", "country": "Thailand", "lat": 13.7469, "lng": 100.5528, "specialty": "General & Emergency", "languages": ["English", "Thai"], "trust": 9.7, "twenty_four_seven": True, "phone": "+66 2 066 8888"},
    {"id": "c2", "name": "Raffles Medical", "city": "Singapore", "country": "Singapore", "lat": 1.3067, "lng": 103.8557, "specialty": "General & Cardiology", "languages": ["English", "Mandarin"], "trust": 9.5, "twenty_four_seven": True, "phone": "+65 6311 1111"},
    {"id": "c3", "name": "Hospital CIMA", "city": "San José", "country": "Costa Rica", "lat": 9.9591, "lng": -84.1416, "specialty": "General & Dental", "languages": ["English", "Spanish"], "trust": 9.1, "twenty_four_seven": True, "phone": "+506 2208 1000"},
    {"id": "c4", "name": "American Hospital", "city": "Lisbon", "country": "Portugal", "lat": 38.7223, "lng": -9.1393, "specialty": "General & Travel Medicine", "languages": ["English", "Portuguese"], "trust": 9.0, "twenty_four_seven": False, "phone": "+351 21 000 0000"},
    {"id": "c5", "name": "Acibadem Maslak", "city": "Istanbul", "country": "Turkey", "lat": 41.1097, "lng": 29.0187, "specialty": "General & Dental", "languages": ["English", "Turkish", "Arabic"], "trust": 9.3, "twenty_four_seven": True, "phone": "+90 216 544 4444"},
    {"id": "c6", "name": "CDMX Médica Sur", "city": "Mexico City", "country": "Mexico", "lat": 19.2942, "lng": -99.1780, "specialty": "General & Emergency", "languages": ["English", "Spanish"], "trust": 9.2, "twenty_four_seven": True, "phone": "+52 55 5424 7200"},
]

@api_router.get("/clinics")
async def clinics(q: Optional[str] = None, only_24_7: bool = False):
    items = CLINICS
    if q:
        ql = q.lower()
        items = [c for c in items if ql in c["name"].lower() or ql in c["city"].lower() or ql in c["country"].lower()]
    if only_24_7:
        items = [c for c in items if c["twenty_four_seven"]]
    return items

# ---------------- Medical Vault ----------------
class MedRecordIn(BaseModel):
    kind: str  # medication | allergy | condition | visit
    label: str
    detail: str = ""

@api_router.post("/medical")
async def add_med(payload: MedRecordIn, request: Request):
    user = await require_user(request)
    doc = {"id": str(uuid.uuid4()), "user_id": user["user_id"],
           "kind": payload.kind, "label": payload.label, "detail": payload.detail,
           "created_at": now_iso()}
    await db.medical.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/medical")
async def list_med(request: Request):
    user = await require_user(request)
    items = await db.medical.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.delete("/medical/{item_id}")
async def del_med(item_id: str, request: Request):
    user = await require_user(request)
    await db.medical.delete_one({"id": item_id, "user_id": user["user_id"]})
    return {"ok": True}

# ---------------- Safety resources ----------------
RESOURCES = [
    {"id": "r1", "name": "988 Suicide & Crisis Lifeline", "country": "United States", "type": "Crisis Hotline", "phone": "988", "url": "https://988lifeline.org", "twenty_four_seven": True},
    {"id": "r2", "name": "National Domestic Violence Hotline", "country": "United States", "type": "IPV Hotline", "phone": "1-800-799-7233", "url": "https://thehotline.org", "twenty_four_seven": True},
    {"id": "r3", "name": "RAINN", "country": "United States", "type": "Sexual Assault", "phone": "1-800-656-4673", "url": "https://rainn.org", "twenty_four_seven": True},
    {"id": "r4", "name": "Refuge", "country": "United Kingdom", "type": "IPV Shelter", "phone": "0808 2000 247", "url": "https://refuge.org.uk", "twenty_four_seven": True},
    {"id": "r5", "name": "1800RESPECT", "country": "Australia", "type": "IPV Hotline", "phone": "1800 737 732", "url": "https://1800respect.org.au", "twenty_four_seven": True},
    {"id": "r6", "name": "Women Helpline India", "country": "India", "type": "IPV Hotline", "phone": "181", "url": "https://wcd.nic.in", "twenty_four_seven": True},
    {"id": "r7", "name": "SOS Amitié", "country": "France", "type": "Crisis Hotline", "phone": "09 72 39 40 50", "url": "https://sos-amitie.com", "twenty_four_seven": True},
]

@api_router.get("/resources")
async def resources(country: Optional[str] = None, kind: Optional[str] = None):
    items = RESOURCES
    if country:
        items = [r for r in items if country.lower() in r["country"].lower()]
    if kind:
        items = [r for r in items if kind.lower() in r["type"].lower()]
    return items

# ---------------- OG preview (link unfurling) ----------------
@api_router.get("/og/{slug}.png")
async def og_image(slug: str):
    from PIL import Image, ImageDraw, ImageFont
    u = await db.users.find_one({"sanctuary_slug": slug}, {"_id": 0, "email": 0})
    name = (u or {}).get("sanctuary_name") or (u or {}).get("name") or "Someone you love"
    latest = None
    if u:
        latest = await db.mood_pulses.find_one({"user_id": u["user_id"]}, {"_id": 0}, sort=[("created_at", -1)])
    mood = (latest or {}).get("state", "grounded")
    orb_main, orb_mid = {
        "grounded": ("#4C5D4B", "#8E9E8D"),
        "hopeful": ("#F7B557", "#C1521E"),
        "struggling": ("#9197AA", "#4D5468"),
    }.get(mood, ("#4C5D4B", "#8E9E8D"))
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), "#FBFBF9")
    d = ImageDraw.Draw(img)
    # Soft warmth blobs
    d.ellipse([W - 420, -180, W + 180, 420], fill="#FEF3DE")
    d.ellipse([-200, H - 260, 300, H + 240], fill="#FBEAE2")
    # Orb reflects the sanctuary's current weather
    d.ellipse([W - 430, H // 2 - 150, W - 130, H // 2 + 150], fill=orb_main)
    d.ellipse([W - 430, H // 2 - 150, W - 250, H // 2 + 30], fill=orb_mid)
    d.ellipse([W - 400, H // 2 - 120, W - 330, H // 2 - 50], fill="#FEF3DE")
    def font(size, serif=True):
        for p in ("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
                  "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
                  "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                  "/usr/share/fonts/truetype/freefont/FreeSans.ttf"):
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
        return ImageFont.load_default()
    try:
        f_eyebrow = font(26); f_h1 = font(72); f_sub = font(30); f_brand = font(24)
        d.text((90, 100), "A  Q U I E T   D O O R W A Y", font=f_eyebrow, fill="#8E9E8D")
        d.text((86, 160), "Give", font=f_h1, fill="#1F2623")
        d.text((86 + d.textlength("Give ", font=f_h1), 160), name, font=f_h1, fill="#C1521E")
        d.text((86, 250), "a reason to stay.", font=f_h1, fill="#1F2623")
        d.text((90, 360), "A photo. A voice note. A song they used to hum.", font=f_sub, fill="#535E56")
        d.text((90, 400), "No account. No likes. No read receipts.", font=f_sub, fill="#535E56")
        d.text((90, H - 90), "Pocket Anchor", font=f_brand, fill="#4C5D4B")
    except Exception as e:
        logger.error(f"og font error: {e}")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png",
                    headers={"Cache-Control": "public, max-age=3600"})

@api_router.get("/og/{slug}")
async def og_page(slug: str):
    """Serves OG meta for chat/crawler unfurls, then redirects humans to the SPA."""
    u = await db.users.find_one({"sanctuary_slug": slug}, {"_id": 0, "email": 0})
    name = (u or {}).get("sanctuary_name") or (u or {}).get("name") or "Someone you love"
    img = f"{APP_URL}/api/og/{slug}.png"
    spa = f"{APP_URL}/with/{slug}"
    html = f"""<!doctype html><html><head>
<meta charset="utf-8"/>
<title>Give {name} a reason to stay · Pocket Anchor</title>
<meta property="og:title" content="Give {name} a reason to stay"/>
<meta property="og:description" content="Leave a soft memory — a photo, a voice note, a song. No account, no likes, no read receipts."/>
<meta property="og:image" content="{img}"/>
<meta property="og:url" content="{spa}"/>
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta http-equiv="refresh" content="0;url={spa}"/>
</head><body style="background:#FBFBF9;font-family:Georgia,serif;text-align:center;padding-top:20vh">
<p style="color:#4C5D4B">Opening {name}'s sanctuary… <a href="{spa}" style="color:#C1521E">continue</a></p>
</body></html>"""
    return Response(content=html, media_type="text/html")

# ---------------- Weekly soft summary cron ----------------
async def run_weekly_summaries():
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    owners = await db.guardians.distinct("owner_user_id", {"status": "active"})
    for owner_id in owners:
        owner = await db.users.find_one({"user_id": owner_id}, {"_id": 0})
        if not owner:
            continue
        gs = await db.guardians.find({"owner_user_id": owner_id, "status": "active"}, {"_id": 0}).to_list(50)
        reasons = await db.hope_reasons.count_documents({"user_id": owner_id, "created_at": {"$gte": week_ago}})
        latest = await db.mood_pulses.find_one({"user_id": owner_id}, {"_id": 0}, sort=[("created_at", -1)])
        mood_state = (latest or {}).get("state")
        owner_name = owner.get("sanctuary_name") or owner.get("name", "your person")
        for g in gs:
            circle_url = f"{APP_URL}/circle/{g['accept_token']}"
            subject, html = weekly_summary_html(owner_name, g["guardian_name"], reasons, mood_state, circle_url)
            try:
                await send_email(to=g["guardian_email"], subject=subject, html=html)
            except Exception as e:
                logger.error(f"weekly summary to {g['guardian_email']} failed: {e}")

@api_router.post("/cron/weekly-summary")
async def cron_weekly_summary(request: Request):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.lower().startswith("bearer ") else ""
    if not token or not CRON_SECRET or not hmac.compare_digest(token, CRON_SECRET):
        raise HTTPException(401, "Unauthorized")
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid body")
    run_id = body.get("run_id") or request.headers.get("x-webhook-id")
    if run_id:
        if await db.cron_runs.find_one({"run_id": run_id}):
            return {"ok": True, "duplicate": True}
        await db.cron_runs.insert_one({"run_id": run_id, "ran_at": now_iso()})
    asyncio.create_task(run_weekly_summaries())
    return {"ok": True, "queued": True}

# ---------------- Stripe subscriptions (Nomad Pass / Enterprise) ----------------
PLANS = {
    "nomad-pass": "nomad_pass_monthly",
    "nomad-pass-yearly": "nomad_pass_yearly",
    "enterprise": "enterprise_seat",
}

@api_router.get("/stripe/checkout")
async def stripe_checkout(plan: str, seats: int = 1):
    cfg = PLANS.get(plan)
    if not cfg:
        raise HTTPException(400, "Unknown plan")
    seats = max(1, min(seats, 500))
    prices = stripe.Price.list(lookup_keys=[cfg], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, f"Price not found: {cfg}")
    price = prices[0]
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": seats}],
        mode="subscription",
        success_url=f"{APP_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{APP_URL}/pricing",
        metadata={"plan": plan},
    )
    try:
        session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
    except stripe.error.InvalidRequestError as e:
        msg = (e.user_message or "").lower()
        if "managed payments" in msg or "ineligible" in msg:
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
        else:
            raise
    await db.payment_transactions.insert_one({
        "session_id": session.id, "plan": plan, "seats": seats,
        "amount": (price.unit_amount or 0) * seats, "currency": price.currency,
        "status": "initiated", "payment_status": "pending",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    return RedirectResponse(session.url, status_code=303)

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_subscription_id": s.subscription,
                              "stripe_payment_intent_id": s.payment_intent,
                              "updated_at": now_iso()}})
                rec = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except stripe.error.StripeError:
            pass
    return {"session_id": rec["session_id"], "status": rec["status"], "payment_status": rec["payment_status"]}

@api_router.post("/stripe/link")
async def stripe_link(request: Request):
    user = await require_user(request)
    body = await request.json()
    sid = (body or {}).get("session_id")
    if not sid:
        raise HTTPException(400, "session_id required")
    rec = await db.payment_transactions.find_one({"session_id": sid}, {"_id": 0})
    if not rec:
        raise HTTPException(404, "Transaction not found")
    if rec.get("payment_status") != "paid":
        s = stripe.checkout.Session.retrieve(sid)
        if s.payment_status == "paid" or s.status == "complete":
            await db.payment_transactions.update_one(
                {"session_id": sid, "payment_status": {"$ne": "paid"}},
                {"$set": {"status": "completed", "payment_status": "paid",
                          "stripe_subscription_id": s.subscription, "updated_at": now_iso()}})
            rec = await db.payment_transactions.find_one({"session_id": sid}, {"_id": 0})
    if rec.get("payment_status") != "paid":
        raise HTTPException(402, "Payment not completed")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"subscription": {
        "active": True, "plan": rec.get("plan"),
        "stripe_subscription_id": rec.get("stripe_subscription_id"),
        "linked_at": now_iso(),
    }}})
    return {"ok": True, "plan": rec.get("plan")}

@api_router.get("/stripe/status")
async def stripe_status(request: Request):
    user = await require_user(request)
    sub = user.get("subscription") or {}
    return {"active": bool(sub.get("active")), "plan": sub.get("plan")}

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, os.environ.get("STRIPE_WEBHOOK_SECRET", ""))
    except Exception:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_subscription_id": obj.get("subscription"),
                      "stripe_payment_intent_id": obj.get("payment_intent"),
                      "updated_at": now_iso()}})
    elif t == "checkout.session.async_payment_succeeded":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"payment_status": "paid", "updated_at": now_iso()}})
    elif t == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": now_iso()}})
    elif t == "checkout.session.expired":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": now_iso()}})
    elif t == "charge.refunded":
        await db.payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now_iso()}})
    return {"status": "ok"}

# ---------------- Health check ----------------
@api_router.get("/")
async def root():
    return {"message": "Pocket Anchor API", "storage_ready": bool(_storage_key)}

# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    init_storage()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("sanctuary_slug")
    await db.user_sessions.create_index("session_token", unique=True)

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)
