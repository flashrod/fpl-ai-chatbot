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
    # Check if it's a team rating request
    if is_team_rating_request(user_input):
        return await rate_fpl_team(user_input, fpl_data)
    
    # Otherwise proceed with normal response
    # Get the bootstrap and fixtures data
    bootstrap_data = fpl_data["bootstrap"]
    fixtures_data = fpl_data["fixtures"]
    injuries_data = fpl_data.get("injuries", [])
    
    # Process injury data for the prompt - select from a variety of teams
    # Group injuries by team first
    injuries_by_team = {}
    for injury in injuries_data:
        team = injury['team']
        if team not in injuries_by_team:
            injuries_by_team[team] = []
        injuries_by_team[team].append(injury)
    
    # Select 1-2 injuries from each team to ensure coverage across teams
    injury_lines = []
    for team, team_injuries in injuries_by_team.items():
        # Take up to 2 injuries per team, prioritizing more serious ones (status 'i')
        serious_injuries = [i for i in team_injuries if i['status'] == 'i'][:1]
        other_injuries = [i for i in team_injuries if i['status'] != 'i'][:1]
        
        selected_injuries = serious_injuries + other_injuries
        for injury in selected_injuries:
            injury_lines.append(f"{injury['player']} ({injury['team']}) - {injury['status']}: {injury['news']}")
        
        # Cap at 15 teams to keep the context manageable
        if len(injury_lines) >= 20:
            break
    
    injury_context = "\n".join(injury_lines)
    
    # Get teams mapping for fixture processing
    teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
    
    # Define function to check if player is injured
    def is_player_injured(player):
        return any(p["id"] == player["id"] for p in injuries_data)
    
    # Rank top players but exclude injured players
    available_players = [p for p in bootstrap_data["elements"] if not is_player_injured(p)]
    top_players = sorted(
        available_players, 
        key=lambda x: x["total_points"], 
        reverse=True
    )[:10]

    player_lines = []
    for p in top_players:
        try:
            name = p["web_name"]
            # Handle element_type more robustly
            element_type = p["element_type"]
            position_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
            pos = position_map.get(element_type, "UNK")  # Default to "UNK" if element_type is not recognized
            
            pts = p["total_points"]
            form = p["form"]
            team_id = p["team"]
            team_name = teams.get(team_id, "Unknown")
            player_lines.append(f"{name} ({team_name}) - {pos}, {pts} pts, form: {form}")
        except Exception as e:
            # Skip players that cause errors
            continue

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

Based on the latest data below, give concise, tactical recommendations in response to user questions.

FORMAT YOUR RESPONSE USING THESE RULES:
1. Keep total response under 150 words
2. Use bullet points for lists (• Item)
3. Group information into categories with short headings
4. Prioritize the most relevant 3-5 points only
5. Use simple, direct language
6. Avoid lengthy explanations
7. Include only essential details
8. Do not recommend injured players

--- TOP PLAYER DATA ---
{player_context}
-----------------------

--- UPCOMING FIXTURES ---
{fixture_context}
-----------------------

--- INJURY NEWS ---
{injury_context}
-----------------------

