# Agent Guidelines & Security Constraints

## 🔒 Strict Security Rule: Never Read or Log .env Files
1. **NEVER** use `view_file`, `grep_search`, or terminal commands to read, print, log, or inspect `.env`, `.env.local`, `.env.*`, or any environment files containing secrets, API keys, or database credentials.
2. If environment variables need to be explained or referenced, only refer to `.env.example` or explain the keys generically without viewing the real `.env` file.
3. Keep user credentials, database URIs, and Gemini API keys confidential at all times.

