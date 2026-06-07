import { create } from 'zustand'
import type { Community, PageResponse } from '@/types'
import api from '@/services/api'

interface CommunityState {
  communities: Community[]
  currentCommunity: Community | null
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
  fetchCommunities: (params?: any) => Promise<void>
  fetchCommunity: (id: number) => Promise<void>
  createCommunity: (data: Partial<Community>) => Promise<void>
  updateCommunity: (id: number, data: Partial<Community>) => Promise<void>
  deleteCommunity: (id: number) => Promise<void>
  joinCommunity: (id: number) => Promise<void>
  leaveCommunity: (id: number) => Promise<void>
  fetchMyCommunities: () => Promise<void>
  clearCurrentCommunity: () => void
  setPage: (page: number) => void
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  currentCommunity: null,
  total: 0,
  page: 1,
  pageSize: 20,
  isLoading: false,
  error: null,

  fetchCommunities: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.searchCommunities({
        page: get().page,
        page_size: get().pageSize,
        ...params
      })
      if (response.success && response.data) {
        const pageData = response.data as PageResponse<Community>
        set({ communities: pageData.items, total: pageData.total, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取社区列表失败', isLoading: false })
    }
  },

  fetchCommunity: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getCommunity(id)
      if (response.success && response.data) {
        set({ currentCommunity: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取社区详情失败', isLoading: false })
    }
  },

  createCommunity: async (data: Partial<Community>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.createCommunity(data)
      if (response.success) {
        await get().fetchCommunities()
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '创建社区失败', isLoading: false })
      throw err
    }
  },

  updateCommunity: async (id: number, data: Partial<Community>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.updateCommunity(id, data)
      if (response.success && response.data) {
        set((state) => ({
          communities: state.communities.map(c => c.id === id ? response.data! : c),
          currentCommunity: response.data,
          isLoading: false
        }))
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '更新社区失败', isLoading: false })
      throw err
    }
  },

  deleteCommunity: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteCommunity(id)
      set((state) => ({
        communities: state.communities.filter(c => c.id !== id),
        isLoading: false
      }))
    } catch (err: any) {
      set({ error: err.response?.data?.message || '删除社区失败', isLoading: false })
      throw err
    }
  },

  joinCommunity: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.joinCommunity(id)
      set({ isLoading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || '加入社区失败', isLoading: false })
      throw err
    }
  },

  leaveCommunity: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      await api.leaveCommunity(id)
      set({ isLoading: false })
    } catch (err: any) {
      set({ error: err.response?.data?.message || '离开社区失败', isLoading: false })
      throw err
    }
  },

  fetchMyCommunities: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.getMyCommunities()
      if (response.success && response.data) {
        set({ communities: response.data, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '获取我的社区失败', isLoading: false })
    }
  },

  clearCurrentCommunity: () => set({ currentCommunity: null }),
  
  setPage: (page: number) => set({ page })
}))
