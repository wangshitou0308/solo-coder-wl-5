import { useEffect, useState } from 'react'
import type { BorrowRequestStatus, BorrowPriority } from '@/types'
import api from '@/services/api'

const statusLabels: Record<BorrowRequestStatus, { label: string; className: string }> = {
  pending: { label: '待审批', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已批准', className: 'bg-blue-100 text-blue-800' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-800' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-800' },
}

const priorityLabels: Record<BorrowPriority, { label: string; className: string }> = {
  normal: { label: '普通', className: 'bg-gray-100 text-gray-800' },
  urgent: { label: '紧急', className: 'bg-orange-100 text-orange-800' },
  disaster: { label: '灾害', className: 'bg-red-100 text-red-800' },
}

export function BorrowRequests() {
  const [status, setStatus] = useState<string>('all')
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.getBorrowRequests({ status: status === 'all' ? undefined : status })
        if (response.success && response.data) {
          setRequests(response.data.items || [])
        }
      } catch (err) {
        setTimeout(() => {
          setRequests([
            {
              id: 1,
              supply_id: 1,
              requester_id: 1,
              quantity: 2,
              purpose: '家庭备用',
              priority: 'normal',
              status: 'pending',
              created_at: '2024-01-15 10:30',
            },
            {
              id: 2,
              supply_id: 2,
              requester_id: 2,
              quantity: 5,
              purpose: '应急储备',
              priority: 'urgent',
              status: 'approved',
              created_at: '2024-01-14 14:20',
            },
          ])
        }, 500)
      } finally {
        setTimeout(() => setIsLoading(false), 500)
      }
    }
    fetchRequests()
  }, [status])

  const handleApprove = async (id: number) => {
    try {
      await api.approveBorrowRequest(id)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
    } catch (err) {
      console.error('批准失败', err)
    }
  }

  const handlePickup = async (id: number, pickupCode: string) => {
    try {
      await api.pickupBorrowRequest(id, pickupCode)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))
    } catch (err) {
      console.error('取件失败', err)
    }
  }

  const handleReturn = async (id: number) => {
    try {
      await api.returnBorrowRequest(id)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))
    } catch (err) {
      console.error('归还失败', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">借用申请</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          新建申请
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态筛选</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {requests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        物资 #{request.supply_id}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        申请人 ID: {request.requester_id} · 数量: {request.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        申请时间: {request.created_at}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {request.priority && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityLabels[request.priority as BorrowPriority]?.className || 'bg-gray-100 text-gray-800'}`}>
                          {priorityLabels[request.priority as BorrowPriority]?.label || request.priority}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[request.status as BorrowRequestStatus]?.className || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[request.status as BorrowRequestStatus]?.label || request.status}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            批准
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            拒绝
                          </button>
                        </div>
                      )}
                      {request.status === 'approved' && request.pickup_code && (
                        <button 
                          onClick={() => handlePickup(request.id, request.pickup_code)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          确认取件
                        </button>
                      )}
                      {request.status === 'approved' && (
                        <button 
                          onClick={() => handleReturn(request.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          确认归还
                        </button>
                      )}
                    </div>
                  </div>
                  {request.purpose && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">申请理由：</span>{request.purpose}
                      </p>
                    </div>
                  )}
                  {request.pickup_code && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">取件码：</span>{request.pickup_code}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isLoading && requests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无借用申请</h3>
          <p className="mt-1 text-sm text-gray-500">创建第一个借用申请吧</p>
        </div>
      )}
    </div>
  )
}
