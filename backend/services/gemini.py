import os
import google.generativeai as genai
from dotenv import load_dotenv
import re

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Use a model that's available in the list
model = genai.GenerativeModel("models/gemini-1.5-pro")

async def get_gemini_response(user_input: str, fpl_data: dict) -> str:
    # Get the bootstrap and fixtures data
    bootstrap_data = fpl_data["bootstrap"]
    fixtures_data = fpl_data["fixtures"]
    
    # Get teams mapping for fixture processing
    teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
    
    # Rank top players
    top_players = sorted(
        bootstrap_data["elements"], 
        key=lambda x: x["total_points"], 
        reverse=True
    )[:10]

    player_lines = []
    for p in top_players:
        name = p["web_name"]
        pos = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}[p["element_type"]]
        pts = p["total_points"]
        form = p["form"]
        team_id = p["team"]
        team_name = teams.get(team_id, "Unknown")
        player_lines.append(f"{name} ({team_name}) - {pos}, {pts} pts, form: {form}")

    # Process upcoming fixtures (next 2 gameweeks)
    current_gameweek = next(
        (gw for gw in bootstrap_data["events"] if gw["is_current"]), 
        bootstrap_data["events"][0]
    )
    current_gw_id = current_gameweek["id"]
    
    upcoming_fixtures = [
        f for f in fixtures_data 
        if f["event"] is not None and f["event"] in [current_gw_id, current_gw_id + 1]
    ]
    
    fixture_lines = []
    for f in upcoming_fixtures:
        home_team = teams.get(f["team_h"], "Unknown")
        away_team = teams.get(f["team_a"], "Unknown")
        gameweek = f["event"]
        kickoff_time = f["kickoff_time"].split("T")[0] if f["kickoff_time"] else "TBD"
        
        fixture_lines.append(f"GW{gameweek}: {home_team} vs {away_team} - {kickoff_time}")
    
    player_context = "\n".join(player_lines)
    fixture_context = "\n".join(fixture_lines)

    prompt = f"""
You are a Fantasy Premier League expert assistant. 

Based on the latest data below, give tactical, position-specific, and useful recommendations in response to user questions.

--- TOP PLAYER DATA ---
{player_context}
-----------------------

--- UPCOMING FIXTURES ---
{fixture_context}
-----------------------

Now answer this question:
{user_input}
""".strip()

    try:
        response = model.generate_content(prompt)
        raw_text = response.text
        
        # Remove markdown formatting
        clean_text = clean_markdown(raw_text)
        return clean_text
    except Exception as e:
        # Detailed error with troubleshooting suggestions
        error_msg = f"Error from Gemini: {e}"
        error_msg += "\n\nTroubleshooting tips:"
        error_msg += "\n1. Check if your API key is valid and has access to the Gemini models"
        error_msg += "\n2. Verify that you're using the correct model name"
        error_msg += "\n3. Ensure you have proper internet connectivity"
        return error_msg

def clean_markdown(text):
    """
    Remove common markdown formatting from text:
    - Headers (# Header)
    - Bold/Italic (**bold**, *italic*)
    - Code blocks (```code```)
    - Lists (- item or * item or 1. item)
    - Links ([text](url))
    - Etc.
    """
    # Replace headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    
    # Replace bold and italic
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Italic
    text = re.sub(r'__(.*?)__', r'\1', text)      # Bold
    text = re.sub(r'_(.*?)_', r'\1', text)        # Italic
    
    # Remove code blocks while preserving content
    text = re.sub(r'```(?:\w+)?\n(.*?)\n```', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'`(.*?)`', r'\1', text)        # Inline code
    
    # Clean up lists but keep the content
    text = re.sub(r'^[\*\-]\s+', '• ', text, flags=re.MULTILINE)  # Bullet lists
    text = re.sub(r'^\d+\.\s+', '• ', text, flags=re.MULTILINE)   # Numbered lists
    
    # Remove links and keep the text
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    
    # Remove blockquotes
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    
    # Remove horizontal rules
    text = re.sub(r'^\s*[\-\*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    
    # Clean up extra newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove HTML tags if any
    text = re.sub(r'<[^>]+>', '', text)
    
    return text.strip()
