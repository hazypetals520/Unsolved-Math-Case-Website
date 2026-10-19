# Cyber-Investigation Backend Service

The backend stores student records and quiz progress in LibSQL/Turso. Student presensi numbers are reserved by the database when login succeeds; a number is released only when an administrator deletes that student's record.

## Admin authentication

Configure these server-side environment variables before using the admin dashboard:

- `ADMIN_PASSWORD`: a private administrator passcode.
- `ADMIN_SESSION_SECRET`: a private random signing secret of at least 32 characters.

Do not use `VITE_ADMIN_PASSWORD` or put either value in frontend environment variables. Admin login is verified by the backend and returns a signed, expiring session token. Student-list, reset, unblock, delete, and clear-all endpoints require that token.

For local development, copy `.env.example` to `.env` and replace both admin values with private values. Configure the same variables in the backend deployment environment.
