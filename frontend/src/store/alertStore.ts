import { create } from 'zustand'
import type { Alert, AlertSupply, PageResponse } from '@/types'
import api from '@/services/api'

interface AlertState {
  alerts: Alert[]
  currentAlert: Alert | null
  alertSupplies: AlertSupply[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
  fetchAlerts: (params?: any) => Promise<void>
  fetchAlert: (id: number) => Promise<void>
  fetchAlertSupplies: (id: number) => Promise<void>
  fetchAlertMatchGap: (id: number) => Promise<any>
  createAlert: (data: Partial<Alert>) => Promise<void>
  updateAlert: (id: number, data: Partial<Alert>) => Promise<void>
  deleteAlert: (id: number) => Promise<void>
  clearCurrentAlert: () => void
  setPage: (page: number) => void
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  currentAlert: null,
  alertSupplies: [],
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,

  fetchAlerts: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getAlerts({
        page: get().page,
        page_size: get().pageSize,
        ...params
      })
      if (response.success && response.data) {
        const pageData = response.data as PageResponse<Alert>
        set({ alerts: pageData.items, total: pageData.total, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取警报列表失败', isLoading: false })
    }
  },

  fetchAlert: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getAlert(id)
      if (response.success && response.data) {
        set({ currentAlert: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取警报详情失败', isLoading: false })
    }
  },

  fetchAlertSupplies: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getAlertSupplies(id)
      if (response.success && response.data) {
        set({ alertSupplies: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取警报物资失败', isLoading: false })
    }
  },

  fetchAlertMatchGap: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getAlertMatchGap(id)
      if (response.success && response.data) {
        set({ isLoading: false })
        return response.data
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取物资缺口失败', isLoading: false })
    }
    return null
  },

  createAlert: async (data: Partial<Alert>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.createAlert(data)
      if (response.success) {
        await get().fetchAlerts()
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '创建警报失败', isLoading: false })
      throw err
    }
  },

  updateAlert: async (id: number, data: Partial<Alert>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.updateAlert(id, data)
      if (response.success && response.data) {
        set((state) => ({
          alerts: state.alerts.map(a => a.id === id ? response.data! : a),
          currentAlert: response.data,
          isLoading: false
        }))
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '更新警报失败', isLoading: false })
      throw err
    }
  },

  deleteAlert: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteAlert(id)
      set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id),
        isLoading: false
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || '删除警报失败', isLoading: false })
      throw err
    }
  },

  clearCurrentAlert: () => set({ currentAlert: null, alertSupplies: [] }),
  
  setPage: (page: number) => set({ page })
}))
