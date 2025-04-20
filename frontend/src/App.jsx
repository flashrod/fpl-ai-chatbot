import ChatBot from './components/ChatBot'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1><span className="soccer-icon">⚽</span> <span>FPL AI</span> Assistant</h1>
      </header>
      <main>
        <ChatBot />
      </main>
      <footer className="app-footer">
        <p>Powered by <span>Fantasy Premier League API</span> + <span>Gemini AI</span></p>
      </footer>
    </div>
  )
}

export default App 