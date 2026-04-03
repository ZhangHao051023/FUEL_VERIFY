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

1. Open `index.html` in your browser.
2. Start entering refueling details.

## Cloudflare AI Setup

This project includes a Cloudflare Worker proxy so your API token stays secure server-side.

### 1. Configure Worker

- Edit `cloudflare/wrangler.toml`
- Set `CLOUDFLARE_ACCOUNT_ID` in `[vars]`

### 2. Set API Token as Secret

Run this in the `cloudflare` folder:

`wrangler secret put CLOUDFLARE_API_TOKEN`

Use a token that can call Workers AI.

### 3. Deploy Worker

From the `cloudflare` folder:

`wrangler deploy`

Copy the deployed Worker URL (example: `https://fuel-verify-ai.<subdomain>.workers.dev`).

### 4. Connect Frontend to Worker

Open `index.html` and set:

`window.FUEL_VERIFY_AI_ENDPOINT = "YOUR_WORKER_URL";`

Example:

`window.FUEL_VERIFY_AI_ENDPOINT = "https://fuel-verify-ai.<subdomain>.workers.dev";`

### 5. Use AI Insight in App

- Add records in the app
- Go to Overview
- Click **Generate Insight**

## Files

- `index.html` : App layout and sections
- `styles.css` : Styling and responsive design
- `app.js` : Form handling, storage, overview metrics, and records table
- `cloudflare/worker.js` : Cloudflare Worker proxy for Workers AI
- `cloudflare/wrangler.toml` : Wrangler configuration for deployment