# CryptoTon 🚀

CryptoTon is a modern, real-time cryptocurrency dashboard built with React and Tailwind CSS. It provides live price tracking, portfolio management, and market insights using the CoinGecko API.

# ✨ Features

Live Data Tracking: Real-time price updates every 15 seconds with a visual countdown timer.

Multi-Category Views:

📈 Top: Market cap leaders.

🔥 Trending: Coins trending on CoinGecko.

👁️ Most Visited: High traffic assets.

🆕 New: Recently listed cryptocurrencies.

⚡ Gainers & Losers: Top movers in the last 24 hours.

🌐 Real-World Assets (RWA): Tracking tokens backed by real-world assets.

Portfolio Manager: * Input your holdings for any coin.

Automatically calculates your total value based on live prices.

Data persists locally in your browser (LocalStorage).

Smart Sorting: Sort by Price, 1h %, 24h %, Market Cap, or your Personal Holdings Value.

Price Alerts: Set custom "Above" or "Below" price alerts and get visual notifications when thresholds are hit.

Robust Fallback: Includes a "Demo Mode" that automatically generates realistic mock data if the API rate limit is reached.

# 🛠️ Tech Stack

Framework: React (Vite)

Styling: Tailwind CSS

Icons: Lucide React

Data Source: CoinGecko API

# 🚀 Getting Started

Follow these steps to run the project locally.

Prerequisites

Make sure you have Node.js installed on your machine.

Installation

Clone the repository

git clone [https://github.com/yourusername/cryptoton.git](https://github.com/yourusername/cryptoton.git)
cd cryptoton


Install dependencies

npm install


Run the development server

npm run dev


Open your browser
Navigate to http://localhost:5173 to view the app.

# 📂 Project Structure

cryptoton/
├── src/
│   ├── App.jsx        # Main application logic
│   ├── index.css      # Global styles & Tailwind imports
│   └── main.jsx       # Entry point
├── public/
├── index.html
├── tailwind.config.js # Tailwind configuration
└── package.json


# ⚠️ API Rate Limits

This project uses the free tier of the CoinGecko API, which has a rate limit of approximately 10-30 calls per minute.

CryptoTon handles this automatically:

If the API limit is hit, the app switches to Demo Mode (indicated by an orange WiFi icon).

It generates realistic mock data so the UI remains functional for testing features like sorting and pagination.

It will attempt to reconnect to the live API automatically.

# 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

Built by Abhranil Singha Roy.
