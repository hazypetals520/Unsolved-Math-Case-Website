# Cyber-Investigation Backend Service

The backend stores student records and quiz progress in LibSQL/Turso. Student presensi numbers are reserved by the database when login succeeds; a number is released only when an administrator deletes that student's record.

## Admin authentication

Configure these environment variables in the Vercel project before using the admin dashboard:

- `ADMIN_PASSWORD`: a private administrator passcode. For compatibility, the backend also accepts `VITE_ADMIN_PASSWORD` as a fallback, but reads it only on the server.
- `ADMIN_SESSION_SECRET`: a private random signing secret of at least 32 characters.

Do not read the password through `import.meta.env` or otherwise include it in frontend code. Even when the Vercel variable is named `VITE_ADMIN_PASSWORD`, the backend uses it only to verify login. `ADMIN_SESSION_SECRET` is still required. Admin login is verified by the backend and returns a signed, expiring session token. Student-list, reset, unblock, delete, and clear-all endpoints require that token.

For local development, copy `.env.example` to `.env` and replace both admin values with private values. In Vercel, configure `VITE_ADMIN_PASSWORD` (or preferably `ADMIN_PASSWORD`) and `ADMIN_SESSION_SECRET` in the project's Environment Variables, then redeploy.
