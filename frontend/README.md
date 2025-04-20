# FPL AI Chatbot - Frontend

This is the frontend for the FPL AI Chatbot application, built with React and Vite.

## Features

- Interactive chat interface with FPL AI assistant
- Real-time responses using the FPL API data
- Responsive design for desktop and mobile use

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Configuration

The application is configured to proxy API requests to the backend service running on `http://localhost:8000`. You can modify the proxy configuration in `vite.config.js` if your backend is hosted elsewhere.

## Technology

- React 18+
- Vite
- Axios for API calls
- Custom CSS for styling
