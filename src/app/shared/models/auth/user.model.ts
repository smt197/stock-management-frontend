export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  email_verified_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'admin' | 'manager' | 'user' | 'viewer';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    access_token: string;
    token_type: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
