import os
os.environ.setdefault('TEST_SQLITE','1')
import json
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, ENGINE
from app.db.models import Base
from app.db.models import User, Property, PropertyViewing, AgentReview
import datetime as dt

# NOTE: Ensure PYTHON_API_KEY=test in test env

def setup_module(module):
    # Create minimal data (bypassing migrations for brevity)
    # Ensure tables exist
    # env already set before app import
    try:
        Base.metadata.create_all(bind=ENGINE)
    except Exception as e:
        print('Table creation failed', e)
    db = SessionLocal()
    db.query(AgentReview).delete()
    db.query(PropertyViewing).delete()
    db.query(Property).delete()
    db.query(User).delete()
    agent = User(email="agent@example.com", password_hash="x", user_type="agent", email_verified=True, verification_status="approved")
    buyer = User(email="buyer@example.com", password_hash="x", user_type="buyer", email_verified=True, verification_status="approved")
    prop = Property(title="Test Prop", price=100000, city="City", state="State", description="Desc", added_by=agent.id, listing_type="SALE", owner_id=agent.id)
    db.add(agent); db.add(buyer); db.flush()
    prop.added_by = agent.id
    db.add(prop)
    db.commit()
    db.close()

client = TestClient(app)

def test_viewing_lifecycle(api_key_header):
    # Create viewing
    resp = client.post("/viewings", headers=api_key_header, json={"property_id": 1, "user_id": 2, "agent_id": 1, "scheduled_at": dt.datetime.utcnow().isoformat()})
    assert resp.status_code == 200
    vid = resp.json()["id"]

    # Update status via patch
    resp2 = client.patch(f"/viewings/{vid}", headers=api_key_header, json={"status": "completed", "completed_at": dt.datetime.utcnow().isoformat()})
    assert resp2.status_code == 200

    # Quick status endpoint
    resp3 = client.post(f"/viewings/{vid}/status", headers=api_key_header, json={"status": "no_show"})
    assert resp3.status_code == 200
    assert resp3.json()["status"] == "no_show"

    # List
    list_resp = client.get("/viewings", headers=api_key_header)
    assert list_resp.status_code == 200
    assert any(v["id"] == vid for v in list_resp.json())


def test_agent_reviews(api_key_header):
    # Create review
    resp = client.post("/agent-reviews", headers=api_key_header, json={"agent_id": 1, "reviewer_user_id": 2, "property_id": 1, "rating": 5, "comment": "Great!"})
    assert resp.status_code == 200
    rid = resp.json()["id"]

    # List reviews
    lst = client.get("/agent-reviews?agent_id=1", headers=api_key_header)
    assert lst.status_code == 200
    data = lst.json()
    assert any(r["id"] == rid for r in data)
    # Invalid rating
    bad = client.post("/agent-reviews", headers=api_key_header, json={"agent_id": 1, "reviewer_user_id": 2, "property_id": 1, "rating": 7})
    assert bad.status_code == 400


def test_contact_gating(api_key_header):
    # Buyer should get masked
    masked = client.get("/properties/1/contact?user_role=buyer&user_id=2", headers=api_key_header)
    assert masked.status_code == 200
    assert masked.json()["owner"]["masked"] is True
    # Agent (approved) should get details
    agent_contact = client.get("/properties/1/contact?user_role=agent&user_id=1", headers=api_key_header)
    assert agent_contact.status_code == 200
    assert agent_contact.json()["owner"]["masked"] is False
    # Missing user_id should mask
    masked2 = client.get("/properties/1/contact?user_role=agent", headers=api_key_header)
    assert masked2.status_code == 200
    assert masked2.json()["owner"]["masked"] is True
