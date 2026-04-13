import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryStore } from '../../application/category.store';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, AppFooterComponent],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private readonly store = inject(CategoryStore);

  readonly categories = this.store.categories;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadAll();
  }
}
