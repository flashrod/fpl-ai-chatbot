import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager

# Import the router that contains our API endpoints
from routes import teams, chat, chips, fpl, injuries

# 1. Import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

# Import the caching function to be run on startup
from services.fpl_data import initialize_fpl_data_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    logger.info("Server starting up...")
    initialize_fpl_data_cache()
    yield
    # Code to run on shutdown
    logger.info("Server shutting down.")

# Initialize the FastAPI app with the lifespan manager
app = FastAPI(lifespan=lifespan)

# 2. Define the origins that are allowed to make requests
# This should be the address of your React frontend
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite dev server port
    "http://127.0.0.1:5173",
]

# 3. Add the CORS middleware to your app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)


# Include the existing routers
app.include_router(teams.router)
app.include_router(chat.router)
app.include_router(chips.router)
app.include_router(fpl.router)
app.include_router(injuries.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the FPL AI Chatbot API"}