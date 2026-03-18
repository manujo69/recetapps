import { Observable } from 'rxjs';
import { AuthRequest, AuthResponse, LoginRequest } from './auth.model';

export abstract class AuthRepository {
  abstract login(credentials: LoginRequest): Observable<AuthResponse>;
  abstract register(data: AuthRequest): Observable<AuthResponse>;
}
