const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Load .env.local first if present, otherwise fallback to .env
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else {
  require('dotenv').config({ path: envPath });
}

// Determine database URL:
// 1. Turso Cloud (libsql://[database-name]-[org].turso.io)
// 2. Or Local embedded LibSQL SQLite database fallback (file:./math_exam.db)
const dbUrl = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, 'math_exam.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

console.log(`[TURSO DB] Connecting to: ${dbUrl.startsWith('file:') ? 'Local SQLite (fallback)' : dbUrl}`);

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

// Initialize database schema
async function initDb() {
  try {
    await client.batch([
      `CREATE TABLE IF NOT EXISTS students (
        presensi_number TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        logged_in_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
        violations_count INTEGER NOT NULL DEFAULT 0,
        violation_history TEXT NOT NULL DEFAULT '[]',
        is_blocked INTEGER NOT NULL DEFAULT 0,
        unblocked_at TEXT,
        case_statuses TEXT NOT NULL DEFAULT '{}',
        attempts TEXT NOT NULL DEFAULT '{}',
        score INTEGER NOT NULL DEFAULT 0,
        accuracy INTEGER NOT NULL DEFAULT 0,
        total_attempted INTEGER NOT NULL DEFAULT 0,
        is_finished INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE TABLE IF NOT EXISTS shell_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_uuid TEXT NOT NULL UNIQUE,
        user_type TEXT NOT NULL CHECK(user_type IN ('STUDENT', 'ADMIN', 'SYSTEM')),
        presensi_number TEXT,
        client_ip TEXT,
        user_agent TEXT,
        current_directory TEXT NOT NULL DEFAULT '/sys/root',
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'CLOSED', 'TERMINATED')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        closed_at TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS shell_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        command_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SUCCESS', 'ERROR', 'BLOCKED', 'TIMEOUT')),
        exit_code INTEGER DEFAULT 0,
        stdout TEXT,
        stderr TEXT,
        execution_time_ms INTEGER DEFAULT 0,
        executed_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
      `CREATE TABLE IF NOT EXISTS shell_audit_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        presensi_number TEXT,
        attempted_command TEXT NOT NULL,
        threat_level TEXT NOT NULL CHECK(threat_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        reason TEXT NOT NULL,
        detected_at TEXT NOT NULL DEFAULT (datetime('now'))
      );`,
      `CREATE INDEX IF NOT EXISTS idx_shell_sessions_uuid ON shell_sessions(session_uuid);`,
      `CREATE INDEX IF NOT EXISTS idx_shell_sessions_presensi ON shell_sessions(presensi_number);`,
      `CREATE INDEX IF NOT EXISTS idx_shell_commands_session ON shell_commands(session_id);`,
      `CREATE INDEX IF NOT EXISTS idx_shell_commands_executed_at ON shell_commands(executed_at);`,
      `CREATE INDEX IF NOT EXISTS idx_shell_audit_presensi ON shell_audit_alerts(presensi_number);`
    ], 'write');
    console.log('[TURSO DB] All schemas (students + shell) initialized successfully.');
  } catch (err) {
    console.error('[TURSO DB] Error initializing schema:', err);
  }
}

// Map row to Student object
function mapRowToStudent(row) {
  const score = Number(row.score || 0);
  // Akurasi konsisten selalu dihitung terhadap total 10 soal (score / 10 * 100)
  const accuracy = Math.round((score / 10) * 100);

  return {
    presensiNumber: row.presensi_number,
    fullName: row.full_name,
    loggedInAt: row.logged_in_at,
    lastActiveAt: row.last_active_at,
    violationsCount: Number(row.violations_count || 0),
    violationHistory: row.violation_history ? JSON.parse(row.violation_history) : [],
    isBlocked: Boolean(row.is_blocked),
    unblockedAt: row.unblocked_at || null,
    caseStatuses: row.case_statuses ? JSON.parse(row.case_statuses) : {},
    attempts: row.attempts ? JSON.parse(row.attempts) : {},
    score: score,
    accuracy: accuracy,
    totalAttempted: Number(row.total_attempted || 0),
    isFinished: Boolean(row.is_finished),
  };
}

async function getAllStudents() {
  const result = await client.execute('SELECT * FROM students');
  const students = result.rows.map(mapRowToStudent);

  // Sort by presensi number numerically if possible, else string
  students.sort((a, b) => {
    const numA = parseInt(a.presensiNumber, 10);
    const numB = parseInt(b.presensiNumber, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.presensiNumber.localeCompare(b.presensiNumber);
  });

  return students;
}

async function getStudent(presensiNumber) {
  const clean = String(presensiNumber).trim();
  const result = await client.execute({
    sql: 'SELECT * FROM students WHERE presensi_number = ?',
    args: [clean],
  });
  if (result.rows.length === 0) return null;
  return mapRowToStudent(result.rows[0]);
}

async function upsertStudentLogin(presensiNumber, fullName) {
  const cleanPresensi = String(presensiNumber).trim();
  const cleanName = String(fullName).trim();
  const now = new Date().toISOString();

  const existing = await getStudent(cleanPresensi);

  if (!existing) {
    await client.execute({
      sql: `
        INSERT INTO students (
          presensi_number, full_name, logged_in_at, last_active_at,
          violations_count, violation_history, is_blocked, unblocked_at,
          case_statuses, attempts, score, accuracy, total_attempted, is_finished
        ) VALUES (?, ?, ?, ?, 0, '[]', 0, NULL, '{}', '{}', 0, 0, 0, 0)
      `,
      args: [cleanPresensi, cleanName, now, now],
    });
    return getStudent(cleanPresensi);
  } else {
    await client.execute({
      sql: `
        UPDATE students
        SET full_name = ?, last_active_at = ?
        WHERE presensi_number = ?
      `,
      args: [cleanName, now, cleanPresensi],
    });
    return getStudent(cleanPresensi);
  }
}

async function updateStudentProgress(presensiNumber, { caseStatuses, attempts, isFinished }) {
  const cleanPresensi = String(presensiNumber).trim();
  const student = await getStudent(cleanPresensi);
  if (!student) return null;

  const newCaseStatuses = caseStatuses ? caseStatuses : student.caseStatuses;
  const newAttempts = attempts ? attempts : student.attempts;

  const attemptsArray = Object.values(newAttempts || {});
  const totalAttempted = attemptsArray.length;
  const solvedCount = attemptsArray.filter((a) => a.isCorrect).length;
  const score = solvedCount;
  // Akurasi/Nilai dihitung dari jumlah benar dibagi total 10 soal (1 benar dari 10 = 10%)
  const accuracy = Math.round((solvedCount / 10) * 100);
  const finished = isFinished !== undefined ? (isFinished ? 1 : 0) : totalAttempted >= 10 ? 1 : student.isFinished ? 1 : 0;
  const now = new Date().toISOString();

  await client.execute({
    sql: `
      UPDATE students
      SET case_statuses = ?,
          attempts = ?,
          score = ?,
          accuracy = ?,
          total_attempted = ?,
          is_finished = ?,
          last_active_at = ?
      WHERE presensi_number = ?
    `,
    args: [
      JSON.stringify(newCaseStatuses),
      JSON.stringify(newAttempts),
      score,
      accuracy,
      totalAttempted,
      finished,
      now,
      cleanPresensi,
    ],
  });

  return getStudent(cleanPresensi);
}

async function recordViolation(presensiNumber, reason) {
  const cleanPresensi = String(presensiNumber).trim();
  const student = await getStudent(cleanPresensi);
  if (!student) return null;

  // Jika siswa sudah menyelesaikan kuis, jangan catat pelanggaran baru
  if (student.isFinished) {
    return {
      violationsCount: student.violationsCount,
      isBlocked: student.isBlocked,
      ignored: true,
    };
  }
  const newHistory = [...student.violationHistory, {
    reason: reason || 'Anti-cheat violation detected',
    timestamp: new Date().toISOString(),
  }];
  const isBlocked = newViolationsCount >= 2 ? 1 : 0;
  const now = new Date().toISOString();

  await client.execute({
    sql: `
      UPDATE students
      SET violations_count = ?,
          violation_history = ?,
          is_blocked = ?,
          last_active_at = ?
      WHERE presensi_number = ?
    `,
    args: [newViolationsCount, JSON.stringify(newHistory), isBlocked, now, cleanPresensi],
  });

  return {
    violationsCount: newViolationsCount,
    isBlocked: Boolean(isBlocked),
  };
}

async function unblockStudent(presensiNumber) {
  const cleanPresensi = String(presensiNumber).trim();
  const student = await getStudent(cleanPresensi);
  if (!student) return null;

  const now = new Date().toISOString();

  // Restore unopened cases if they were flagged failed without attempts
  const updatedStatuses = { ...student.caseStatuses };
  for (let id = 1; id <= 10; id++) {
    if (!student.attempts || !student.attempts[id]) {
      updatedStatuses[id] = 'unopened';
    }
  }

  await client.execute({
    sql: `
      UPDATE students
      SET is_blocked = 0,
          unblocked_at = ?,
          case_statuses = ?,
          last_active_at = ?
      WHERE presensi_number = ?
    `,
    args: [now, JSON.stringify(updatedStatuses), now, cleanPresensi],
  });

  return getStudent(cleanPresensi);
}

async function resetStudent(presensiNumber) {
  const cleanPresensi = String(presensiNumber).trim();
  const student = await getStudent(cleanPresensi);
  if (!student) return null;

  const now = new Date().toISOString();

  await client.execute({
    sql: `
      UPDATE students
      SET violations_count = 0,
          violation_history = '[]',
          is_blocked = 0,
          case_statuses = '{}',
          attempts = '{}',
          score = 0,
          accuracy = 0,
          total_attempted = 0,
          is_finished = 0,
          unblocked_at = ?,
          last_active_at = ?
      WHERE presensi_number = ?
    `,
    args: [now, now, cleanPresensi],
  });

  return getStudent(cleanPresensi);
}

async function deleteStudent(presensiNumber) {
  const cleanPresensi = String(presensiNumber).trim();
  const result = await client.execute({
    sql: 'DELETE FROM students WHERE presensi_number = ?',
    args: [cleanPresensi],
  });
  return result.rowsAffected > 0;
}

async function clearAllStudents() {
  await client.execute('DELETE FROM students');
  return true;
}

module.exports = {
  client,
  initDb,
  getAllStudents,
  getStudent,
  upsertStudentLogin,
  updateStudentProgress,
  recordViolation,
  unblockStudent,
  resetStudent,
  deleteStudent,
  clearAllStudents,
};
