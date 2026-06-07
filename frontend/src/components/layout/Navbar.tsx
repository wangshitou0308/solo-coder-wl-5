import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAlertStore } from '@/store/alertStore'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { unreadCount } = useAlertStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">防</span>
              </div>
              <span className="text-xl font-bold text-gray-900">社区防灾共享平台</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                  首页
                </Link>
                <Link to="/communities" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                  社区
                </Link>
                <Link to="/supplies" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                  物资
                </Link>
                <Link to="/supply-map" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                  地图
                </Link>
                <Link to="/borrow-requests" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-blue-600">
                  借用
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/alerts" className="relative p-2 text-gray-600 hover:text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {user?.username?.charAt(0) || '用'}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user?.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50"
                  >
                    退出
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
