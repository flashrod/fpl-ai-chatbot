import os
import google.generativeai as genai
from dotenv import load_dotenv
import re

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Use a model that's available in the list
model = genai.GenerativeModel("models/gemini-1.5-pro")

async def get_gemini_response(user_input, fpl_data, team_data=None):
    """Get response from Gemini for the given user input and FPL data"""
    try:
        # Basic prompt to give context
        system_prompt = """You are an FPL (Fantasy Premier League) Assistant with expertise in fantasy football.
        Your purpose is to provide helpful, accurate, and tactical advice on all things FPL.
        Use data-backed recommendations when available.
        Focus on being concise but informative, strategic, and up-to-date with the latest FPL information."""
        
        # Add user team context if available
        team_context = ""
        if team_data:
            # Extract team context
            team_name = team_data.get('name', 'Unknown')
            team_player = team_data.get('player_name', 'Unknown')
            team_summary = team_data.get('summary', {})
            overall_rank = team_summary.get('overall_rank', 'Unknown')
            team_value = team_summary.get('value', 0) / 10 if team_summary.get('value') else 'Unknown'
            
            # Extract current squad if available
            squad_info = ""
            if team_data.get('picks'):
                picks = team_data.get('picks', [])
                # Format picks info
                squad_info = "\nCurrent Squad:\n"
                for pick in picks:
                    is_captain = pick.get('is_captain', False)
                    is_vice = pick.get('is_vice_captain', False)
                    multiplier = pick.get('multiplier', 1)
                    position = "Captain" if is_captain else "Vice Captain" if is_vice else ""
                    # Add player info to squad
                    squad_info += f"- Player ID: {pick.get('element')} {position}\n"
                
                active_chip = team_data.get('active_chip')
                if active_chip:
                    squad_info += f"\nActive chip: {active_chip}\n"
            
            team_context = f"""
            I'm providing you with specific data about the user's FPL team:
            Team name: {team_name}
            Manager: {team_player}
            Overall rank: {overall_rank}
            Team value: £{team_value}m
            {squad_info}
            
            Please provide personalized advice considering this team information.
            """
        
        # Create messages for the API
        messages = [
            {"role": "system", "content": system_prompt + team_context},
            {"role": "user", "content": user_input}
        ]
        
        # Add FPL data context if available
        if fpl_data:
            current_gw = fpl_data.get('current_gameweek', {})
            gw_info = f"Current gameweek: {current_gw.get('id', 'Unknown')}, Status: {current_gw.get('name', 'Unknown')}"
            
            fpl_context = f"""
            Here's some recent FPL data to help with your response:
            {gw_info}
            """
            
            messages[0]["content"] += "\n" + fpl_context
        
        # Generate response
        model = genai.GenerativeModel(model_name="gemini-pro")
        response = model.generate_content(messages)
        
        return response.text
    except Exception as e:
        logger.error(f"Error getting Gemini response: {e}")
        return "I'm sorry, I couldn't process your request at the moment. Please try again later."

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
