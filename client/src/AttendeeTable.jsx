import React, { useEffect, useMemo, useState } from 'react'
import { Table, Input, Button } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendeeTable() {
  const { getAllStudents } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

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

  const csvRows = useMemo(() => {
    const headers = ['ID', 'Firstname', 'Lastname', 'Gown Status']
    const rows = filtered.map(s => [
      s.ID,
      s.Firstname || '',
      s.Lastname || '',
      s.GownStatus || 'Not Collected'
    ])
    return [headers, ...rows]
  }, [filtered])

  const downloadCsv = () => {
    const escape = (v) => {
      const s = String(v ?? '')
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const text = csvRows.map(r => r.map(escape).join(',')).join('\r\n') + '\r\n'
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]
    a.href = url
    a.download = `attendees-${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        <Button onClick={downloadCsv} style={{ marginLeft: 8 }}>
          Export CSV
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
