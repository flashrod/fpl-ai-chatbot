# backend/routes/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import pandas as pd
import logging
# --- THIS IS THE CORRECTED LINE ---
# It now correctly looks for the 'services' folder at the top level of the backend.
from services.gemini import get_gemini_response

# Configure basic logging
logging.basicConfig(level=logging.INFO)

router = APIRouter()

DB_NAME = 'fpl_database.db'

class ChatRequest(BaseModel):
    message: str
    # If you aren't using team_id, you can remove it.
    # For now, we'll keep it as the frontend expects it.
    team_id: int

def search_fpl_data(query: str) -> str:
    """
    Searches the FPL database for a player's name and returns recent stats.
    """
    try:
        conn = sqlite3.connect(DB_NAME)
        # Using parameter substitution to prevent SQL injection
        players_df = pd.read_sql_query("SELECT DISTINCT name FROM gameweeks", conn)
        player_names = players_df['name'].tolist()

        found_player = None
        # A more robust way to find the player name in the query
        for name in sorted(player_names, key=len, reverse=True): # Prioritize longer names
            if name.lower() in query.lower():
                found_player = name
                break

        if not found_player:
            return ""

        # Use parameterized query to be safe
        player_query = "SELECT name, opponent_team, total_points, goals_scored, assists, minutes, was_home FROM gameweeks WHERE name = ? ORDER BY gw DESC LIMIT 5"
        player_df = pd.read_sql_query(player_query, conn, params=(found_player,))
        conn.close()

        if player_df.empty:
            return ""
            
        context_string = f"Here is the recent performance for {found_player}:\n"
        context_string += player_df.to_string(index=False)
        return context_string

    except Exception as e:
        logging.error(f"Database search error: {e}")
        return ""


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        user_message = request.message
        fpl_context = search_fpl_data(user_message)
        response_text = get_gemini_response(user_message, fpl_context)
        return {"response": response_text}
    except Exception as e:
        logging.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=503, detail="Error getting AI response")