import React, { useCallback, useEffect, useState } from 'react'
import './index.css'

export default function AwardScreen() {
  const [students, setStudents] = useState([])

  const loadStudents = useCallback(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        const filtered = data
          .filter(s => s.StudentAttended === 'Yes' && s.AwardStatus !== 'Collected')
          .sort((a, b) => a.ID - b.ID)
          .slice(0, 3)
        setStudents(filtered)
      })
      .catch(err => console.error(err))
  }, [])

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
    fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ AwardStatus: 'Collected' })
    })
      .then(() => loadStudents())
      .catch(err => console.error(err))
  }

  return (
    <div className="container">
      <h1>Award Collection</h1>
      <div className="grid">
        {students.map(s => (
          <div key={s.ID} className="card">
            {s.StudentPicture && (
              <img src={s.StudentPicture} alt={s.Firstname} className="photo" />
            )}
            <h3>{s.Firstname} {s.Lastname}</h3>
            <p>{s.Course}</p>
            <button onClick={() => markCollected(s.ID)}>Mark Certificate Collected</button>
          </div>
        ))}
      </div>
    </div>
  )
}
