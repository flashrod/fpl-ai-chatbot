# routes/teams.py (FIXED VERSION)

from fastapi import APIRouter, HTTPException
import logging

# Import the corrected service function
from services.fpl_data import get_fpl_data

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/api/teams/{team_id}")
def get_team_details(team_id: int):
    """
    Provides detailed information for a single FPL team, including its players.
    """
    logger.info(f"Fetching data for team ID: {team_id}")

    # 1. Call get_fpl_data() with NO arguments to get all data.
    all_data = get_fpl_data()

    if not all_data:
        raise HTTPException(status_code=503, detail="Could not retrieve data from FPL service.")

    # 2. Find the specific team's info from the 'teams' list.
    # We use a generator expression for an efficient one-liner search.
    team_info = next((team for team in all_data.get('teams', []) if team['id'] == team_id), None)

    if not team_info:
        logger.error(f"Team with ID {team_id} not found in the data.")
        raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found.")

    # 3. Find all players belonging to that team from the 'elements' (players) list.
    team_players = [player for player in all_data.get('elements', []) if player['team'] == team_id]

    # 4. Combine the information into a single, clean response.
    response_data = {
        "team_details": team_info,
        "players": team_players
    }
    
    logger.info(f"Successfully found data for team {team_info.get('name')}.")
    
    return response_data