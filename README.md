
# JukeBid 🎵  
An Automated Song Playback & Loyalty System for Cafés and Lounges  
Empower your customers to control the music, earn rewards, and create the perfect vibe.

## 🚀 Overview

JukeBid is a plug-and-play web platform designed for cafés and public venues that lets customers:

- Request or prioritize songs  
- Earn and redeem loyalty points  
- Engage with the café through music  
- Experience a real-time music queue powered by user interaction

This system automates music playback via Spotify while introducing a loyalty system to drive customer engagement and return visits.

## ✨ Features

- 🎶 Song request and queue system (free & premium)  
- 📶 Realtime updates  
- 🔐 Auth0 authentication (Google, Email, etc.)  
- 🧠 Loyalty system with point tracking and redemption  
- 📺 Playback via Spotify API  
- 📊 Leaderboards and request history  


## 🛠 Tech Stack

| Layer       | Tech Used                | Why?                                      |
|-------------|---------------------------|--------------------------------------------|
| Frontend    | React.js + Tailwind CSS  | Fast, modern UI with responsive styling    |
| Backend     | Node.js + Express        | Lightweight and scalable API layer         |
| Database    | MongoDB Atlas            | Flexible and scalable document store       |
| Realtime    | In house backend                | Push-based song queue updates              |
| Auth        | AuthO            | Simple, secure authentication              |
| Playback    | Spotify API       | Free music catalog, no login required      |




## 🧪 Local Setup

1. Clone the repo:

```bash
git clone https://github.com/vandituv03/UncommonHacks2025
cd jukebid
```

2. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables:

Create a .env file in backend/ using .env.example

4. Run the app locally:

```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

5. Open your browser at http://localhost:5173/

## 🔒 Environment Variables (.env)

In backend/.env

- MONGO_URI=your_mongodb_connection  
- FIREBASE_API_KEY=your_key  
- STRIPE_SECRET_KEY=your_key  
- YOUTUBE_API_KEY=optional  

In frontend/.env (if required)

- VITE_BACKEND_URL=http://localhost:3000

## 👥 Contributors

- Jash Patel  
- Deven Patel
- Jimmy Patel
- Vandit Shah
- Ayush Thakkar

## 📜 License

MIT License — feel free to use, remix, and build upon it!
