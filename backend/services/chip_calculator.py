import asyncio
import functools
import time
from typing import Dict, List, Tuple, Optional, Any
from services.fpl_data import get_fpl_data

# Cache configuration
CACHE_TTL = 86400  # 24 hour cache lifetime (updated from 1 hour)
_fixtures_cache = {
    "data": None,
    "timestamp": 0
}

async def get_cached_fixtures() -> Dict[str, Any]:
    """
    Get fixtures data with caching to reduce API calls
    """
    global _fixtures_cache
    current_time = time.time()
    
    # Check if cache is valid
    if _fixtures_cache["data"] is None or (current_time - _fixtures_cache["timestamp"]) > CACHE_TTL:
        # Cache expired or not initialized, fetch fresh data
        fpl_data = await get_fpl_data()
        
        # Structure the data in a more usable format for chip calculations
        processed_data = {
            "fixtures": fpl_data["fixtures"],
            "teams": {team["id"]: team for team in fpl_data["bootstrap"]["teams"]},
            "events": fpl_data["bootstrap"]["events"],
            "current_gameweek": next(
                (gw for gw in fpl_data["bootstrap"]["events"] if gw["is_current"]), 
                fpl_data["bootstrap"]["events"][0]
            )
        }
        
        # Update cache
        _fixtures_cache["data"] = processed_data
        _fixtures_cache["timestamp"] = current_time
        
    return _fixtures_cache["data"]

def identify_double_gameweeks(fixtures: List[Dict], current_gw: int) -> Dict[int, Dict[int, int]]:
    """
    Identify gameweeks where teams play multiple times
    
    Returns:
        Dict mapping gameweek -> team_id -> number of fixtures
    """
    # Filter only future fixtures
    future_fixtures = [f for f in fixtures if f["event"] is not None and f["event"] >= current_gw]
    
    # Map teams to their fixtures per gameweek
    team_fixtures = {}
    
    for fixture in future_fixtures:
        gw = fixture["event"]
        home_team = fixture["team_h"]
        away_team = fixture["team_a"]
        
        # Initialize if not exists
        if gw not in team_fixtures:
            team_fixtures[gw] = {}
            
        # Count home team fixtures
        if home_team not in team_fixtures[gw]:
            team_fixtures[gw][home_team] = 0
        team_fixtures[gw][home_team] += 1
        
        # Count away team fixtures
        if away_team not in team_fixtures[gw]:
            team_fixtures[gw][away_team] = 0
        team_fixtures[gw][away_team] += 1
    
    return team_fixtures

