from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import asyncio
import logging
from services.gemini import get_gemini_response
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    team_id: Optional[str] = Field(None, pattern=r'^\d{4,8}$')

def raise_chat_error(message: str, error_type: str, status_code: int = 400):
    """Helper function to raise HTTPException with error details"""
    raise HTTPException(
        status_code=status_code,
        detail={
            "error": {
                "type": error_type,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

async def validate_team_id(team_id: Optional[str]) -> Optional[dict]:
    if not team_id:
        return None
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # First try to get the team's current data
            team_response = await client.get(f"https://fantasy.premierleague.com/api/entry/{team_id}/")
            
            # If we get a 404, try to get historical data
            if team_response.status_code == 404:
                # Try to get historical data from the previous season
                history_response = await client.get(f"https://fantasy.premierleague.com/api/entry/{team_id}/history/")
                if history_response.status_code == 200:
                    # If we can get historical data, return a modified response
                    history_data = history_response.json()
                    if history_data and len(history_data.get('current', [])) > 0:
                        # Create a minimal team data structure from historical data
                        latest_data = history_data['current'][-1]
                        return {
                            "id": int(team_id),
                            "name": f"Team {team_id} (Historical)",
                            "player_name": "Historical Data",
                            "overall_rank": latest_data.get('overall_rank', 0),
                            "total_points": latest_data.get('total_points', 0),
                            "gameweek": latest_data.get('event', 0),
                            "gameweek_points": latest_data.get('points', 0),
                            "is_historical": True
                        }
                    else:
                        raise_chat_error(
                            f"Team ID {team_id} not found in current or historical data. Please check the ID and try again.",
                            "team_not_found",
                            404
                        )
                else:
                    raise_chat_error(
                        f"Team ID {team_id} not found. Please check the ID and try again.",
                        "team_not_found",
                        404
                    )
            elif team_response.status_code != 200:
                raise_chat_error(
                    "Failed to fetch team data from FPL API. Please try again later.",
                    "fpl_api_error",
                    502
                )
                
            team_data = team_response.json()
            return {
                "id": team_data.get("id"),
                "name": team_data.get("name", f"Team {team_id}"),
                "player_name": team_data.get("player_first_name", "") + " " + team_data.get("player_last_name", ""),
                "overall_rank": team_data.get("summary_overall_rank", 0),
                "total_points": team_data.get("summary_overall_points", 0),
                "gameweek": team_data.get("current_event", 0),
                "gameweek_points": team_data.get("summary_event_points", 0),
                "is_historical": False
            }
            
    except httpx.RequestError as e:
        logger.error(f"Network error while fetching team data: {str(e)}")
        raise_chat_error(
            "Unable to connect to FPL API. Please check your internet connection.",
            "network_error",
            503
        )
    except Exception as e:
        logger.error(f"Unexpected error while fetching team data: {str(e)}")
        raise_chat_error(
            "An unexpected error occurred while fetching team data.",
            "server_error",
            500
        )

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        # Validate and fetch team data if team_id is provided
        team_data = await validate_team_id(request.team_id)
        
        # Get latest FPL data for context
        try:
            latest_fpl_data = await fetch_latest_fpl_data()
        except Exception as e:
            logger.error(f"Error fetching FPL data: {str(e)}")
            raise_chat_error(
                "Unable to fetch the latest FPL data. Please try again later.",
                "fpl_data_error",
                503
            )
        
        # Get response from Gemini
        try:
            ai_response = await get_gemini_response(
                request.message,
                latest_fpl_data,
                team_data
            )
            if not ai_response:
                raise_chat_error(
                    "The AI model was unable to generate a response. Please try rephrasing your question.",
                    "ai_generation_error",
                    422
                )
        except Exception as e:
            logger.error(f"Error getting AI response: {str(e)}")
            raise_chat_error(
                "The AI service is currently unavailable. Please try again later.",
                "ai_service_error",
                503
            )
        
        return {"response": ai_response}
        
    except HTTPException:
        # Re-raise HTTPException as is
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise_chat_error(
            "An unexpected error occurred. Please try again later.",
            "server_error",
            500
        )

async def fetch_latest_fpl_data():
    """Fetch latest data from FPL API for context"""
    try:
        async with httpx.AsyncClient() as client:
            # Get general FPL data
            response = await client.get("https://fantasy.premierleague.com/api/bootstrap-static/")
            if response.status_code == 200:
                data = response.json()
                
                # Extract only what we need to avoid overloading the context
                elements = data.get('elements', [])[:30]  # Top 30 players by points
                sorted_elements = sorted(elements, key=lambda x: x.get('total_points', 0), reverse=True)
                
                # Get current gameweek info
                current_gw = next((event for event in data.get('events', []) 
                                if event.get('is_current')), None)
                
                # Create a compact version with just what we need
                compact_data = {
                    'top_players': sorted_elements,
                    'current_gameweek': current_gw,
                }
                
                return compact_data
            else:
                return None
    except Exception as e:
        logger.error(f"Error fetching FPL data: {e}")
        return None
