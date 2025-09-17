import React, { useEffect, useState } from 'react'
import { Table, Input, Button } from 'antd'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendeeTable() {
  const { getAllStudents, getStudentPicture } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [pictures, setPictures] = useState({})
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchData = () => {
      getAllStudents()
        .then(data => {
          const attended = data.filter(s => s.StudentAttended === 'Yes')
          setStudents(attended)
        })
        .catch(err => console.error(err))
    }

    fetchData()

    const source = new EventSource('/events')
    source.onmessage = () => fetchData()

    return () => {
      source.close()
    }
  }, [getAllStudents])

  const filtered = students.filter(s => {
    const term = search.toLowerCase()
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    )
  })

  const downloadPdf = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const pictureMap = { ...pictures }
      const ids = filtered.map(s => s.ID)
      const missingIds = ids.filter(id => pictureMap[id] === undefined)
      if (missingIds.length) {
        const fetchedEntries = await Promise.all(
          missingIds.map(async id => {
            try {
              const pic = await getStudentPicture(id)
              return [id, pic || '']
            } catch (err) {
              console.error('Failed to fetch picture for student', id, err)
              return [id, '']
            }
          })
        )
        if (fetchedEntries.length) {
          fetchedEntries.forEach(([id, pic]) => {
            pictureMap[id] = pic
          })
          setPictures(prev => ({ ...prev, ...Object.fromEntries(fetchedEntries) }))
        }
      }

      const parsePicture = (raw) => {
        if (!raw) return null
        const match = /^data:(.*?);base64,(.+)$/i.exec(raw)
        if (match) {
          const mime = match[1] || 'image/jpeg'
          const format = mime.includes('png') ? 'PNG' : 'JPEG'
          return {
            dataUrl: `data:${mime};base64,${match[2]}`,
            format,
          }
        }
        return {
          dataUrl: `data:image/jpeg;base64,${raw}`,
          format: 'JPEG'
        }
      }

      const loadImageDimensions = (dataUrl) => new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve({ width: img.width, height: img.height })
        img.onerror = () => resolve(null)
        img.src = dataUrl
      })

      const tableRows = await Promise.all(
        filtered.map(async s => {
          const photoMeta = parsePicture(pictureMap[s.ID])
          let dimensions = null
          if (photoMeta) {
            dimensions = await loadImageDimensions(photoMeta.dataUrl)
          }
          const fullName = [s.Firstname, s.Lastname].filter(Boolean).join(' ').trim()
          return {
            id: s.ID,
            name: fullName || 'N/A',
            gown: s.GownStatus || 'Not Collected',
            photo: photoMeta ? '' : 'No Photo',
            photoMeta: photoMeta && dimensions
              ? { ...photoMeta, ...dimensions }
              : photoMeta
          }
        })
      )

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
      const marginLeft = 40
      const startY = 60

      doc.setFontSize(18)
      doc.text('Attendees Export', marginLeft, 36)
      doc.setFontSize(10)
      doc.text(`Generated ${new Date().toLocaleString()}`, marginLeft, 52)

      autoTable(doc, {
        startY,
        margin: { left: marginLeft, right: marginLeft },
        styles: { minCellHeight: 80, valign: 'middle' },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          id: { cellWidth: 60 },
          name: { cellWidth: 200 },
          gown: { cellWidth: 140 },
          photo: { cellWidth: 180, halign: 'center' }
        },
        columns: [
          { header: 'ID', dataKey: 'id' },
          { header: 'Name', dataKey: 'name' },
          { header: 'Gown Status', dataKey: 'gown' },
          { header: 'Photo', dataKey: 'photo' }
        ],
        body: tableRows,
        didDrawCell: data => {
          if (data.section === 'body' && data.column.dataKey === 'photo') {
            const { photoMeta } = data.row.raw
            if (photoMeta) {
              const padding = 6
              const availableWidth = data.cell.width - padding * 2
              const availableHeight = data.cell.height - padding * 2
              let drawWidth = availableWidth
              let drawHeight = availableHeight
              if (photoMeta.width && photoMeta.height) {
                const ratio = Math.min(
                  availableWidth / photoMeta.width,
                  availableHeight / photoMeta.height,
                  1
                )
                drawWidth = photoMeta.width * ratio
                drawHeight = photoMeta.height * ratio
              } else {
                const fallback = Math.min(availableWidth, availableHeight)
                drawWidth = fallback
                drawHeight = fallback
              }
              const x = data.cell.x + (data.cell.width - drawWidth) / 2
              const y = data.cell.y + (data.cell.height - drawHeight) / 2
              doc.addImage(photoMeta.dataUrl, photoMeta.format, x, y, drawWidth, drawHeight, undefined, 'FAST')
            }
          }
        }
      })

      const ts = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]
      doc.save(`attendees-${ts}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="container">
      {/* <h1>Attendees</h1> */}
      <div className="form-controls">
        <Input
          placeholder="Search by ID or name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
        <Button
          onClick={downloadPdf}
          style={{ marginLeft: 8 }}
          loading={exporting}
        >
          Export PDF
        </Button>
      </div>
      <Table
        dataSource={filtered}
        rowKey="ID"
        pagination={false}
        className="table"
        columns={[
          { title: 'ID', dataIndex: 'ID' },
          {
            title: 'Name',
            render: (_, s) => `${s.Firstname} ${s.Lastname}`
          },
          {
            title: 'Gown Status',
            render: (_, s) => s.GownStatus || 'Not Collected'
          }
        ]}
      />
    </div>
  )
}
