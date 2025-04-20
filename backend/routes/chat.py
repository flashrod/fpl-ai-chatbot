from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.fpl_data import get_fpl_data
from services.gemini import get_gemini_response

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
async def chat_with_ai(request: ChatRequest):
    try:
        user_input = request.message

        # Fetch combined FPL data (now includes fixtures)
        fpl_data = await get_fpl_data()

        # Pass to Gemini for response
        response = await get_gemini_response(user_input, fpl_data)

        return {"reply": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
