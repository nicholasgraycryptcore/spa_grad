import React, { useEffect, useState } from 'react'
import { Input, Select, Button, Alert } from 'antd'
import { useSheets } from './SheetsContext'
import './index.css'

const PACKAGES = [
  {
    name: 'Package 1 - 2-4x6 Stage Photos (Medal & Trophy)',
    description: '2-4x6 Stage Photos (Medal & Trophy)',
    prints: 40,
    digital: 20
  },
  {
    name: 'Package 2 - 2-4x6 Stage photos (Medal & Trophy)',
    description: '2-4x6 Stage photos (Medal & Trophy)',
    prints: 80,
    digital: 40
  },
  {
    name: 'Package 2 - 1 -8x10 Family/solo shot',
    description: '1 -8x10 Family/solo shot',
    prints: 80,
    digital: 40
  },
  {
    name: 'Package 3 - 2-8x10 Stage photos (Medal & Trophy)',
    description: '2-8x10 Stage photos (Medal & Trophy)',
    prints: 80,
    digital: 40
  },
  {
    name: 'Package 4 - 2-4x6 Stage Photos (Medal & Trophy)',
    description: '2-4x6 Stage Photos (Medal & Trophy)',
    prints: 100,
    digital: 50
  },
  {
    name: 'Package 4 - 1 4x6 (Family/Solo shot)',
    description: '1 4x6 (Family/Solo shot)',
    prints: 100,
    digital: 50
  },
  {
    name: 'Package 4 - 1 8x10 (Family/Solo shot)',
    description: '1 8x10 (Family/Solo shot)',
    prints: 100,
    digital: 50
  }
]

export default function PhotoPackageForm() {
  const { getAllStudents, getStudentById, updateStudentField } = useSheets()
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [student, setStudent] = useState(null)
  const [pkg, setPkg] = useState(PACKAGES[0].name)
  const [pkgType, setPkgType] = useState('Print')
  const [paymentStatus, setPaymentStatus] = useState('Not Paid')
  const [pkgStatus, setPkgStatus] = useState('Not Collected')
  const [photoNumber, setPhotoNumber] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setMessage({ type: 'error', text: 'Failed to load students' }))
  }, [getAllStudents])

  useEffect(() => {
    if (search) setOpen(true)
    else setOpen(false)
  }, [search])

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
        setStudent(data)
        setPkg(data['Photo Package'] || PACKAGES[0].name)
        setPkgType(data['Photo Package Type'] || 'Print')
        setPaymentStatus(data['Photo Payment Status'] || 'Not Paid')
        setPkgStatus(data['Photo Package Status'] || 'Not Collected')
        setPhotoNumber(data['Photo Number'] || '')
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load student' }))
  }

  const handleSelect = value => {
    setSelectedId(value)
    if (value) loadStudent(value)
    else setStudent(null)
    setOpen(false)
  }

  const selectedPackage = PACKAGES.find(p => p.name === pkg)
  const price = pkgType === 'Digital' ? selectedPackage.digital : selectedPackage.prints

  const updateFields = updates => {
    setMessage(null)
    const promises = Object.entries(updates).map(([field, value]) =>
      updateStudentField(selectedId, field, value)
    )
    Promise.all(promises)
      .then(() => loadStudent(selectedId))
      .then(() => setMessage({ type: 'success', text: 'Saved successfully' }))
      .catch(() => setMessage({ type: 'error', text: 'Failed to save changes' }))
  }

  const handleSave = e => {
    e.preventDefault()
    updateFields({
      'Photo Package': pkg,
      'Photo Package Type': pkgType,
      'Photo Payment Status': paymentStatus,
      'Photo Package Status': pkgStatus,
      'Photo Number': photoNumber
    })
  }

  return (
    <div className="container">
      <div className="form-controls">
        <Input
          placeholder="Search by ID or name"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          style={{ width: 200 }}
        />
        <Select
          value={selectedId || undefined}
          onChange={handleSelect}
          placeholder="Select a student"
          style={{ minWidth: 220 }}
          allowClear
          options={filtered.map(s => ({ value: s.ID, label: `${s.ID} - ${s.Firstname} ${s.Lastname}` }))}
          open={open}
          onDropdownVisibleChange={vis => setOpen(vis)}
        />
      </div>

      {student && (
        <form onSubmit={handleSave} className="form">
          <label>
            Photo Package
            <Select value={pkg} onChange={setPkg} style={{ width: 200 }}>
              {PACKAGES.map(p => (
                <Select.Option key={p.name} value={p.name}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </label>
          <label>
            Package Type
            <Select value={pkgType} onChange={setPkgType} style={{ width: 120 }}>
              <Select.Option value="Print">Print</Select.Option>
              <Select.Option value="Digital">Digital</Select.Option>
            </Select>
          </label>
          <p>Price: ${price.toFixed(2)}</p>
          <label>
            Payment Status
            <Select value={paymentStatus} onChange={setPaymentStatus} style={{ width: 150 }}>
              <Select.Option value="Not Paid">Not Paid</Select.Option>
              <Select.Option value="Paid">Paid</Select.Option>
            </Select>
          </label>
          <label>
            Package Status
            <Select value={pkgStatus} onChange={setPkgStatus} style={{ width: 150 }}>
              <Select.Option value="Not Collected">Not Collected</Select.Option>
              <Select.Option value="Collected">Collected</Select.Option>
            </Select>
          </label>
          <label>
            Photo Number
            <Input
              placeholder="Enter photo number"
              value={photoNumber}
              onChange={e => setPhotoNumber(e.target.value)}
              style={{ width: 200 }}
            />
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
