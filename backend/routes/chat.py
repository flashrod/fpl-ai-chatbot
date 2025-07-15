from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

from services.gemini import get_gemini_response
from context.team_context import get_team_context

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    team_id: int | None = None

@router.post("/api/chat", tags=["Chat"])
async def chat_endpoint(request: ChatRequest):
    """
    Handles chat messages, gets context for the team_id if provided,
    and returns a response from the Gemini model.
    """
    logger.info(f"Received chat message: '{request.message}' for team_id: {request.team_id}")
    try:
        context = ""
        if request.team_id:
            # *** THE FINAL FIX ***
            # Add 'await' because get_team_context is an async function
            context = await get_team_context(request.team_id)

        full_prompt = f"{context}\n\nUser Question: {request.message}"
        
        response_text = get_gemini_response(full_prompt)
        
        return {"reply": response_text}

    except Exception as e:
        logger.error(f"An error occurred in the chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the chat message.")