import React, { useState, useEffect } from 'react';
import { getAllStudents, getStudentById, updateStudentField } from './sheets';

export default function AttendanceForm() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [guestNumber, setGuestNumber] = useState('');
  const [studentAttended, setStudentAttended] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const data = await getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load students' });
    }
  }

  async function handleSelect(e) {
    const id = Number(e.target.value);
    setSelectedId(id);
    if (!id) {
      setSelectedStudent(null);
      return;
    }
    try {
      const student = await getStudentById(id);
      setSelectedStudent(student);
      setGuestNumber(student.GuestNumber || 0);
      setStudentAttended(student.StudentAttended === 'Yes');
      setMessage(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load student' });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStudent) return;
    saveChanges();
  }

  async function saveChanges() {
    setMessage(null);
    const updates = [];
    if (guestNumber !== selectedStudent.GuestNumber) {
      updates.push(updateStudentField(selectedStudent.ID, 'GuestNumber', guestNumber));
    }
    const attendedValue = studentAttended ? 'Yes' : 'No';
    if (attendedValue !== selectedStudent.StudentAttended) {
      updates.push(updateStudentField(selectedStudent.ID, 'StudentAttended', attendedValue));
    }
    if (updates.length === 0) {
      setMessage({ type: 'success', text: 'No changes to save' });
      return;
    }
    try {
      await Promise.all(updates);
      const refreshed = await getStudentById(selectedStudent.ID);
      setSelectedStudent(refreshed);
      setGuestNumber(refreshed.GuestNumber || 0);
      setStudentAttended(refreshed.StudentAttended === 'Yes');
      await fetchStudents();
      setMessage({ type: 'success', text: 'Saved successfully' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    }
  }

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Search by ID or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={selectedId} onChange={handleSelect}>
          <option value="">Select a student</option>
          {filteredStudents.map((s) => (
            <option key={s.ID} value={s.ID}>
              {s.ID} - {s.Firstname} {s.Lastname}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div>
            <label>
              Guest Number:
              <input
                type="number"
                value={guestNumber}
                onChange={(e) => setGuestNumber(Number(e.target.value))}
              />
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={studentAttended}
                onChange={(e) => setStudentAttended(e.target.checked)}
              />
              Student Attended
            </label>
          </div>
          <button type="submit">Save</button>
        </form>
      )}

      {message && (
        <div style={{ color: message.type === 'error' ? 'red' : 'green' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