def calculate_gameweek_difficulty(
    gw: int,
    team_fixtures: Dict[int, Dict[int, int]],
    fixtures: List[Dict],
    teams: Dict[int, Dict]
) -> Dict:
    """
    Calculate difficulty of a gameweek for chip usage
    
    Returns:
        Dict with difficulty metrics and team data
    """
    if gw not in team_fixtures:
        return {
            "gameweek": gw,
            "difficulty_score": 100,  # Very high difficulty (no fixtures)
            "teams_with_multiple_fixtures": 0,
            "avg_fixture_difficulty": 3,
            "team_data": {}
        }
    
    gw_fixtures = [f for f in fixtures if f["event"] == gw]
    
    # Teams with multiple fixtures in this gameweek
    double_gw_teams = {team_id: count for team_id, count in team_fixtures[gw].items() if count > 1}
    
    # Calculate average fixture difficulty for this gameweek
    team_difficulties = {}
    
    for fixture in gw_fixtures:
        home_team = fixture["team_h"]
        away_team = fixture["team_a"]
        
        # Away team difficulty (facing home team)
        if away_team not in team_difficulties:
            team_difficulties[away_team] = []
        team_difficulties[away_team].append(fixture["team_h_difficulty"])
        
        # Home team difficulty (facing away team)
        if home_team not in team_difficulties:
            team_difficulties[home_team] = []
        team_difficulties[home_team].append(fixture["team_a_difficulty"])
    
    # Calculate average difficulty per team
    team_avg_difficulty = {}
    for team_id, difficulties in team_difficulties.items():
        # If team plays multiple fixtures, take the average of their fixture difficulties
        team_avg_difficulty[team_id] = sum(difficulties) / len(difficulties)
    
    # Overall metrics
    avg_difficulty = sum(team_avg_difficulty.values()) / len(team_avg_difficulty) if team_avg_difficulty else 3
    
    # Calculate a composite difficulty score (lower is better for chips)
    # Formula factors: average difficulty (30%), number of teams with multiple fixtures (70%)
    difficulty_score = (avg_difficulty * 0.3) - (len(double_gw_teams) * 0.7 * 10)
    
    return {
        "gameweek": gw,
        "difficulty_score": difficulty_score,
        "teams_with_multiple_fixtures": len(double_gw_teams),
        "avg_fixture_difficulty": avg_difficulty,
        "team_data": {
            team_id: {
                "name": teams[team_id]["name"],
                "short_name": teams[team_id]["short_name"],
                "fixtures_count": team_fixtures[gw].get(team_id, 0),
                "avg_difficulty": team_avg_difficulty.get(team_id, 3),
                "fixture_details": [
                    {
                        "opponent": teams[f["team_a"]]["short_name"] if f["team_h"] == team_id else teams[f["team_h"]]["short_name"],
                        "is_home": f["team_h"] == team_id,
                        "difficulty": f["team_a_difficulty"] if f["team_h"] == team_id else f["team_h_difficulty"]
                    }
                    for f in gw_fixtures
                    if f["team_h"] == team_id or f["team_a"] == team_id
                ]
            }
            for team_id in team_fixtures[gw].keys()
        }
    }

def get_recommended_players(gameweek_data, bootstrap_data, position_filter=None):
    """
    Get player recommendations based on fixture difficulty and form
    
    Args:
        gameweek_data: Gameweek metrics including team difficulty data
        bootstrap_data: Bootstrap data from FPL API containing player information
        position_filter: Optional filter for player position (1=GK, 2=DEF, 3=MID, 4=FWD)
    
    Returns:
        List of recommended players sorted by a composite score
    """
    # Get team data from gameweek metrics
    team_data = gameweek_data["team_data"]
    
    # Filter players by position if specified
    players = bootstrap_data["elements"]
    if position_filter:
        players = [p for p in players if p["element_type"] == position_filter]
    
    # Create position mappings
    position_map = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
    
    # Calculate player scores based on form, upcoming fixtures, and total points
    player_scores = []
    for player in players:
        team_id = player["team"]
        
        # Skip if team doesn't have fixtures in this gameweek
        if team_id not in team_data:
            continue
        
        # Get team fixtures data
        team_fixtures = team_data[team_id]
        team_fixtures_count = team_fixtures["fixtures_count"]
        fixture_difficulty = team_fixtures["avg_difficulty"]
        
        # Get player data
        form = float(player["form"]) if player["form"] and player["form"] != "-" else 0
        points = player["total_points"]
        minutes = player["minutes"]
        
        # Skip players with very low minutes
        if minutes < 450:  # Less than 5 full games
            continue
        
        # Calculate composite score: 
        # - Higher for players in form
        # - Higher for teams with multiple fixtures
        # - Higher for teams with easier fixtures
        # - Higher for players with more total points
        composite_score = (
            form * 3 +                          # Form is important
            team_fixtures_count * 2 +           # Multiple fixtures is a big advantage
            (5 - fixture_difficulty) * 0.5 +    # Easier fixtures are better (5 is the max difficulty)
            points / 20                         # Total points shows consistency
        )
        
        # Create player entry
        player_entry = {
            "id": player["id"],
            "name": player["web_name"],
            "team": team_data[team_id]["name"],
            "position": position_map[player["element_type"]],
            "form": form,
            "points": points,
            "price": player["now_cost"] / 10.0,
            "fixtures_count": team_fixtures_count,
            "avg_fixture_difficulty": fixture_difficulty,
            "score": composite_score
        }
        
        player_scores.append(player_entry)
    
    # Sort by composite score
    sorted_players = sorted(player_scores, key=lambda x: x["score"], reverse=True)
    
    # Return top players
    return sorted_players[:10]

