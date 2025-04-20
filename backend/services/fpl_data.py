import httpx

# Base FPL API URLs
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"

async def get_fpl_data():
    """Fetch both player and fixture data from the FPL API, including injury information"""
    async with httpx.AsyncClient() as client:
        # Fetch general data (includes players, teams, etc.)
        bootstrap_response = await client.get(FPL_BOOTSTRAP_URL)
        bootstrap_response.raise_for_status()
        bootstrap_data = bootstrap_response.json()
        
        # Get team name mapping for easier reference
        teams = {team["id"]: team["name"] for team in bootstrap_data["teams"]}
        
        # Process injury data
        injured_players = []
        for p in bootstrap_data["elements"]:
            if p["status"] not in ["a", "u"]:  # Not available or unknown
                injured_players.append({
                    "id": p["id"],
                    "player": f"{p['first_name']} {p['second_name']}",
                    "web_name": p["web_name"],
                    "team": teams.get(p["team"], "Unknown"),
                    "team_id": p["team"],
                    "status": p["status"],
                    "news": p["news"],
                    "chance_of_playing": p["chance_of_playing_next_round"]
                })
        
        # Fetch fixture data
        fixtures_response = await client.get(FPL_FIXTURES_URL)
        fixtures_response.raise_for_status()
        fixtures_data = fixtures_response.json()
        
        # Return combined data including injuries
        return {
            "bootstrap": bootstrap_data,
            "fixtures": fixtures_data,
            "injuries": injured_players
        }

def is_player_injured(player_id, injuries_data):
    """Check if a player is injured based on player ID"""
    return any(p["id"] == player_id for p in injuries_data)
