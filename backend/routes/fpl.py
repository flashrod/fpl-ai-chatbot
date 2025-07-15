from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

FPL_API_BASE_URL = "https://fantasy.premierleague.com/api"

@router.get("/api/entry/{entry_id}", tags=["FPL Entry"])
async def get_entry_data(entry_id: int):
    """
    Fetches a specific manager's FPL entry data (team name, points, etc.).
    """
    entry_url = f"{FPL_API_BASE_URL}/entry/{entry_id}/"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(entry_url)
            # Raise an error for 4xx or 5xx responses
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"FPL entry with ID {entry_id} not found.")
            else:
                raise HTTPException(status_code=exc.response.status_code, detail="Error fetching data from FPL API.")
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="An error occurred while communicating with the FPL API.")

# You can keep any other routes you have in this file below