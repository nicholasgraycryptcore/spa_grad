import React from 'react'
import { Link } from 'react-router-dom'
import './index.css'

export default function Menu() {
  return (
    <nav className="menu">
      <Link to="/">Attendance</Link>
      <Link to="/gown">Gown Mgmt</Link>
      <Link to="/award">Awards</Link>
      <Link to="/award-display">Award Display</Link>
      <Link to="/reports">Reports</Link>
      <Link to="/attendees">Attendees</Link>
    </nav>
  )
}
