import pytest


@pytest.mark.api
@pytest.mark.smoke
def test_successful_login_returns_a_token(reqres):
    response = reqres.login("eve.holt@reqres.in", "cityslicka")
    assert response.status == 200
    assert response.json()["token"]


@pytest.mark.api
@pytest.mark.negative
def test_login_without_a_password_is_rejected(reqres):
    response = reqres.login("eve.holt@reqres.in")
    assert response.status == 400
    assert response.json()["error"] == "Missing password"


@pytest.mark.api
@pytest.mark.negative
@pytest.mark.parametrize("email", ["", "not-an-email"])
def test_login_with_invalid_credentials_is_rejected(reqres, email):
    response = reqres.login(email, "somepassword")
    assert response.status == 400
    assert "error" in response.json()