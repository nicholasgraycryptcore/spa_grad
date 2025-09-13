import React, { useEffect, useMemo, useState } from 'react'
import { useSheets } from './SheetsContext'

export default function TableAssignments() {
  const api = useSheets()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api
      .getAllStudents()
      .then((data) => {
        if (mounted) setStudents(data || [])
      })
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
    return () => {
      mounted = false
    }
  }, [api])

  const tables = useMemo(() => {
    const byTable = new Map()

    const get = (obj, keys) => keys.map((k) => obj[k]).find((v) => v !== undefined && v !== null && v !== '')

    students.forEach((s) => {
      // Only include students who are marked as attended
      if (s.StudentAttended !== 'Yes') return
      const tableRaw = get(s, ['Table Number', 'Table Number ', 'TableNumber'])
      if (tableRaw === undefined || tableRaw === null || tableRaw === '') return
      const tableKey = String(tableRaw).trim()

      // Use the actual number of guests who attended, not invited
      const guestCountVal = get(s, ['GuestAttended'])
      const guestCount = Number.isNaN(Number(guestCountVal)) ? 0 : Number(guestCountVal)

      const first = s.Firstname || ''
      const last = s.Lastname || ''
      const full = `${first} ${last}`.trim()
      if (!full) return

      if (!byTable.has(tableKey)) byTable.set(tableKey, [])
      const list = byTable.get(tableKey)
      list.push(full)
      for (let i = 1; i <= guestCount; i++) {
        list.push(`${full} - Guest ${i}`)
      }
    })

    // Build sorted array
    const entries = Array.from(byTable.entries()).sort((a, b) => {
      const an = Number(a[0])
      const bn = Number(b[0])
      const aIsNum = !Number.isNaN(an)
      const bIsNum = !Number.isNaN(bn)
      if (aIsNum && bIsNum) return an - bn
      if (aIsNum) return -1
      if (bIsNum) return 1
      return String(a[0]).localeCompare(String(b[0]))
    })

    return entries.map(([table, people]) => ({ table, people }))
  }, [students])

  if (loading) return <div>Loading…</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>Table Assignments</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16
        }}
      >
        {tables.map((t) => (
          <div key={t.table} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Table {t.table}</h3>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {t.people.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
