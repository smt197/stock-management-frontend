import { Injectable, signal } from '@angular/core';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest, AuthResponse, AuthState } from '../../shared/models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private authState = signal<AuthState>({
    user: this.getUserFromStorage(),
    token: this.getTokenFromStorage(),
    isAuthenticated: !!this.getTokenFromStorage()
  });

  // Observable pour les composants qui en ont besoin
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  /**
   * Register a new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('register', data).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data.user, response.data.access_token);
        }
      })
    );
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('login', credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.handleAuthSuccess(response.data.user, response.data.access_token);
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.apiService.post('logout', {}).pipe(
      tap(() => {
        this.clearAuthData();
        this.router.navigate(['/login']);
      })
    );
  }

  /**
   * Get current user info
   */
  me(): Observable<{ success: boolean, data: User }> {
    return this.apiService.get<{ success: boolean, data: User }>('me').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setUser(response.data);
        }
      })
    );
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('refresh', {}).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setToken(response.data.access_token);
        }
      })
    );
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(user: User, token: string): void {
    this.setToken(token);
    this.setUser(user);
    this.authState.set({
      user,
      token,
      isAuthenticated: true
    });
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({
      user: null,
      token: null,
      isAuthenticated: false
    });
    this.currentUserSubject.next(null);
  }

  /**
   * Set token in localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return this.getTokenFromStorage();
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set user in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.authState.update(state => ({ ...state, user }));
    this.currentUserSubject.next(user);
  }

  /**
   * Get user from localStorage
   */
  getUser(): User | null {
    return this.getUserFromStorage();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  /**
   * Get auth state as signal
   */
  getAuthState() {
    return this.authState;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user ? user.role === role : false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user is manager or admin
   */
  isManagerOrAdmin(): boolean {
    return this.hasAnyRole(['admin', 'manager']);
  }

  /**
   * Check if user can create resources (user, manager, admin)
   */
  canCreate(): boolean {
    return this.hasAnyRole(['admin', 'manager', 'user']);
  }

  /**
   * Check if user can update resources (manager, admin)
   */
  canUpdate(): boolean {
    return this.hasAnyRole(['admin', 'manager']);
  }

  /**
   * Check if user can delete resources (admin only)
   */
  canDelete(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can only view resources (viewer role)
   */
  isViewer(): boolean {
    return this.hasRole('viewer');
  }
}
