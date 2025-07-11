import React, { useState, useEffect } from 'react'
import { Input, Select, Button, Alert } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function GownManagement() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [student, setStudent] = useState(null)
  const [downType, setDownType] = useState('Money')
  const [message, setMessage] = useState(null)
  const [open, setOpen] = useState(false)

  const { getAllStudents, getStudentById, updateStudentField } = useSheets()

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load students' }))
  }, [getAllStudents])

  useEffect(() => {
    if (search) setOpen(true)
    else setOpen(false)
  }, [search])

  const filtered = students.filter(s => {
    const term = search.toLowerCase()
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    )
  })

  const loadStudent = id => {
    getStudentById(id)
      .then(data => {
        setStudent(data)
        setDownType(data.GownDownpaymentType || 'Money')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load student' }))
  }

  const handleSelect = value => {
    setSelectedId(value)
    if (value) loadStudent(value)
    else setStudent(null)
    setOpen(false)
  }

  const updateFields = updates => {
    setMessage(null)
    const promises = Object.entries(updates).map(([field, value]) =>
      updateStudentField(selectedId, field, value)
    )
    Promise.all(promises)
      .then(() => loadStudent(selectedId))
      .then(() => setMessage({ type: 'success', text: 'Saved successfully' }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to save changes' }))
  }

  const handleCollected = () => {
    updateFields({ GownStatus: 'Collected', GownDownpaymentType: downType })
  }

  const handleReturned = () => {
    updateFields({ GownStatus: 'Returned' })
  }

  return (
    <div className="container">
      <div className="form-controls">
        <Input
          placeholder="Search by ID or name"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          style={{ width: 200 }}
        />
        <Select
          value={selectedId || undefined}
          onChange={handleSelect}
          placeholder="Select a student"
          style={{ minWidth: 220 }}
          allowClear
          options={filtered.map(s => ({ value: s.ID, label: `${s.ID} - ${s.Firstname} ${s.Lastname}` }))}
          open={open}
          onDropdownVisibleChange={vis => setOpen(vis)}
        />
      </div>

      {student && (
        <div className="form">
          <p>Current Status: {student.GownStatus || 'Not Collected'}</p>
          <p>Downpayment Type: {student.GownDownpaymentType || 'N/A'}</p>
          <label>
            Down-payment Type
            <Select value={downType} onChange={value => setDownType(value)} style={{ width: 120 }}>
              <Select.Option value="Money">Money</Select.Option>
              <Select.Option value="ID">ID</Select.Option>
            </Select>
          </label>
          <div>
            <Button type="primary" onClick={handleCollected}>Mark Collected</Button>
            <Button onClick={handleReturned} style={{ marginLeft: 8 }}>Mark Returned</Button>
          </div>
        </div>
      )}

      {message && (
        <Alert
          type={message.type === 'error' ? 'error' : 'success'}
          message={message.text}
          showIcon
          style={{ marginTop: '1rem' }}
        />
      )}
    </div>
  )
}
