"""Iter14 backend tests: My Anchor hub, mood need_help, translate/medical, nearby q,
trusted-contacts/ping kind=know, medical media_path, gating & privacy page."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://anchor-hope.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
DOMAIN = "anchor-hope.preview.emergentagent.com"

MAIN_TOKEN = "test_session_1788529862368"
GATE_TOKEN = os.environ.get("GATE_TOKEN", "test_session_gate_1788760657342").strip()


def _client(token: str) -> requests.Session:
    s = requests.Session()
    s.cookies.set("session_token", token, domain=DOMAIN)
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def main():
    return _client(MAIN_TOKEN)


@pytest.fixture(scope="module")
def gate():
    return _client(GATE_TOKEN)


# ---- Auth sanity ----
def test_auth_me_main(main):
    r = main.get(f"{API}/auth/me")
    assert r.status_code == 200, r.text


def test_stripe_active_main(main):
    r = main.get(f"{API}/stripe/status")
    assert r.status_code == 200 and r.json().get("active") is True


def test_stripe_inactive_gate(gate):
    r = gate.get(f"{API}/stripe/status")
    assert r.status_code == 200 and r.json().get("active") is False


# ---- Mood need_help / no_talk (5 states) ----
@pytest.mark.parametrize("state", ["need_help", "no_talk"])
def test_mood_new_states_accepted(main, state):
    r = main.post(f"{API}/mood", json={"state": state, "intensity": 3, "note": "TEST_iter14"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["state"] == state
    assert "id" in j and "created_at" in j


# ---- My Anchor endpoints (subscription-gated) ----
def test_anchor_get_main(main):
    r = main.get(f"{API}/anchor")
    assert r.status_code == 200
    j = r.json()
    for k in ("anchor", "health_card", "trip_pack", "trusted_contacts"):
        assert k in j


def test_anchor_put_main(main):
    r = main.put(f"{API}/anchor", json={
        "name": "Ayesha", "blood_type": "O+", "allergies": "",
        "medications": "", "conditions": "", "emergency_contact": "",
        "insurance": "", "vaccinations": "", "doctors": "", "medical_history": ""
    })
    assert r.status_code == 200


def test_anchor_readiness_shape(main):
    r = main.get(f"{API}/anchor/readiness")
    assert r.status_code == 200
    j = r.json()
    assert "checks" in j and "anchored" in j
    for k in ("health_card", "trusted_contacts", "trip_pack", "emergency_card", "safety_plan"):
        assert k in j["checks"]


def test_anchor_gated_402_gate(gate):
    r = gate.get(f"{API}/anchor")
    assert r.status_code == 402, r.text


def test_anchor_readiness_gated(gate):
    r = gate.get(f"{API}/anchor/readiness")
    assert r.status_code == 402


# ---- Emergency Card (subscription-gated) ----
def test_emergency_card_put_get(main):
    r = main.put(f"{API}/emergency-card", json={
        "preferred_language": "Thai",
        "instructions": "TEST_iter14 speak slowly, allergic to penicillin",
        "show": {"name": True, "blood_type": True, "allergies": True, "medications": False,
                 "conditions": False, "emergency_contact": True},
    })
    assert r.status_code == 200
    r2 = main.get(f"{API}/emergency-card")
    assert r2.status_code == 200
    j = r2.json()
    assert "card" in j and "health" in j and "contacts" in j
    assert j["card"].get("preferred_language") == "Thai"
    assert j["card"].get("show", {}).get("name") is True


def test_emergency_card_gated(gate):
    r = gate.get(f"{API}/emergency-card")
    assert r.status_code == 402


# ---- Safety Plan (AUTH-ONLY, not paywalled) ----
def test_safety_plan_put_get_main(main):
    payload = {
        "warning_signs": "TEST_iter14 restless nights",
        "things_that_help": "cold water",
        "people": "sister",
        "places": "park",
        "avoid": "loud crowds",
        "emergency_instructions": "call sister",
    }
    r = main.put(f"{API}/safety-plan", json=payload)
    assert r.status_code == 200
    r2 = main.get(f"{API}/safety-plan")
    assert r2.status_code == 200
    j = r2.json()
    for k, v in payload.items():
        assert j.get(k) == v, f"Persistence mismatch on {k}: {j.get(k)!r} != {v!r}"


def test_safety_plan_auth_only_gate_user_200(gate):
    """Critical: gate user (no subscription) must still get 200 on safety-plan."""
    r = gate.get(f"{API}/safety-plan")
    assert r.status_code == 200, f"safety-plan should NOT be subscription-gated, got {r.status_code}: {r.text}"
    # PUT also allowed
    r2 = gate.put(f"{API}/safety-plan", json={"warning_signs": "TEST_iter14 gate note"})
    assert r2.status_code == 200


def test_safety_plan_unauthed_401(main):
    s = requests.Session()
    r = s.get(f"{API}/safety-plan")
    assert r.status_code in (401, 403)


# ---- Translate medical ----
def test_translate_medical_main(main):
    r = main.post(f"{API}/translate/medical", json={
        "symptoms": "sharp abdominal pain lower right, worsening 4 hours",
        "started": "this morning",
        "severity": "7/10",
        "allergies": "penicillin",
        "medications": "none",
        "language": "Thai",
    })
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("language") == "Thai"
    assert isinstance(j.get("translation"), str) and len(j["translation"]) > 20


def test_translate_medical_gated(gate):
    r = gate.post(f"{API}/translate/medical", json={"symptoms": "x", "language": "Thai"})
    assert r.status_code == 402


# ---- Nearby q param + emergency badges ----
def test_nearby_hospital_thailand(main):
    r = main.get(f"{API}/nearby", params={"category": "hospital", "q": "Thailand"})
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1, "Expected Thailand hospitals seeded"
    for it in items:
        assert "emergency" in it


def test_nearby_gated(gate):
    r = gate.get(f"{API}/nearby", params={"category": "hospital", "q": "Thailand"})
    assert r.status_code == 402


# ---- Trusted contacts ping know ----
def test_trusted_contacts_ping_know(main):
    # ensure at least one contact
    r_list = main.get(f"{API}/trusted-contacts")
    assert r_list.status_code == 200
    contact_id = None
    if not r_list.json():
        rc = main.post(f"{API}/trusted-contacts", json={
            "name": "TEST_iter14_contact", "email": "test_iter14@example.com",
            "phone": "+10000000", "relationship": "friend", "priority": 2, "notes": "TEST"
        })
        assert rc.status_code == 200
        contact_id = rc.json()["id"]
    r = main.post(f"{API}/trusted-contacts/ping", json={"kind": "know", "note": "TEST_iter14 ping"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "sent" in j and isinstance(j["sent"], int) and j["sent"] >= 0
    if contact_id:
        main.delete(f"{API}/trusted-contacts/{contact_id}")


# ---- Medical vault: lab kind with media_path ----
def test_medical_kind_lab_media_path(main):
    r = main.post(f"{API}/medical", json={
        "kind": "lab", "label": "TEST_iter14 CBC panel",
        "detail": "routine bloodwork", "media_path": "uploads/test_iter14_lab.pdf"
    })
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["kind"] == "lab"
    assert doc.get("media_path") == "uploads/test_iter14_lab.pdf"
    mid = doc["id"]
    # persistence
    r2 = main.get(f"{API}/medical")
    assert any(x["id"] == mid and x.get("media_path") == "uploads/test_iter14_lab.pdf" for x in r2.json())
    # cleanup
    main.delete(f"{API}/medical/{mid}")


# ---- Privacy page publicly served ----
def test_privacy_page_public():
    s = requests.Session()
    r = s.get(f"{BASE_URL}/privacy", allow_redirects=True)
    assert r.status_code == 200
    # Should be the SPA HTML
    assert "<div id=\"root\"" in r.text or "<!doctype html" in r.text.lower()
