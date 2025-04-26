#!/usr/bin/env python3
"""
Utility script to check if the Gemini API key is configured correctly.
Run this script before starting the server to verify your setup.
"""

import os
import sys
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    print("✓ Google Generative AI package is installed")
except ImportError:
    print("✗ Error: Google Generative AI package is not installed")
    print("  Run: pip install google-generativeai")
    sys.exit(1)

# Load environment variables
load_dotenv()
print("✓ Loaded environment variables from .env file")

# Check for API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("✗ Error: GEMINI_API_KEY not found in environment variables")
    print("  Make sure you have copied .env.example to .env and added your API key")
    sys.exit(1)

if api_key == "your_api_key_here":
    print("✗ Error: You need to replace the default API key with your actual key")
    print("  Get your API key from: https://aistudio.google.com/")
    sys.exit(1)

print(f"✓ Found GEMINI_API_KEY in environment variables: {api_key[:5]}...{api_key[-3:]}")

# Try to configure and use the API
try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name="gemini-pro")
    response = model.generate_content("Hello, are you working?")
    print("✓ Successfully connected to Gemini API and received a response")
    print("✓ All checks passed! Your API key is configured correctly")
except Exception as e:
    print(f"✗ Error connecting to Gemini API: {str(e)}")
    print("  Check if your API key is valid and has access to the Gemini models")
    sys.exit(1) 