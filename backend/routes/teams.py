from fastapi import APIRouter, HTTPException
from services.fpl_data import get_fpl_data
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/{team_id}")
async def get_team_details(team_id: int):
    """
    Validates and retrieves basic details for a given FPL team ID.
    The path is now relative to the '/api/teams' prefix in main.py.
    """
    try:
        logger.info(f"Fetching data for team ID: {team_id}")
        data = await get_fpl_data("bootstrap-static/")
        
        # Find the team (entry) in the bootstrap data
        team_entry = next((entry for entry in data.get('entries', []) if entry['id'] == team_id), None)
        
        if not team_entry:
            # If the manager ID is not found in the 'entries' list (for top managers)
            # check the main 'teams' list for Premier League clubs, though this is less likely what's needed.
             team_club = next((team for team in data.get('teams', []) if team['id'] == team_id), None)
             if team_club:
                 return {"id": team_club["id"], "name": team_club["name"]}
            
             logger.warning(f"Team ID {team_id} not found in bootstrap data.")
             raise HTTPException(status_code=404, detail=f"Team with ID {team_id} not found.")

        return {
            "id": team_entry["id"],
            "name": team_entry["player_first_name"] + " " + team_entry["player_last_name"],
            "manager_name": team_entry["name"]
        }
    except HTTPException as e:
        # Re-raise HTTP exceptions to let FastAPI handle them
        raise e
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching team {team_id}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")