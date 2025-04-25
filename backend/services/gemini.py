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
    
    # Process injury data for the prompt - select only critical injuries
    injury_lines = []
    for injury in injuries_data:
        # Only include serious injuries (status 'i') of notable players
        if injury['status'] == 'i' and injury.get('chance_of_playing') == 0:
            injury_lines.append(f"{injury['player']} ({injury['team']}): {injury['news']}")
    
    # Limit to just 5 key injuries
    injury_lines = injury_lines[:5]
    injury_context = "\n".join(injury_lines)
    
    # Get teams mapping for fixture processing
    teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
    
    # Define function to check if player is injured
    def is_player_injured(player):
        return any(p["id"] == player["id"] for p in injuries_data)
    
    # Get current gameweek
    current_gameweek = next(
        (gw for gw in bootstrap_data["events"] if gw["is_current"]), 
        bootstrap_data["events"][0]
    )
    current_gw_id = current_gameweek["id"]
    
    # Process upcoming fixtures (just next gameweek)
    upcoming_fixtures = [
        f for f in fixtures_data 
        if f["event"] is not None and f["event"] == current_gw_id
    ]
    
    # Only include the top 5 most interesting fixtures
    fixture_lines = []
    key_teams = [1, 2, 3, 6, 7, 8, 11, 14, 19, 20]  # IDs of top teams
    
    interesting_fixtures = []
    for f in upcoming_fixtures:
        home_id = f["team_h"]
        away_id = f["team_a"]
        # Prioritize matches involving top teams
        if home_id in key_teams or away_id in key_teams:
            interesting_fixtures.append(f)
    
    # Take top 5 interesting fixtures
    for f in interesting_fixtures[:5]:
        home_team = teams.get(f["team_h"], "Unknown")
        away_team = teams.get(f["team_a"], "Unknown")
        kickoff_time = f["kickoff_time"].split("T")[0] if f["kickoff_time"] else "TBD"
        
        fixture_lines.append(f"{home_team} vs {away_team} - {kickoff_time}")
    
    fixture_context = "\n".join(fixture_lines)

    prompt = f"""
You are a Fantasy Premier League expert assistant. 

Based on the latest data, give very concise, tactical recommendations in response to user questions.

FORMAT YOUR RESPONSE USING THESE RULES:
1. Keep total response under 100 words
2. Use bullet points for lists (• Item)
3. Group information into 1-2 categories at most
4. Only provide 2-3 specific player recommendations in total
5. Use simple, direct language
6. Never list more than 3 players total in your response
7. Focus on actionable advice only
8. Don't provide full lists of players by position
9. Don't recommend injured players
10. Be extremely concise - brevity is key!

--- KEY FIXTURES ---
{fixture_context}

--- CRITICAL INJURIES ---
{injury_context}

Now answer this question with extreme brevity:
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
    
    # Process injury data for the prompt - select only serious injuries
    injury_lines = []
    for injury in injuries_data:
        # Only include serious injuries that would impact team selection
        if injury['status'] == 'i' and injury.get('chance_of_playing') == 0:
            injury_lines.append(f"{injury['player']} ({injury['team']})")
    
    # Limit to just 5 key injuries
    injury_lines = injury_lines[:5]
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
    
    # Prepare upcoming fixtures data - only include next gameweek's fixtures
    upcoming_fixtures = {}
    for f in fixtures_data:
        if f["event"] is not None and f["event"] == current_gw:
            team_h = f["team_h"]
            team_a = f["team_a"]
            
            # Add fixture to home team's list
            if team_h not in upcoming_fixtures:
                upcoming_fixtures[team_h] = []
            upcoming_fixtures[team_h].append(f"vs {teams_data[team_a]['name']} (H)")
            
            # Add fixture to away team's list
            if team_a not in upcoming_fixtures:
                upcoming_fixtures[team_a] = []
            upcoming_fixtures[team_a].append(f"vs {teams_data[team_h]['name']} (A)")
    
    # Format fixtures info - only include top teams
    key_teams = [1, 2, 3, 6, 7, 8, 11, 14, 19, 20]  # IDs of top teams
    fixtures_info = []
    for team_id, fixtures in upcoming_fixtures.items():
        if team_id in key_teams:  # Only include key teams
            team_name = teams_data[team_id]["name"]
            fixtures_str = ", ".join(fixtures[:1])  # Only include first fixture
            fixtures_info.append(f"{team_name}: {fixtures_str}")
    
    # Limit to at most 5 fixtures
    fixtures_context = "\n".join(fixtures_info[:5])
    
    # Construct prompt for team rating
    prompt = f"""
You are a Fantasy Premier League expert assistant who rates teams concisely.

TASK: Rate the FPL team provided by the user on a scale from 1-10.

FORMAT YOUR RESPONSE USING THIS EXACT STRUCTURE:
1. "TEAM RATING: X/10" where X is a number from 1-10 (can use .5 increments)
2. Add 2 brief bullet points about strengths
3. Add 2 brief bullet points about improvements needed
4. If any players are injured, include a warning

Keep the entire response under 100 words and use bullet points (•) for lists.
Be extremely concise - brevity is key!

CONTEXT:
--- UPCOMING FIXTURES ---
{fixtures_context}

--- KEY INJURIES ---
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
    
    # Limit response length (approximately 100-150 words)
    words = text.split()
    if len(words) > 150:
        # Cut off excess words, but try to end at a sentence
        shortened_text = ' '.join(words[:150])
        last_sentence_end = max(
            shortened_text.rfind('.'),
            shortened_text.rfind('!'),
            shortened_text.rfind('?')
        )
        if last_sentence_end > len(shortened_text) * 0.7:  # If we found a sentence end in the latter part
            text = shortened_text[:last_sentence_end+1]
        else:
            text = shortened_text + '...'
    
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
