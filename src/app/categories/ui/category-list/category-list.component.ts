import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryStore } from '../../application/category.store';
import { Category } from '../../domain/category.model';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, AppFooterComponent, TranslatePipe],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private readonly store = inject(CategoryStore);

  readonly categories = this.store.categories;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  readonly categoryToDelete = signal<Category | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.store.loadAll();
  }

  requestDelete(category: Category): void {
    this.categoryToDelete.set(category);
  }

  cancelDelete(): void {
    this.categoryToDelete.set(null);
  }

  confirmDelete(): void {
    const category = this.categoryToDelete();
    if (!category?.id || this.deleting()) return;

    this.deleting.set(true);
    this.store.delete(category.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.categoryToDelete.set(null);
      },
      error: () => this.deleting.set(false),
    });
  }
}
