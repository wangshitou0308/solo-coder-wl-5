import { create } from 'zustand'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import api from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.login(data)
      if (response.success && response.data) {
        const { token, user } = response.data
        api.setToken(token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '登录失败', isLoading: false })
      throw err
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.register(data)
      if (response.success && response.data) {
        const { token, user } = response.data
        api.setToken(token)
        set({ user, token, isAuthenticated: true, isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.response?.data?.message || '注册失败', isLoading: false })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await api.logout()
    } finally {
      api.clearToken()
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true })
    try {
      const response = await api.getCurrentUser()
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false })
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        api.clearToken()
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    }
  },

  clearError: () => set({ error: null })
}))
