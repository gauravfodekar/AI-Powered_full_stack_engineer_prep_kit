# Configuration Parameters Reference (`CONFIG_PARAMETERS.md`)

This document provides a comprehensive reference for all configurable environment variables and system parameters used across the **AI-Powered Full-Stack Interview Preparation Kit Generator** (Backend & Frontend).

---

## 🌐 Frontend Configuration (`frontend/.env.local`)

All client-side environment variables in Next.js must be prefixed with `NEXT_PUBLIC_` to be accessible within browser components.

| Parameter | Type | Default Value | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `String (URL)` | `http://localhost:4000/api` | The base REST API endpoint URL for the backend server. The Next.js client Axios instance routes all authentication (`/auth/*`), kit generation (`/kits`), evaluation, and regeneration requests to this URL. |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | `Number (Integer)` | `180000` (3 mins) | The maximum HTTP client request timeout in milliseconds for Axios calls. Live kit generation executes multi-page SSRF-safe crawling, 4 sequential Gemini LLM pipelines, and bipartite graph verification. A default of `180000` ms (3 minutes) prevents premature browser client timeouts while live AI generation completes. |

---

## ⚙️ Backend Configuration (`.env`)

Backend parameters control the Express server, Gemini AI integration, SSRF security guards, web scraping crawler limits, database connections, and authentication.

| Parameter | Type | Default Value | Constraints / Allowed Values | Description & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `Number` | `4000` | Valid TCP port (e.g. `1024-65535`) | The local port on which the Express.js backend HTTP server listens for incoming API requests. |
| `NODE_ENV` | `String` | `development` | `development`, `production`, `test` | The runtime environment mode. In `test` mode, external network calls and Gemini LLM calls are safely mocked. In `development` and `production`, full live services execute with structured logging. |
| `GEMINI_API_KEY` | `String` | `""` (Empty string) | Google Gemini API Key | The API key used by the `google-genai` / `@google/genai` client to invoke Gemini foundation models. Required for live generation in non-test modes. |
| `GEMINI_MODEL` | `String` | `gemini-3.5-flash-lite` | Valid Gemini model identifier | The primary Gemini model used for parsing company culture, generating interview questions, scoring rubric, and drafting study schedules. The backend includes adaptive circuit breaker failover through `["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.7-flash", "gemini-2.5-pro"]`. |
| `MONGODB_URI` | `String (URI)` | `mongodb://localhost:27017/interview_prep_kit` | Valid MongoDB connection string | Connection string for MongoDB database storing persistent user credentials (`User` model) and generated interview kits (`Kit` model). Supports both local instances and MongoDB Atlas URIs. |
| `JWT_SECRET` | `String` | `default-interview-prep-jwt-secret-key-32chars` | Min 32 characters recommended | Secret key used to sign and verify JSON Web Tokens (JWT) issued during user registration and login (`/api/auth/register`, `/api/auth/login`). |
| `ALLOW_LOCAL_URLS` | `Boolean` | `false` | `true`, `false`, `1`, `0` | SSRF security policy flag. When `false`, the crawler strictly blocks loopback (`127.0.0.1`), private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs (`169.254.169.254`), and multicast ranges to protect against server-side request forgery. Set to `true` only when testing against local mock servers. |
| `MAX_CRAWL_PAGES` | `Number (Integer)` | `5` | Min: `1`, Max: `20` | Maximum number of internal sub-pages crawled per target company domain (prioritizing `/about`, `/careers`, `/jobs`, `/values`, `/engineering`, etc.). |
| `CRAWL_TIMEOUT_MS` | `Number (Integer)` | `8000` (8s) | Min: `1000`, Max: `30000` | Network request timeout per individual page crawl in milliseconds. If a remote website is slow or unresponsive, the crawler aborts after this duration and proceeds with previously gathered content. |

---

## 🔒 Security Best Practices

1. **Never Commit Secrets**: Always keep `.env` and `frontend/.env.local` in `.gitignore`. Never commit actual API keys, database credentials, or secret keys to version control.
2. **SSRF Guarding**: Keep `ALLOW_LOCAL_URLS=false` in production environments to prevent attackers from probing internal VPC or cloud metadata instances (`169.254.169.254`).
3. **JWT Strength**: Ensure `JWT_SECRET` is set to a cryptographically random string (at least 256 bits / 32 characters) in production deployments.