Now answer this question concisely:
{user_input}
""".strip()

    try:
        response = model.generate_content(prompt)
        raw_text = response.text
        
        # Remove markdown formatting and post-process
        clean_text = format_response(raw_text)
        return clean_text
    except Exception as e:
        # Detailed error with troubleshooting suggestions
        error_msg = f"Error from Gemini: {e}"
        error_msg += "\n\nTroubleshooting tips:"
        error_msg += "\n• Check your API key"
        error_msg += "\n• Verify the model name"
        error_msg += "\n• Check your internet connection"
        return error_msg

def is_team_rating_request(user_input: str) -> bool:
    """Detect if the user is asking for team rating"""
    input_lower = user_input.lower()
    
    # Check if the message contains key phrases indicating a team rating request
    team_keywords = [
        "rate my team", "rate this team", "evaluate my team", "team rating",
        "squad rating", "how good is my team", "what do you think of my team",
        "how's my team", "score my team", "team score", "rate these players"
    ]
    
    for keyword in team_keywords:
        if keyword in input_lower:
            return True
    
    # If the message is listing players (likely a team)
    lines = user_input.strip().split('\n')
    player_count = sum(1 for line in lines if line.strip() and not line.startswith('?'))
    
    # If there are 11-15 lines that look like a team listing
    if 5 <= player_count <= 15:
        return True
        
    return False

async def rate_fpl_team(user_input: str, fpl_data: dict) -> str:
    """Rate a user's FPL team on a scale from 1-10"""
    bootstrap_data = fpl_data["bootstrap"]
    fixtures_data = fpl_data["fixtures"]
    injuries_data = fpl_data.get("injuries", [])
    teams_data = {team["id"]: team for team in bootstrap_data["teams"]}
    
    # Process injury data for the prompt - select from a variety of teams
    # Group injuries by team first
    injuries_by_team = {}
    for injury in injuries_data:
        team = injury['team']
        if team not in injuries_by_team:
            injuries_by_team[team] = []
        injuries_by_team[team].append(injury)
    
    # Select 1-2 injuries from each team to ensure coverage across teams
    injury_lines = []
    for team, team_injuries in injuries_by_team.items():
        # Take up to 2 injuries per team, prioritizing more serious ones (status 'i')
        serious_injuries = [i for i in team_injuries if i['status'] == 'i'][:1]
        other_injuries = [i for i in team_injuries if i['status'] != 'i'][:1]
        
        selected_injuries = serious_injuries + other_injuries
        for injury in selected_injuries:
            injury_lines.append(f"{injury['player']} ({injury['team']}) - {injury['status']}: {injury['news']}")
        
        # Cap at 15 teams to keep the context manageable
        if len(injury_lines) >= 20:
            break
    
    injury_context = "\n".join(injury_lines)
    
    # Identify potentially injured players in user's team for warning
    user_team_lines = user_input.strip().split('\n')
    user_team_players = [line.strip() for line in user_team_lines if line.strip()]
    
    # Get current gameweek
    current_gameweek = next(
        (gw for gw in bootstrap_data["events"] if gw["is_current"]), 
        bootstrap_data["events"][0]
    )
    current_gw = current_gameweek["id"]
    
    # Prepare upcoming fixtures data for context
    upcoming_fixtures = {}
    for f in fixtures_data:
        if f["event"] is not None and f["event"] in [current_gw, current_gw + 1]:
            team_h = f["team_h"]
            team_a = f["team_a"]
            gameweek = f["event"]
            
            # Add fixture to home team's list
            if team_h not in upcoming_fixtures:
                upcoming_fixtures[team_h] = []
            upcoming_fixtures[team_h].append(f"GW{gameweek} vs {teams_data[team_a]['name']} (H)")
            
            # Add fixture to away team's list
            if team_a not in upcoming_fixtures:
                upcoming_fixtures[team_a] = []
            upcoming_fixtures[team_a].append(f"GW{gameweek} vs {teams_data[team_h]['name']} (A)")
    
    # Format fixtures info
    fixtures_info = []
    for team_id, fixtures in upcoming_fixtures.items():
        team_name = teams_data[team_id]["name"]
        fixtures_str = ", ".join(fixtures)
        fixtures_info.append(f"{team_name}: {fixtures_str}")
    
    fixtures_context = "\n".join(fixtures_info)
    
    # Define function to check if player is injured
    def is_player_injured(player):
        return any(p["id"] == player["id"] for p in injuries_data)
    
    # Create data about some top players for context, excluding injured players
    available_players = [p for p in bootstrap_data["elements"] if not is_player_injured(p)]
    top_players = sorted(
        available_players, 
        key=lambda x: float(x["form"]) if x["form"] and x["form"] != "-" else 0,
        reverse=True
    )[:20]
    
    player_info = []
    for p in top_players:
        try:
            name = p["web_name"]
            team_name = teams_data[p["team"]]["name"]
            
            # Handle element_type more robustly
            element_type = p["element_type"]
            position_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
            pos = position_map.get(element_type, "UNK")  # Default to "UNK" if element_type is not recognized
            
            points = p["total_points"]
            form = p["form"]
            price = p["now_cost"] / 10.0  # Convert to actual price format
            player_info.append(f"{name} ({team_name}) - {pos}, £{price}m, {points} pts, form: {form}")
        except Exception as e:
            # Skip players that cause errors
            continue
    
    players_context = "\n".join(player_info)
    
    # Construct prompt for team rating
    prompt = f"""
You are a Fantasy Premier League expert assistant who specializes in rating teams.

TASK: Rate the FPL team provided by the user on a scale from 1-10. The rating should reflect the team's current strength.

FORMAT YOUR RESPONSE USING THIS EXACT STRUCTURE:
1. Start with "TEAM RATING: X/10" where X is a number from 1-10 (can use .5 increments)
2. Add 2-3 short bullet points about the team's strengths
3. Add 2-3 short bullet points about areas for improvement
4. Provide 1-2 specific transfer suggestions if needed
5. IMPORTANT: Warn about any potentially injured players in the user's team based on the injury news

Keep the entire response under 150 words and use bullet points (•) for lists.

CONTEXT DATA:
--- FORM PLAYERS ---
{players_context}

--- UPCOMING FIXTURES ---
{fixtures_context}

--- INJURY NEWS ---
{injury_context}

USER'S TEAM:
{user_input}
""".strip()

    try:
        response = model.generate_content(prompt)
        raw_text = response.text
        
        # Remove markdown formatting and post-process
        clean_text = format_response(raw_text)
        return clean_text
    except Exception as e:
        error_msg = f"Error rating team: {e}"
        return error_msg

