"""Backend tests for Déjà (Core Layer) endpoints."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://anchor-hope.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MAIN_TOKEN = "test_session_1788529862368"
GATE_TOKEN = os.environ.get("GATE_TOKEN", "").strip()


def _client(token: str) -> requests.Session:
    s = requests.Session()
    s.cookies.set("session_token", token, domain="anchor-hope.preview.emergentagent.com")
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def main():
    return _client(MAIN_TOKEN)


@pytest.fixture(scope="module")
def gate():
    if not GATE_TOKEN:
        pytest.skip("No GATE_TOKEN env supplied")
    return _client(GATE_TOKEN)


# -------------------- Auth sanity --------------------
def test_auth_me_main(main):
    r = main.get(f"{API}/auth/me")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("email") == "ayesha.pocketagency@gmail.com"


def test_stripe_status_main_active(main):
    r = main.get(f"{API}/stripe/status")
    assert r.status_code == 200
    assert r.json().get("active") is True


def test_stripe_status_gate_inactive(gate):
    r = gate.get(f"{API}/stripe/status")
    assert r.status_code == 200
    assert r.json().get("active") is False


# -------------------- Dream extraction --------------------
DREAM_TEXT = (
    "I was carrying my luggage through a huge terminal, dragging a heavy suitcase past "
    "big glass windows. I could hear announcements echoing and I felt anxious but excited. "
    "Someone was playing a guitar softly near a gate."
)


@pytest.fixture(scope="module")
def created_dream(main):
    payload = {"text": DREAM_TEXT, "location": "Lisbon", "country": "Portugal", "tags": ["TEST_deja"]}
    r = main.post(f"{API}/deja/dreams", json=payload)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["text"] == DREAM_TEXT.strip()
    assert "id" in doc
    assert isinstance(doc.get("elements"), dict)
    # Must contain at least some of the extraction keys with lists
    els = doc["elements"]
    expected_keys = {"places", "objects", "people", "environment", "actions", "emotions", "colors", "sounds"}
    assert expected_keys.issubset(set(els.keys())), f"Missing keys: {expected_keys - set(els.keys())}"
    yield doc
    # Cleanup this single dream at end of module (destructive; leaves other data alone)
    try:
        main.delete(f"{API}/deja/dreams/{doc['id']}")
    except Exception:
        pass


def test_dream_extraction_has_elements(created_dream):
    assert created_dream["reflections"] == []
    assert created_dream["match_status"] is None


def test_dream_appears_in_list(main, created_dream):
    r = main.get(f"{API}/deja/dreams")
    assert r.status_code == 200
    ids = [d["id"] for d in r.json()]
    assert created_dream["id"] in ids


# -------------------- Reflection immutability --------------------
def test_reflection_appends_without_mutating_original(main, created_dream):
    did = created_dream["id"]
    original_text = created_dream["text"]
    original_created_at = created_dream["created_at"]
    r = main.post(f"{API}/deja/dreams/{did}/reflection", json={"text": "TEST_REFLECTION_1 - now I remember the guitar was a busker"})
    assert r.status_code == 200

    r = main.get(f"{API}/deja/dreams")
    assert r.status_code == 200
    d = next((x for x in r.json() if x["id"] == did), None)
    assert d is not None
    assert d["text"] == original_text, "Original dream text was mutated!"
    assert d["created_at"] == original_created_at, "Original created_at was mutated!"
    assert len(d.get("reflections", [])) == 1
    assert d["reflections"][0]["text"].startswith("TEST_REFLECTION_1")
    assert "at" in d["reflections"][0]


def test_reflection_404_for_missing_dream(main):
    r = main.post(f"{API}/deja/dreams/nope-does-not-exist/reflection", json={"text": "x"})
    assert r.status_code == 404


# -------------------- Semantic moment matching --------------------
@pytest.fixture(scope="module")
def created_moment(main, created_dream):
    # Wait a beat to ensure ordering
    time.sleep(1)
    payload = {
        "text": (
            "I just walked through the airport gate area with my rolling suitcase and heard someone playing guitar. "
            "It felt oddly familiar."
        ),
        "location": "Lisbon Airport",
        "country": "Portugal",
    }
    r = main.post(f"{API}/deja/moments", json=payload)
    assert r.status_code == 200, r.text
    doc = r.json()
    assert "id" in doc
    assert isinstance(doc.get("matches"), list)
    yield doc


def test_semantic_match_hits_dream(created_moment, created_dream):
    matches = created_moment["matches"]
    assert len(matches) >= 1, f"No semantic matches returned: {created_moment}"
    ids = [m["dream_id"] for m in matches]
    assert created_dream["id"] in ids, f"Airport/guitar/luggage dream not in matches: {ids}"
    top = next(m for m in matches if m["dream_id"] == created_dream["id"])
    assert top["similarity"] >= 60, f"Similarity too low: {top['similarity']}"
    assert "matching_elements" in top


def test_dream_match_status_becomes_possible(main, created_dream, created_moment):
    r = main.get(f"{API}/deja/dreams")
    d = next(x for x in r.json() if x["id"] == created_dream["id"])
    # After a moment with a match, match_status should be at least 'possible'
    assert d.get("match_status") in ("possible", "confirmed"), d


# -------------------- Verdict flow --------------------
def test_verdict_confirmed_updates_dream(main, created_dream, created_moment):
    mid = created_moment["id"]
    r = main.post(f"{API}/deja/moments/{mid}/verdict", json={"verdict": "confirmed"})
    assert r.status_code == 200
    # verify moment verdict
    r2 = main.get(f"{API}/deja/moments")
    m = next(x for x in r2.json() if x["id"] == mid)
    assert m["verdict"] == "confirmed"
    # dream match_status should now be confirmed
    r3 = main.get(f"{API}/deja/dreams")
    d = next(x for x in r3.json() if x["id"] == created_dream["id"])
    assert d["match_status"] == "confirmed"


def test_verdict_invalid_value(main, created_moment):
    r = main.post(f"{API}/deja/moments/{created_moment['id']}/verdict", json={"verdict": "maybe-lol"})
    assert r.status_code == 400


def test_verdict_404(main):
    r = main.post(f"{API}/deja/moments/does-not-exist/verdict", json={"verdict": "confirmed"})
    assert r.status_code == 404


# -------------------- Profile / Map / Export --------------------
def test_profile_shape(main):
    r = main.get(f"{API}/deja/profile")
    assert r.status_code == 200
    p = r.json()
    for k in ("dreams", "possible", "confirmed", "countries", "themes", "confirmed_moments"):
        assert k in p, f"Missing {k} in profile"
    assert p["dreams"] >= 1
    assert p["confirmed"] >= 1
    assert p["countries"] >= 1
    assert isinstance(p["themes"], list)
    assert isinstance(p["confirmed_moments"], list)


def test_map_grouping(main):
    r = main.get(f"{API}/deja/map")
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list)
    portugal = next((x for x in rows if x["country"] == "Portugal"), None)
    assert portugal is not None, f"Portugal missing from map: {rows}"
    assert portugal["dreams"] >= 1
    assert portugal["moments"] >= 1
    assert portugal["confirmed"] >= 1


def test_export_shape(main):
    r = main.get(f"{API}/deja/export")
    assert r.status_code == 200
    j = r.json()
    assert "exported_at" in j and "dreams" in j and "moments" in j
    assert isinstance(j["dreams"], list) and isinstance(j["moments"], list)
    assert len(j["dreams"]) >= 1


# -------------------- Auth gating --------------------
def test_unauthed_cannot_access(main):
    s = requests.Session()
    r = s.get(f"{API}/deja/dreams")
    assert r.status_code in (401, 403)


def test_gate_user_can_call_backend_but_frontend_gates(gate):
    """Backend does NOT gate on nomad-pass (only require_user). Frontend gates via /stripe/status.
    This documents current behaviour and verifies stripe status is inactive for gate user.
    """
    r = gate.get(f"{API}/stripe/status")
    assert r.status_code == 200
    assert r.json().get("active") is False
    # Backend endpoint currently returns 200 (no server-side gate); flag for review.
    r2 = gate.get(f"{API}/deja/dreams")
    assert r2.status_code == 200
    assert r2.json() == []


# -------------------- Destructive wipe on throwaway user only --------------------
def test_delete_all_wipes_gate_user_only(gate):
    # seed one dream on gate user
    r = gate.post(f"{API}/deja/dreams", json={"text": "TEST short dream to be wiped", "country": "Nowhere"})
    assert r.status_code == 200
    r = gate.get(f"{API}/deja/dreams")
    assert len(r.json()) >= 1
    r = gate.delete(f"{API}/deja/all")
    assert r.status_code == 200
    r = gate.get(f"{API}/deja/dreams")
    assert r.json() == []
