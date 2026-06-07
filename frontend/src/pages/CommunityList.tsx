import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCommunityStore } from '@/store/communityStore'

export function CommunityList() {
  const { communities, isLoading, fetchCommunities } = useCommunityStore()

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">社区列表</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
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
    </div>
  )
}
