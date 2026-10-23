# Auth Reports front end

React app for the report and overview pages, built with Vite. The build is
copied into `authstats/static/authstats/bs5/` and served by Django.

## Scripts

Run these from `frontend-bs5/`, after `npm install`.

### `npm run dev`

Runs the dev server on [http://localhost:3002](http://localhost:3002),
proxying `/reports/api/` to a Django dev server on port 8000.

### `npm test`

Runs the tests once with Vitest. `npm run test:watch` reruns them as files
change.

### `npm run build`

Type checks, builds for production and copies the assets into
`authstats/static/authstats/bs5/`.
