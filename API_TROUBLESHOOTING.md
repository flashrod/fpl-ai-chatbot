# Gemini API Troubleshooting Guide

This guide will help you resolve common issues with the Gemini API integration in the FPL AI Assistant application.

## Common Error Messages

### "I'm having trouble processing your request. Please try a simpler question or try again in a few moments."

This error typically occurs when:

- The Gemini API key is invalid or has expired
- The model name format is incorrect
- The API request payload is invalid or too large
- You've exceeded your API quota or rate limits

### "I'm having trouble connecting to my brain right now..."

This error occurs when:

- The model cannot be found (incorrect model name)
- There's a network connectivity issue
- The API service is temporarily unavailable

## Step-by-Step Troubleshooting

### 1. Check Your API Key

Make sure you have added a valid Gemini API key to your `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

You can get an API key from [Google AI Studio](https://aistudio.google.com/).

### 2. Run the API Key Check Script

Run the `check_api_key.py` script to verify your API key is working:

```bash
python check_api_key.py
```

This script will:

- Check if your API key is present in the environment
- Test if the API key can connect to Gemini service
- Attempt a simple content generation request

### 3. Try the More Detailed Test Script

For more detailed diagnostics, run:

```bash
python backend/test_gemini.py
```

This script will:

- List all available models for your API key
- Test content generation with a simple prompt
- Provide detailed error information if something fails

### 4. Check API Status from the UI

1. When you get an error in the ChatBot, click "Show Debug Info"
2. Click "Check API Status" in the debug panel
3. The results will show if:
   - The API key is configured
   - The backend can connect to Gemini API
   - There are any specific error messages

### 5. Common Issues and Fixes

#### Model Name Format Error

If you see errors about models not being found, it could be due to incorrect model name format.
The correct format is `gemini-pro` (not `models/gemini-pro`).

#### API Key Issues

- **Invalid Key**: Get a new key from Google AI Studio
- **Expired Key**: Keys may expire; generate a new one
- **Usage Limits**: Check if you've hit your quotas or rate limits

#### Network Issues

- Ensure your server has internet access
- Check if your network blocks Google API endpoints
- Try using a VPN if necessary

#### Content Issues

- Very long inputs may be rejected
- Content with sensitive topics may be blocked
- Try simpler, shorter questions first to test

### 6. Model Availability Issues

If the models are not available for your account:

1. Go to Google AI Studio
2. Check which models you have access to
3. Make sure the models you're trying to use are available in your region

## Backend Logs

Check the backend logs for more detailed error information:

```bash
tail -f backend.log
```

Look for errors related to:

- "Gemini API error"
- "Error getting Gemini response"
- "models not found"

## Getting Further Help

If you've tried all the steps above and still have issues:

1. Check the [Google Generative AI Python SDK](https://github.com/google/generative-ai-python) for updates
2. Visit the [Gemini API documentation](https://ai.google.dev/docs)
3. Check if there are any known service outages
4. Try creating a new API key with a different Google account

## Testing with cURL

You can test the debug endpoint directly with cURL:

```bash
curl http://localhost:5000/chat/debug
```

This will show you if the API key is configured correctly and if the backend can connect to the Gemini service.
