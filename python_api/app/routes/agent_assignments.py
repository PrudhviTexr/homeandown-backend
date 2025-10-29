"""
Agent Assignment Routes
Handles agent acceptance/rejection of property assignments
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import traceback

from ..services.sequential_agent_notification import SequentialAgentNotificationService
from ..core.auth import get_current_user_id

router = APIRouter(prefix="/agent/property-assignments", tags=["agent-assignments"])

@router.post("/{notification_id}/accept")
async def accept_property_assignment(
    notification_id: str,
    agent_id: Optional[str] = Depends(get_current_user_id)
):
    """
    Agent accepts a property assignment
    Requires authentication - agent can only accept their own notifications
    """
    try:
        if not agent_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        result = await SequentialAgentNotificationService.accept_assignment(
            notification_id=notification_id,
            agent_id=agent_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400, 
                detail=result.get("error", "Failed to accept assignment")
            )
        
        return {
            "success": True,
            "message": "Property assignment accepted successfully",
            "property_id": result.get("property_id")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT_ASSIGNMENTS] Error accepting assignment: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{notification_id}/reject")
async def reject_property_assignment(
    notification_id: str,
    request_data: Optional[dict] = None,
    agent_id: Optional[str] = Depends(get_current_user_id)
):
    """
    Agent rejects a property assignment
    Requires authentication - agent can only reject their own notifications
    """
    try:
        if not agent_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        reason = None
        if request_data and isinstance(request_data, dict):
            reason = request_data.get("reason")
        
        result = await SequentialAgentNotificationService.reject_assignment(
            notification_id=notification_id,
            agent_id=agent_id,
            reason=reason
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to reject assignment")
            )
        
        return {
            "success": True,
            "message": "Property assignment rejected, system will move to next agent"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT_ASSIGNMENTS] Error rejecting assignment: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{notification_id}")
async def get_assignment_notification(
    notification_id: str,
    agent_id: Optional[str] = Depends(get_current_user_id)
):
    """
    Get assignment notification details
    Requires authentication
    """
    try:
        if not agent_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        from ..db.supabase_client import db
        
        notifications = await db.select("agent_property_notifications",
            filters={"id": notification_id, "agent_id": agent_id})
        
        if not notifications:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification = notifications[0]
        
        # Get property details
        property_id = notification.get("property_id")
        properties = await db.select("properties", filters={"id": property_id})
        property_data = properties[0] if properties else None
        
        return {
            "notification": notification,
            "property": property_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[AGENT_ASSIGNMENTS] Error getting notification: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

