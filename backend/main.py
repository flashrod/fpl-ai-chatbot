from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
from routes.chat import router as chat_router
from routes.injuries import router as injuries_router
from routes.chips import router as chips_router
from routes.teams import router as teams_router
from services.chip_calculator import initialize_cache_refresh, refresh_processed_fixtures_cache
from services.fpl_data import initialize_fpl_data_cache, refresh_fpl_data_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # will restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(injuries_router)
app.include_router(chips_router)
app.include_router(teams_router)

@app.get("/")
def read_root():
    return {"message": "FPL Chatbot API is running"}

@app.post("/admin/refresh-cache")
async def refresh_all_caches():
    """
    Admin endpoint to manually refresh all caches
    This can be called if data needs to be refreshed immediately
    """
    try:
        logger.info("Manually refreshing all caches...")
        
        # Refresh FPL data cache first
        await refresh_fpl_data_cache()
        
        # Then refresh processed fixtures cache
        await refresh_processed_fixtures_cache()
        
        logger.info("Manual cache refresh completed successfully")
        return {"status": "success", "message": "All caches refreshed successfully"}
    except Exception as e:
        logger.error(f"Error during manual cache refresh: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh caches: {str(e)}"
        )

@app.on_event("startup")
async def startup_event():
    """Initialize background tasks when the application starts"""
    logger.info("Initializing background tasks...")
    
    # Initialize FPL data cache first as other services depend on it
    await initialize_fpl_data_cache()
    
    # Then initialize the chip calculator cache
    await initialize_cache_refresh()
    
    logger.info("Background tasks initialized successfully")
