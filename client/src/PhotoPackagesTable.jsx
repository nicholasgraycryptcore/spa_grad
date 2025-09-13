import React, { useEffect, useMemo, useState } from 'react'
import { Table, Input, Button } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function PhotoPackagesTable() {
  const { getAllStudents } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = () => {
      getAllStudents()
        .then(data => {
          const withPackages = data.filter(s => s['Photo Package'])
          setStudents(withPackages)
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
    const headers = ['Name', 'Email', 'Photo Package', 'Package Type', 'Payment Status', 'Photo Number']
    const rows = filtered.map(s => [
      `${s.Firstname} ${s.Lastname}`,
      s.Email || '',
      s['Photo Package'] || '',
      s['Photo Package Type'] || '',
      s['Photo Payment Status'] || '',
      s['Photo Number'] || ''
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
    a.download = `photo-packages-${ts}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const columns = [
    {
      title: 'Name',
      render: (_, s) => `${s.Firstname} ${s.Lastname}`
    },
    {
      title: 'Email',
      dataIndex: 'Email'
    },
    {
      title: 'Photo Package',
      dataIndex: 'Photo Package'
    },
    {
      title: 'Package Type',
      dataIndex: 'Photo Package Type'
    },
    {
      title: 'Payment Status',
      dataIndex: 'Photo Payment Status'
    },
    {
      title: 'Photo Number',
      dataIndex: 'Photo Number'
    }
  ]

  return (
    <div className="container">
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
        columns={columns}
      />
    </div>
  )
}
