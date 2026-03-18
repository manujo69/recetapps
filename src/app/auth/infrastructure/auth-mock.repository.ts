import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthRepository } from '../domain/auth.repository';
import { AuthRequest, AuthResponse, LoginRequest } from '../domain/auth.model';

@Injectable()
export class AuthMockRepository extends AuthRepository {
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return of({
      token: 'mock-jwt-token',
      type: 'Bearer',
      id: 1,
      username: 'mock_user',
      email: credentials.email,
    });
  }

  register(data: AuthRequest): Observable<AuthResponse> {
    return of({
      token: 'mock-jwt-token',
      type: 'Bearer',
      id: 2,
      username: data.username,
      email: data.email,
    });
  }
}
