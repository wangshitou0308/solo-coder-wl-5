import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { 
  ApiResponse, 
  User, 
  Community,
  CommunityMember, 
  Supply,
  AlertSupply, 
  BorrowRequest, 
  BorrowRecord, 
  Alert, 
  Stats,
  ContributionRank,
  MutualAidReport,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  PageResponse,
  SupplyCategory,
  SupplyStatus
} from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiClient {
  private instance: AxiosInstance
  private token: string | null = null

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      this.token = savedToken
      this.instance.defaults.headers.common.Authorization = `Bearer ${savedToken}`
    }

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response.data as any
      },
      (error) => {
        if (error.response?.status === 401) {
          this.token = null
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token')
    }
    return this.token
  }

  private async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.request(config)
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config })
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...config })
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...config })
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config })
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/login', data)
  }

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register', data)
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/logout')
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me')
  }

  async searchCommunities(params?: { 
    page?: number; 
    page_size?: number;
    keyword?: string;
    lat?: number;
    lng?: number;
  }): Promise<ApiResponse<PageResponse<Community>>> {
    return this.get<PageResponse<Community>>('/communities/search', { params })
  }

  async getCommunity(id: number): Promise<ApiResponse<Community>> {
    return this.get<Community>(`/communities/${id}`)
  }

  async createCommunity(data: Partial<Community>): Promise<ApiResponse<Community>> {
    return this.post<Community>('/communities', data)
  }

  async updateCommunity(id: number, data: Partial<Community>): Promise<ApiResponse<Community>> {
    return this.put<Community>(`/communities/${id}`, data)
  }

  async deleteCommunity(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/communities/${id}`)
  }

  async joinCommunity(id: number): Promise<ApiResponse<CommunityMember>> {
    return this.post<CommunityMember>(`/communities/${id}/join`)
  }

  async leaveCommunity(id: number): Promise<ApiResponse<void>> {
    return this.post<void>(`/communities/${id}/leave`)
  }

  async getMyCommunities(): Promise<ApiResponse<Community[]>> {
    return this.get<Community[]>('/communities/mine/list')
  }

  async searchSupplies(params?: { 
    page?: number; 
    page_size?: number; 
    community_id?: number; 
    category?: string;
    status?: string;
    keyword?: string;
    lat?: number;
    lng?: number;
  }): Promise<ApiResponse<PageResponse<Supply>>> {
    return this.get<PageResponse<Supply>>('/supplies/search', { params })
  }

  async getHotSupplies(): Promise<ApiResponse<Supply[]>> {
    return this.get<Supply[]>('/supplies/hot')
  }

  async getSupplyCategories(): Promise<ApiResponse<{ category: SupplyCategory; count: number }[]>> {
    return this.get<{ category: SupplyCategory; count: number }[]>('/supplies/categories')
  }

  async getSupply(id: number): Promise<ApiResponse<Supply>> {
    return this.get<Supply>(`/supplies/${id}`)
  }

  async getSuppliesByUser(userId: number): Promise<ApiResponse<Supply[]>> {
    return this.get<Supply[]>(`/supplies/user/${userId}`)
  }

  async getMySupplies(): Promise<ApiResponse<Supply[]>> {
    return this.get<Supply[]>('/supplies/mine/list')
  }

  async createSupply(data: Partial<Supply>): Promise<ApiResponse<Supply>> {
    return this.post<Supply>('/supplies', data)
  }

  async updateSupply(id: number, data: Partial<Supply>): Promise<ApiResponse<Supply>> {
    return this.put<Supply>(`/supplies/${id}`, data)
  }

  async deleteSupply(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/supplies/${id}`)
  }

  async getBorrowRequests(params?: { 
    page?: number; 
    page_size?: number; 
    status?: string;
    community_id?: number;
  }): Promise<ApiResponse<PageResponse<BorrowRequest>>> {
    return this.get<PageResponse<BorrowRequest>>('/borrows', { params })
  }

  async getBorrowRequest(id: number): Promise<ApiResponse<BorrowRequest>> {
    return this.get<BorrowRequest>(`/borrows/${id}`)
  }

  async createBorrowRequest(data: Partial<BorrowRequest>): Promise<ApiResponse<BorrowRequest>> {
    return this.post<BorrowRequest>('/borrows', data)
  }

  async approveBorrowRequest(id: number): Promise<ApiResponse<BorrowRequest>> {
    return this.post<BorrowRequest>(`/borrows/${id}/approve`)
  }

  async pickupBorrowRequest(id: number, pickup_code: string): Promise<ApiResponse<BorrowRequest>> {
    return this.post<BorrowRequest>(`/borrows/${id}/pickup`, { pickup_code })
  }

  async returnBorrowRequest(id: number): Promise<ApiResponse<BorrowRequest>> {
    return this.post<BorrowRequest>(`/borrows/${id}/return`)
  }

  async rateBorrowRequest(id: number, rating: number, comment?: string): Promise<ApiResponse<BorrowRequest>> {
    return this.post<BorrowRequest>(`/borrows/${id}/rate`, { rating, comment })
  }

  async getMyBorrows(): Promise<ApiResponse<BorrowRecord[]>> {
    return this.get<BorrowRecord[]>('/borrows/mine/borrows')
  }

  async getMyLends(): Promise<ApiResponse<BorrowRecord[]>> {
    return this.get<BorrowRecord[]>('/borrows/mine/lends')
  }

  async getAlerts(params?: { 
    page?: number; 
    page_size?: number; 
    status?: string;
    type?: string;
  }): Promise<ApiResponse<PageResponse<Alert>>> {
    return this.get<PageResponse<Alert>>('/alerts', { params })
  }

  async getAlert(id: number): Promise<ApiResponse<Alert>> {
    return this.get<Alert>(`/alerts/${id}`)
  }

  async createAlert(data: Partial<Alert>): Promise<ApiResponse<Alert>> {
    return this.post<Alert>('/alerts', data)
  }

  async updateAlert(id: number, data: Partial<Alert>): Promise<ApiResponse<Alert>> {
    return this.put<Alert>(`/alerts/${id}`, data)
  }

  async deleteAlert(id: number): Promise<ApiResponse<void>> {
    return this.delete<void>(`/alerts/${id}`)
  }

  async getAlertSupplies(id: number): Promise<ApiResponse<AlertSupply[]>> {
    return this.get<AlertSupply[]>(`/alerts/${id}/supplies`)
  }

  async getAlertMatchGap(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/alerts/${id}/match-gap`)
  }

  async getDashboardStats(): Promise<ApiResponse<Stats>> {
    return this.get<Stats>('/stats/dashboard')
  }

  async getContributionRank(): Promise<ApiResponse<ContributionRank[]>> {
    return this.get<ContributionRank[]>('/stats/contribution-rank')
  }

  async getMutualAidReport(): Promise<ApiResponse<MutualAidReport>> {
    return this.get<MutualAidReport>('/stats/mutual-aid-report')
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/users/profile', data)
  }
}

export const api = new ApiClient()
export default api
