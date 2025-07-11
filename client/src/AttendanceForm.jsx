import React, { useState, useEffect } from 'react'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendanceForm() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [guestNumber, setGuestNumber] = useState('')
  const [studentAttended, setStudentAttended] = useState(false)
  const [message, setMessage] = useState(null)

  const { getAllStudents, getStudentById, updateStudentField } = useSheets()

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load students' }))
  }, [getAllStudents])

  const filtered = students.filter(s => {
    const term = search.toLowerCase()
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    )
  })

  const loadStudent = id => {
    getStudentById(id)
      .then(data => {
        setSelectedStudent(data)
        setGuestNumber(data.GuestNumber || 0)
        setStudentAttended(data.StudentAttended === 'Yes')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load student' }))
  }

  const handleSelect = e => {
    const id = e.target.value
    setSelectedId(id)
    if (id) loadStudent(id)
    else setSelectedStudent(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!selectedId) return
    Promise.all([
      updateStudentField(selectedId, 'GuestNumber', Number(guestNumber)),
      updateStudentField(
        selectedId,
        'StudentAttended',
        studentAttended ? 'Yes' : 'No'
      )
    ])
      .then(() => loadStudent(selectedId))
      .then(() => setMessage({ type: 'success', text: 'Saved successfully' }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to save changes' }))
  }

  return (
    <div className="container">
      <div className="form-controls">
        <input
          type="text"
          placeholder="Search by ID or name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={selectedId} onChange={handleSelect}>
          <option value="">Select a student</option>
          {filtered.map(s => (
            <option key={s.ID} value={s.ID}>
              {s.ID} - {s.Firstname} {s.Lastname}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            Guest Number
            <input
              type="number"
              value={guestNumber}
              onChange={e => setGuestNumber(e.target.value)}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={studentAttended}
              onChange={e => setStudentAttended(e.target.checked)}
            />
            Student Attended
          </label>
          <button type="submit">Save</button>
        </form>
      )}

      {message && (
        <div className={message.type === 'error' ? 'msg error' : 'msg'}>
          {message.text}
        </div>
      )}
    </div>
  )
}