async def calculate_chip_recommendations(number_of_recommendations: int = 3) -> Dict:
    """
    Calculate and recommend optimal gameweeks for using FPL chips
    
    Args:
        number_of_recommendations: Number of gameweeks to recommend for each chip
    
    Returns:
        Dictionary with recommendations for each chip type
    """
    try:
        # Get cached fixture data
        data = await get_cached_fixtures()
        fixtures = data["fixtures"]
        teams = data["teams"]
        current_gw = data["current_gameweek"]["id"]
        
        # Get bootstrap data for player recommendations
        fpl_data = await get_fpl_data()
        bootstrap_data = fpl_data["bootstrap"]
        
        # Identify double/triple gameweeks
        team_fixtures_by_gw = identify_double_gameweeks(fixtures, current_gw)
        
        # Calculate difficulty for each gameweek
        gameweek_metrics = {}
        future_gameweeks = sorted([gw for gw in team_fixtures_by_gw.keys() if gw >= current_gw])
        
        for gw in future_gameweeks:
            gameweek_metrics[gw] = calculate_gameweek_difficulty(gw, team_fixtures_by_gw, fixtures, teams)
        
        # Recommendation logic for different chips
        
        # Bench Boost - prioritize gameweeks with many teams playing twice
        # as this maximizes the potential of bench players
        bench_boost_recommendations = sorted(
            gameweek_metrics.values(),
            key=lambda x: (
                -x["teams_with_multiple_fixtures"],  # More teams with double fixtures is better
                x["avg_fixture_difficulty"]  # Lower average difficulty is better
            )
        )[:number_of_recommendations]
        
        # Triple Captain - prioritize gameweeks with top teams playing twice
        # and against easier opposition
        triple_captain_recommendations = sorted(
            gameweek_metrics.values(),
            key=lambda x: x["difficulty_score"]  # Lower difficulty score is better
        )[:number_of_recommendations]
        
        # Add player recommendations for each chip type and gameweek
        for rec in bench_boost_recommendations:
            # For Bench Boost, recommend 3 goalkeepers, 5 defenders, 5 midfielders, and 3 forwards
            rec["recommended_players"] = {
                "GK": get_recommended_players(rec, bootstrap_data, position_filter=1),
                "DEF": get_recommended_players(rec, bootstrap_data, position_filter=2),
                "MID": get_recommended_players(rec, bootstrap_data, position_filter=3),
                "FWD": get_recommended_players(rec, bootstrap_data, position_filter=4)
            }
        
        for rec in triple_captain_recommendations:
            # For Triple Captain, recommend top players regardless of position but prioritize attackers
            rec["recommended_players"] = {
                "GK": get_recommended_players(rec, bootstrap_data, position_filter=1)[:3],
                "DEF": get_recommended_players(rec, bootstrap_data, position_filter=2)[:5],
                "MID": get_recommended_players(rec, bootstrap_data, position_filter=3)[:7],
                "FWD": get_recommended_players(rec, bootstrap_data, position_filter=4)[:5]
            }
        
        return {
            "bench_boost": bench_boost_recommendations,
            "triple_captain": triple_captain_recommendations,
            "current_gameweek": current_gw,
            "status": "success",
            "last_updated": time.time()
        }
    
    except Exception as e:
        # Log error for debugging
        print(f"Error calculating chip recommendations: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Failed to calculate chip recommendations: {str(e)}",
            "current_gameweek": None,
            "bench_boost": [],
            "triple_captain": []
        } 