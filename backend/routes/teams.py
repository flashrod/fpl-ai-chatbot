from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
import httpx
import asyncio
from datetime import datetime, timedelta
import json
import traceback
from pydantic import BaseModel

router = APIRouter(prefix="/teams", tags=["Teams"])

# Cache configuration for team data to reduce API calls
team_cache = {}
CACHE_DURATION = 15 * 60  # 15 minutes in seconds

# FPL API URLs
FPL_API_BASE = "https://fantasy.premierleague.com/api"
FPL_BOOTSTRAP_URL = f"{FPL_API_BASE}/bootstrap-static/"
FPL_TEAM_URL = f"{FPL_API_BASE}/entry"
FPL_GAMEWEEK_URL = f"{FPL_API_BASE}/event"
FPL_LIVE_URL = f"{FPL_API_BASE}/event"

# Define a model for team search results
class TeamSearchResult(BaseModel):
    id: int
    name: str
    player_name: Optional[str] = None
    total_points: Optional[int] = None
    rank: Optional[int] = None

@router.get("/{team_id}")
async def get_team_data(
    team_id: int,
    gameweek: Optional[int] = Query(None, description="Specific gameweek to fetch data for")
):
    """
    Get detailed team data for a specific team ID
    
    Args:
        team_id: The FPL team ID to fetch data for
        gameweek: Optional specific gameweek to fetch data for (defaults to current gameweek)
    
    Returns:
        Detailed team data including lineup, points, rank, etc.
    """
    print(f"Received request for team ID {team_id}, gameweek {gameweek}")
    
    # Check cache first
    cache_key = f"team_{team_id}_{gameweek}"
    if cache_key in team_cache:
        cached_data, timestamp = team_cache[cache_key]
        if datetime.now() - timestamp < timedelta(seconds=CACHE_DURATION):
            print(f"Returning cached data for team ID {team_id}, gameweek {gameweek}")
            return cached_data
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            # Fetch Bootstrap data (for general information like events, teams, etc.)
            print(f"Fetching bootstrap data from {FPL_BOOTSTRAP_URL}")
            bootstrap_response = await client.get(FPL_BOOTSTRAP_URL)
            bootstrap_response.raise_for_status()
            bootstrap_data = bootstrap_response.json()
            
            # Determine current gameweek if not specified
            if not gameweek:
                for event in bootstrap_data["events"]:
                    if event["is_current"]:
                        gameweek = event["id"]
                        break
                if not gameweek:
                    # If no current gameweek found, find the next one
                    for event in bootstrap_data["events"]:
                        if event["is_next"]:
                            gameweek = event["id"]
                            break
                    # If still no gameweek, take the last finished one
                    if not gameweek:
                        gameweek = max(event["id"] for event in bootstrap_data["events"] if event["finished"])
            print(f"Using gameweek {gameweek} for team ID {team_id}")
            
            # Fetch basic team information
            team_url = f"{FPL_TEAM_URL}/{team_id}/"
            print(f"Fetching team data from {team_url}")
            try:
                team_response = await client.get(team_url)
                team_response.raise_for_status()
                team_info = team_response.json()
                print(f"Team data response structure: {list(team_info.keys()) if isinstance(team_info, dict) else 'Not a dict'}")
            except Exception as e:
                print(f"Error fetching team info: {str(e)}")
                # Provide default team info if the fetch fails
                team_info = {
                    "name": f"Team {team_id}",
                    "player_name": "Unknown Manager",
                    "summary_overall_points": 0,
                    "summary_overall_rank": 0,
                    "value": 0,
                    "bank": 0
                }
            
            # Fetch team's history
            history_url = f"{FPL_TEAM_URL}/{team_id}/history/"
            print(f"Fetching team history from {history_url}")
            try:
                history_response = await client.get(history_url)
                history_response.raise_for_status()
                history_data = history_response.json()
            except Exception as e:
                print(f"Error fetching history: {str(e)}")
                history_data = {"current": [], "chips": []}
            
            # Fetch team's picks for the specified gameweek
            picks_url = f"{FPL_TEAM_URL}/{team_id}/event/{gameweek}/picks/"
            print(f"Fetching team picks from {picks_url}")
            try:
                picks_response = await client.get(picks_url)
                picks_response.raise_for_status()
                picks_data = picks_response.json()
            except Exception as e:
                print(f"Error fetching picks: {str(e)}")
                picks_data = {"picks": [], "entry_history": {"points": 0, "rank": 0}}
            
            # Fetch live gameweek data for points
            live_url = f"{FPL_LIVE_URL}/{gameweek}/live/"
            print(f"Fetching live gameweek data from {live_url}")
            try:
                live_response = await client.get(live_url)
                live_response.raise_for_status()
                live_data = live_response.json()
            except Exception as e:
                print(f"Error fetching live data: {str(e)}")
                live_data = {"elements": []}
            
            # Process and enrich the team data
            try:
                processed_data = await process_team_data(
                    team_id, 
                    gameweek,
                    bootstrap_data, 
                    team_info, 
                    history_data, 
                    picks_data, 
                    live_data
                )
                
                # Store in cache
                team_cache[cache_key] = (processed_data, datetime.now())
                
                return processed_data
            except Exception as e:
                print(f"Error in process_team_data: {str(e)}")
                traceback_str = traceback.format_exc()
                print(f"Traceback: {traceback_str}")
                raise
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(
                status_code=404, 
                detail=f"Team with ID {team_id} not found or not set to public."
            )
        else:
            # Log the error for debugging
            print(f"FPL API error: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Error fetching team data from FPL: {str(e)}"
            )
    except httpx.HTTPError as e:
        # This will catch other HTTP-related errors including redirect issues
        print(f"HTTP error connecting to FPL API: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error connecting to FPL API: {str(e)}"
        )
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing team data: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing team data: {str(e)}"
        )

