from fastapi import APIRouter, HTTPException, Query
from services.fpl_data import get_fpl_data
from collections import defaultdict
from typing import Optional

router = APIRouter(prefix="/injuries", tags=["Injuries"])

@router.get("/")
async def get_injuries(group_by_team: Optional[bool] = Query(False, description="Group injuries by team")):
    """Get a list of currently injured players from FPL data
    
    Parameters:
    - group_by_team: If True, returns injuries grouped by team
    """
    try:
        # Fetch FPL data that now includes injury information
        fpl_data = await get_fpl_data()
        injuries = fpl_data.get("injuries", [])
        
        # Format the response
        if group_by_team:
            # Group injuries by team
            injuries_by_team = defaultdict(list)
            for injury in injuries:
                injuries_by_team[injury['team']].append(injury)
            
            # Convert to dictionary for JSON response
            grouped_injuries = {
                team: team_injuries 
                for team, team_injuries in sorted(injuries_by_team.items())
            }
            
            return {
                "injuries_by_team": grouped_injuries,
                "team_count": len(grouped_injuries),
                "total_count": len(injuries)
            }
        else:
            # Return flat list of injuries
            return {
                "injuries": injuries,
                "count": len(injuries)
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 