# FUEL_VERIFY

A simple fuel usage tracking + analytics app for Malaysia, with a Cloudflare Worker backend that checks online fuel prices (via CollectAPI) and enriches records.

## Sections

- overview
- records
- report
- analytic
- setting

## Features

- User input: location, fuel type, litre, optional notes
- Cloudflare Worker endpoint: `/api/price` and `/api/record`
- Online fuel price fetch with fallback
- Per-record cost and analytics generated from recent history
- LocalStorage persistence on client

## Files

- `wrangler.toml` – Cloudflare Worker deploy settings
- `src/index.js` – Worker logic
- `web/index.html` – UI with tabs
- `web/app.js` – frontend behavior and connection to Worker
- `web/style.css` – UI styles

## Quick start (local)

1. Install `wrangler`:
   - `npm install -g wrangler`
2. Configure your API key (optional):
   - `wrangler secret put COLLECTAPI_KEY`
3. Run worker locally:
   - `wrangler dev src/index.js --port 8787`
4. Open `web/index.html` in browser (local file), set Worker endpoint to `http://localhost:8787`, then add records.

## Deploy to Cloudflare

1. `wrangler login`
2. `wrangler publish`
3. Set `Settings` endpoint in the web UI to your `https://<your-worker>.workers.dev`

## Usage

- Use `Records` tab to add refuels.
- Each submission calls Worker: fetches price, calculates cost, returns enriched record, and reports analytics.
- `Report` and `Analytic` show computed aggregates.
- `Setting` lets you set Cloudflare endpoint and optionally manage API behavior.

## Notes

- Fuel price API key and endpoint may require paid CollectAPI subscription.
- You can swap `fetchPriceFromAPI` in `src/index.js` for any authenticated Malaysian fuel API.