async def process_team_data(team_id, gameweek, bootstrap, team_info, history, picks, live):
    """Process and enrich the team data for return to the client"""
    
    # Print team_info for debugging
    print(f"Team info received: {team_info.keys() if isinstance(team_info, dict) else 'Not a dict'}")
    
    try:
        # Map player IDs to their data for easy lookup
        players_map = {player["id"]: player for player in bootstrap.get("elements", [])}
        teams_map = {team["id"]: team for team in bootstrap.get("teams", [])}
        
        # Get current event data
        current_event = next((e for e in bootstrap.get("events", []) if e.get("id") == gameweek), None)
        
        # Process team picks (lineup)
        processed_picks = []
        for pick in picks.get("picks", []):
            try:
                player_id = pick.get("element", 0)
                player_data = players_map.get(player_id, {})
                
                # Get live points for the player
                player_live = next(
                    (p for p in live.get("elements", []) if p.get("id") == player_id), 
                    {"stats": {"total_points": 0}}
                )
                
                # Create processed player object
                processed_player = {
                    "id": player_id,
                    "name": player_data.get("web_name", "Unknown"),
                    "team": teams_map.get(player_data.get("team"), {"short_name": "UNK"}).get("short_name", "UNK"),
                    "position": get_position_name(player_data.get("element_type", 0)),
                    "points": player_live.get("stats", {}).get("total_points", 0),
                    "price": player_data.get("now_cost", 0) / 10.0,
                    "form": player_data.get("form", "0.0"),
                    "total_points": player_data.get("total_points", 0),
                    "minutes": player_data.get("minutes", 0),
                    "is_captain": pick.get("is_captain", False),
                    "is_vice_captain": pick.get("is_vice_captain", False),
                    "multiplier": pick.get("multiplier", 1),
                    "position_order": pick.get("position", 0),
                }
                processed_picks.append(processed_player)
            except Exception as e:
                print(f"Error processing player: {str(e)}")
                continue
        
        # Get rank history (last 10 gameweeks)
        rank_history = []
        current_season = history.get("current", [])
        
        # Take latest 10 gameweeks or less if not available
        for event in current_season[-10:]:
            try:
                rank_history.append({
                    "event": event.get("event", 0),
                    "points": event.get("points", 0),
                    "total_points": event.get("total_points", 0),
                    "rank": event.get("rank", 0),
                    "overall_rank": event.get("overall_rank", 0),
                })
            except Exception as e:
                print(f"Error processing rank history: {str(e)}")
                continue
        
        # Process team chips data
        chips_data = history.get("chips", [])
        chips_used = []
        try:
            chips_used = [{"name": chip.get("name", "unknown"), "event": chip.get("event", 0)} for chip in chips_data]
        except Exception as e:
            print(f"Error processing chips used: {str(e)}")
        
        # Standard available chips
        all_chips = ["wildcard", "freehit", "bboost", "3xc"]
        
        # Check used wildcard to determine if second wildcard is available
        wildcards_used = [chip for chip in chips_used if chip.get("name") == "wildcard"]
        
        # In FPL, there are 2 wildcards allowed per season
        wildcard_status = []
        if len(wildcards_used) == 0:
            wildcard_status = [{"name": "wildcard", "available": True, "used_in": None}]
        elif len(wildcards_used) == 1:
            wildcard_gw = wildcards_used[0].get("event", 0)
            # First half wildcard can only be used in first half of season (roughly GW1-19)
            if wildcard_gw <= 19:  
                wildcard_status = [
                    {"name": "wildcard", "available": False, "used_in": wildcard_gw},
                    {"name": "wildcard2", "available": True, "used_in": None}
                ]
            else:
                wildcard_status = [{"name": "wildcard", "available": False, "used_in": wildcard_gw}]
        else:
            wildcard_status = [{"name": "wildcard", "available": False, "used_in": wildcards_used[-1].get("event", 0)}]
        
        # Check status of other chips
        chips_status = wildcard_status
        for chip_name in ["freehit", "bboost", "3xc"]:
            used = next((chip for chip in chips_used if chip.get("name") == chip_name), None)
            chips_status.append({
                "name": chip_name,
                "available": used is None,
                "used_in": used.get("event") if used else None
            })
        
        # Create the final processed team data object
        return {
            "team_id": team_id,
            "name": team_info.get("name", f"Team {team_id}"),
            "player_name": team_info.get("player_name", "Unknown Manager"),
            "gameweek": gameweek,
            "gameweek_points": picks.get("entry_history", {}).get("points", 0),
            "total_points": team_info.get("summary_overall_points", 0),
            "overall_rank": team_info.get("summary_overall_rank", 0),
            "gameweek_rank": picks.get("entry_history", {}).get("rank", 0),
            "value": team_info.get("value", 0) / 10.0,  # Convert to actual team value format
            "bank": team_info.get("bank", 0) / 10.0,    # Convert to actual bank format
            "lineup": processed_picks,
            "chips": {
                "used": chips_used,
                "status": chips_status
            },
            "rank_history": rank_history,
            "last_updated": datetime.now().isoformat(),
            "current_event": {
                "id": current_event.get("id") if current_event else None,
                "name": current_event.get("name") if current_event else None,
                "deadline": current_event.get("deadline_time") if current_event else None,
                "is_current": current_event.get("is_current", False) if current_event else False,
                "is_next": current_event.get("is_next", False) if current_event else False,
                "is_previous": current_event.get("is_previous", False) if current_event else False,
                "finished": current_event.get("finished", False) if current_event else False,
                "average_points": current_event.get("average_entry_score", 0) if current_event else 0,
            } if current_event else {}
        }
    except Exception as e:
        print(f"Error in process_team_data: {str(e)}")
        # If all else fails, return minimal data to avoid breaking the frontend
        return {
            "team_id": team_id,
            "name": f"Team {team_id}",
            "player_name": "Unknown Manager",
            "gameweek": gameweek,
            "gameweek_points": 0,
            "total_points": 0,
            "overall_rank": 0,
            "gameweek_rank": 0,
            "value": 0,
            "bank": 0,
            "lineup": [],
            "chips": {
                "used": [],
                "status": []
            },
            "rank_history": [],
            "last_updated": datetime.now().isoformat(),
            "current_event": {}
        }

def get_position_name(position_id):
    """Convert position ID to position name"""
    positions = {
        1: "GK",
        2: "DEF",
        3: "MID",
        4: "FWD"
    }
    return positions.get(position_id, "UNK")

@router.get("/search", response_model=List[TeamSearchResult])
async def search_teams(query: str = Query(..., description="The team name or manager to search for")):
    """
    Search for teams by name or manager name
    
    Args:
        query: The search query (team name or manager name)
    
    Returns:
        A list of matching teams
    """
    try:
        # This is a simplified implementation that returns a single match
        # In a production environment, you would implement a more robust search
        # using the FPL API or a database
        
        # For now, return a mock result based on the query
        # This prevents timeouts while still providing functionality
        mock_team = {
            "id": int(query) if query.isdigit() else 12345, 
            "name": f"Team {query}",
            "player_name": f"Manager for {query}"
        }
        
        return [TeamSearchResult(**mock_team)]
    except Exception as e:
        print(f"Error in search_teams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/test")
async def test_endpoint():
    """
    A simple test endpoint to check if the teams router is functioning correctly
    
    Returns:
        A simple test response
    """
    print("Test endpoint called")
    return {
        "status": "success",
        "message": "Teams API is working",
        "timestamp": datetime.now().isoformat()
    } 