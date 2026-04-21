import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { AuthRepository } from '../domain/auth.repository';
import { AuthRequest, AuthResponse, LoginRequest } from '../domain/auth.model';
import { SyncService } from '../../sync/application/sync.service';

@Injectable()
export class AuthService {
  private readonly repository = inject(AuthRepository);
  private readonly syncService = inject(SyncService);

  readonly currentUser = signal<AuthResponse | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.repository.login(credentials).pipe(
      tap((response) => this.persistSession(response)),
      switchMap((response) => this.syncAfterAuth(response)),
    );
  }

  register(data: AuthRequest): Observable<AuthResponse> {
    return this.repository.register(data).pipe(
      tap((response) => this.persistSession(response)),
      switchMap((response) => this.syncAfterAuth(response)),
    );
  }

  /** Restores the session from localStorage. Call this on app startup. */
  restoreSession(): void {
    const stored = localStorage.getItem('currentUser');
    if (!stored) return;
    try {
      this.currentUser.set(JSON.parse(stored));
    } catch {
      localStorage.removeItem('currentUser');
    }
  }

  private syncAfterAuth(response: AuthResponse): Observable<AuthResponse> {
    if (!Capacitor.isNativePlatform()) return of(response);
    return from(this.syncService.syncOnLogin()).pipe(
      catchError(() => of(null)),
      map(() => response),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  private persistSession(response: AuthResponse): void {
    this.currentUser.set(response);
    localStorage.setItem('token', response.token);
    localStorage.setItem('currentUser', JSON.stringify(response));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
