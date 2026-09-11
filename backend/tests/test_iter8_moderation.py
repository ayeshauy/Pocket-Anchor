"""
Iteration 8 — Safety & Wellbeing Moderation Layer, recipient controls, PH resources.

Notes:
- Uses public preview URL from REACT_APP_BACKEND_URL.
- Uses seeded session cookie for ayesha (slug 'ayesha').
- Abuse guard: 6 submits / 10 min / fp+slug and 24h duplicate. Tests vary text and
  pace calls; we also stagger by using unique fingerprints (via distinct sessions)
  where needed. Kept ≤5 hope-POSTs per test session.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
SLUG = "ayesha"

# Session token seeded via mongosh — see conftest fixture below to (re)provision.
SESSION_TOKEN = os.environ.get("ITER8_SESSION") or "test_session_iter8_1789107025536"


@pytest.fixture(scope="session")
def public_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json",
                      "User-Agent": f"pytest-iter8-public-{uuid.uuid4().hex[:6]}"})
    return s


@pytest.fixture(scope="session")
def auth_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    s.cookies.set("session_token", SESSION_TOKEN)
    # sanity check auth
    r = s.get(f"{API}/anchor-settings")
    if r.status_code == 401:
        pytest.skip("Session token invalid — reseed via mongosh")
    return s


# ---------- PH Resources ----------
class TestPhilippinesResources:
    def test_ph_resources_present(self, public_client):
        r = public_client.get(f"{API}/resources", params={"country": "Philippines"})
        assert r.status_code == 200
        data = r.json()
        names = {x["name"] for x in data}
        assert len(data) >= 3
        assert "NCMH Crisis Hotline" in names
        assert "Hopeline Philippines" in names
        assert any("DSWD" in n for n in names)
        # NCMH phone 1553
        ncmh = next(x for x in data if x["name"] == "NCMH Crisis Hotline")
        assert ncmh["phone"] == "1553"


# ---------- Moderation endpoints ----------
class TestModerationDirect:
    def test_appeal_endpoint(self, public_client):
        r = public_client.post(f"{API}/moderate/appeal",
                               json={"slug": SLUG, "draft_text": "TEST_appeal iter8"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_rewrite_empty_400(self, public_client):
        r = public_client.post(f"{API}/moderate/rewrite", json={"text": ""})
        assert r.status_code == 400


# ---------- Hope submission moderation (via public /api/hope/{slug}) ----------
# Only 2 hope POSTs here to stay under abuse guard.
class TestHopeModeration:
    def test_green_kind_with_sadness_delivers(self, public_client):
        payload = {
            "supporter_name": f"TEST_Green_{uuid.uuid4().hex[:5]}",
            "kind": "text",
            "text": ("I miss you so much. I wish things were not so hard right now. "
                     "I love you and I am here whenever you want quiet company. "
                     f"[{uuid.uuid4().hex[:6]}]"),
            "song_url": "", "media_path": "",
            "reason": "loved", "consent_level": "recipient",
        }
        r = public_client.post(f"{API}/hope/{SLUG}", json=payload)
        assert r.status_code == 200, f"Sadness should be GREEN not blocked: {r.status_code} {r.text}"
        j = r.json()
        assert j["visibility"] == "private"
        assert j["consent_level"] == "recipient"

    def test_red_threat_blocked(self, public_client):
        # Use a fresh fingerprint (unique User-Agent) to avoid rate-limit
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json",
                          "User-Agent": f"pytest-iter8-red-{uuid.uuid4().hex[:8]}"})
        payload = {
            "supporter_name": f"TEST_Red_{uuid.uuid4().hex[:5]}",
            "kind": "text",
            "text": (f"I know where you live and I will come hurt you if you do not "
                     f"answer me right now [{uuid.uuid4().hex[:6]}]."),
            "song_url": "", "media_path": "",
            "reason": "smile", "consent_level": "recipient",
        }
        r = s.post(f"{API}/hope/{SLUG}", json=payload)
        assert r.status_code == 422, f"expected 422 blocked, got {r.status_code}: {r.text}"
        d = r.json().get("detail")
        assert isinstance(d, dict)
        assert d.get("moderation") == "blocked"


# ---------- Anchor Settings (auth) ----------
class TestAnchorSettings:
    def test_get_default(self, auth_client):
        r = auth_client.get(f"{API}/anchor-settings")
        assert r.status_code == 200
        s = r.json()
        assert "who" in s and "require_approval" in s and "allow_anonymous" in s

    def test_put_approval_then_restore(self, auth_client):
        # switch to approval
        r = auth_client.put(f"{API}/anchor-settings",
                            json={"who": "approval", "require_approval": True, "allow_anonymous": True})
        assert r.status_code == 200
        g = auth_client.get(f"{API}/anchor-settings").json()
        assert g["who"] == "approval"
        assert g["require_approval"] is True
        # restore
        r2 = auth_client.put(f"{API}/anchor-settings",
                             json={"who": "anyone", "require_approval": False, "allow_anonymous": True})
        assert r2.status_code == 200
        g2 = auth_client.get(f"{API}/anchor-settings").json()
        assert g2["who"] == "anyone"
        assert g2["require_approval"] is False

    def test_invalid_who(self, auth_client):
        r = auth_client.put(f"{API}/anchor-settings",
                            json={"who": "nope", "require_approval": False, "allow_anonymous": True})
        assert r.status_code == 400

    def test_get_unauth(self, public_client):
        r = public_client.get(f"{API}/anchor-settings")
        assert r.status_code == 401


# ---------- Visibility ceiling using consent_level ----------
class TestVisibilityCeiling:
    def test_public_visibility_requires_public_consent(self, auth_client):
        # Create an item via public API with consent_level=recipient
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json",
                          "User-Agent": f"pytest-iter8-vis-{uuid.uuid4().hex[:8]}"})
        payload = {
            "supporter_name": f"TEST_Vis_{uuid.uuid4().hex[:5]}",
            "kind": "text",
            "text": f"a gentle little hi [{uuid.uuid4().hex[:6]}]",
            "song_url": "", "media_path": "",
            "reason": "smile", "consent_level": "recipient",
        }
        r = s.post(f"{API}/hope/{SLUG}", json=payload)
        assert r.status_code == 200, r.text
        item_id = r.json()["id"]
        # Try to set public — should 403
        rv = auth_client.post(f"{API}/hope/{item_id}/visibility", json={"visibility": "public"})
        assert rv.status_code == 403
        # shared should also be blocked (recipient level)
        rv2 = auth_client.post(f"{API}/hope/{item_id}/visibility", json={"visibility": "shared"})
        assert rv2.status_code == 403
        # private is fine
        rv3 = auth_client.post(f"{API}/hope/{item_id}/visibility", json={"visibility": "private"})
        assert rv3.status_code == 200

    def test_report_flips_to_private(self, public_client, auth_client):
        # Create via unique fp
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json",
                          "User-Agent": f"pytest-iter8-rep-{uuid.uuid4().hex[:8]}"})
        payload = {
            "supporter_name": f"TEST_Rep_{uuid.uuid4().hex[:5]}",
            "kind": "text",
            "text": f"a soft memory only [{uuid.uuid4().hex[:6]}]",
            "song_url": "", "media_path": "",
            "reason": "memory", "consent_level": "circle",
        }
        r = s.post(f"{API}/hope/{SLUG}", json=payload)
        assert r.status_code == 200, r.text
        item_id = r.json()["id"]
        # Owner shares to circle
        rv = auth_client.post(f"{API}/hope/{item_id}/visibility", json={"visibility": "shared"})
        assert rv.status_code == 200
        # Anyone reports — should flip to private
        rr = public_client.post(f"{API}/hope/{item_id}/report", json={"category": "harassment"})
        assert rr.status_code == 200
        # Verify via list
        listing = auth_client.get(f"{API}/hope").json()
        it = next((x for x in listing if x["id"] == item_id), None)
        assert it is not None
        assert it["visibility"] == "private"
        assert it.get("reported") is True
