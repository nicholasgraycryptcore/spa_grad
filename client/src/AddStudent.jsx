import React, { useState } from 'react'
import { Input, InputNumber, Button, Alert, Select } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AddStudent() {
  const { createStudent } = useSheets()
  const [id, setId] = useState()
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [course, setCourse] = useState('')
  const [courseType, setCourseType] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      const payload = {
        ID: id,
        Firstname: firstname.trim(),
        Lastname: lastname.trim(),
        Course: course.trim(),
        CourseType: courseType.trim(),
        Email: email.trim(),
        Phone: phone.trim()
      }
      // Remove undefined/empty ID to auto-generate
      if (payload.ID === undefined || payload.ID === null || payload.ID === '') delete payload.ID
      const created = await createStudent(payload)
      setMessage({ type: 'success', text: `Added #${created.ID} ${created.Firstname} ${created.Lastname}` })
      // Reset minimal fields except course defaults
      setId(undefined)
      setFirstname('')
      setLastname('')
      setEmail('')
      setPhone('')
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to add student' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Add Student</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          ID (optional)
          <InputNumber readOnly min={1} value={id} onChange={setId} style={{ width: '100%' }} />
        </label>
        <label>
          Firstname
          <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} required />
        </label>
        <label>
          Lastname
          <Input value={lastname} onChange={(e) => setLastname(e.target.value)} required />
        </label>
        <label>
          Course
          <Input value={course} onChange={(e) => setCourse(e.target.value)} />
        </label>
        <label>
          Course Type
          <Input value={courseType} onChange={(e) => setCourseType(e.target.value)} />
        </label>
        <label>
          Email
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Phone
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <div className="form-controls">
          <Button type="primary" htmlType="submit" loading={loading}>Add Student</Button>
        </div>
      </form>
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

