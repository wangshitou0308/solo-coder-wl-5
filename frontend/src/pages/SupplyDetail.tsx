import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSupplyStore } from '@/store/supplyStore'
import type { SupplyCategory, SupplyStatus, Supply } from '@/types'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

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
  const { currentSupply, isLoading, fetchSupply, clearCurrentSupply, deleteSupply } = useSupplyStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [borrowForm, setBorrowForm] = useState({ quantity: 1, purpose: '', priority: 'normal' })
  const [editForm, setEditForm] = useState<Partial<Supply>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSupply(Number(id))
    }
    return () => clearCurrentSupply()
  }, [id, fetchSupply, clearCurrentSupply])

  useEffect(() => {
    if (currentSupply) {
      setEditForm({
        name: currentSupply.name,
        description: currentSupply.description,
        quantity: currentSupply.quantity,
        unit: currentSupply.unit,
        category: currentSupply.category,
        expire_date: currentSupply.expire_date,
      })
    }
  }, [currentSupply])

  const handleBorrow = async () => {
    if (!currentSupply) return
    try {
      setIsSubmitting(true)
      await api.createBorrowRequest({
        supply_id: currentSupply.id,
        quantity: borrowForm.quantity,
        purpose: borrowForm.purpose,
        priority: borrowForm.priority,
      })
      alert('申请提交成功！')
      setShowBorrowModal(false)
      setBorrowForm({ quantity: 1, purpose: '', priority: 'normal' })
    } catch (err) {
      console.error('申请借用失败', err)
      alert('申请失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!currentSupply) return
    try {
      setIsSubmitting(true)
      await api.updateSupply(currentSupply.id, editForm)
      alert('更新成功！')
      setShowEditModal(false)
      fetchSupply(currentSupply.id)
    } catch (err) {
      console.error('更新失败', err)
      alert('更新失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentSupply) return
    try {
      setIsSubmitting(true)
      await api.deleteSupply(currentSupply.id)
      alert('删除成功！')
      navigate('/supplies')
    } catch (err) {
      console.error('删除失败', err)
      alert('删除失败，请重试')
    } finally {
      setIsSubmitting(false)
      setShowDeleteConfirm(false)
    }
  }

  const isOwner = user && currentSupply && user.id === currentSupply.owner_id

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
              {currentSupply.status === 'available' && !isOwner && (
                <button 
                  onClick={() => setShowBorrowModal(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  申请借用
                </button>
              )}
              {isOwner && (
                <>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    编辑物资
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-white border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50"
                  >
                    删除物资
                  </button>
                </>
              )}
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

      {showBorrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">申请借用</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                <input
                  type="number"
                  min="1"
                  max={currentSupply?.quantity || 1}
                  value={borrowForm.quantity}
                  onChange={(e) => setBorrowForm({ ...borrowForm, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用途说明</label>
                <textarea
                  value={borrowForm.purpose}
                  onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请说明借用用途..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  value={borrowForm.priority}
                  onChange={(e) => setBorrowForm({ ...borrowForm, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">普通</option>
                  <option value="urgent">紧急</option>
                  <option value="disaster">灾害</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowBorrowModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleBorrow}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">编辑物资</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物资名称</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                  <input
                    type="number"
                    value={editForm.quantity || 0}
                    onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
                  <input
                    type="text"
                    value={editForm.unit || ''}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as SupplyCategory })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">过期时间</label>
                <input
                  type="date"
                  value={editForm.expire_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, expire_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-500 mb-6">确定要删除该物资吗？此操作无法撤销。</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
