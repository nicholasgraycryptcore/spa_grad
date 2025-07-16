import React, { useEffect, useState } from 'react'
import { Table, Input } from 'antd'
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

  const columns = [
    {
      title: 'Name',
      render: (_, s) => `${s.Firstname} ${s.Lastname}`
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
