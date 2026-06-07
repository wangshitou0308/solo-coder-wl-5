import { create } from 'zustand'
import type { Supply, PageResponse } from '@/types'
import api from '@/services/api'

interface SupplyState {
  supplies: Supply[]
  currentSupply: Supply | null
  hotSupplies: Supply[]
  categories: { category: string; count: number }[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
  fetchSupplies: (params?: any) => Promise<void>
  fetchSupply: (id: number) => Promise<void>
  fetchHotSupplies: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchMySupplies: () => Promise<void>
  fetchSuppliesByUser: (userId: number) => Promise<void>
  createSupply: (data: Partial<Supply>) => Promise<void>
  updateSupply: (id: number, data: Partial<Supply>) => Promise<void>
  deleteSupply: (id: number) => Promise<void>
  clearCurrentSupply: () => void
  setPage: (page: number) => void
}

export const useSupplyStore = create<SupplyState>((set, get) => ({
  supplies: [],
  currentSupply: null,
  hotSupplies: [],
  categories: [],
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,

  fetchSupplies: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.searchSupplies({
        page: get().page,
        page_size: get().pageSize,
        ...params
      })
      if (response.success && response.data) {
        const pageData = response.data as PageResponse<Supply>
        set({ supplies: pageData.items, total: pageData.total, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取物资列表失败', isLoading: false })
    }
  },

  fetchSupply: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getSupply(id)
      if (response.success && response.data) {
        set({ currentSupply: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取物资详情失败', isLoading: false })
    }
  },

  fetchHotSupplies: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getHotSupplies()
      if (response.success && response.data) {
        set({ hotSupplies: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取热门物资失败', isLoading: false })
    }
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getSupplyCategories()
      if (response.success && response.data) {
        set({ categories: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取物资分类失败', isLoading: false })
    }
  },

  fetchMySupplies: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getMySupplies()
      if (response.success && response.data) {
        set({ supplies: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取我的物资失败', isLoading: false })
    }
  },

  fetchSuppliesByUser: async (userId: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getSuppliesByUser(userId)
      if (response.success && response.data) {
        set({ supplies: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取用户物资失败', isLoading: false })
    }
  },

  createSupply: async (data: Partial<Supply>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.createSupply(data)
      if (response.success) {
        await get().fetchSupplies()
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '创建物资失败', isLoading: false })
      throw err
    }
  },

  updateSupply: async (id: number, data: Partial<Supply>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.updateSupply(id, data)
      if (response.success && response.data) {
        set((state) => ({
          supplies: state.supplies.map(s => s.id === id ? response.data! : s),
          currentSupply: response.data,
          isLoading: false
        }))
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '更新物资失败', isLoading: false })
      throw err
    }
  },

  deleteSupply: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteSupply(id)
      set((state) => ({
        supplies: state.supplies.filter(s => s.id !== id),
        isLoading: false
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || '删除物资失败', isLoading: false })
      throw err
    }
  },

  clearCurrentSupply: () => set({ currentSupply: null }),
  
  setPage: (page: number) => set({ page })
}))
