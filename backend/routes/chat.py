from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
import asyncio
import logging
from services.gemini import get_gemini_response

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    team_id: Optional[str] = None

@router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        user_message = request.message
        team_id = request.team_id
        team_data = None
        
        # If team ID is provided, fetch team data
        if team_id:
            try:
                async with httpx.AsyncClient() as client:
                    team_response = await client.get(f"https://fantasy.premierleague.com/api/entry/{team_id}/")
                    if team_response.status_code == 200:
                        team_data = team_response.json()
                        
                    # Also get current picks if possible
                    current_gw_response = await client.get("https://fantasy.premierleague.com/api/bootstrap-static/")
                    if current_gw_response.status_code == 200:
                        current_gw_data = current_gw_response.json()
                        current_gw = next((event['id'] for event in current_gw_data['events'] 
                                         if event['is_current']), None)
                        
                        if current_gw:
                            picks_response = await client.get(f"https://fantasy.premierleague.com/api/entry/{team_id}/event/{current_gw}/picks/")
                            if picks_response.status_code == 200:
                                picks_data = picks_response.json()
                                # Add picks to team data
                                team_data['picks'] = picks_data['picks']
                                team_data['active_chip'] = picks_data.get('active_chip')
                                
            except Exception as e:
                logger.error(f"Error fetching team data: {e}")
                # Continue without team data if it fails
                pass
        
        # Get latest FPL data for context
        latest_fpl_data = await fetch_latest_fpl_data()
        
        # Get response from Gemini
        ai_response = await get_gemini_response(user_message, latest_fpl_data, team_data)
        
        return {"response": ai_response}
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
