const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'students.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// Helpers to read/write database
function readStudents() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading students data:', err);
    return [];
  }
}

function writeStudents(students) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing students data:', err);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET all students (For Admin Dashboard)
app.get('/api/students', (req, res) => {
  const students = readStudents();
  // Sort by presensi number numerically if possible, else string
  students.sort((a, b) => {
    const numA = parseInt(a.presensiNumber, 10);
    const numB = parseInt(b.presensiNumber, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.presensiNumber.localeCompare(b.presensiNumber);
  });
  res.json(students);
});

// POST Student Login (From Student FE)
app.post('/api/students/login', (req, res) => {
  const { fullName, presensiNumber } = req.body;
  if (!presensiNumber || !fullName) {
    return res.status(400).json({ error: 'fullName and presensiNumber are required' });
  }

  const cleanPresensi = String(presensiNumber).trim();
  const cleanName = String(fullName).trim();
  const students = readStudents();

  let student = students.find((s) => s.presensiNumber === cleanPresensi);

  if (!student) {
    student = {
      presensiNumber: cleanPresensi,
      fullName: cleanName,
      loggedInAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      violationsCount: 0,
      violationHistory: [],
      isBlocked: false,
      unblockedAt: null,
      caseStatuses: {},
      attempts: {},
      score: 0,
      accuracy: 0,
      totalAttempted: 0,
      isFinished: false,
    };
    students.push(student);
  } else {
    student.fullName = cleanName;
    student.lastActiveAt = new Date().toISOString();
  }

  writeStudents(students);
  res.json(student);
});

// POST Student Progress Update (answers, score, attempts)
app.post('/api/students/progress', (req, res) => {
  const { presensiNumber, caseStatuses, attempts, isFinished } = req.body;
  if (!presensiNumber) {
    return res.status(400).json({ error: 'presensiNumber is required' });
  }

  const cleanPresensi = String(presensiNumber).trim();
  const students = readStudents();
  const student = students.find((s) => s.presensiNumber === cleanPresensi);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  if (caseStatuses) student.caseStatuses = caseStatuses;
  if (attempts) student.attempts = attempts;
  if (isFinished !== undefined) student.isFinished = isFinished;

  // Calculate score & accuracy
  const attemptsArray = Object.values(student.attempts || {});
  const totalAttempted = attemptsArray.length;
  const solvedCount = attemptsArray.filter((a) => a.isCorrect).length;

  student.score = solvedCount;
  student.totalAttempted = totalAttempted;
  student.accuracy = totalAttempted > 0 ? Math.round((solvedCount / totalAttempted) * 100) : 0;
  student.lastActiveAt = new Date().toISOString();

  if (totalAttempted >= 10) {
    student.isFinished = true;
  }

  writeStudents(students);
  res.json(student);
});

// POST Violation report
app.post('/api/students/violation', (req, res) => {
  const { presensiNumber, reason } = req.body;
  if (!presensiNumber) {
    return res.status(400).json({ error: 'presensiNumber is required' });
  }

  const cleanPresensi = String(presensiNumber).trim();
  const students = readStudents();
  const student = students.find((s) => s.presensiNumber === cleanPresensi);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.violationsCount = (student.violationsCount || 0) + 1;
  if (!student.violationHistory) student.violationHistory = [];
  student.violationHistory.push({
    reason: reason || 'Anti-cheat violation detected',
    timestamp: new Date().toISOString(),
  });

  student.lastActiveAt = new Date().toISOString();

  // If detected 2 or more times, block student
  if (student.violationsCount >= 2) {
    student.isBlocked = true;
  }

  writeStudents(students);
  res.json({
    violationsCount: student.violationsCount,
    isBlocked: student.isBlocked,
  });
});

// GET single student status (Polled by Student FE to check if unblocked)
app.get('/api/students/:presensiNumber/status', (req, res) => {
  const cleanPresensi = String(req.params.presensiNumber).trim();
  const students = readStudents();
  const student = students.find((s) => s.presensiNumber === cleanPresensi);

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
});

// POST Admin Unblock / Lepaskan Siswa
app.post('/api/students/:presensiNumber/unblock', (req, res) => {
  const cleanPresensi = String(req.params.presensiNumber).trim();
  const students = readStudents();
  const student = students.find((s) => s.presensiNumber === cleanPresensi);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.isBlocked = false;
  student.violationsCount = 0; // Reset violations
  student.unblockedAt = new Date().toISOString();
  student.lastActiveAt = new Date().toISOString();

  // Restore any unopened case statuses that were prematurely auto-failed
  if (student.caseStatuses) {
    const updatedStatuses = { ...student.caseStatuses };
    for (let id = 1; id <= 10; id++) {
      // If it has no attempt recorded, restore it to unopened so student can solve it
      if (!student.attempts || !student.attempts[id]) {
        updatedStatuses[id] = 'unopened';
      }
    }
    student.caseStatuses = updatedStatuses;
  }

  writeStudents(students);
  console.log(`[ADMIN] Unblocked student #${student.presensiNumber} (${student.fullName})`);
  res.json({ success: true, student });
});

// POST Admin Reset Student
app.post('/api/students/:presensiNumber/reset', (req, res) => {
  const cleanPresensi = String(req.params.presensiNumber).trim();
  const students = readStudents();
  const student = students.find((s) => s.presensiNumber === cleanPresensi);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.violationsCount = 0;
  student.violationHistory = [];
  student.isBlocked = false;
  student.caseStatuses = {};
  student.attempts = {};
  student.score = 0;
  student.accuracy = 0;
  student.totalAttempted = 0;
  student.isFinished = false;
  student.unblockedAt = new Date().toISOString();
  student.lastActiveAt = new Date().toISOString();

  writeStudents(students);
  res.json({ success: true, student });
});

// DELETE single student
app.delete('/api/students/:presensiNumber', (req, res) => {
  const cleanPresensi = String(req.params.presensiNumber).trim();
  let students = readStudents();
  const initialLength = students.length;
  students = students.filter((s) => s.presensiNumber !== cleanPresensi);

  if (students.length === initialLength) {
    return res.status(404).json({ error: 'Student not found' });
  }

  writeStudents(students);
  res.json({ success: true, message: 'Student removed' });
});

// POST Clear all data
app.post('/api/students/clear-all', (req, res) => {
  writeStudents([]);
  res.json({ success: true, message: 'All student data cleared' });
});

app.listen(PORT, () => {
  console.log(`[CYBER-EXAM BACKEND] Server running on http://localhost:${PORT}`);
});
