import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Button } from 'antd'
import './index.css'

export default function MenuComponent() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const items = [
    { label: <Link to="/">Attendance</Link>, key: '/' },
    { label: <Link to="/gown">Gown Mgmt</Link>, key: '/gown' },
    { label: <Link to="/award">Awards</Link>, key: '/award' },
    { label: <Link to="/award-display">Award Display</Link>, key: '/award-display' },
    { label: <Link to="/award-display-single">Award Display (Single)</Link>, key: '/award-display-single' },
    { label: <Link to="/photos">Photos</Link>, key: '/photos' },
    { label: <Link to="/photo-packages">Photo Packages</Link>, key: '/photo-packages' },
    { label: <Link to="/reports">Reports</Link>, key: '/reports' },
    { label: <Link to="/attendees">Attendees</Link>, key: '/attendees' },
    { label: <Link to="/tables">Tables</Link>, key: '/tables' }
  ]

  return (
    <div className="menu-wrapper">
      <Button className="menu-toggle" onClick={() => setOpen(!open)}>
        Menu
      </Button>
      {open && (
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={() => setOpen(false)}
          className="menu"
        />
      )}
    </div>
  )
}
