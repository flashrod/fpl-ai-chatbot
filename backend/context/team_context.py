import httpx
import logging

logger = logging.getLogger(__name__)

# Base URL for the FPL API
FPL_API_BASE_URL = "https://fantasy.premierleague.com/api"

async def get_team_context(team_id: int) -> str:
    """
    Fetches all relevant data for a given FPL team ID and formats it
    into a string context for the AI model.
    """
    if not team_id:
        return "No team ID provided."

    # URLs for the different API endpoints we need
    entry_url = f"{FPL_API_BASE_URL}/entry/{team_id}/"
    picks_url = f"{FPL_API_BASE_URL}/entry/{team_id}/event/1/picks/" # Using gameweek 1 as an example
    bootstrap_url = f"{FPL_API_BASE_URL}/bootstrap-static/"

    async with httpx.AsyncClient() as client:
        try:
            # Fetch all data concurrently
            entry_res, picks_res, bootstrap_res = await httpx.get(entry_url), httpx.get(picks_url), httpx.get(bootstrap_url)
            
            # Check for errors
            entry_res.raise_for_status()
            picks_res.raise_for_status()
            bootstrap_res.raise_for_status()

            entry_data = entry_res.json()
            picks_data = picks_res.json()
            bootstrap_data = bootstrap_res.json()

            # --- Build the Context String ---
            context_parts = []
            
            # Manager Info
            context_parts.append(f"FPL Manager: {entry_data.get('name')}, Team Name: {entry_data.get('name')}.")
            context_parts.append(f"Overall Points: {entry_data.get('summary_overall_points')}, Rank: {entry_data.get('summary_overall_rank')}.")

            # Player Info from picks
            player_elements = {p['id']: p for p in bootstrap_data.get('elements', [])}
            
            squad = []
            for pick in picks_data.get('picks', []):
                player_id = pick.get('element')
                player_info = player_elements.get(player_id)
                if player_info:
                    squad.append(f"- {player_info.get('web_name')} (Cost: {player_info.get('now_cost')/10.0}m)")

            context_parts.append("\nCurrent Squad:")
            context_parts.extend(squad)

            return "\n".join(context_parts)

        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch FPL data for team context: {e}")
            return f"Error: Could not retrieve FPL data for team ID {team_id}."
        except Exception as e:
            logger.error(f"An unexpected error occurred in get_team_context: {e}")
            return "Error: An unexpected error occurred while building team context."