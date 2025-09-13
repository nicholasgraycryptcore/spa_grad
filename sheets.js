const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

/**
 * @typedef {Object} Student
 * @property {number} ID
 * @property {string} Firstname
 * @property {string} Lastname
 * @property {string} Course
 * @property {string} CourseType
 * @property {number} [GuestNumber]
 * @property {number} [GuestAttended]
 * @property {('Yes'|'No')} [StudentAttended]
 * @property {('Not Collected'|'Collected'|'Returned')} [GownStatus]
 * @property {('Money'|'ID')} [GownDownpaymentType]
 * @property {string} [StudentPicture]
 * @property {string} [Email]
 * @property {string} [Phone]
 * @property {('Collected'|null)} [AwardStatus]
 * @property {string} ["Photo Package"]
 * @property {('Print'|'Digital')} ["Photo Package Type"]
 * @property {('Paid'|'Not Paid')} ["Photo Payment Status"]
 * @property {('Collected'|'Not Collected')} ["Photo Package Status"]
 * @property {string|number} ["Table Number"]
 */

const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'grad_sept.xlsx');

// Default headers used only when creating a new workbook from scratch.
// When reading or writing, we detect headers dynamically from the file
// so additional columns (e.g. "Table Number") are supported transparently.
const HEADERS = [
  'ID',
  'Firstname',
  'Lastname',
  'Course',
  'CourseType',
  'GuestNumber',
  'GuestAttended',
  'StudentAttended',
  'GownStatus',
  'GownDownpaymentType',
  'StudentPicture',
  'Email',
  'Phone',
  'AwardStatus',
  'Photo Package',
  'Photo Package Type',
  'Photo Payment Status',
  'Photo Package Status',
  // New optional column. If the existing sheet already has it (with or without
  // trailing space), dynamic header detection below will pick it up.
  'Table Number'
];

let writeQueue = Promise.resolve();

async function ensureWorkbook() {
  if (!fs.existsSync(FILE_PATH)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(SHEET_NAME);
    ws.addRow(HEADERS);
    await wb.xlsx.writeFile(FILE_PATH);
  }
}

async function loadWorkbook() {
  await ensureWorkbook();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE_PATH);
  return wb;
}

function getHeadersFromWorksheet(ws) {
  const headerRow = ws.getRow(1);
  const headers = [];
  for (let i = 1; i <= ws.columnCount; i++) {
    const cellVal = headerRow.getCell(i).value;
    if (cellVal === undefined || cellVal === null) continue;
    headers.push(String(cellVal));
  }
  return headers.length ? headers : HEADERS;
}

function normalizeHeaderName(name) {
  return String(name).replace(/\s+/g, '').toLowerCase();
}

function normalizeAttendedValue(value) {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') return value === 0 ? 'No' : 'Yes';
  const s = String(value).trim().toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Yes';
  if (s === 'no' || s === 'n' || s === 'false' || s === '0' || s === '') return 'No';
  return value;
}

function parseStudentRow(row, headers) {
  const student = {};
  const CANONICAL = {
    studentattended: 'StudentAttended',
    guestattended: 'GuestAttended',
    guestnumber: 'GuestNumber',
    tablenumber: 'Table Number',
    studentpicture: 'StudentPicture'
  };
  headers.forEach((header, i) => {
    let value = row.getCell(i + 1).value;
    if (value === undefined || value === null) return;
    const hn = normalizeHeaderName(header);
    if (['id', 'guestnumber', 'guestattended', 'tablenumber'].includes(hn)) {
      const num = Number(value);
      value = Number.isNaN(num) ? value : num;
    }
    if (hn === 'studentattended') {
      value = normalizeAttendedValue(value);
    }
    student[header] = value;
    const canonical = CANONICAL[hn];
    if (canonical && student[canonical] === undefined) {
      student[canonical] = value;
    }
  });
  return student;
}

async function getAllStudents() {
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(SHEET_NAME);
  const headers = getHeadersFromWorksheet(ws);
  const students = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const student = parseStudentRow(row, headers);
    if (student.ID !== undefined) students.push(student);
  });
  return students;
}

async function getStudentById(id) {
  const students = await getAllStudents();
  return students.find((s) => s.ID === id);
}

async function updateStudentField(id, field, value) {
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(SHEET_NAME);
  const headers = getHeadersFromWorksheet(ws);
  const FIELD_ALIASES = {
    GuestAttended: ['Guest Attended', 'Guest_Attended'],
    StudentAttended: ['Student Attended', 'Student_Attended'],
    GuestNumber: ['Guest Number', 'Guest_Number'],
    'Table Number': ['Table Number ', 'TableNumber'],
    StudentPicture: ['Student Picture', 'Student_Picture', 'Picture']
  };

  const want = String(field);
  const wantNorm = normalizeHeaderName(want);

  const findColumn = () => {
    // 1) Exact match
    let idx = headers.indexOf(want);
    if (idx !== -1) return idx + 1;
    // 2) Trimmed match
    idx = headers.findIndex((h) => h.trim() === want.trim());
    if (idx !== -1) return idx + 1;
    // 3) Normalized (ignore spaces/case)
    idx = headers.findIndex((h) => normalizeHeaderName(h) === wantNorm);
    if (idx !== -1) return idx + 1;
    // 4) Aliases
    const aliases = FIELD_ALIASES[want] || [];
    for (const a of aliases) {
      const an = normalizeHeaderName(a);
      idx = headers.findIndex((h) => normalizeHeaderName(h) === an);
      if (idx !== -1) return idx + 1;
    }
    return 0;
  };

  let column = findColumn();
  if (column === 0) throw new Error(`Unknown field ${field}`);
  writeQueue = writeQueue.then(async () => {
    let targetRow;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellVal = row.getCell(1).value;
      if (Number(cellVal) === id) targetRow = row;
    });
    if (!targetRow) {
      throw new Error(`Student with ID ${id} not found`);
    }
    targetRow.getCell(column).value = value;
    await wb.xlsx.writeFile(FILE_PATH);
  });
  return writeQueue;
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudentField,
};
