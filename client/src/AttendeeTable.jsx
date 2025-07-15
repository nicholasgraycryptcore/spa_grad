import React, { useEffect, useState } from 'react'
import { Table, Input } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

export default function AttendeeTable() {
  const { getAllStudents } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllStudents()
      .then(data => {
        const attended = data.filter(s => s.StudentAttended === 'Yes')
        setStudents(attended)
      })
      .catch(err => console.error(err))
  }, [getAllStudents])

  const filtered = students.filter(s => {
    const term = search.toLowerCase()
    return (
      s.ID.toString().includes(term) ||
      `${s.Firstname} ${s.Lastname}`.toLowerCase().includes(term)
    )
  })

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
