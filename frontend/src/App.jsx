import ChatBot from './components/ChatBot'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚽ FPL AI Chatbot</h1>
      </header>
      <main>
        <ChatBot />
      </main>
      <footer className="app-footer">
        <p>Powered by Fantasy Premier League API + Gemini AI</p>
      </footer>
    </div>
  )
}

export default App 