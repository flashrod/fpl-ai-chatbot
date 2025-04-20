import asyncio
from services.fpl_data import get_fpl_data
from services.gemini import rate_fpl_team, is_team_rating_request

async def test_team_rating():
    # Sample team input
    team_input = """Pickford (Everton)
Trippier (Newcastle)
Saliba (Arsenal)
Van Dijk (Liverpool)
Bruno (Man United)
Saka (Arsenal)
Haaland (Man City)
Watkins (Aston Villa)
Isak (Newcastle)"""

    print("Step 1: Testing if the input is recognized as a team rating request...")
    is_team = is_team_rating_request(team_input)
    print(f"Is team rating request: {is_team}")

    try:
        print("\nStep 2: Fetching FPL data...")
        fpl_data = await get_fpl_data()
        print("FPL data fetched successfully!")
        
        teams_count = len(fpl_data["bootstrap"]["teams"])
        players_count = len(fpl_data["bootstrap"]["elements"])
        fixtures_count = len(fpl_data["fixtures"])
        
        print(f"Data summary: {teams_count} teams, {players_count} players, {fixtures_count} fixtures")
        
        # Verify that the required fields exist in the data
        current_gameweek = next(
            (gw for gw in fpl_data["bootstrap"]["events"] if gw["is_current"]), 
            fpl_data["bootstrap"]["events"][0]
        )
        print(f"Current gameweek: {current_gameweek['id']}")
        
        # Check team data
        first_team = fpl_data["bootstrap"]["teams"][0]
        print(f"Sample team data: id={first_team['id']}, name={first_team['name']}")
        
        # Check player form
        form_players = sorted(
            fpl_data["bootstrap"]["elements"], 
            key=lambda x: float(x["form"]) if x["form"] and x["form"] != "-" else 0,
            reverse=True
        )[:3]
        print("Top form players:")
        for p in form_players:
            print(f"  {p['web_name']} - form: {p['form']}")
        
        print("\nStep 3: Processing team rating...")
        try:
            response = await rate_fpl_team(team_input, fpl_data)
            print("Team rating successful!")
            print("Response:")
            print(response)
        except Exception as e:
            print(f"Error in rate_fpl_team function: {e}")
            import traceback
            traceback.print_exc()
            
    except Exception as e:
        print(f"Error fetching FPL data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_team_rating()) 