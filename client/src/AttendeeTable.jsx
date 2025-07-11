import React, { useEffect, useState } from 'react'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendeeTable() {
  const { getAllStudents } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllStudents()
      .then(data => {
        const attended = data.filter(s => s.StudentAttended === 'Yes')
        setStudents(attended)
      })
      .catch(err => console.error(err))
  }, [getAllStudents])

  const filtered = students.filter(s => {
    const term = search.toLowerCase()
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    )
  })

  return (
    <div className="container">
      <h1>Attendees</h1>
      <div className="form-controls">
        <input
          type="text"
          placeholder="Search by ID or name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Gown Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.ID}>
              <td>{s.ID}</td>
              <td>{s.Firstname} {s.Lastname}</td>
              <td>{s.GownStatus || 'Not Collected'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
