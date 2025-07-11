require('dotenv').config(); // Add this line at the very top

const express = require('express');
const path = require('path');
const { getAllStudents, getStudentById, updateStudentField } = require('./sheets');

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

app.get('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const student = await getStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = [];
    if (req.body.GuestNumber !== undefined) {
      updates.push(updateStudentField(id, 'GuestNumber', req.body.GuestNumber));
    }
    if (req.body.StudentAttended !== undefined) {
      updates.push(updateStudentField(id, 'StudentAttended', req.body.StudentAttended));
    }
    if (req.body.GownStatus !== undefined) {
      updates.push(updateStudentField(id, 'GownStatus', req.body.GownStatus));
    }
    if (req.body.GownDownpaymentType !== undefined) {
      updates.push(updateStudentField(id, 'GownDownpaymentType', req.body.GownDownpaymentType));
    }
    if (req.body.AwardStatus !== undefined) {
      updates.push(updateStudentField(id, 'AwardStatus', req.body.AwardStatus));
    }
    await Promise.all(updates);
    const student = await getStudentById(id);
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

app.use(express.static(path.join(__dirname, 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
