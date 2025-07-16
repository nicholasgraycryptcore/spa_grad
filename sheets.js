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
 */

const SHEET_NAME = process.env.SHEET_NAME || 'Final';
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'gradevening.xlsx');

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
  'Photo Package Status'
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

function parseStudentRow(row) {
  const student = {};
  HEADERS.forEach((header, i) => {
    let value = row.getCell(i + 1).value;
    if (value === undefined || value === null) return;
    if (['ID', 'GuestNumber', 'GuestAttended'].includes(header)) {
      const num = Number(value);
      value = Number.isNaN(num) ? undefined : num;
    }
    student[header] = value;
  });
  return student;
}

async function getAllStudents() {
  const wb = await loadWorkbook();
  const ws = wb.getWorksheet(SHEET_NAME);
  const students = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const student = parseStudentRow(row);
    if (student.ID !== undefined) students.push(student);
  });
  return students;
}

async function getStudentById(id) {
  const students = await getAllStudents();
  return students.find((s) => s.ID === id);
}

async function updateStudentField(id, field, value) {
  const column = HEADERS.indexOf(field) + 1;
  if (column === 0) throw new Error(`Unknown field ${field}`);
  writeQueue = writeQueue.then(async () => {
    const wb = await loadWorkbook();
    const ws = wb.getWorksheet(SHEET_NAME);
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
