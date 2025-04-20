import httpx

# Base FPL API URLs
FPL_BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
FPL_FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/"

async def get_fpl_data():
    """Fetch both player and fixture data from the FPL API"""
    async with httpx.AsyncClient() as client:
        # Fetch general data (includes players, teams, etc.)
        bootstrap_response = await client.get(FPL_BOOTSTRAP_URL)
        bootstrap_response.raise_for_status()
        bootstrap_data = bootstrap_response.json()
        
        # Fetch fixture data
        fixtures_response = await client.get(FPL_FIXTURES_URL)
        fixtures_response.raise_for_status()
        fixtures_data = fixtures_response.json()
        
        # Combine the data
        return {
            "bootstrap": bootstrap_data,
            "fixtures": fixtures_data
        }
