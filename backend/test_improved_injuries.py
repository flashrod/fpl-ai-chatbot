import asyncio
from services.fpl_data import get_fpl_data

async def test_improved_injury_selection():
    """Test the improved injury selection logic for including injuries from multiple teams"""
    print("Fetching FPL data including injury information...")
    fpl_data = await get_fpl_data()
    
    # Verify injuries data exists
    injuries_data = fpl_data.get("injuries", [])
    print(f"Found {len(injuries_data)} injured players")
    
    if not injuries_data:
        print("No injuries found - this is unusual and may indicate an issue")
        return
    
    # Group injuries by team first - replicating the logic from gemini.py
    injuries_by_team = {}
    for injury in injuries_data:
        team = injury['team']
        if team not in injuries_by_team:
            injuries_by_team[team] = []
        injuries_by_team[team].append(injury)
    
    print(f"\nFound injuries for {len(injuries_by_team)} teams")
    
    # Select 1-2 injuries from each team to ensure coverage across teams
    injury_lines = []
    teams_included = set()
    
    for team, team_injuries in injuries_by_team.items():
        # Take up to 2 injuries per team, prioritizing more serious ones (status 'i')
        serious_injuries = [i for i in team_injuries if i['status'] == 'i'][:1]
        other_injuries = [i for i in team_injuries if i['status'] != 'i'][:1]
        
        selected_injuries = serious_injuries + other_injuries
        
        if selected_injuries:
            teams_included.add(team)
            
        for injury in selected_injuries:
            injury_lines.append(f"{injury['player']} ({injury['team']}) - {injury['status']}: {injury['news']}")
        
        # Cap at 15 teams to keep the context manageable
        if len(injury_lines) >= 20:
            break
    
    print(f"\nSelected {len(injury_lines)} injuries across {len(teams_included)} teams for the model prompt:")
    for i, line in enumerate(injury_lines):
        print(f"{i+1}. {line}")
    
    # Compare with old approach (first 10 injuries)
    old_approach_injuries = injuries_data[:10]
    old_approach_teams = set(injury['team'] for injury in old_approach_injuries)
    
    print(f"\nOld approach would have selected {len(old_approach_injuries)} injuries from {len(old_approach_teams)} teams:")
    for i, injury in enumerate(old_approach_injuries):
        print(f"{i+1}. {injury['player']} ({injury['team']}) - {injury['status']}: {injury['news']}")
    
    print(f"\nImprovement: From {len(old_approach_teams)} teams to {len(teams_included)} teams")

if __name__ == "__main__":
    asyncio.run(test_improved_injury_selection()) 