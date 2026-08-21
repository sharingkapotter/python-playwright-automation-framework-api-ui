class ReqresClient:
    """Thin client over the Reqres API. One method per endpoint, no assertions."""

    def __init__(self, request_context):
        self.request = request_context

    def list_users(self, page: int = 1):
        return self.request.get(f"/api/users?page={page}")

    def get_user(self, user_id: int):
        return self.request.get(f"/api/users/{user_id}")

    def create_user(self, name: str, job: str):
        return self.request.post("/api/users", data={"name": name, "job": job})

    def update_user(self, user_id: int, name: str, job: str):
        return self.request.put(f"/api/users/{user_id}", data={"name": name, "job": job})

    def delete_user(self, user_id: int):
        return self.request.delete(f"/api/users/{user_id}")

    def login(self, email: str, password: str | None = None):
        payload = {"email": email}
        if password is not None:
            payload["password"] = password
        return self.request.post("/api/login", data=payload)