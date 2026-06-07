import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCommunityStore } from '@/store/communityStore'

export function CommunityDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentCommunity, isLoading, fetchCommunity, clearCurrentCommunity } = useCommunityStore()

  useEffect(() => {
    if (id) {
      fetchCommunity(Number(id))
    }
    return () => clearCurrentCommunity()
  }, [id, fetchCommunity, clearCurrentCommunity])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!currentCommunity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">社区不存在</p>
        <Link to="/communities" className="mt-4 inline-block text-blue-600 hover:underline">
          返回社区列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/communities" className="text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{currentCommunity.name}</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">社区信息</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">社区名称</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentCommunity.name}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">社区描述</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {currentCommunity.description || '暂无描述'}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">位置</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentCommunity.location}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">成员数量</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentCommunity.memberCount} 人</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">物资数量</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{currentCommunity.supplyCount} 件</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to={`/supplies?communityId=${currentCommunity.id}`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">查看社区物资</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">浏览社区内的所有共享物资</p>
        </Link>

        <Link
          to={`/borrow-requests?communityId=${currentCommunity.id}`}
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">借用申请</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-2 text-sm text-gray-500">查看和管理物资借用申请</p>
        </Link>
      </div>
    </div>
  )
}
