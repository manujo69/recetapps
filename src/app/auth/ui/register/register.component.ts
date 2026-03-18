import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../application/auth.service';
import { AuthRequest } from '../../domain/auth.model';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, InputText, Password, Button, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  data: AuthRequest = { username: '', email: '', password: '' };

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.register(this.data).subscribe({
      next: () => this.router.navigateByUrl('/recipes'),
      error: (err) => {
        this.error.set(err.message ?? 'Error al registrarse');
        this.loading.set(false);
      },
    });
  }
}
