const express = require('express');
const cors = require('cors');
const { createHmac, timingSafeEqual } = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ADMIN_SESSION_DURATION_SECONDS = 12 * 60 * 60;

app.use(cors());
app.use(express.json());

function secureStringEquals(expected, actual) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function adminAuthIsConfigured() {
  return Boolean(ADMIN_PASSWORD && ADMIN_SESSION_SECRET && ADMIN_SESSION_SECRET.length >= 32);
}

function signAdminSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', ADMIN_SESSION_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function requireAdmin(req, res, next) {
  if (!adminAuthIsConfigured()) {
    return res.status(503).json({ error: 'Admin authentication is not configured on the server' });
  }

  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9_.-]+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  const [encodedPayload, signature, extra] = match[1].split('.');
  if (!encodedPayload || !signature || extra) {
    return res.status(401).json({ error: 'Invalid admin session' });
  }

  const expectedSignature = createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  if (!secureStringEquals(expectedSignature, signature)) {
    return res.status(401).json({ error: 'Invalid admin session' });
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Admin session expired' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid admin session' });
  }

  next();
}

// Initialize Turso schema on startup
db.initDb().catch((err) => {
  console.error('[SERVER] Failed initializing database schema:', err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: process.env.TURSO_DATABASE_URL ? 'turso-cloud' : 'libsql-local',
    time: new Date().toISOString(),
  });
});

// POST Admin Login
app.post('/api/admin/login', (req, res) => {
  if (!adminAuthIsConfigured()) {
    return res.status(503).json({ error: 'Admin authentication is not configured on the server' });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!secureStringEquals(ADMIN_PASSWORD, password)) {
    return res.status(401).json({ error: 'Passcode administrator tidak valid.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = signAdminSession({ iat: now, exp: now + ADMIN_SESSION_DURATION_SECONDS });
  res.json({ token, expiresAt: (now + ADMIN_SESSION_DURATION_SECONDS) * 1000 });
});

// GET all students (For Admin Dashboard)
app.get('/api/students', requireAdmin, async (req, res) => {
  try {
    const students = await db.getAllStudents();
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET available presensi numbers for the student login dropdown.
app.get('/api/students/available-presensi', async (req, res) => {
  try {
    res.json(await db.getAvailablePresensiNumbers());
  } catch (err) {
    console.error('Error fetching available presensi numbers:', err);
    res.status(500).json({ error: 'Failed to fetch available presensi numbers' });
  }
});

// POST Student Login (From Student FE)
app.post('/api/students/login', async (req, res) => {
  try {
    const { fullName, presensiNumber } = req.body;
    const submittedNumber = String(presensiNumber ?? '').trim();
    if (!/^(?:0?[1-9]|[12][0-9]|3[0-6])$/.test(submittedNumber) || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ error: 'fullName and presensiNumber are required' });
    }

    const student = await db.upsertStudentLogin(presensiNumber, fullName);
    res.json(student);
  } catch (err) {
    if (err.code === 'PRESENSI_TAKEN') {
      return res.status(409).json({ error: 'Nomor presensi ini sudah digunakan.' });
    }
    console.error('Error during student login:', err);
    res.status(500).json({ error: 'Failed to register student login' });
  }
});

// POST Student Progress Update (answers, score, attempts)
app.post('/api/students/progress', async (req, res) => {
  try {
    const { presensiNumber, sessionToken, caseStatuses, attempts, isFinished } = req.body;
    if (!presensiNumber) {
      return res.status(400).json({ error: 'presensiNumber is required' });
    }

    const updated = await db.updateStudentProgress(presensiNumber, sessionToken, {
      caseStatuses,
      attempts,
      isFinished,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ error: 'Failed to update student progress' });
  }
});

// POST Violation report
app.post('/api/students/violation', async (req, res) => {
  try {
    const { presensiNumber, sessionToken, reason } = req.body;
    if (!presensiNumber) {
      return res.status(400).json({ error: 'presensiNumber is required' });
    }

    const result = await db.recordViolation(presensiNumber, sessionToken, reason);
    if (!result) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error recording violation:', err);
    res.status(500).json({ error: 'Failed to record violation' });
  }
});

// GET single student status (Polled by Student FE to check if unblocked)
app.get('/api/students/:presensiNumber/status', async (req, res) => {
  try {
    const cleanPresensi = String(req.params.presensiNumber).trim();
    const student = await db.getStudent(cleanPresensi);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const session = await db.getStudentSession(cleanPresensi, req.get('x-student-session'));
    if (!session || (session.sessionToken && !req.get('x-student-session'))) {
      return res.status(404).json({ error: 'Student session not found' });
    }

    res.json({
      presensiNumber: student.presensiNumber,
      sessionToken: session.sessionToken,
      isBlocked: student.isBlocked,
      violationsCount: student.violationsCount,
      unblockedAt: student.unblockedAt,
      caseStatuses: student.caseStatuses,
      attempts: student.attempts,
      isFinished: student.isFinished,
    });
  } catch (err) {
    console.error('Error checking student status:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// POST Admin Unblock / Lepaskan Siswa
app.post('/api/students/:presensiNumber/unblock', requireAdmin, async (req, res) => {
  try {
    const cleanPresensi = String(req.params.presensiNumber).trim();
    const student = await db.unblockStudent(cleanPresensi);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`[ADMIN] Unblocked student #${student.presensiNumber} (${student.fullName})`);
    res.json({ success: true, student });
  } catch (err) {
    console.error('Error unblocking student:', err);
    res.status(500).json({ error: 'Failed to unblock student' });
  }
});

// POST Admin Reset Student (kept as a backend-only control; no visible UI button)
app.post('/api/students/:presensiNumber/reset', requireAdmin, async (req, res) => {
  try {
    const cleanPresensi = String(req.params.presensiNumber).trim();
    const student = await db.resetStudent(cleanPresensi);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error('Error resetting student:', err);
    res.status(500).json({ error: 'Failed to reset student' });
  }
});

// DELETE single student
app.delete('/api/students/:presensiNumber', requireAdmin, async (req, res) => {
  try {
    const cleanPresensi = String(req.params.presensiNumber).trim();
    const deleted = await db.deleteStudent(cleanPresensi);

    if (!deleted) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ success: true, message: 'Student removed' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// POST Clear all data
app.post('/api/students/clear-all', requireAdmin, async (req, res) => {
  try {
    await db.clearAllStudents();
    res.json({ success: true, message: 'All student data cleared' });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[CYBER-EXAM BACKEND] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
