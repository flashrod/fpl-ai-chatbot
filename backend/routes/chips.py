from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.chip_calculator import calculate_chip_recommendations

router = APIRouter(prefix="/chips", tags=["Chips"])

@router.get("/calculate")
async def get_chip_recommendations(
    limit: Optional[int] = Query(3, description="Number of recommendations to return for each chip", ge=1, le=10)
):
    """
    Calculate optimal gameweeks for using FPL chips like Bench Boost and Triple Captain
    
    Parameters:
    - limit: Number of recommendations to return for each chip (default: 3)
    
    Returns:
    - List of recommended gameweeks for each chip type with details about fixture difficulty
    """
    try:
        recommendations = await calculate_chip_recommendations(number_of_recommendations=limit)
        
        if recommendations["status"] == "error":
            raise HTTPException(
                status_code=500, 
                detail=recommendations.get("message", "Failed to calculate chip recommendations")
            )
            
        return recommendations
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in chip recommendations endpoint: {str(e)}")
        
        # Return proper error response
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chip recommendations: {str(e)}"
        ) 