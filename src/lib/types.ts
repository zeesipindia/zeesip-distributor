export type UserRole = 'admin' | 'distributor' | 'zeesip_staff';

export interface PortalUser {
  id: string;
  name: string;
  role: 'distributor' | 'zeesip_staff';
  username: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
}

export type PortalUserPublic = Omit<PortalUser, 'password_hash'>;

export interface SessionPayload {
  userId: string;
  role: UserRole;
  name: string;
  username: string;
}

export interface AdminLoginRequest {
  password: string;
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  name: string;
  role: 'distributor' | 'zeesip_staff';
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'distributor' | 'zeesip_staff';
  is_active?: boolean;
  password?: string;
}
