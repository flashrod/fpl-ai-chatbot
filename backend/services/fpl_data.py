# services/fpl_data.py

import httpx
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# The main FPL API endpoint for general data
FPL_API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"

# A simple in-memory cache
class FPLCache:
    def __init__(self):
        self.data = None
        self.last_updated = None
        self.cache_duration = timedelta(minutes=15) # How long before the cache is stale

    def is_stale(self):
        """Checks if the cached data is older than the cache_duration."""
        if not self.last_updated:
            return True
        return datetime.utcnow() - self.last_updated > self.cache_duration

# Create a single cache instance to be used by the app
fpl_cache = FPLCache()

def fetch_and_cache_data():
    """Fetches fresh data from the FPL API and updates the cache."""
    logger.info("Attempting to fetch fresh FPL data from API...")
    try:
        response = httpx.get(FPL_API_URL)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        fpl_cache.data = response.json()
        fpl_cache.last_updated = datetime.utcnow()
        logger.info("FPL data cache refreshed successfully.")
        return True
    except httpx.RequestError as e:
        logger.error(f"An error occurred while requesting FPL data: {e}")
        return False

def initialize_fpl_data_cache():
    """Function to be called on application startup."""
    logger.info("Initializing FPL data cache...")
    fetch_and_cache_data()

def get_fpl_data():
    """
    Returns FPL data from the cache.
    Refreshes the cache if the data is stale.
    This function takes NO arguments.
    """
    if fpl_cache.is_stale():
        logger.info("Cache is stale or empty, fetching new data.")
        fetch_and_cache_data()
    
    # Return the cached data
    return fpl_cache.data