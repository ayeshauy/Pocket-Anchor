"""Backend tests for Forever Anchor / Shared Memories feature."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://anchor-hope.preview.emergentagent.com').rstrip('/')
SLUG = 'ayesha'
SESSION_COOKIE = 'test_session_1788529862368'


@pytest.fixture(scope="module")
def anon():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def authed():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    s.cookies.set('session_token', SESSION_COOKIE, domain='anchor-hope.preview.emergentagent.com')
    return s


# ---------- Public endpoint ----------
class TestSanctuaryPublic:
    def test_returns_collection_and_counts(self, anon):
        r = anon.get(f"{BASE_URL}/api/sanctuary/public/{SLUG}")
        assert r.status_code == 200
        data = r.json()
        assert data['slug'] == SLUG
        assert 'collection' in data and isinstance(data['collection'], list)
        assert 'category_counts' in data and isinstance(data['category_counts'], dict)
        # every item exposed must be consented + shared/forever
        for it in data['collection']:
            assert it.get('consent_shared') is True, f"Non-consented item leaked: {it.get('id')}"
            assert it.get('visibility') in ('shared', 'forever'), f"Private item leaked: {it.get('id')}"
        # category_counts sums to len(collection)
        assert sum(data['category_counts'].values()) == len(data['collection'])

    def test_not_found(self, anon):
        r = anon.get(f"{BASE_URL}/api/sanctuary/public/__no_such_slug__")
        assert r.status_code == 404


# ---------- Submission flow ----------
class TestAddHope:
    def test_add_with_consent(self, anon):
        payload = {"supporter_name": "TEST_Automation", "kind": "text",
                   "text": "TEST_ backend test consent true smile",
                   "reason": "smile", "consent_shared": True}
        r = anon.post(f"{BASE_URL}/api/hope/{SLUG}", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d['reason'] == 'smile'
        assert d['consent_shared'] is True
        assert d['visibility'] == 'private'
        assert '_id' not in d
        assert 'id' in d
        pytest.consented_id = d['id']

    def test_add_without_consent(self, anon):
        payload = {"supporter_name": "TEST_Automation", "kind": "text",
                   "text": "TEST_ backend test consent false hope",
                   "reason": "hope", "consent_shared": False}
        r = anon.post(f"{BASE_URL}/api/hope/{SLUG}", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d['reason'] == 'hope'
        assert d['consent_shared'] is False
        assert d['visibility'] == 'private'
        pytest.nonconsented_id = d['id']

    def test_add_bad_slug(self, anon):
        r = anon.post(f"{BASE_URL}/api/hope/__no_such_slug__",
                      json={"text": "x", "reason": "stay"})
        assert r.status_code == 404


# ---------- Visibility control ----------
class TestVisibility:
    def test_share_nonconsented_returns_403(self, authed):
        item_id = getattr(pytest, 'nonconsented_id', None)
        assert item_id, "nonconsented item was not created"
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "shared"})
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

    def test_forever_nonconsented_returns_403(self, authed):
        item_id = getattr(pytest, 'nonconsented_id', None)
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "forever"})
        assert r.status_code == 403

    def test_share_consented_works(self, authed, anon):
        item_id = getattr(pytest, 'consented_id', None)
        assert item_id
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "shared"})
        assert r.status_code == 200
        # verify GET public shows it
        pub = anon.get(f"{BASE_URL}/api/sanctuary/public/{SLUG}").json()
        ids = [x['id'] for x in pub['collection']]
        assert item_id in ids

    def test_forever_consented_works(self, authed, anon):
        item_id = getattr(pytest, 'consented_id', None)
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "forever"})
        assert r.status_code == 200
        pub = anon.get(f"{BASE_URL}/api/sanctuary/public/{SLUG}").json()
        for it in pub['collection']:
            if it['id'] == item_id:
                assert it['visibility'] == 'forever'
                return
        pytest.fail("Forever item missing from public collection")

    def test_back_to_private(self, authed):
        item_id = getattr(pytest, 'consented_id', None)
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "private"})
        assert r.status_code == 200

    def test_invalid_visibility(self, authed):
        item_id = getattr(pytest, 'consented_id', None)
        r = authed.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                        json={"visibility": "invalid"})
        assert r.status_code == 400

    def test_unauthenticated(self, anon):
        item_id = getattr(pytest, 'consented_id', None)
        r = anon.post(f"{BASE_URL}/api/hope/{item_id}/visibility",
                      json={"visibility": "shared"})
        assert r.status_code in (401, 403)


# ---------- Private items never leak on public ----------
class TestPrivacyGuard:
    def test_nonconsented_never_in_public(self, anon):
        pub = anon.get(f"{BASE_URL}/api/sanctuary/public/{SLUG}").json()
        item_id = getattr(pytest, 'nonconsented_id', None)
        ids = [x['id'] for x in pub['collection']]
        assert item_id not in ids
