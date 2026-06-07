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
import { useEffect, useState } from 'react'
import api from '@/services/api'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { getCurrentUser } = useAuthStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        api.getToken()
        try {
          await getCurrentUser()
        } catch (err) {
          console.error('初始化用户信息失败', err)
        }
      }
      setIsInitializing(false)
    }
    initAuth()
  }, [getCurrentUser])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

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
