import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { CommunityList } from '@/pages/CommunityList'
import { CommunityDetail } from '@/pages/CommunityDetail'
import { SupplyList } from '@/pages/SupplyList'
import { SupplyDetail } from '@/pages/SupplyDetail'
import { SupplyMap } from '@/pages/SupplyMap'
import { BorrowRequests } from '@/pages/BorrowRequests'
import { Alerts } from '@/pages/Alerts'
import { Profile } from '@/pages/Profile'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { isAuthenticated, getCurrentUser, token } = useAuthStore()

  useEffect(() => {
    if (token && isAuthenticated) {
      getCurrentUser()
    }
  }, [token, isAuthenticated, getCurrentUser])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout showSidebar={false} />}>
          <Route index element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="/communities" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<CommunityList />} />
          <Route path=":id" element={<CommunityDetail />} />
        </Route>

        <Route path="/supplies" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<SupplyList />} />
          <Route path=":id" element={<SupplyDetail />} />
        </Route>

        <Route path="/supply-map" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<SupplyMap />} />
        </Route>

        <Route path="/borrow-requests" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<BorrowRequests />} />
        </Route>

        <Route path="/alerts" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Alerts />} />
        </Route>

        <Route path="/profile" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
