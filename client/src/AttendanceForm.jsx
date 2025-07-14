import React, { useState, useEffect, useRef } from 'react'
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
  const [cameraActive, setCameraActive] = useState(false)
  const [useFrontCamera, setUseFrontCamera] = useState(true)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  const { getAllStudents, getStudentById, updateStudentField } = useSheets()

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load students' }))
  }, [getAllStudents])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

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
        const guestVal =
          data.GuestAttended !== undefined &&
          data.GuestAttended !== null &&
          data.GuestAttended !== ''
            ? data.GuestAttended
            : data.GuestNumber || 0
        setGuestNumber(guestVal)
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

  const openCamera = async (front = useFrontCamera) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      const constraints = { video: { facingMode: front ? 'user' : 'environment' } }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setUseFrontCamera(front)
      setCameraActive(true)
    } catch (err) {
      setMessage({ type: 'error', text: 'Unable to access camera' })
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
    if (!cameraActive && videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [cameraActive])

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const switchCamera = () => {
    const newFacing = !useFrontCamera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    openCamera(newFacing)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    closeCamera()
    const img = new Image()
    img.onload = () => {
      const resizeCanvas = document.createElement('canvas')
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
      resizeCanvas.width = width
      resizeCanvas.height = height
      const rctx = resizeCanvas.getContext('2d')
      rctx.drawImage(img, 0, 0, width, height)
      setPhoto(resizeCanvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = dataUrl
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
          <li
            key={s.ID}
            onClick={() => handleSelectItem(s.ID)}
            className={s.ID === selectedId ? 'selected' : ''}
          >
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
          {cameraActive && (
            <div className="camera">
              <video ref={videoRef} autoPlay playsInline />
              <div>
                {isMobile && (
                  <Button onClick={switchCamera} style={{ marginRight: 8 }}>
                    Switch Camera
                  </Button>
                )}
                <Button onClick={capturePhoto} style={{ marginRight: 8 }}>
                  Capture
                </Button>
                <Button onClick={closeCamera}>Cancel</Button>
              </div>
            </div>
          )}
          {photo && <img src={photo} alt="preview" className="photo" />}
          <div className="form-controls">
            <Button onClick={openCamera}>Take Photo</Button>
          </div>
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
