import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'antd'
import './index.css'

export default function MenuComponent() {
  const location = useLocation()
  const items = [
    { label: <Link to="/">Attendance</Link>, key: '/' },
    { label: <Link to="/gown">Gown Mgmt</Link>, key: '/gown' },
    { label: <Link to="/award">Awards</Link>, key: '/award' },
    { label: <Link to="/award-display">Award Display</Link>, key: '/award-display' },
    { label: <Link to="/reports">Reports</Link>, key: '/reports' },
    { label: <Link to="/attendees">Attendees</Link>, key: '/attendees' }
  ]

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[location.pathname]}
      items={items}
      className="menu"
    />
  )
}
