import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatBot.css'

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Hi there! I\'m your FPL AI assistant. How can I help with your team today?\n\nTry asking about:\n• Top performers\n• Upcoming fixtures\n• Captain recommendations' 
    }
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
        text: formatMessageText(response.data.reply)
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

  // Format message text for better display
  const formatMessageText = (text) => {
    return text.trim();
  }

  // Process message text before rendering
  const processMessageText = (text) => {
    // Find and transform headings
    let processedText = text;
    
    // Format lines that start with "• " as bullet points with proper spacing
    const bulletPointRegex = /^• (.+)$/gm;
    processedText = processedText.replace(bulletPointRegex, (match, p1) => {
      return `<div class="bullet-point">${p1}</div>`;
    });

    // Format lines that end with ":" as headings
    const headingRegex = /^([A-Z][A-Za-z\s]+):/gm;
    processedText = processedText.replace(headingRegex, (match, p1) => {
      return `<div class="section-heading">${p1}</div>`;
    });

    return processedText;
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  // Render message with HTML formatting
  const renderMessageContent = (text) => {
    const processedText = processMessageText(text);
    return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  // Message components
  const renderMessages = () => {
    return messages.map((msg, index) => (
      <div key={index} className={`message ${msg.sender}`}>
        <div className="message-content">
          {renderMessageContent(msg.text)}
        </div>
      </div>
    ));
  }

  // Loading indicator
  const renderLoadingIndicator = () => {
    if (!isLoading) return null;
    
    return (
      <div className="message bot">
        <div className="message-content loading">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {renderMessages()}
        {renderLoadingIndicator()}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about players, fixtures, team selection..."
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