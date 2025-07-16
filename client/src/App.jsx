import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Menu from './Menu'
import AttendanceForm from './AttendanceForm'
import GownManagement from './GownManagement'
import AwardScreen from './AwardScreen'
import AwardDisplay from './AwardDisplay'
import AwardDisplaySingle from './AwardDisplaySingle'
import ReportScreen from './ReportScreen'
import AttendeeTable from './AttendeeTable'
import PhotoPackageForm from './PhotoPackageForm'
import PhotoPackagesTable from './PhotoPackagesTable'
import { SheetsProvider } from './SheetsContext'

export default function App() {
  return (
    <SheetsProvider>
      <Router>
        <img
          src="https://study.spa.edu.tt/images/spa-logo-rec.png"
          alt="SPA Logo"
          className="logo"
        />
        <Menu />
        <Routes>
          <Route path="/" element={<AttendanceForm />} />
          <Route path="/gown" element={<GownManagement />} />
          <Route path="/award" element={<AwardScreen />} />
          <Route path="/award-display" element={<AwardDisplay />} />
          <Route path="/award-display-single" element={<AwardDisplaySingle />} />
          <Route path="/photos" element={<PhotoPackageForm />} />
          <Route path="/photo-packages" element={<PhotoPackagesTable />} />
          <Route path="/reports" element={<ReportScreen />} />
          <Route path="/attendees" element={<AttendeeTable />} />
        </Routes>
      </Router>
    </SheetsProvider>
  )
}
