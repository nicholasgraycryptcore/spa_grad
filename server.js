require('dotenv').config(); // Add this line at the very top

const express = require('express');
const path = require('path');
const { getAllStudents, getStudentById, updateStudentField } = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

// Store SSE connections
const clients = [];

function broadcastUpdate() {
  clients.forEach((res) => {
    try {
      res.write('data: update\n\n');
    } catch (err) {
      // Connection might be closed
    }
  });
}

// Increase body limit to handle base64 encoded images
app.use(express.json({ limit: '5mb' }));

// SSE endpoint to notify clients of updates
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  // Send a comment to keep connection alive
  res.write(': connected\n\n');

  clients.push(res);

  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

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
    if (req.body.GuestAttended !== undefined) {
      updates.push(updateStudentField(id, 'GuestAttended', req.body.GuestAttended));
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
    if (req.body.StudentPicture !== undefined) {
      updates.push(updateStudentField(id, 'StudentPicture', req.body.StudentPicture));
    }
    if (req.body.AwardStatus !== undefined) {
      updates.push(updateStudentField(id, 'AwardStatus', req.body.AwardStatus));
    }
    if (req.body['Photo Package'] !== undefined) {
      updates.push(updateStudentField(id, 'Photo Package', req.body['Photo Package']));
    }
    if (req.body['Photo Package Type'] !== undefined) {
      updates.push(updateStudentField(id, 'Photo Package Type', req.body['Photo Package Type']));
    }
    if (req.body['Photo Payment Status'] !== undefined) {
      updates.push(updateStudentField(id, 'Photo Payment Status', req.body['Photo Payment Status']));
    }
    if (req.body['Photo Package Status'] !== undefined) {
      updates.push(updateStudentField(id, 'Photo Package Status', req.body['Photo Package Status']));
    }
    await Promise.all(updates);
    const student = await getStudentById(id);
    res.json(student);
    broadcastUpdate();
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
