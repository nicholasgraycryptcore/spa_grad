import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AwardDisplaySingle() {
  const [students, setStudents] = useState([])
  const { getAllStudents, getStudentPicture } = useSheets()
  const [pictures, setPictures] = useState({})

  const loadStudents = useCallback(() => {
    getAllStudents()
      .then(data => {
        const filtered = data
          .filter(s => s.StudentAttended === 'Yes' && s.AwardStatus !== 'Collected')
          .sort((a, b) => a.ID - b.ID)
          .slice(0, 1)
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

//add scoped CSS class for display, add an image to the body tag

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

  // Lazy-load picture for the single visible student
  const visibleIds = useMemo(() => students.map(s => s.ID), [students])
  useEffect(() => {
    let cancelled = false
    const fetchPic = async () => {
      const id = visibleIds[0]
      if (!id || pictures[id]) return
      try {
        const pic = await getStudentPicture(id)
        if (!cancelled && pic) setPictures(prev => ({ ...prev, [id]: pic }))
      } catch {}
    }
    fetchPic()
    return () => { cancelled = true }
  }, [visibleIds, pictures, getStudentPicture])
  
  return (
    <div className="display-container">
      <h1>Award Display (Single)</h1>
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
