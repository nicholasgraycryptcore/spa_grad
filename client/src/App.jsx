import React, { useEffect, useState } from 'react'

function App() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(setStudents)
      .catch(err => console.error(err))
  }, [])

  return (
    <div>
      <h1>Student List</h1>
      <ul>
        {students.map(student => (
          <li key={student.ID}>
            {student.Firstname} {student.Lastname} - {student.Course}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
