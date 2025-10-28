import os
import pytest

@pytest.fixture(scope="session")
def api_key_header():
    key = os.getenv("PYTHON_API_KEY", "test")
    return {"X-API-Key": key}
