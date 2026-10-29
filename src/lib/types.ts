export type UserRole = 'admin' | 'zeesip_admin' | 'distributor' | 'zeesip_staff';

export interface PortalUser {
  id: string;
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password_hash: string;
  password_lookup: string;
  is_active: boolean;
  created_at: string;
}

export type PortalUserPublic = Omit<PortalUser, 'password_hash' | 'password_lookup'>;

export interface SessionPayload {
  userId: string;
  role: UserRole;
  name: string;
}

export interface LoginRequest {
  password: string;
}

export interface CreateUserRequest {
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  is_active?: boolean;
  password?: string;
}

export interface DashboardStats {
  totalUsers: number;
  distributors: number;
  staff: number;
  admins: number;
  activeUsers: number;
  inactiveUsers: number;
}
