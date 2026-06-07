import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export function Profile() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">个人信息</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              编辑
            </button>
          )}
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-600">
                  {user?.username?.charAt(0) || '用'}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
              <p className="text-sm text-gray-500 mt-1">
                信用积分: {user?.credit_score || 0}
              </p>
              {user?.is_admin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  系统管理员
                </span>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    用户名
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    手机号
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <dl className="mt-8 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">用户名</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">手机号</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.phone || '未填写'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">信用积分</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.credit_score || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">我的统计</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-500 mt-1">发布物资</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">8</p>
              <p className="text-sm text-gray-500 mt-1">借用物资</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">5</p>
              <p className="text-sm text-gray-500 mt-1">参与社区</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
