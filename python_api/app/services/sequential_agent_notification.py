"""
Sequential Agent Notification Service
Handles sequential agent notifications with 5-minute timeout per agent,
up to 3 attempts per agent, for property assignments
"""

import asyncio
import datetime as dt
from typing import Dict, List, Optional, Any
from ..db.supabase_client import db
import uuid
import traceback

class SequentialAgentNotificationService:
    """Service for sequential agent notification with timeout handling"""
    
    # Active notification timers (property_id -> timer_task)
    _active_timers: Dict[str, asyncio.Task] = {}
    
    @staticmethod
    async def start_property_assignment_queue(property_id: str) -> Dict[str, Any]:
        """
        Start sequential notification process when property is approved
        This is triggered when admin approves a property
        """
        try:
            print(f"[SEQUENTIAL_NOTIFICATION] Starting assignment queue for property: {property_id}")
            
            # Get property details
            properties = await db.select("properties", filters={"id": property_id})
            if not properties:
                return {"success": False, "error": "Property not found"}
            
            property_data = properties[0]
            zip_code = property_data.get("zip_code")
            property_city = property_data.get("city")
            property_state = property_data.get("state")
            
            if not zip_code:
                print(f"[SEQUENTIAL_NOTIFICATION] Property {property_id} has no zip_code, marking as unassigned")
                return {
                    "success": False, 
                    "error": "Property has no zip code",
                    "unassigned": True
                }
            
            # Find all agents - first by zipcode, then by city/state if needed
            agents = await SequentialAgentNotificationService._find_agents_by_zipcode(zip_code)
            
            # If no agents found by zipcode, try city/state matching
            if not agents and property_city and property_state:
                print(f"[SEQUENTIAL_NOTIFICATION] No agents by zipcode, trying city/state match: {property_city}, {property_state}")
                agents = await SequentialAgentNotificationService._find_agents_by_location(property_city, property_state)
            
            if not agents:
                print(f"[SEQUENTIAL_NOTIFICATION] No agents found for zipcode {zip_code}")
                return {
                    "success": False,
                    "error": "No agents available in this area",
                    "unassigned": True
                }
            
            print(f"[SEQUENTIAL_NOTIFICATION] Found {len(agents)} agents for zipcode {zip_code}")
            
            # Create assignment queue entry
            agent_list = [{"id": str(agent["id"]), "name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}"} for agent in agents]
            
            queue_data = {
                "id": str(uuid.uuid4()),
                "property_id": property_id,
                "status": "active",
                "current_round": 1,
                "agent_list": agent_list,
                "started_at": dt.datetime.utcnow().isoformat(),
                "created_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }
            
            await db.insert("property_assignment_queue", queue_data)
            print(f"[SEQUENTIAL_NOTIFICATION] Created assignment queue for property {property_id}")
            
            # Start the sequential notification process
            asyncio.create_task(SequentialAgentNotificationService._process_queue(property_id))
            
            return {
                "success": True,
                "message": f"Notification queue started for {len(agents)} agents",
                "agents_count": len(agents),
                "queue_id": queue_data["id"]
            }
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error starting assignment queue: {e}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _find_agents_by_zipcode(zip_code: str) -> List[Dict[str, Any]]:
        """
        Find all agents in the same zipcode
        Note: If users table doesn't have zip_code field, we'll match by city/state
        """
        try:
            # Get all verified active agents
            all_agents = await db.select("users", filters={
                "user_type": "agent",
                "status": "active",
                "verification_status": "verified"
            })
            
            if not all_agents:
                return []
            
            matching_agents = []
            
            # Try to match by zip_code first (if field exists)
            for agent in all_agents:
                agent_zip = agent.get("zip_code")
                if agent_zip and str(agent_zip).strip() == str(zip_code).strip():
                    matching_agents.append(agent)
            
            # If no direct zipcode match and we have property data, try city/state matching
            # This will be handled in start_property_assignment_queue where we have property data
            # For now, return agents matched by zip_code
            
            # If still no matches, try to get pincode location and match nearby agents
            if not matching_agents:
                # Try to find agents by nearby location (within same city)
                # We can use property's city/state to find agents
                print(f"[SEQUENTIAL_NOTIFICATION] No direct zipcode match, will match by property location")
                # Return empty for now, caller will handle city/state matching
                
            return matching_agents
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error finding agents by zipcode: {e}")
            print(traceback.format_exc())
            return []
    
    @staticmethod
    async def _find_agents_by_location(city: str, state: str) -> List[Dict[str, Any]]:
        """Find agents by city and state (fallback when zipcode doesn't match)"""
        try:
            agents = await db.select("users", filters={
                "user_type": "agent",
                "status": "active",
                "verification_status": "verified",
                "city": city,
                "state": state
            })
            return agents or []
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error finding agents by location: {e}")
            return []
    
    @staticmethod
    async def _process_queue(property_id: str) -> None:
        """
        Process the notification queue sequentially
        This runs as a background task
        """
        try:
            print(f"[SEQUENTIAL_NOTIFICATION] Processing queue for property: {property_id}")
            
            while True:
                # Get queue status
                queue = await db.select("property_assignment_queue", filters={"property_id": property_id})
                if not queue or queue[0].get("status") != "active":
                    print(f"[SEQUENTIAL_NOTIFICATION] Queue not active for property {property_id}, stopping")
                    break
                
                queue_data = queue[0]
                
                # Check if property already has an agent
                properties = await db.select("properties", filters={"id": property_id})
                if properties and properties[0].get("agent_id"):
                    print(f"[SEQUENTIAL_NOTIFICATION] Property {property_id} already assigned, stopping queue")
                    await db.update("property_assignment_queue", {
                        "status": "completed",
                        "assignment_completed": True,
                        "final_agent_id": properties[0].get("agent_id"),
                        "completed_at": dt.datetime.utcnow().isoformat(),
                        "updated_at": dt.datetime.utcnow().isoformat()
                    }, {"property_id": property_id})
                    break
                
                # Get next agent to notify
                next_agent_id = await SequentialAgentNotificationService._get_next_agent(property_id, queue_data)
                
                if not next_agent_id:
                    # No more agents available, mark as unassigned
                    print(f"[SEQUENTIAL_NOTIFICATION] No more agents available for property {property_id}, marking as unassigned")
                    await db.update("property_assignment_queue", {
                        "status": "expired",
                        "completed_at": dt.datetime.utcnow().isoformat(),
                        "updated_at": dt.datetime.utcnow().isoformat()
                    }, {"property_id": property_id})
                    break
                
                # Send notification to next agent
                notification_result = await SequentialAgentNotificationService._send_notification_to_agent(
                    property_id, next_agent_id, queue_data
                )
                
                if notification_result.get("success"):
                    # Wait 5 minutes for response (or until agent responds)
                    await SequentialAgentNotificationService._wait_for_response(
                        property_id, notification_result.get("notification_id")
                    )
                    
                    # Check if agent responded (accept/reject)
                    notification = await db.select("agent_property_notifications", 
                        filters={"id": notification_result.get("notification_id")})
                    
                    if notification and notification[0].get("status") == "accepted":
                        # Agent accepted, assign and stop
                        await db.update("properties", {
                            "agent_id": next_agent_id,
                            "assigned_agent_id": next_agent_id,
                            "updated_at": dt.datetime.utcnow().isoformat()
                        }, {"id": property_id})
                        
                        await db.update("property_assignment_queue", {
                            "status": "completed",
                            "assignment_completed": True,
                            "final_agent_id": next_agent_id,
                            "completed_at": dt.datetime.utcnow().isoformat(),
                            "updated_at": dt.datetime.utcnow().isoformat()
                        }, {"property_id": property_id})
                        
                        print(f"[SEQUENTIAL_NOTIFICATION] Property {property_id} assigned to agent {next_agent_id}")
                        break
                    elif notification and notification[0].get("status") in ["rejected", "timeout"]:
                        # Move to next agent
                        await db.update("property_assignment_queue", {
                            "current_agent_id": None,
                            "current_notification_id": None,
                            "total_notifications_sent": queue_data.get("total_notifications_sent", 0) + 1,
                            "updated_at": dt.datetime.utcnow().isoformat()
                        }, {"property_id": property_id})
                        # Continue to next iteration
                        continue
                else:
                    # Failed to send notification, try next agent
                    print(f"[SEQUENTIAL_NOTIFICATION] Failed to send notification: {notification_result.get('error')}")
                    await asyncio.sleep(1)  # Brief pause before next agent
                    continue
                
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error processing queue: {e}")
            print(traceback.format_exc())
    
    @staticmethod
    async def _get_next_agent(property_id: str, queue_data: Dict[str, Any]) -> Optional[str]:
        """Get next agent to notify (hasn't been contacted 3 times)"""
        try:
            agent_list = queue_data.get("agent_list", [])
            current_round = queue_data.get("current_round", 1)
            
            # Get all notifications for this property to count attempts per agent
            all_notifications = await db.select("agent_property_notifications", 
                filters={"property_id": property_id})
            
            # Count attempts per agent
            agent_attempts: Dict[str, int] = {}
            for notif in all_notifications:
                agent_id = notif.get("agent_id")
                if agent_id:
                    agent_attempts[agent_id] = agent_attempts.get(agent_id, 0) + 1
            
            # Find next agent who hasn't been contacted 3 times
            for agent_info in agent_list:
                agent_id = agent_info.get("id")
                attempts = agent_attempts.get(agent_id, 0)
                
                if attempts < 3:
                    return agent_id
            
            return None  # All agents have been contacted 3 times
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error getting next agent: {e}")
            return None
    
    @staticmethod
    async def _send_notification_to_agent(
        property_id: str, 
        agent_id: str, 
        queue_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send email notification to agent"""
        try:
            # Get agent details
            agents = await db.select("users", filters={"id": agent_id})
            if not agents:
                return {"success": False, "error": "Agent not found"}
            
            agent = agents[0]
            
            # Get property details
            properties = await db.select("properties", filters={"id": property_id})
            if not properties:
                return {"success": False, "error": "Property not found"}
            
            property_data = properties[0]
            
            # Calculate notification round for this agent
            existing_notifications = await db.select("agent_property_notifications",
                filters={"property_id": property_id, "agent_id": agent_id})
            notification_round = len(existing_notifications) + 1
            
            # Calculate expiration time (5 minutes from now)
            sent_at = dt.datetime.utcnow()
            expires_at = sent_at + dt.timedelta(minutes=5)
            
            # Create notification record
            notification_id = str(uuid.uuid4())
            notification_data = {
                "id": notification_id,
                "property_id": property_id,
                "agent_id": agent_id,
                "notification_round": notification_round,
                "status": "pending",
                "sent_at": sent_at.isoformat(),
                "expires_at": expires_at.isoformat(),
                "email_sent": False,
                "created_at": sent_at.isoformat(),
                "updated_at": sent_at.isoformat()
            }
            
            await db.insert("agent_property_notifications", notification_data)
            
            # Update queue
            await db.update("property_assignment_queue", {
                "current_agent_id": agent_id,
                "current_notification_id": notification_id,
                "total_notifications_sent": queue_data.get("total_notifications_sent", 0) + 1,
                "total_agents_contacted": len(set([
                    n.get("agent_id") for n in await db.select("agent_property_notifications", 
                        filters={"property_id": property_id})
                ])),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"property_id": property_id})
            
            # Send email
            from ..services.email import send_email
            from ..services.templates import get_property_assignment_email
            
            # Get base URL for accept/reject links (use frontend URL)
            base_url = "https://homeandown.com"  # This should match your frontend URL
            
            email_html = await get_property_assignment_email(
                agent_name=f"{agent.get('first_name', '')} {agent.get('last_name', '')}",
                property=property_data,
                notification_round=notification_round,
                accept_url=f"{base_url}/agent/assignments/{notification_id}/accept",
                reject_url=f"{base_url}/agent/assignments/{notification_id}/reject"
            )
            
            email_result = await send_email(
                to=agent.get("email"),
                subject=f"New Property Assignment - Round {notification_round} - {property_data.get('title', 'Property')}",
                html=email_html
            )
            
            # Update notification with email status
            await db.update("agent_property_notifications", {
                "email_sent": True,
                "email_sent_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": notification_id})
            
            print(f"[SEQUENTIAL_NOTIFICATION] Sent notification to agent {agent_id} for property {property_id} (Round {notification_round})")
            
            return {
                "success": True,
                "notification_id": notification_id,
                "agent_id": agent_id,
                "round": notification_round
            }
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error sending notification: {e}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _wait_for_response(property_id: str, notification_id: str) -> None:
        """Wait 5 minutes for agent response, checking periodically"""
        try:
            expiration_time = None
            
            # Get expiration time
            notifications = await db.select("agent_property_notifications", 
                filters={"id": notification_id})
            if notifications:
                expires_at_str = notifications[0].get("expires_at")
                if expires_at_str:
                    expiration_time = dt.datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
            
            if not expiration_time:
                print(f"[SEQUENTIAL_NOTIFICATION] No expiration time found for notification {notification_id}")
                return
            
            # Check every 10 seconds until expiration or response
            check_interval = 10  # seconds
            while dt.datetime.utcnow() < expiration_time:
                await asyncio.sleep(check_interval)
                
                # Check if agent responded
                notifications = await db.select("agent_property_notifications",
                    filters={"id": notification_id})
                
                if notifications:
                    status = notifications[0].get("status")
                    if status in ["accepted", "rejected"]:
                        print(f"[SEQUENTIAL_NOTIFICATION] Agent responded with status: {status}")
                        return
            
            # Timeout reached
            print(f"[SEQUENTIAL_NOTIFICATION] Notification {notification_id} expired (timeout)")
            await db.update("agent_property_notifications", {
                "status": "timeout",
                "response": "timeout",
                "responded_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": notification_id})
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error waiting for response: {e}")
            print(traceback.format_exc())
    
    @staticmethod
    async def accept_assignment(notification_id: str, agent_id: str) -> Dict[str, Any]:
        """Agent accepts the property assignment"""
        try:
            # Get notification
            notifications = await db.select("agent_property_notifications",
                filters={"id": notification_id, "agent_id": agent_id})
            
            if not notifications:
                return {"success": False, "error": "Notification not found"}
            
            notification = notifications[0]
            property_id = notification.get("property_id")
            
            # Check if already expired
            expires_at_str = notification.get("expires_at")
            if expires_at_str:
                expires_at = dt.datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                if dt.datetime.utcnow() > expires_at:
                    return {"success": False, "error": "Notification has expired"}
            
            # Check if already responded
            if notification.get("status") != "pending":
                return {"success": False, "error": "Already responded to this notification"}
            
            # Update notification
            await db.update("agent_property_notifications", {
                "status": "accepted",
                "response": "accept",
                "responded_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": notification_id})
            
            # Assign property to agent
            await db.update("properties", {
                "agent_id": agent_id,
                "assigned_agent_id": agent_id,
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": property_id})
            
            # Complete queue
            await db.update("property_assignment_queue", {
                "status": "completed",
                "assignment_completed": True,
                "final_agent_id": agent_id,
                "completed_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"property_id": property_id})
            
            # Mark all other pending notifications for this property as cancelled
            await db.update("agent_property_notifications", {
                "status": "expired",
                "response": "timeout",
                "responded_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {
                "property_id": property_id,
                "status": "pending"
            })
            
            print(f"[SEQUENTIAL_NOTIFICATION] Agent {agent_id} accepted property {property_id}")
            
            return {
                "success": True,
                "message": "Property assignment accepted",
                "property_id": property_id
            }
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error accepting assignment: {e}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def reject_assignment(notification_id: str, agent_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Agent rejects the property assignment"""
        try:
            # Get notification
            notifications = await db.select("agent_property_notifications",
                filters={"id": notification_id, "agent_id": agent_id})
            
            if not notifications:
                return {"success": False, "error": "Notification not found"}
            
            notification = notifications[0]
            property_id = notification.get("property_id")
            
            # Check if already responded
            if notification.get("status") != "pending":
                return {"success": False, "error": "Already responded to this notification"}
            
            # Update notification
            await db.update("agent_property_notifications", {
                "status": "rejected",
                "response": "reject",
                "rejection_reason": reason or "No reason provided",
                "responded_at": dt.datetime.utcnow().isoformat(),
                "updated_at": dt.datetime.utcnow().isoformat()
            }, {"id": notification_id})
            
            # Update queue to continue with next agent
            queue = await db.select("property_assignment_queue", filters={"property_id": property_id})
            if queue:
                await db.update("property_assignment_queue", {
                    "current_agent_id": None,
                    "current_notification_id": None,
                    "updated_at": dt.datetime.utcnow().isoformat()
                }, {"property_id": property_id})
                
                # Continue processing queue
                asyncio.create_task(SequentialAgentNotificationService._process_queue(property_id))
            
            print(f"[SEQUENTIAL_NOTIFICATION] Agent {agent_id} rejected property {property_id}")
            
            return {
                "success": True,
                "message": "Property assignment rejected, moving to next agent"
            }
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error rejecting assignment: {e}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_assignment_tracking(property_id: str) -> Dict[str, Any]:
        """Get complete tracking information for admin dashboard"""
        try:
            # Get queue status
            queue = await db.select("property_assignment_queue", filters={"property_id": property_id})
            queue_data = queue[0] if queue else None
            
            # Get all notifications
            notifications = await db.select("agent_property_notifications",
                filters={"property_id": property_id})
            
            # Get agent details for each notification
            notification_details = []
            for notif in notifications:
                agent_id = notif.get("agent_id")
                agent_data = None
                if agent_id:
                    agents = await db.select("users", filters={"id": agent_id})
                    if agents:
                        agent = agents[0]
                        agent_data = {
                            "id": agent_id,
                            "name": f"{agent.get('first_name', '')} {agent.get('last_name', '')}",
                            "email": agent.get("email", "")
                        }
                
                notification_details.append({
                    "id": notif.get("id"),
                    "agent": agent_data,
                    "round": notif.get("notification_round"),
                    "status": notif.get("status"),
                    "sent_at": notif.get("sent_at"),
                    "expires_at": notif.get("expires_at"),
                    "responded_at": notif.get("responded_at"),
                    "response": notif.get("response"),
                    "rejection_reason": notif.get("rejection_reason"),
                    "email_sent": notif.get("email_sent"),
                    "email_sent_at": notif.get("email_sent_at")
                })
            
            return {
                "property_id": property_id,
                "queue_status": queue_data.get("status") if queue_data else None,
                "current_agent_id": queue_data.get("current_agent_id") if queue_data else None,
                "current_round": queue_data.get("current_round") if queue_data else 1,
                "total_notifications_sent": queue_data.get("total_notifications_sent") if queue_data else 0,
                "total_agents_contacted": queue_data.get("total_agents_contacted") if queue_data else 0,
                "assignment_completed": queue_data.get("assignment_completed") if queue_data else False,
                "final_agent_id": queue_data.get("final_agent_id") if queue_data else None,
                "started_at": queue_data.get("started_at") if queue_data else None,
                "completed_at": queue_data.get("completed_at") if queue_data else None,
                "notifications": notification_details,
                "agent_list": queue_data.get("agent_list", []) if queue_data else []
            }
            
        except Exception as e:
            print(f"[SEQUENTIAL_NOTIFICATION] Error getting tracking: {e}")
            print(traceback.format_exc())
            return {"success": False, "error": str(e)}

