import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSupplyStore } from '@/store/supplyStore'
import type { SupplyCategory, SupplyStatus, Supply } from '@/types'
import api from '@/services/api'

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

export function SupplyList() {
  const { supplies, isLoading, fetchSupplies } = useSupplyStore()
  const navigate = useNavigate()
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<Partial<Supply>>({
    name: '',
    description: '',
    quantity: 1,
    unit: '件',
    category: 'other',
    community_id: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchSupplies({
      category: category === 'all' ? undefined : category,
      status: status === 'all' ? undefined : status,
      keyword: keyword || undefined,
    })
  }, [fetchSupplies, category, status, keyword])

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      await api.createSupply(createForm)
      alert('物资发布成功！')
      setShowCreateModal(false)
      setCreateForm({
        name: '',
        description: '',
        quantity: 1,
        unit: '件',
        category: 'other',
        community_id: 0,
      })
      fetchSupplies({
        category: category === 'all' ? undefined : category,
        status: status === 'all' ? undefined : status,
        keyword: keyword || undefined,
      })
    } catch (err) {
      console.error('发布物资失败', err)
      alert('发布失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">物资列表</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          发布物资
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索物资名称..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部分类</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {supplies.map((supply) => (
              <li key={supply.id}>
                <Link
                  to={`/supplies/${supply.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-blue-600">{supply.name}</h3>
                          <p className="text-sm text-gray-500">
                            {categoryLabels[supply.category as SupplyCategory]} · {supply.quantity} {supply.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[supply.status as SupplyStatus].className}`}>
                          {statusLabels[supply.status as SupplyStatus].label}
                        </span>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && supplies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无物资</h3>
          <p className="mt-1 text-sm text-gray-500">发布第一个物资开始共享吧</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">发布物资</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物资名称</label>
                <input
                  type="text"
                  value={createForm.name || ''}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入物资名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入物资描述"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    value={createForm.quantity || 0}
                    onChange={(e) => setCreateForm({ ...createForm, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                  <input
                    type="text"
                    value={createForm.unit || ''}
                    onChange={(e) => setCreateForm({ ...createForm, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：件、箱、个"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={createForm.category || 'other'}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as SupplyCategory })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">社区ID</label>
                <input
                  type="number"
                  value={createForm.community_id || ''}
                  onChange={(e) => setCreateForm({ ...createForm, community_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入社区ID"
                />
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
                {isSubmitting ? '发布中...' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
