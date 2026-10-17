const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// GET all students (For Admin Dashboard)
app.get('/api/students', async (req, res) => {
  try {
    const students = await db.getAllStudents();
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// POST Student Login (From Student FE)
app.post('/api/students/login', async (req, res) => {
  try {
    const { fullName, presensiNumber } = req.body;
    if (!presensiNumber || !fullName) {
      return res.status(400).json({ error: 'fullName and presensiNumber are required' });
    }

    const student = await db.upsertStudentLogin(presensiNumber, fullName);
    res.json(student);
  } catch (err) {
    console.error('Error during student login:', err);
    res.status(500).json({ error: 'Failed to register student login' });
  }
});

// POST Student Progress Update (answers, score, attempts)
app.post('/api/students/progress', async (req, res) => {
  try {
    const { presensiNumber, caseStatuses, attempts, isFinished } = req.body;
    if (!presensiNumber) {
      return res.status(400).json({ error: 'presensiNumber is required' });
    }

    const updated = await db.updateStudentProgress(presensiNumber, {
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
    const { presensiNumber, reason } = req.body;
    if (!presensiNumber) {
      return res.status(400).json({ error: 'presensiNumber is required' });
    }

    const result = await db.recordViolation(presensiNumber, reason);
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

    res.json({
      presensiNumber: student.presensiNumber,
      isBlocked: student.isBlocked,
      violationsCount: student.violationsCount,
      unblockedAt: student.unblockedAt,
      caseStatuses: student.caseStatuses,
      isFinished: student.isFinished,
    });
  } catch (err) {
    console.error('Error checking student status:', err);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// POST Admin Unblock / Lepaskan Siswa
app.post('/api/students/:presensiNumber/unblock', async (req, res) => {
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

// POST Admin Reset Student
app.post('/api/students/:presensiNumber/reset', async (req, res) => {
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
app.delete('/api/students/:presensiNumber', async (req, res) => {
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
app.post('/api/students/clear-all', async (req, res) => {
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
