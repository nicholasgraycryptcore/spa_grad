import React, { useState, useEffect } from 'react'
import { useSheets } from './SheetsContext'
import './index.css'

export default function GownManagement() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [student, setStudent] = useState(null)
  const [downType, setDownType] = useState('Money')
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
        setStudent(data)
        setDownType(data.GownDownpaymentType || 'Money')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load student' }))
  }

  const handleSelect = e => {
    const id = e.target.value
    setSelectedId(id)
    if (id) loadStudent(id)
    else setStudent(null)
  }

  const updateFields = updates => {
    setMessage(null)
    const promises = Object.entries(updates).map(([field, value]) =>
      updateStudentField(selectedId, field, value)
    )
    Promise.all(promises)
      .then(() => loadStudent(selectedId))
      .then(() => setMessage({ type: 'success', text: 'Saved successfully' }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to save changes' }))
  }

  const handleCollected = () => {
    updateFields({ GownStatus: 'Collected', GownDownpaymentType: downType })
  }

  const handleReturned = () => {
    updateFields({ GownStatus: 'Returned' })
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

      {student && (
        <div className="form">
          <p>Current Status: {student.GownStatus || 'Not Collected'}</p>
          <p>Downpayment Type: {student.GownDownpaymentType || 'N/A'}</p>
          <label>
            Down-payment Type
            <select value={downType} onChange={e => setDownType(e.target.value)}>
              <option value="Money">Money</option>
              <option value="ID">ID</option>
            </select>
          </label>
          <div>
            <button onClick={handleCollected}>Mark Collected</button>
            <button onClick={handleReturned}>Mark Returned</button>
          </div>
        </div>
      )}

      {message && (
        <div className={message.type === 'error' ? 'msg error' : 'msg'}>
          {message.text}
        </div>
      )}
    </div>
  )
}
