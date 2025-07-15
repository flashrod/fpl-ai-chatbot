# backend/services/gemini.py

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Change this to an 'async def' function
async def get_gemini_response(user_question: str, fpl_context: str) -> str:
    """
    Asynchronously sends a prompt to the Gemini API with added FPL context.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found. Please set it in your .env file.")
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')

    if fpl_context:
        prompt = f"""
        You are an expert FPL AI assistant.
        
        Use the following context to answer the question. If the context doesn't contain the answer, 
        say that you don't have enough specific information but try to answer from your general knowledge.

        Context:
        ---
        {fpl_context}
        ---
        
        Question: {user_question}
        """
    else:
        prompt = f"""
        You are an expert FPL AI assistant. Answer the following question: {user_question}
        """

    try:
        # Use the asynchronous version of the call with 'await'
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "Sorry, I encountered an error trying to get a response."