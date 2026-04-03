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
- Generate Cloudflare AI insights from your records (via Worker endpoint)
- See all records in the Record section
- Remove one record or clear all records
- Data is saved in browser localStorage

## Run

1. Open `index.html` in your browser.
2. Start entering refueling details.

## Cloudflare AI Setup

1. Install Wrangler:

	```bash
	npm install -g wrangler
	```

2. Login to Cloudflare:

	```bash
	wrangler login
	```

3. Deploy worker in this folder:

	```bash
	wrangler deploy
	```

4. Copy deployed Worker URL (for example `https://fuel-verify-ai.<subdomain>.workers.dev`).
5. In app Overview section, paste the Worker URL in "Worker API URL".
6. Click "Generate Insights".

### Local test for worker

```bash
wrangler dev
```

Then use the local URL shown by Wrangler as the Worker API URL.

## Files

- `index.html` : App layout and sections
- `styles.css` : Styling and responsive design
- `app.js` : Form handling, storage, overview metrics, and records table
- `worker.js` : Cloudflare Worker endpoint for AI insights
- `wrangler.toml` : Cloudflare Worker configuration