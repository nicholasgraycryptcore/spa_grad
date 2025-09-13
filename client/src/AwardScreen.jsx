import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Button } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AwardScreen() {
  const [students, setStudents] = useState([])
  const { getAllStudents, updateStudentField, getStudentPicture } = useSheets()
  const [pictures, setPictures] = useState({})

  const loadStudents = useCallback(() => {
    getAllStudents()
      .then(data => {
        const filtered = data
          .filter(s => s.StudentAttended === 'Yes' && s.AwardStatus !== 'Collected')
          .sort((a, b) => a.ID - b.ID)
          .slice(0, 3)
        setStudents(filtered)
      })
      .catch(err => console.error(err))
  }, [getAllStudents])

  useEffect(() => {
    loadStudents()
    // Subscribe to server-sent events for instant updates
    const source = new EventSource('/events')
    source.onmessage = () => loadStudents()
    window.addEventListener('focus', loadStudents)
    return () => {
      source.close()
      window.removeEventListener('focus', loadStudents)
    }
  }, [loadStudents])

  // Lazy-load pictures for the visible students
  const visibleIds = useMemo(() => students.map(s => s.ID), [students])
  useEffect(() => {
    let cancelled = false
    const fetchPics = async () => {
      await Promise.all(
        visibleIds
          .filter(id => !pictures[id])
          .map(async (id) => {
            try {
              const pic = await getStudentPicture(id)
              if (!cancelled && pic) {
                setPictures(prev => ({ ...prev, [id]: pic }))
              }
            } catch (_) {}
          })
      )
    }
    if (visibleIds.length) fetchPics()
    return () => { cancelled = true }
  }, [visibleIds, pictures, getStudentPicture])

  const markCollected = id => {
    updateStudentField(id, 'AwardStatus', 'Collected')
      .then(() => loadStudents())
      .catch(err => console.error(err))
  }

  return (
    <div className="container">
      <h1>Award Collection</h1>
      <div className="grid">
        {students.map(s => (
          <Card
            key={s.ID}
            className="display-card"
            cover={
              pictures[s.ID] ? (
                <img src={pictures[s.ID]} alt={s.Firstname} className="photo" 
                 style={{ margin: '0 auto' }}
                />
              ) : null
            }
          >
            <Card.Meta title={`${s.Firstname} ${s.Lastname}`} description={`ID #${s.ID}`} />
            <p>{(s.Course || '').split(/[\/,]/)[0].trim()}</p>
            <Button onClick={() => markCollected(s.ID)} style={{ marginTop: 8 }}>
              Mark Certificate Collected
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
