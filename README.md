# Northstar authentication app

Express authentication API backed by MongoDB, with Nginx acting as the API gateway.

## Run with Docker Compose

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGO_ROOT_PASSWORD` to a strong URL-safe password (for example, generate a hex string) and `JWT_SECRET` to a long random secret.
3. Run `docker compose --env-file backend/.env up --build -d`.
4. Open [http://localhost:8080](http://localhost:8080) for the gateway status, or [http://localhost:8080/api/health](http://localhost:8080/api/health) for the API health check.

Port mapping is `8080:80` (host:container) for Nginx. Nginx proxies `/api/*` to the API container on port `4000`; the API is exposed only inside the Compose network. MongoDB listens on `27017` inside that network and is not published to the host. Data persists in the `mongo-data` volume.

By default, the API connects to the MongoDB container in this Compose project. To use another MongoDB deployment, set `MONGODB_URI` in `backend/.env`; keep the URI private and properly quote it if it contains characters that require quoting. For local development outside Docker, run `npm run dev` from `backend/`; Node loads `backend/.env`.

For HTTPS deployments, set `COOKIE_SECURE=true` and terminate TLS in front of Nginx.

The gateway is API-only; it does not serve a login/signup web page.

## API

- `POST /api/auth/signup` — `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login` — `{ "email": "...", "password": "..." }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`

Successful signup/login sets an HTTP-only, same-site cookie; the JWT is not exposed to browser JavaScript. Passwords are bcrypt-hashed. Authentication endpoints are rate limited.
