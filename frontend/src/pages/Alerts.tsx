import { useEffect } from 'react'
import { useAlertStore } from '@/store/alertStore'
import type { AlertType, AlertStatus } from '@/types'

const typeLabels: Record<AlertType, string> = {
  typhoon: '台风',
  earthquake: '地震',
  flood: '洪水',
  other: '其他',
}

const statusLabels: Record<AlertStatus, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  warning: { label: '预警中', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', dotColor: 'bg-yellow-400' },
  responding: { label: '响应中', bgColor: 'bg-orange-50', textColor: 'text-orange-800', dotColor: 'bg-orange-400' },
  resolved: { label: '已解除', bgColor: 'bg-green-50', textColor: 'text-green-800', dotColor: 'bg-green-400' },
}

const levelLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
}

export function Alerts() {
  const { alerts, isLoading, fetchAlerts } = useAlertStore()

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">灾害警报</h1>
          <p className="text-sm text-gray-500 mt-1">
            查看当前的灾害警报信息
          </p>
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
            {alerts.map((alert) => {
              const statusConfig = statusLabels[alert.status as AlertStatus]
              return (
                <li
                  key={alert.id}
                  className={`${alert.status !== 'resolved' ? statusConfig.bgColor : ''} hover:bg-gray-50`}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.dotColor} mt-2`}></span>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {alert.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {typeLabels[alert.type as AlertType]}
                            </span>
                            <span className="text-xs text-gray-500">
                              级别: {levelLabels[alert.level] || alert.level}
                            </span>
                          </div>
                        </div>
                        {alert.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {alert.description}
                          </p>
                        )}
                        {alert.affected_area && (
                          <p className="mt-1 text-sm text-gray-500">
                            影响区域: {alert.affected_area}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          发布时间: {formatDate(alert.created_at)}
                        </p>
                        {alert.resolved_at && (
                          <p className="mt-1 text-xs text-gray-400">
                            解除时间: {formatDate(alert.resolved_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无警报</h3>
          <p className="mt-1 text-sm text-gray-500">当前没有灾害警报</p>
        </div>
      )}
    </div>
  )
}
