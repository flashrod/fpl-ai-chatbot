# FPL AI Assistant - Frontend

A modern, minimalist dark-themed React frontend for the FPL AI Assistant application.

## Features

- Sleek dark mode UI with green FPL-inspired accents
- Interactive chat interface with the FPL AI assistant
- Real-time responses using the FPL API data
- Responsive design for desktop and mobile use
- Loading animations and smooth transitions

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

## Design Choices

- **Dark Theme**: Minimalist dark UI for reduced eye strain and modern aesthetics
- **Accent Color**: Using FPL's signature green (`#00ff85`) as accent color
- **Typography**: Clean, readable font with proper spacing
- **Animations**: Subtle animations for message transitions and loading states
- **Responsive**: Mobile-first approach with optimized layout for all device sizes

## Configuration

The application is configured to proxy API requests to the backend service running on `http://localhost:8000`. You can modify the proxy configuration in `vite.config.js` if your backend is hosted elsewhere.

## Technology

- React 18+
- Vite
- Axios for API calls
- Custom CSS for styling
