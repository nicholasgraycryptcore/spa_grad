import React, { useState, useEffect } from 'react'
import { Input, InputNumber, Checkbox, Button, Alert } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendanceForm() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [guestNumber, setGuestNumber] = useState(0)
  const [studentAttended, setStudentAttended] = useState(false)
  const [photo, setPhoto] = useState('')
  const [message, setMessage] = useState(null)

  const { getAllStudents, getStudentById, updateStudentField } = useSheets()

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load students' }))
  }, [getAllStudents])

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
        setSelectedStudent(data)
        setGuestNumber(data.GuestAttended || 0)
        setStudentAttended(data.StudentAttended === 'Yes')
        setPhoto(data.StudentPicture || '')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load student' }))
  }


  const handleSubmit = e => {
    e.preventDefault()
    if (!selectedId) return
    const updates = []
    // if (guestNumber !== selectedStudent.GuestNumber)
    //   updates.push(updateStudentField(selectedId, 'GuestNumber', guestNumber))
    if (guestNumber !== selectedStudent.GuestAttended)
      updates.push(updateStudentField(selectedId, 'GuestAttended', guestNumber))
    const attendedVal = studentAttended ? 'Yes' : 'No'
    if (attendedVal !== selectedStudent.StudentAttended)
      updates.push(updateStudentField(selectedId, 'StudentAttended', attendedVal))
    if (photo && photo !== selectedStudent.StudentPicture)
      updates.push(updateStudentField(selectedId, 'StudentPicture', photo))
    Promise.all(updates)
      .then(() => loadStudent(selectedId))
      .then(() => setMessage({ type: 'success', text: 'Saved successfully' }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to save changes' }))
  }

  const handlePhotoChange = e => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 400
          let { width, height } = img
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          setPhoto(dataUrl)
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSelectItem = id => {
    setSelectedId(id)
    loadStudent(id)
  }

  return (
    <div className="container">
      <div className="form-controls">
        <Input
          placeholder="Search by ID or name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
      </div>
      <ul className="search-results">
        {filtered.map(s => (
          <li key={s.ID} onClick={() => handleSelectItem(s.ID)}>
            {s.ID} - {s.Firstname} {s.Lastname}
          </li>
        ))}
      </ul>

      {selectedStudent && (
        <form onSubmit={handleSubmit} className="form">
          <label>
            Guest Number
            <InputNumber
              min={0}
              value={guestNumber}
              onChange={value => setGuestNumber(value)}
              style={{ width: '100%' }}
            />
          </label>
          <label className="checkbox">
            <Checkbox
              checked={studentAttended}
              onChange={e => setStudentAttended(e.target.checked)}
            >
              Student Attended
            </Checkbox>
          </label>
          {photo && <img src={photo} alt="preview" className="photo" />}
          <label>
            Upload Photo
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          <Button type="primary" htmlType="submit">Save</Button>
        </form>
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
