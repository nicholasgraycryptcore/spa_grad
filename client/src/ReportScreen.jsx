import React, { useEffect, useState } from 'react'
import { Alert, List } from 'antd'
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
        <Alert type="error" message={error} showIcon />
      </div>
    )
  }

  if (!stats) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h1>Reports</h1>
      <List bordered className="list">
        <List.Item>Students Attended: {stats.totalStudents}</List.Item>
        <List.Item>Guests Present: {stats.totalGuests}</List.Item>
        <List.Item>Total Present: {stats.totalTotal}</List.Item>
        <List.Item>Gowns Collected: {stats.gownsCollected}</List.Item>
        <List.Item>Gowns Returned: {stats.gownsReturned}</List.Item>
      </List>
    </div>
  )
}
