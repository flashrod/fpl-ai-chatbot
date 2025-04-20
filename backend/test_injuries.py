import asyncio
from services.fpl_data import get_fpl_data

async def test_injury_data():
    """Test that injury data is being collected and processed correctly"""
    print("Fetching FPL data including injury information...")
    fpl_data = await get_fpl_data()
    
    # Verify injuries data exists
    injuries = fpl_data.get("injuries", [])
    print(f"Found {len(injuries)} injured players")
    
    if not injuries:
        print("No injuries found - this is unusual and may indicate an issue")
        return
    
    # Display some sample injury data
    print("\nSample injury data:")
    for i, injury in enumerate(injuries[:5]):  # Show first 5 injuries
        print(f"{i+1}. {injury['player']} ({injury['team']}) - {injury['status']}")
        print(f"   News: {injury['news']}")
        print(f"   Chance of playing: {injury['chance_of_playing']}")
        print("")
    
    # Test the is_player_injured function
    from services.fpl_data import is_player_injured
    
    # Find an injured player for testing
    test_player_id = injuries[0]["id"] if injuries else None
    
    if test_player_id:
        # Verify is_player_injured works
        is_injured = is_player_injured(test_player_id, injuries)
        print(f"is_player_injured test: Player {test_player_id} is{'not ' if not is_injured else ' '}recognized as injured")
    
    print("\nInjury data test complete")

if __name__ == "__main__":
    asyncio.run(test_injury_data()) 