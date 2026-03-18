import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthRequest, AuthResponse, LoginRequest } from '../domain/auth.model';

@Injectable()
export class AuthService {
  private readonly repository = inject(AuthRepository);

  readonly currentUser = signal<AuthResponse | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.repository.login(credentials).pipe(
      tap((response) => {
        this.currentUser.set(response);
        localStorage.setItem('token', response.token);
      }),
    );
  }

  register(data: AuthRequest): Observable<AuthResponse> {
    return this.repository.register(data).pipe(
      tap((response) => {
        this.currentUser.set(response);
        localStorage.setItem('token', response.token);
      }),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
