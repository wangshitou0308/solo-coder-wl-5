import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSupplyStore } from '@/store/supplyStore'
import type { SupplyCategory, SupplyStatus } from '@/types'

const categoryLabels: Record<SupplyCategory, string> = {
  food: '食品',
  water: '饮用水',
  medicine: '药品',
  clothing: '衣物',
  shelter: '避难物资',
  tools: '工具',
  communication: '通讯设备',
  hygiene: '卫生用品',
  first_aid: '急救用品',
  other: '其他',
}

const statusLabels: Record<SupplyStatus, { label: string; className: string }> = {
  available: { label: '可用', className: 'bg-green-100 text-green-800' },
  reserved: { label: '已预留', className: 'bg-blue-100 text-blue-800' },
  borrowed: { label: '已借出', className: 'bg-yellow-100 text-yellow-800' },
  returned: { label: '已归还', className: 'bg-purple-100 text-purple-800' },
  consumed: { label: '已消耗', className: 'bg-gray-100 text-gray-800' },
}

export function SupplyDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentSupply, isLoading, fetchSupply, clearCurrentSupply } = useSupplyStore()

  useEffect(() => {
    if (id) {
      fetchSupply(Number(id))
    }
    return () => clearCurrentSupply()
  }, [id, fetchSupply, clearCurrentSupply])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!currentSupply) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">物资不存在</p>
        <Link to="/supplies" className="mt-4 inline-block text-blue-600 hover:underline">
          返回物资列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/supplies" className="text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{currentSupply.name}</h1>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[currentSupply.status as SupplyStatus].className}`}>
          {statusLabels[currentSupply.status as SupplyStatus].label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">物资详情</h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">物资名称</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentSupply.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">分类</dt>
                  <dd className="mt-1 text-sm text-gray-900">{categoryLabels[currentSupply.category as SupplyCategory]}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">数量</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentSupply.quantity} {currentSupply.unit}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">描述</dt>
                  <dd className="mt-1 text-sm text-gray-900">{currentSupply.description || '暂无描述'}</dd>
                </div>
                {currentSupply.expire_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">过期时间</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentSupply.expire_date}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">操作</h3>
            </div>
            <div className="px-4 py-5 sm:px-6 space-y-3">
              {currentSupply.status === 'available' && (
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                  申请借用
                </button>
              )}
              <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50">
                编辑物资
              </button>
              <button className="w-full bg-white border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50">
                删除物资
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">位置信息</h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              {currentSupply.lat && currentSupply.lng && (
                <p className="text-sm text-gray-500">
                  坐标: {currentSupply.lat.toFixed(4)}, {currentSupply.lng.toFixed(4)}
                </p>
              )}
              {currentSupply.photo_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">物资照片</p>
                  <img src={currentSupply.photo_url} alt={currentSupply.name} className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
