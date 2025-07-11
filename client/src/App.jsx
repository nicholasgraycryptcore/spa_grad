import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Menu from './Menu'
import AttendanceForm from './AttendanceForm'
import GownManagement from './GownManagement'
import AwardScreen from './AwardScreen'
import AwardDisplay from './AwardDisplay'
import ReportScreen from './ReportScreen'
import AttendeeTable from './AttendeeTable'
import { SheetsProvider } from './SheetsContext'

export default function App() {
  return (
    <SheetsProvider>
      <Router>
        <Menu />
        <Routes>
          <Route path="/" element={<AttendanceForm />} />
          <Route path="/gown" element={<GownManagement />} />
          <Route path="/award" element={<AwardScreen />} />
          <Route path="/award-display" element={<AwardDisplay />} />
          <Route path="/reports" element={<ReportScreen />} />
          <Route path="/attendees" element={<AttendeeTable />} />
        </Routes>
      </Router>
    </SheetsProvider>
  )
}
