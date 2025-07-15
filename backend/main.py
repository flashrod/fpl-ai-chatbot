import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import all your routers
from routes.chat import router as chat_router
from routes.injuries import router as injuries_router
from routes.chips import router as chips_router
from routes.teams import router as teams_router
from routes.fpl import router as fpl_router

# Import background task and cache functions
from services.chip_calculator import initialize_cache_refresh, refresh_processed_fixtures_cache
from services.fpl_data import initialize_fpl_data_cache, refresh_fpl_data_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FPL AI Assistant API")

# Allow your frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Add a unique /api prefix to every router ---
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(teams_router, prefix="/api/teams", tags=["Teams"])
app.include_router(injuries_router, prefix="/api/injuries", tags=["Injuries"])
app.include_router(chips_router, prefix="/api/chips", tags=["Chips"])
app.include_router(fpl_router, prefix="/api/fpl", tags=["FPL"])


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing background tasks...")
    await initialize_fpl_data_cache()
    await initialize_cache_refresh()
    logger.info("Background tasks initialized successfully")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the FPL AI Chatbot API!"}

@app.post("/admin/refresh-cache", tags=["Admin"])
async def refresh_all_caches():
    try:
        logger.info("Manually refreshing all caches...")
        await refresh_fpl_data_cache()
        await refresh_processed_fixtures_cache()
        logger.info("Manual cache refresh completed successfully")
        return {"status": "success", "message": "All caches refreshed successfully"}
    except Exception as e:
        logger.error(f"Error during manual cache refresh: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh caches: {str(e)}")