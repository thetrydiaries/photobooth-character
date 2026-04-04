import { Routes, Route, Navigate } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import MakerPage from './pages/MakerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/maker"  element={<MakerPage />} />
      <Route path="*"       element={<Navigate to="/upload" replace />} />
    </Routes>
  )
}
