import io

import pytest

from app import app

CSV = ("timestamp,ph,turbidity_ntu,tds_ppm,dissolved_oxygen_mgL,temperature_c\n"
       "2026-10-01 06:00,7.2,2,300,8,24\n2026-10-01 06:15,9.5,7,700,4,30\n")


@pytest.fixture()
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    return app.test_client()


@pytest.fixture()
def csrf_client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = True
    yield app.test_client()
    app.config["WTF_CSRF_ENABLED"] = False


def test_health(client):
    assert client.get("/health").get_json() == {"status": "ok"}


def test_index_renders_with_security_headers(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Water Quality Monitoring" in response.data
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]


def test_simulate_endpoint(client):
    data = client.get("/api/simulate?n=40&seed=42").get_json()
    assert data["summary"]["total"] == 40


@pytest.mark.parametrize("query", ["n=abc", "n=1", "n=100000", "n=10&seed=x"])
def test_simulate_rejects_bad_params(client, query):
    assert client.get(f"/api/simulate?{query}").status_code == 400


def test_upload_valid_csv(client):
    resp = client.post("/api/process", data={"file": (io.BytesIO(CSV.encode()), "d.csv")},
                       content_type="multipart/form-data")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["summary"]["counts"]["UNSAFE"] == 1


def test_upload_requires_file(client):
    assert client.post("/api/process").status_code == 400


def test_upload_rejects_non_csv_extension(client):
    resp = client.post("/api/process", data={"file": (io.BytesIO(b"x"), "evil.exe")},
                       content_type="multipart/form-data")
    assert resp.status_code == 400


def test_upload_rejects_non_utf8(client):
    resp = client.post("/api/process", data={"file": (io.BytesIO(b"\xff\xfe\x00"), "d.csv")},
                       content_type="multipart/form-data")
    assert resp.status_code == 400


def test_upload_rejects_malformed_csv(client):
    resp = client.post("/api/process", data={"file": (io.BytesIO(b"a,b\n1,2\n"), "d.csv")},
                       content_type="multipart/form-data")
    assert resp.status_code == 400


def test_upload_too_large(client):
    big = b"a" * (1024 * 1024 + 10)
    resp = client.post("/api/process", data={"file": (io.BytesIO(big), "d.csv")},
                       content_type="multipart/form-data")
    assert resp.status_code == 413


def _upload(client, headers=None):
    return client.post("/api/process", data={"file": (io.BytesIO(CSV.encode()), "d.csv")},
                       content_type="multipart/form-data", headers=headers or {})


def test_upload_without_csrf_token_is_rejected(csrf_client):
    resp = _upload(csrf_client)
    assert resp.status_code == 400
    assert "CSRF" in resp.get_json()["error"]


def test_upload_with_valid_csrf_token_succeeds(csrf_client):
    page = csrf_client.get("/").get_data(as_text=True)
    token = page.split('name="csrf-token" content="')[1].split('"')[0]
    resp = _upload(csrf_client, {"X-CSRFToken": token})
    assert resp.status_code == 200
    assert resp.get_json()["summary"]["total"] == 2
