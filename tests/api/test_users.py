import pytest


@pytest.mark.api
@pytest.mark.smoke
def test_list_users_returns_a_page_of_results(reqres):
    response = reqres.list_users(page=2)
    assert response.status == 200

    body = response.json()
    assert body["page"] == 2
    assert len(body["data"]) == body["per_page"]


@pytest.mark.api
def test_user_payload_matches_the_expected_contract(reqres):
    body = reqres.get_user(2).json()
    user = body["data"]

    for field in ("id", "email", "first_name", "last_name", "avatar"):
        assert field in user, f"Response is missing '{field}'"

    assert isinstance(user["id"], int)
    assert "@" in user["email"]


@pytest.mark.api
@pytest.mark.negative
def test_unknown_user_returns_not_found(reqres):
    assert reqres.get_user(23).status == 404


@pytest.mark.api
def test_create_user_returns_created_with_identifier(reqres):
    response = reqres.create_user("Sunil", "SDET")
    assert response.status == 201

    body = response.json()
    assert body["name"] == "Sunil"
    assert body["job"] == "SDET"
    assert "id" in body
    assert "createdAt" in body


@pytest.mark.api
def test_update_user_returns_updated_timestamp(reqres):
    response = reqres.update_user(2, "Sunil", "Automation Architect")
    assert response.status == 200
    assert response.json()["job"] == "Automation Architect"


@pytest.mark.api
def test_delete_user_returns_no_content(reqres):
    assert reqres.delete_user(2).status == 204