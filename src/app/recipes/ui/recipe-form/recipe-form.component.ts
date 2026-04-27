import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecipeStore } from '../../application/recipe.store';
import { latestImage } from '../../domain/recipe.model';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeImageComponent } from '../recipe-image/recipe-image.component';

@Component({
  selector: 'app-recipe-form',
  imports: [TranslatePipe, RouterLink, ReactiveFormsModule, RecipeImageComponent],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.scss',
})
export class RecipeFormComponent {
  private readonly store = inject(RecipeStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editId = signal<number | null>(null);
  readonly isEditMode = computed(() => this.editId() !== null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly existingImageUrl = signal<string | null>(null);

  readonly imageUrl = computed(
    () => this.previewUrl() ?? this.existingImageUrl() ?? 'images/ingredients-background-010.png',
  );

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

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.loading.set(true);
      this.store.loadById(id);
    }

    effect(() => {
      const recipe = this.store.selectedRecipe();
      if (recipe && this.isEditMode() && this.loading()) {
        this.form.patchValue({
          title: recipe.title,
          description: recipe.description ?? '',
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        });
        this.existingImageUrl.set(latestImage(recipe.images)?.url ?? null);
        this.loading.set(false);
      }
    });
  }

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

    const id = this.editId();

    if (id !== null) {
      this.store
        .update(id, { title, description, prepTime, cookTime, servings, ingredients, instructions })
        .subscribe({
          next: () => {
            const image = this.selectedImage();
            if (image) {
              this.store.uploadImage(id, image).subscribe({
                next: () => this.router.navigate(['/recipes', id], { replaceUrl: true }),
                error: () => this.router.navigate(['/recipes', id], { replaceUrl: true }),
              });
            } else {
              this.router.navigate(['/recipes', id], { replaceUrl: true });
            }
          },
          error: (err) => {
            this.error.set(err.message ?? 'errors.generic');
            this.submitting.set(false);
          },
        });
    } else {
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
}
