export type UserRole = 'admin' | 'zeesip_admin' | 'distributor' | 'zeesip_staff';

export interface SessionPayload {
  userId: string;
  role: UserRole;
  name?: string;
}

export interface PortalUser {
  id: string;
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  password_hash: string;
  password_lookup: string;
  password_enc?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PortalUserPublic {
  id: string;
  name: string;
  role: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
  is_active: boolean;
  created_at: string;
  password?: string | null; // Populated only for admin user list via server-side decryption
}

export interface DashboardStats {
  totalUsers: number;
  distributors: number;
  staff: number;
  admins: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface DeliveredLocation {
  id: string;
  distributor_id: string;
  district: string;
  location: string;
  details?: string | null;
  created_at: string;
}

export interface DistributorDeliverySummary {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  total_deliveries: number;
  last_delivery_at: string | null;
}
