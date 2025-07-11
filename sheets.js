const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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
 */

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// Allow both SPREADSHEET_ID and REACT_APP_SPREADSHEET_ID for flexibility
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || process.env.REACT_APP_SPREADSHEET_ID;
const SHEET_NAME = process.env.SHEET_NAME || 'Final';

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  const file =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_SERVICE_ACCOUNT_FILE ||
    path.join(__dirname, 'service-account.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const credentials = loadCredentials();
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

const sheets = google.sheets({ version: 'v4', auth });

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
  'AwardStatus'
];

const COLUMN_MAP = HEADERS.reduce((map, header, i) => {
  map[header] = columnToLetter(i + 1);
  return map;
}, {});

function columnToLetter(col) {
  let letter = '';
  let temp;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

function parseStudentRow(row) {
  const student = {};
  HEADERS.forEach((header, i) => {
    let value = row[i];
    if (value === undefined) return;
    if (['ID', 'GuestNumber', 'GuestAttended'].includes(header)) {
      value = Number(value);
    }
    student[header] = value;
  });
  return student;
}

async function fetchAllRows() {
  const columnEnd = COLUMN_MAP[HEADERS[HEADERS.length - 1]];
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:${columnEnd}`,
  });
  return data.values || [];
}

async function getAllStudents() {
  const rows = await fetchAllRows();
  return rows.map(parseStudentRow);
}

async function getStudentById(id) {
  const students = await getAllStudents();
  return students.find((s) => s.ID === id);
}

async function updateStudentField(id, field, value) {
  const rows = await fetchAllRows();
  const index = rows.findIndex((r) => Number(r[0]) === id);
  if (index === -1) {
    throw new Error(`Student with ID ${id} not found`);
  }
  const rowNumber = index + 2; // account for header row
  const column = COLUMN_MAP[field];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!${column}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[value]],
    },
  });
}

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudentField,
};
