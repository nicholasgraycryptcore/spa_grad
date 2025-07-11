import React from 'react'
import { Link } from 'react-router-dom'
import './index.css'

export default function Menu() {
  return (
    <nav className="menu">
      <Link to="/">Students</Link>
      <Link to="/attendance">Attendance</Link>
      <Link to="/gown">Gown Mgmt</Link>
    </nav>
  )
}
