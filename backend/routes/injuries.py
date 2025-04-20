from fastapi import APIRouter, HTTPException
from services.fpl_data import get_fpl_data

router = APIRouter(prefix="/injuries", tags=["Injuries"])

@router.get("/")
async def get_injuries():
    """Get a list of currently injured players from FPL data"""
    try:
        # Fetch FPL data that now includes injury information
        fpl_data = await get_fpl_data()
        injuries = fpl_data.get("injuries", [])
        
        # Format the response
        return {
            "injuries": injuries,
            "count": len(injuries)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 