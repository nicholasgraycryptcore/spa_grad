import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Menu from './Menu'
import StudentList from './StudentList'
import AttendanceForm from './AttendanceForm'

export default function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        <Route path="/" element={<StudentList />} />
        <Route path="/attendance" element={<AttendanceForm />} />
      </Routes>
    </Router>
  )
}
