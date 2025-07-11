import React, { useEffect, useState } from 'react'
import './index.css'

export default function StudentList() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(setStudents)
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="container">
      <h1>Student List</h1>
      <ul className="list">
        {students.map(student => (
          <li key={student.ID} className="list-item">
            {student.Firstname} {student.Lastname} - {student.Course}
          </li>
        ))}
      </ul>
    </div>
  )
}
