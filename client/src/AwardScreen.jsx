import React, { useCallback, useEffect, useState } from 'react'
import { Card, Button } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AwardScreen() {
  const [students, setStudents] = useState([])
  const { getAllStudents, updateStudentField } = useSheets()

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

  const markCollected = id => {
    updateStudentField(id, 'AwardStatus', 'Collected')
      .then(() => loadStudents())
      .catch(err => console.error(err))
  }

  return (
    <div className="container">
      <h1>Award Collection</h1>
      <div className="grid">
        {students.map(s => (
          <Card
            key={s.ID}
            className="display-card"
            cover={
              s.StudentPicture ? (
                <img src={s.StudentPicture} alt={s.Firstname} className="photo" 
                 style={{ margin: '0 auto' }}
                />
              ) : null
            }
          >
            <Card.Meta title={`${s.Firstname} ${s.Lastname}`} description={`ID #${s.ID}`} />
            <p>{s.Course}</p>
            <Button onClick={() => markCollected(s.ID)} style={{ marginTop: 8 }}>
              Mark Certificate Collected
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
