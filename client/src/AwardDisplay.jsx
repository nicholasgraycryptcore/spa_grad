import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AwardDisplay() {
  const [students, setStudents] = useState([])
  const { getAllStudents, getStudentPicture } = useSheets()
  const [pictures, setPictures] = useState({}) // { [ID]: dataUrl }

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
    const source = new EventSource('/events')
    source.onmessage = () => loadStudents()
    window.addEventListener('focus', loadStudents)
    return () => {
      source.close()
      window.removeEventListener('focus', loadStudents)
    }
  }, [loadStudents])

  // Fetch pictures for currently displayed students (lazy, with caching)
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

  useEffect(() => {
    document.body.classList.add('award-display-body');
  
    // Add background image to body
    document.body.style.backgroundImage = "url('https://study.spa.edu.tt/images/grad_back.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  
    return () => {
      document.body.classList.remove('award-display-body');
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    };
  }, []);

  return (
    <div className="display-container">
      <h1>Award Display</h1>
      <div className="display-grid">
        {students.map(s => (
          <Card
            key={s.ID}
            className="display-card"
            cover={
              (pictures[s.ID] || s.StudentPicture) ? (
                <img src={pictures[s.ID] || s.StudentPicture} alt={s.Firstname} className="display-photo" />
              ) : null
            }
          >
            <Card.Meta title={`${s.Firstname} ${s.Lastname}`} description={`ID #${s.ID}`} />
            <p>{(s.Course || '').split(/[\/,]/)[0].trim()}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
