require('dotenv').config(); // Add this line at the very top

const express = require('express');
const path = require('path');
const { getAllStudents } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/students', async (req, res) => {
  try {
    const students = await getAllStudents();
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
