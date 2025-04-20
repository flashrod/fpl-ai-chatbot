import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key
api_key = os.getenv("GEMINI_API_KEY")
print(f"API key exists: {bool(api_key)}")

try:
    # Configure Gemini
    genai.configure(api_key=api_key)
    
    # Initialize model
    model = genai.GenerativeModel("models/gemini-1.5-pro")
    
    # Test simple prompt
    response = model.generate_content("Hello, world!")
    print("Gemini API test successful. Response:")
    print(response.text)
    
except Exception as e:
    print(f"Gemini API error: {e}") 