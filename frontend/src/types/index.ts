export interface User {
  id: number
  username: string
  email: string
  password_hash?: string
  phone?: string
  avatar?: string
  credit_score: number
  is_admin: boolean
  created_at: string
}

export interface Community {
  id: number
  name: string
  description?: string
  location: string
  lat: number
  lng: number
  admin_id: number
  created_at: string
  memberCount?: number
  supplyCount?: number
}

export interface CommunityMember {
  id: number
  user_id: number
  community_id: number
  role: 'member' | 'admin'
  joined_at: string
  user?: User
}

export interface Supply {
  id: number
  owner_id: number
  community_id: number
  category: SupplyCategory
  name: string
  description?: string
  quantity: number
  unit: string
  expire_date?: string
  photo_url?: string
  lat: number
  lng: number
  status: SupplyStatus
  created_at: string
}

export type SupplyCategory = 
  | 'food' 
  | 'water' 
  | 'medicine' 
  | 'clothing' 
  | 'shelter' 
  | 'tools' 
  | 'communication' 
  | 'hygiene' 
  | 'first_aid' 
  | 'other'

export type SupplyStatus = 'available' | 'reserved' | 'borrowed' | 'returned' | 'consumed'

export interface BorrowRequest {
  id: number
  requester_id: number
  supply_id: number
  quantity: number
  purpose: string
  priority: BorrowPriority
  status: BorrowRequestStatus
  pickup_code?: string
  created_at: string
}

export type BorrowPriority = 'normal' | 'urgent' | 'disaster'

export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface BorrowRecord {
  id: number
  requester_id: number
  supply_id: number
  quantity: number
  purpose: string
  priority: BorrowPriority
  status: BorrowRequestStatus
  pickup_code?: string
  created_at: string
  returned_at?: string
  rated?: boolean
  rating?: number
}

export interface Alert {
  id: number
  title: string
  type: AlertType
  level: string
  description?: string
  affected_area?: string
  status: AlertStatus
  creator_id: number
  created_at: string
  resolved_at?: string
}

export interface AlertSupply {
  id: number
  alert_id: number
  supply_id: number
  quantity_needed: number
  quantity_available: number
  supply?: Supply
}

export type AlertType = 'typhoon' | 'earthquake' | 'flood' | 'other'

export type AlertStatus = 'warning' | 'responding' | 'resolved'

export interface Stats {
  totalUsers: number
  totalCommunities: number
  totalSupplies: number
  totalBorrowRequests: number
  activeBorrows: number
  suppliesByCategory: Record<SupplyCategory, number>
  borrowTrend: { date: string; count: number }[]
  communityStats: { communityId: number; communityName: string; supplyCount: number; memberCount: number }[]
}

export interface ContributionRank {
  user_id: number
  username: string
  avatar?: string
  credit_score: number
  borrow_count: number
  lend_count: number
}

export interface MutualAidReport {
  total_borrows: number
  total_returns: number
  completion_rate: number
  avg_rating: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PageResponse<T = any> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Location {
  lat: number
  lng: number
  address?: string
}
