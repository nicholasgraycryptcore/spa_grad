import React, { useEffect, useState } from 'react'
import { useSheets } from './SheetsContext'
import './index.css'

export default function ReportScreen() {
  const { getAllStudents } = useSheets()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAllStudents()
      .then(data => {
        const totalStudents = data.filter(s => s.StudentAttended === 'Yes').length
        const totalGuests = data.reduce((sum, s) => sum + (s.GuestAttended || 0), 0)
        const gownsCollected = data.filter(s => s.GownStatus === 'Collected').length
        const gownsReturned = data.filter(s => s.GownStatus === 'Returned').length
        setStats({
          totalStudents,
          totalGuests,
          totalTotal: totalStudents + totalGuests,
          gownsCollected,
          gownsReturned
        })
      })
      .catch(() => setError('Failed to load data'))
  }, [getAllStudents])

  if (error) {
    return (
      <div className="container">
        <div className="msg error">{error}</div>
      </div>
    )
  }

  if (!stats) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h1>Reports</h1>
      <ul className="list">
        <li className="list-item">Students Attended: {stats.totalStudents}</li>
        <li className="list-item">Guests Present: {stats.totalGuests}</li>
        <li className="list-item">Total Present: {stats.totalTotal}</li>
        <li className="list-item">Gowns Collected: {stats.gownsCollected}</li>
        <li className="list-item">Gowns Returned: {stats.gownsReturned}</li>
      </ul>
    </div>
  )
}
