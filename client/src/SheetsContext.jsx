import React, { createContext, useContext } from 'react'

const SheetsContext = createContext({})

export function SheetsProvider({ children }) {
  const api = {
    async getAllStudents() {
      const res = await fetch('/api/students')
      if (!res.ok) throw new Error('Failed to fetch students')
      return res.json()
    },
    async getStudentById(id) {
      const res = await fetch(`/api/students/${id}`)
      if (!res.ok) throw new Error('Failed to fetch student')
      return res.json()
    },
    async getStudentPicture(id) {
      const res = await fetch(`/api/students/${id}/picture`)
      if (!res.ok) throw new Error('Failed to fetch picture')
      const data = await res.json()
      return data.StudentPicture || ''
    },
    async updateStudentField(id, field, value) {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      if (!res.ok) throw new Error('Failed to update student')
      return res.json()
    }
  }

  return (
    <SheetsContext.Provider value={api}>{children}</SheetsContext.Provider>
  )
}

export function useSheets() {
  return useContext(SheetsContext)
}
