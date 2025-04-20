# ⚽ FPL AI Chatbot – Fullstack Project

An intelligent Fantasy Premier League assistant that combines live FPL data with Google's Gemini AI to provide strategic advice, player recommendations, and team insights.

## 🌟 Features

- **Real-time FPL Data**: Connects to the official Fantasy Premier League API
- **AI-Powered Recommendations**: Uses Google's Gemini Pro model
- **Interactive Chat Interface**: User-friendly conversational UI
- **Strategic Insights**: Get advice on transfers, captain picks, and team selection

## 🛠️ Tech Stack

- **Frontend**: React with Vite
- **Backend**: FastAPI (Python)
- **AI Engine**: Google Generative AI (Gemini Pro)
- **API Integration**: FPL Official API

## 📋 Project Structure

```
fplai/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── routes/
│   │   └── chat.py             # API endpoints for chat
│   ├── services/
│   │   ├── gemini.py           # Google Gemini AI integration
│   │   └── fpl_data.py         # FPL API data fetching
│   ├── .env                    # Environment variables
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── index.html              # Entry HTML
│   ├── vite.config.js          # Vite configuration
│   └── src/
│       ├── App.jsx             # Main React component
│       ├── main.jsx            # React entry point
│       └── components/
│           └── ChatBot.jsx     # Chat interface component
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- Google Gemini API key

### Setting Up the Backend

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your Gemini API key:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Setting Up the Frontend

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and go to http://localhost:5173

## 💬 Example Questions

- "Who are the top 5 players by form right now?"
- "Who should I captain this week?"
- "Is it worth taking a hit to bring in Haaland?"
- "Best budget defenders under 4.5m?"
- "Should I use my wildcard this week?"

## 📝 License

MIT

## 🙏 Acknowledgements

- [Fantasy Premier League API](https://fantasy.premierleague.com/api/bootstrap-static/)
- [Google Generative AI](https://ai.google.dev/)
- Icons by [FontAwesome](https://fontawesome.com/)