def clean_markdown(text):
    """Remove common markdown formatting from text"""
    # Replace headers but preserve as bold
    text = re.sub(r'^#\s+(.*?)$', r'\1:', text, flags=re.MULTILINE)
    text = re.sub(r'^##\s+(.*?)$', r'\1:', text, flags=re.MULTILINE)
    text = re.sub(r'^###\s+(.*?)$', r'\1:', text, flags=re.MULTILINE)
    
    # Replace bold and italic
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.*?)\*', r'\1', text)      # Italic
    text = re.sub(r'__(.*?)__', r'\1', text)      # Bold
    text = re.sub(r'_(.*?)_', r'\1', text)        # Italic
    
    # Remove code blocks while preserving content
    text = re.sub(r'```(?:\w+)?\n(.*?)\n```', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'`(.*?)`', r'\1', text)        # Inline code
    
    # Format lists consistently
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

def format_response(text):
    """Format the response into a cleaner, more concise structure"""
    # First clean markdown
    text = clean_markdown(text)
    
    # Special handling for team ratings
    if "TEAM RATING:" in text:
        # Make the rating more prominent
        text = text.replace("TEAM RATING:", "TEAM RATING:")
    
    # Ensure consistent bullet point format with proper spacing
    text = re.sub(r'•\s*', '• ', text)
    
    # Ensure headings are properly formatted and stand out
    text = re.sub(r'([A-Z][A-Za-z\s]+):', r'\n\1:', text)
    
    # Special handling for TEAM RATING to be prominent
    text = re.sub(r'TEAM RATING:', r'TEAM RATING:', text)
    
    # Ensure good spacing between sections
    text = re.sub(r':\n', ':\n\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Fix any remaining formatting issues
    text = text.replace('• •', '•')
    text = text.replace('••', '•')
    
    # Ensure there's no excessive spacing
    text = re.sub(r'\n\s+', '\n', text)
    
    # Ensure proper spacing after bullet points
    text = re.sub(r'•(\S)', '• \1', text)
    
    return text.strip()
