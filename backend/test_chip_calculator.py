import asyncio
from services.chip_calculator import calculate_chip_recommendations, identify_double_gameweeks, get_cached_fixtures

async def test_chip_calculator():
    """
    Test the chip calculator functionality by:
    1. Checking if fixtures data can be retrieved
    2. Identifying double gameweeks
    3. Generating chip recommendations
    """
    print("Testing FPL Chip Calculator functionality...\n")
    
    try:
        # Step 1: Test fixture data retrieval
        print("1. Retrieving fixture data...")
        data = await get_cached_fixtures()
        
        if data:
            print(f"✅ Successfully retrieved fixture data")
            print(f"   - {len(data['fixtures'])} fixtures loaded")
            print(f"   - {len(data['teams'])} teams loaded")
            print(f"   - Current gameweek: {data['current_gameweek']['id']}")
        else:
            print("❌ Failed to retrieve fixture data")
            return
        
        # Step 2: Test double gameweek identification
        print("\n2. Identifying double gameweeks...")
        current_gw = data['current_gameweek']['id']
        team_fixtures = identify_double_gameweeks(data['fixtures'], current_gw)
        
        double_gameweeks = {
            gw: len([team for team, count in teams.items() if count > 1]) 
            for gw, teams in team_fixtures.items() 
            if any(count > 1 for team, count in teams.items())
        }
        
        if double_gameweeks:
            print(f"✅ Found {len(double_gameweeks)} gameweeks with multiple fixtures:")
            for gw, team_count in sorted(double_gameweeks.items()):
                print(f"   - GW{gw}: {team_count} teams with multiple fixtures")
        else:
            print("ℹ️ No double gameweeks found in future fixtures")
        
        # Step 3: Test recommendation generation
        print("\n3. Generating chip recommendations...")
        recommendations = await calculate_chip_recommendations(number_of_recommendations=3)
        
        if recommendations['status'] == 'success':
            print("✅ Successfully generated chip recommendations")
            
            print("\n   Bench Boost Recommendations:")
            for i, rec in enumerate(recommendations['bench_boost']):
                print(f"   {i+1}. GW{rec['gameweek']} - {rec['teams_with_multiple_fixtures']} teams with multiple fixtures, avg difficulty: {rec['avg_fixture_difficulty']:.2f}")
            
            print("\n   Triple Captain Recommendations:")
            for i, rec in enumerate(recommendations['triple_captain']):
                print(f"   {i+1}. GW{rec['gameweek']} - {rec['teams_with_multiple_fixtures']} teams with multiple fixtures, avg difficulty: {rec['avg_fixture_difficulty']:.2f}")
        else:
            print(f"❌ Failed to generate recommendations: {recommendations.get('message', 'Unknown error')}")
        
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_chip_calculator()) 