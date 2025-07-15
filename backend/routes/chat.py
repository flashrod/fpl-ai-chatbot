# backend/routes/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
import pandas as pd
import logging # <--- ADD THIS LINE
from .services.gemini import get_gemini_response

# Configure basic logging
logging.basicConfig(level=logging.INFO) # <--- AND THIS LINE

router = APIRouter()

DB_NAME = 'fpl_database.db'

class ChatRequest(BaseModel):
    message: str
    team_id: int

def search_fpl_data(query: str) -> str:
    """
    A simple function to search the FPL database based on a user query.
    This is a basic implementation and can be greatly improved.
    """
    try:
        conn = sqlite3.connect(DB_NAME)
        players_df = pd.read_sql_query("SELECT DISTINCT name FROM gameweeks", conn)
        player_names = players_df['name'].tolist()

        found_player = None
        for name in player_names:
            if name.lower() in query.lower():
                found_player = name
                break

        if not found_player:
            return ""

        player_query = f"SELECT name, opponent_team, total_points, goals_scored, assists, minutes, was_home FROM gameweeks WHERE name = '{found_player}' ORDER BY gw DESC LIMIT 5"
        player_df = pd.read_sql_query(player_query, conn)
        conn.close()

        if player_df.empty:
            return ""
            
        context_string = f"Here is the recent performance for {found_player}:\n"
        context_string += player_df.to_string(index=False)
        return context_string

    except Exception as e:
        logging.error(f"Database search error: {e}") # <--- Use logging here
        return ""


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        user_message = request.message
        fpl_context = search_fpl_data(user_message)
        response_text = get_gemini_response(user_message, fpl_context)
        return {"response": response_text}
    except Exception as e:
        # Use the logger here instead of the undefined 'logger'
        logging.error(f"Error getting AI response: {e}") # <--- CHANGE THIS LINE
        raise HTTPException(status_code=503, detail="Error getting AI response")