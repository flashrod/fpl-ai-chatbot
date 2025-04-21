import { useState } from 'react'
import ChatBot from './components/ChatBot'
import TeamRating from './components/TeamRating'
import ChipCalculator from './components/ChipCalculator'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [teamRatingResponse, setTeamRatingResponse] = useState(null)

  const handleTeamRatingReceived = (response) => {
    setTeamRatingResponse(response)
    setActiveTab('chat')
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1><span className="soccer-icon">⚽</span> <span>FPL AI</span> Assistant</h1>
      </header>
      
      <div className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="tab-icon">💬</span> Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'team-rating' ? 'active' : ''}`}
          onClick={() => setActiveTab('team-rating')}
        >
          <span className="tab-icon">🏆</span> Team Rating
        </button>
        <button 
          className={`tab-button ${activeTab === 'chip-calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('chip-calculator')}
        >
          <span className="tab-icon">🔍</span> Chip Planner
        </button>
      </div>
      
      <main>
        {activeTab === 'chat' && <ChatBot initialMessage={teamRatingResponse} />}
        {activeTab === 'team-rating' && <TeamRating onRatingReceived={handleTeamRatingReceived} />}
        {activeTab === 'chip-calculator' && <ChipCalculator />}
      </main>
      
      <footer className="app-footer">
        <p>Powered by <span>Fantasy Premier League API</span> + <span>Gemini AI</span></p>
      </footer>
    </div>
  )
}

export default App 