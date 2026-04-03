# FUEL_VERIFY

A simple refueling tracker app with two sections:
- Overview
- Record

Users can key in:
- Date
- Location
- Fuel type
- Litre
- Price

## Features

- Add new refueling records through a form
- See an Overview with:
	- Total records
	- Total litre
	- Total price
	- Average price per litre
- See all records in the Record section
- Remove one record or clear all records
- Data is saved in browser localStorage
- Cloudflare AI insights from your refueling history

## Run

1. Install dependencies with `npm install`.
2. Start server with `npm start`.
3. Open `http://localhost:8787` in your browser.

## Node + Cloudflare AI Setup

This project now uses a Node.js backend proxy so your Cloudflare API token stays server-side.

### 1. Install dependencies

Run in project root:

`npm install`

### 2. Configure environment variables

Copy `.env.example` to `.env` and set:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `PORT` (optional, default is 8787)

### 3. Start server

Run in project root:

`npm start`

Server runs at `http://localhost:8787` and serves both frontend and API.

### 4. Open app

Open:

`http://localhost:8787`

### 5. Use AI Insight

- Add records in the app
- Go to Overview
- Click **Generate Insight**

## Files

- `index.html` : App layout and sections
- `styles.css` : Styling and responsive design
- `app.js` : Form handling, storage, overview metrics, and records table
- `server.js` : Node.js API proxy and static server
- `.env.example` : Required environment variables