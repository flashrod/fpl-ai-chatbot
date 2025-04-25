import httpx
import time
import logging
import asyncio
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base FPL API URLs
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"

# Cache configuration
CACHE_TTL = 86400  # 24 hour cache lifetime
_fpl_data_cache = {
    "data": None,
    "timestamp": 0,
    "refresh_task": None,
    "is_refreshing": False
}

async def refresh_fpl_data_cache():
    """
    Background task to refresh the FPL data cache
    """
    global _fpl_data_cache
    
    # Don't try to refresh if already in progress
    if _fpl_data_cache["is_refreshing"]:
        return
    
    try:
        _fpl_data_cache["is_refreshing"] = True
        logger.info("Starting automatic FPL data cache refresh")
        
        # Fetch fresh data directly from the API
        async with httpx.AsyncClient() as client:
            # Fetch general data (includes players, teams, etc.)
            bootstrap_response = await client.get(FPL_BOOTSTRAP_URL)
            bootstrap_response.raise_for_status()
            bootstrap_data = bootstrap_response.json()
            
            # Get team name mapping for easier reference
            teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
            
            # Process injury data
            injured_players = []
            for p in bootstrap_data["elements"]:
                if p["status"] not in ["a", "u"]:  # Not available or unknown
                    injured_players.append({
                        "id": p["id"],
                        "player": f"{p['first_name']} {p['second_name']}",
                        "web_name": p["web_name"],
                        "team": teams.get(p["team"], "Unknown"),
                        "team_id": p["team"],
                        "status": p["status"],
                        "news": p["news"],
                        "chance_of_playing": p["chance_of_playing_next_round"]
                    })
            
            # Fetch fixture data
            fixtures_response = await client.get(FPL_FIXTURES_URL)
            fixtures_response.raise_for_status()
            fixtures_data = fixtures_response.json()
            
            # Compile the data
            fresh_data = {
                "bootstrap": bootstrap_data,
                "fixtures": fixtures_data,
                "injuries": injured_players
            }
        
        # Update cache
        _fpl_data_cache["data"] = fresh_data
        _fpl_data_cache["timestamp"] = time.time()
        
        logger.info(f"FPL data cache refreshed successfully at {time.ctime()}")
        
        # Schedule next refresh after CACHE_TTL seconds
        _fpl_data_cache["refresh_task"] = asyncio.create_task(schedule_next_refresh())
    except Exception as e:
        logger.error(f"Error refreshing FPL data cache: {str(e)}")
    finally:
        _fpl_data_cache["is_refreshing"] = False

async def schedule_next_refresh():
    """Schedule the next cache refresh after CACHE_TTL seconds"""
    await asyncio.sleep(CACHE_TTL)
    await refresh_fpl_data_cache()

async def initialize_fpl_data_cache():
    """Initialize the cache refresh background task"""
    if _fpl_data_cache["refresh_task"] is None:
        logger.info("Initializing automatic FPL data cache refresh")
        _fpl_data_cache["refresh_task"] = asyncio.create_task(refresh_fpl_data_cache())

async def get_fpl_data() -> Dict[str, Any]:
    """
    Fetch both player and fixture data from the FPL API with caching to reduce API calls
    
    Returns:
        Dictionary containing bootstrap data, fixtures, and processed injury information
    """
    global _fpl_data_cache
    current_time = time.time()
    
    # Check if cache is valid
    if _fpl_data_cache["data"] is None or (current_time - _fpl_data_cache["timestamp"]) > CACHE_TTL:
        # Cache expired or not initialized, fetch fresh data
        if not _fpl_data_cache["is_refreshing"]:  # Only if not already refreshing
            await refresh_fpl_data_cache()
    
    # Initialize background refresh task if not already started
    if _fpl_data_cache["refresh_task"] is None:
        await initialize_fpl_data_cache()
    
    # Return cached data (even if it's being refreshed, return the existing data)
    return _fpl_data_cache["data"] if _fpl_data_cache["data"] else await fetch_fpl_data_directly()

async def fetch_fpl_data_directly():
    """Direct fetch from API when cache is not available"""
    async with httpx.AsyncClient() as client:
        # Fetch general data (includes players, teams, etc.)
        bootstrap_response = await client.get(FPL_BOOTSTRAP_URL)
        bootstrap_response.raise_for_status()
        bootstrap_data = bootstrap_response.json()
        
        # Get team name mapping for easier reference
        teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
        
        # Process injury data
        injured_players = []
        for p in bootstrap_data["elements"]:
            if p["status"] not in ["a", "u"]:  # Not available or unknown
                injured_players.append({
                    "id": p["id"],
                    "player": f"{p['first_name']} {p['second_name']}",
                    "web_name": p["web_name"],
                    "team": teams.get(p["team"], "Unknown"),
                    "team_id": p["team"],
                    "status": p["status"],
                    "news": p["news"],
                    "chance_of_playing": p["chance_of_playing_next_round"]
                })
        
        # Fetch fixture data
        fixtures_response = await client.get(FPL_FIXTURES_URL)
        fixtures_response.raise_for_status()
        fixtures_data = fixtures_response.json()
        
        # Return combined data including injuries
        return {
            "bootstrap": bootstrap_data,
            "fixtures": fixtures_data,
            "injuries": injured_players
        }

def is_player_injured(player_id, injuries_data):
    """Check if a player is injured based on player ID"""
    return any(p["id"] == player_id for p in injuries_data)
