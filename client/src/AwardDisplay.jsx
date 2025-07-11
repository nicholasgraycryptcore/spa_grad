import React, { useCallback, useEffect, useState } from 'react'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AwardDisplay() {
  const [students, setStudents] = useState([])
  const { getAllStudents } = useSheets()

  const loadStudents = useCallback(() => {
    getAllStudents()
      .then(data => {
        const filtered = data
          .filter(s => s.StudentAttended === 'Yes' && s.AwardStatus !== 'Collected')
          .sort((a, b) => a.ID - b.ID)
          .slice(0, 3)
        setStudents(filtered)
      })
      .catch(err => console.error(err))
  }, [getAllStudents])

  useEffect(() => {
    loadStudents()
    const interval = setInterval(loadStudents, 5000)
    window.addEventListener('focus', loadStudents)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', loadStudents)
    }
  }, [loadStudents])

  return (
    <div className="container">
      <h1>Award Display</h1>
      <div className="grid">
        {students.map(s => (
          <div key={s.ID} className="card">
            {s.StudentPicture && (
              <img src={s.StudentPicture} alt={s.Firstname} className="photo" />
            )}
            <h3>{s.Firstname} {s.Lastname}</h3>
            <p>ID #{s.ID}</p>
            <p>{s.Course}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
