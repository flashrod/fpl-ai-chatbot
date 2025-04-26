from fastapi import APIRouter, HTTPException
from services.fpl_data import get_fpl_data
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/fpl",
    tags=["fpl"],
    responses={404: {"description": "Not found"}},
)

@router.get("/bootstrap-static")
async def get_bootstrap_static():
    """
    Proxy endpoint for the FPL bootstrap-static API
    This endpoint is used by the deadline countdown component
    """
    try:
        logger.info("Fetching FPL bootstrap-static data for deadline countdown")
        
        # Get the data from our cached service
        fpl_data = await get_fpl_data()
        
        # Return just the bootstrap data which contains gameweek information
        if fpl_data and "bootstrap" in fpl_data:
            return fpl_data["bootstrap"]
        
        # Fallback to direct API call if our cache doesn't have it
        logger.warning("Cache miss - fetching directly from FPL API")
        async with httpx.AsyncClient() as client:
            response = await client.get("https://fantasy.premierleague.com/api/bootstrap-static/")
            response.raise_for_status()
            return response.json()
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error while fetching FPL data: {str(e)}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"FPL API error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error fetching FPL data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        ) 