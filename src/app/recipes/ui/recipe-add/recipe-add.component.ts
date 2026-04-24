import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeImageComponent } from '../recipe-image/recipe-image.component';

@Component({
  selector: 'app-recipe-add',
  imports: [TranslatePipe, RouterLink, ReactiveFormsModule, RecipeImageComponent],
  templateUrl: './recipe-add.component.html',
  styleUrl: './recipe-add.component.scss',
})
export class RecipeAddComponent {
  private readonly store = inject(RecipeStore);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);

  readonly imageUrl = computed(() => this.previewUrl() ?? 'images/ingredients-background-010.png');

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    prepTime: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    cookTime: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    servings: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    ingredients: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    instructions: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  onFileSelected(file: File): void {
    this.selectedImage.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    const { title, description, prepTime, cookTime, servings, ingredients, instructions } =
      this.form.getRawValue();

    this.store
      .create({ title, description, prepTime, cookTime, servings, ingredients, instructions })
      .subscribe({
        next: (recipe) => {
          const image = this.selectedImage();
          if (image && recipe.id) {
            this.store.uploadImage(recipe.id, image).subscribe({
              next: () => this.router.navigate(['/recipes', recipe.id]),
              error: () => this.router.navigate(['/recipes', recipe.id]),
            });
          } else {
            this.router.navigate(['/recipes', recipe.id]);
          }
        },
        error: (err) => {
          this.error.set(err.message ?? 'errors.generic');
          this.submitting.set(false);
        },
      });
  }
}
