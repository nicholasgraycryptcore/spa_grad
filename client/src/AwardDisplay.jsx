import React, { useCallback, useEffect, useState } from 'react'
import { Card } from 'antd'
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
    <div className="display-container">
      <h1>Award Display</h1>
      <div className="display-grid">
        {students.map(s => (
          <Card
            key={s.ID}
            className="display-card"
            cover={
              s.StudentPicture ? (
                <img src={s.StudentPicture} alt={s.Firstname} className="display-photo" />
              ) : null
            }
          >
            <Card.Meta title={`${s.Firstname} ${s.Lastname}`} description={`ID #${s.ID}`} />
            <p>{s.Course}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
