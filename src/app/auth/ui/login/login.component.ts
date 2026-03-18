import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { LoginRequest } from '../../domain/auth.model';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, InputText, Password, Button, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  credentials: LoginRequest = { email: '', password: '' };

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.login(this.credentials).subscribe({
      next: () => this.router.navigateByUrl('/recipes'),
      error: (err) => {
        this.error.set(err.message ?? 'Error al iniciar sesión');
        this.loading.set(false);
      },
    });
  }
}
