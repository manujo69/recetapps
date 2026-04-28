import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryStore } from '../../application/category.store';

@Component({
  selector: 'app-category-add',
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './category-add.component.html',
  styleUrl: './category-add.component.scss',
})
export class CategoryAddComponent {
  private readonly store = inject(CategoryStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    const { name, description } = this.form.getRawValue();

    this.store.create({ name, description }).subscribe({
      next: () => this.router.navigate(['/categories']),
      error: (err) => {
        this.error.set(err.message ?? 'Error al crear la categoría');
        this.submitting.set(false);
      },
    });
  }
}
