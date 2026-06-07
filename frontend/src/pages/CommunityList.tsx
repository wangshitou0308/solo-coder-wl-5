import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommunityStore } from '@/store/communityStore'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { Community } from '@/types'

export function CommunityList() {
  const { communities, isLoading, fetchCommunities, createCommunity, joinCommunity, leaveCommunity } = useCommunityStore()
  const { user } = useAuthStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [myCommunities, setMyCommunities] = useState<number[]>([])
  const [createForm, setCreateForm] = useState<Partial<Community>>({
    name: '',
    description: '',
    location: '',
    lat: 0,
    lng: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCommunities()
    loadMyCommunities()
  }, [fetchCommunities])

  const loadMyCommunities = async () => {
    try {
      const response = await api.getMyCommunities()
      if (response.success && response.data) {
        setMyCommunities(response.data.map((c: Community) => c.id))
      }
    } catch (err) {
      console.error('获取我的社区失败', err)
    }
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      await createCommunity(createForm)
      alert('社区创建成功！')
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        description: '',
        location: '',
        lat: 0,
        lng: 0,
      })
      fetchCommunities()
    } catch (err) {
      console.error('创建社区失败', err)
      alert('创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await joinCommunity(id)
      alert('加入社区成功！')
      setMyCommunities(prev => [...prev, id])
    } catch (err) {
      console.error('加入社区失败', err)
      alert('加入失败，请重试')
    }
  }

  const handleLeave = async (id: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('确定要退出该社区吗？')) return
    try {
      await leaveCommunity(id)
      alert('已退出社区')
      setMyCommunities(prev => prev.filter(cid => cid !== id))
    } catch (err) {
      console.error('退出社区失败', err)
      alert('退出失败，请重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">社区列表</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          创建社区
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Link
              key={community.id}
              to={`/communities/${community.id}`}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{community.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {community.memberCount} 成员
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                  {community.description || '暂无描述'}
                </p>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {community.location}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {community.supplyCount} 件物资
                  </span>
                  <span className="text-blue-600 text-sm font-medium">查看详情 →</span>
                </div>
                <div className="mt-4">
                  {myCommunities.includes(community.id) ? (
                    <button
                      onClick={(e) => handleLeave(community.id, e)}
                      className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      退出社区
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoin(community.id, e)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      加入社区
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && communities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无社区</h3>
          <p className="mt-1 text-sm text-gray-500">创建第一个社区开始使用吧</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">创建社区</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">社区名称</label>
                <input
                  type="text"
                  value={createForm.name || ''}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入社区名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入社区描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={createForm.location || ''}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入社区位置"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纬度</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={createForm.lat || ''}
                    onChange={(e) => setCreateForm({ ...createForm, lat: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">经度</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={createForm.lng || ''}
                    onChange={(e) => setCreateForm({ ...createForm, lng: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
