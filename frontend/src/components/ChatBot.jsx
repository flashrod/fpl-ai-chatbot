import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatBot.css'

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi there! I\'m your FPL assistant. How can I help with your Fantasy Premier League team today?' }
  ])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const input = userInput.trim()
    if (!input || isLoading) return

    // Add user message to chat
    const newMessages = [...messages, { sender: 'user', text: input }]
    setMessages(newMessages)
    setUserInput('')
    setIsLoading(true)

    try {
      // Call backend API
      const response = await axios.post('http://localhost:8000/chat', { 
        message: input 
      })

      // Add bot response to chat
      setMessages([...newMessages, { 
        sender: 'bot', 
        text: response.data.reply 
      }])
    } catch (error) {
      console.error('Error getting response:', error)
      setMessages([...newMessages, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again later.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about FPL players, team selection, transfers..."
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !userInput.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatBot 