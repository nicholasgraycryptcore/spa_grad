const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname, 'data');
const EXCEL_PATH = path.join(DATA_DIR, 'grad_sept.xlsx');
const DB_PATH = path.join(DATA_DIR, 'grad.db');
const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

function q(identifier) {
  return '"' + String(identifier).replace(/"/g, '""') + '"';
}

function normalizeHeaderName(name) {
  return String(name || '').replace(/\s+/g, '').toLowerCase();
}

// Map of normalized header -> canonical property name
const CANONICAL = {
  studentattended: 'StudentAttended',
  guestattended: 'GuestAttended',
  guestnumber: 'GuestNumber',
  tablenumber: 'Table Number',
  studentpicture: 'StudentPicture',
  awardstatus: 'AwardStatus',
  gownstatus: 'GownStatus',
  gowndownpaymenttype: 'GownDownpaymentType',
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function openDb() {
  ensureDir();
  const db = new sqlite3.Database(DB_PATH);
  db.exec('PRAGMA journal_mode=WAL;');
  return db;
}

function pingDb() {
  const db = openDb();
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 AS ok', (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(!!(row && row.ok === 1));
    });
  });
}

async function readExcelHeadersAndRows() {
  if (!fs.existsSync(EXCEL_PATH)) return { headers: [], rows: [] };
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  const ws = wb.getWorksheet(SHEET_NAME);
  if (!ws) return { headers: [], rows: [] };
  const headerRow = ws.getRow(1);
  const headers = [];
  for (let i = 1; i <= ws.columnCount; i++) {
    const v = headerRow.getCell(i).value;
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      headers.push(String(v));
    }
  }
  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    headers.forEach((h, i) => {
      const val = row.getCell(i + 1).value;
      if (val !== undefined && val !== null && val !== '') obj[h] = val;
    });
    if (Object.keys(obj).length) rows.push(obj);
  });
  return { headers, rows };
}

function ensureTable(db, headers) {
  return new Promise((resolve, reject) => {
    const baseCols = new Set([
      'ID',
      'Firstname',
      'Lastname',
      'Course',
      'CourseType'
    ]);
    const extra = headers.filter((h) => !baseCols.has(h));
    const cols = [
      'ID INTEGER PRIMARY KEY',
      'Firstname TEXT',
      'Lastname TEXT',
      'Course TEXT',
      'CourseType TEXT',
      ...extra.map((h) => `${q(h)} TEXT`)
    ];
    const sql = `CREATE TABLE IF NOT EXISTS students (${cols.join(', ')})`;
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function getExistingColumns(db) {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info('students')", (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map((r) => r.name));
    });
  });
}

function addMissingColumns(db, wantCols) {
  return getExistingColumns(db).then((existing) => {
    const missing = wantCols.filter((c) => !existing.includes(c));
    return new Promise((resolve, reject) => {
      if (missing.length === 0) return resolve();
      const stmts = missing.map((c) => `ALTER TABLE students ADD COLUMN ${q(c)} TEXT`);
      db.serialize(() => {
        let errOut = null;
        stmts.forEach((s) => {
          if (errOut) return;
          db.run(s, (err) => {
            if (err) errOut = err;
          });
        });
        db.run('SELECT 1', (err) => (errOut || err ? reject(errOut || err) : resolve()));
      });
    });
  });
}

async function importFromExcelIfEmpty(db) {
  const { headers, rows } = await readExcelHeadersAndRows();
  await ensureTable(db, headers);
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(1) as cnt FROM students', (err, row) => {
      if (err) return reject(err);
      const count = row ? row.cnt : 0;
      if (count > 0 || rows.length === 0) return resolve();
      const allCols = Array.from(new Set(['ID', 'Firstname', 'Lastname', 'Course', 'CourseType', ...headers.filter((h) => !['ID','Firstname','Lastname','Course','CourseType'].includes(h))]));
      addMissingColumns(db, allCols).then(() => {
        db.serialize(() => {
          db.run('BEGIN');
          rows.forEach((r) => {
            // Ensure numeric ID
            if (r.ID === undefined || r.ID === null) return;
            const cols = Object.keys(r);
            const placeholders = cols.map(() => '?').join(',');
            const insertCols = cols.map((c) => q(c)).join(',');
            const sql = `INSERT INTO students (${insertCols}) VALUES (${placeholders}) ON CONFLICT(ID) DO UPDATE SET ${cols.filter(c=>c!=='ID').map((c)=>`${q(c)}=excluded.${q(c)}`).join(',')}`;
            db.run(sql, cols.map((c) => r[c]));
          });
          db.run('COMMIT', (e) => (e ? reject(e) : resolve()));
        });
      }).catch(reject);
    });
  });
}

// Public API expected by server.js
async function getAllStudents() {
  const db = openDb();
  await importFromExcelIfEmpty(db);
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students', (err, rows) => {
      db.close();
      if (err) return reject(err);
      const out = (rows || []).map((r) => {
        const obj = normalizeRowObject(r);
        // Trim heavy picture data from list responses
        delete obj.StudentPicture;
        delete obj['Student Picture'];
        return obj;
      });
      resolve(out);
    });
  });
}

async function getStudentById(id) {
  const db = openDb();
  await importFromExcelIfEmpty(db);
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM students WHERE ID = ?', [id], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row ? normalizeRowObject(row) : null);
    });
  });
}

async function updateStudentField(id, field, value) {
  const db = openDb();
  await importFromExcelIfEmpty(db);
  // Resolve to an existing column name if possible
  const col = await resolveColumnName(db, field);
  if (!col) {
    // Ensure column exists if not found
    await addMissingColumns(db, [field]);
  }
  // Ensure row exists
  const exists = await new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM students WHERE ID = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(!!row);
    });
  });
  if (!exists) {
    db.close();
    throw new Error(`Student with ID ${id} not found`);
  }
  return new Promise((resolve, reject) => {
    const target = col || field;
    const sql = `UPDATE students SET ${q(target)} = ? WHERE ID = ?`;
    db.run(sql, [value, id], (err) => {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

async function createStudent(data) {
  const db = openDb();
  await importFromExcelIfEmpty(db);
  // Provide ID if missing: next integer ID
  let id = data.ID;
  if (id === undefined || id === null || id === '') {
    id = await new Promise((resolve, reject) => {
      db.get('SELECT COALESCE(MAX(ID),0)+1 AS nextId FROM students', (err, row) => {
        if (err) return reject(err);
        resolve(row?.nextId || 1);
      });
    });
  }
  id = Number(id);
  if (!Number.isFinite(id)) {
    db.close();
    throw new Error('Invalid ID');
  }
  // Check if already exists
  const exists = await new Promise((resolve, reject) => {
    db.get('SELECT 1 FROM students WHERE ID = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(!!row);
    });
  });
  if (exists) {
    db.close();
    const e = new Error('Student with this ID already exists');
    e.code = 'ALREADY_EXISTS';
    throw e;
  }
  // Ensure any custom columns exist
  const colsInPayload = Object.keys(data).filter(k => k !== 'ID');
  if (colsInPayload.length) await addMissingColumns(db, colsInPayload);
  // Build insert
  const allCols = ['ID', ...colsInPayload];
  const placeholders = allCols.map(() => '?').join(',');
  const sql = `INSERT INTO students (${allCols.map(c => q(c)).join(',')}) VALUES (${placeholders})`;
  const values = allCols.map(c => (c === 'ID' ? id : data[c]));
  await new Promise((resolve, reject) => db.run(sql, values, (err) => (err ? reject(err) : resolve())));
  // Return created row
  const created = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM students WHERE ID = ?', [id], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row ? normalizeRowObject(row) : null);
    });
  });
  return created;
}

function normalizeRowObject(row) {
  // Copy original
  const out = { ...row };
  // Create canonical aliases
  Object.keys(row).forEach((key) => {
    const hn = normalizeHeaderName(key);
    const canonical = CANONICAL[hn];
    if (canonical && out[canonical] === undefined) {
      out[canonical] = row[key];
    }
  });
  return out;
}

async function resolveColumnName(db, field) {
  const cols = await getExistingColumns(db);
  const want = String(field);
  const wantNorm = normalizeHeaderName(want);
  // Exact
  if (cols.includes(want)) return want;
  // Trimmed
  const trimmed = cols.find((c) => c.trim() === want.trim());
  if (trimmed) return trimmed;
  // Normalized
  const normMatch = cols.find((c) => normalizeHeaderName(c) === wantNorm);
  if (normMatch) return normMatch;
  // Aliases
  const FIELD_ALIASES = {
    GuestAttended: ['Guest Attended', 'Guest_Attended'],
    StudentAttended: ['Student Attended', 'Student_Attended'],
    GuestNumber: ['Guest Number', 'Guest_Number'],
    'Table Number': ['Table Number ', 'TableNumber'],
    StudentPicture: ['Student Picture', 'Student_Picture', 'Picture'],
    AwardStatus: ['Award Status', 'Award_Status'],
    GownStatus: ['Gown Status', 'Gown_Status'],
    GownDownpaymentType: ['Gown Downpayment Type', 'Gown_Downpayment_Type'],
    'Photo Number': ['PhotoNumber', 'Photo No', 'PhotoNo'],
  };
  const aliases = FIELD_ALIASES[want] || [];
  for (const a of aliases) {
    const an = normalizeHeaderName(a);
    const match = cols.find((c) => normalizeHeaderName(c) === an);
    if (match) return match;
  }
  return '';
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudentField,
  pingDb,
  createStudent,
};
