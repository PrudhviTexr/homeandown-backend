"""
Property Favorites Routes

Provides endpoints for managing user's favorite/wishlist properties.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
import logging

from ..db.supabase_client import db
from ..core.auth import get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/property-favorites", tags=["favorites"])


class CreateFavoriteRequest(BaseModel):
    property_id: str | int
    user_id: str | int


@router.get("")
async def list_favorites(
    user_id: Optional[str] = None,
    current_user = Depends(get_current_user_optional)
):
    """
    List favorite properties for a user
    
    - **user_id**: Optional user ID filter (defaults to current user)
    """
    try:
        # Use current_user if user_id not provided
        if not user_id and current_user:
            user_id = str(current_user.get("id"))
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        
        logger.info(f"Listing favorites for user: {user_id}")
        
        # Query favorites with property details
        favorites = await db.select(
            "property_favorites",
            filters={"user_id": user_id},
            select="*, property:properties(*)"
        )
        
        return {
            "success": True,
            "data": favorites
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing favorites: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def add_favorite(
    request: CreateFavoriteRequest,
    current_user = Depends(get_current_user_optional)
):
    """
    Add a property to favorites
    
    - **property_id**: Property ID
    - **user_id**: User ID
    """
    try:
        logger.info(f"Adding favorite: property={request.property_id}, user={request.user_id}")
        
        # Check if already favorited
        existing = await db.select(
            "property_favorites",
            filters={
                "property_id": str(request.property_id),
                "user_id": str(request.user_id)
            }
        )
        
        if existing:
            return {
                "success": True,
                "message": "Property already in favorites",
                "data": existing[0]
            }
        
        # Create favorite
        favorite_data = {
            "property_id": str(request.property_id),
            "user_id": str(request.user_id)
        }
        
        result = await db.insert("property_favorites", favorite_data)
        
        return {
            "success": True,
            "message": "Added to favorites",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{favorite_id}")
async def remove_favorite(
    favorite_id: str,
    current_user = Depends(get_current_user_optional)
):
    """
    Remove a property from favorites
    
    - **favorite_id**: Favorite record ID
    """
    try:
        logger.info(f"Removing favorite: {favorite_id}")
        
        # Delete favorite
        await db.delete("property_favorites", {"id": favorite_id})
        
        return {
            "success": True,
            "message": "Removed from favorites"
        }
        
    except Exception as e:
        logger.error(f"Error removing favorite: {e}")
        raise HTTPException(status_code=500, detail=str(e))
