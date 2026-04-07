import { inject, Injectable } from '@angular/core';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';

@Injectable()
export class CategoryService {
  private readonly repository = inject(CategoryRepository);

  getAll() {
    return this.repository.getAll();
  }

  getById(id: number) {
    return this.repository.getById(id);
  }

  create(category: Category) {
    return this.repository.create(category);
  }

  update(id: number, category: Category) {
    return this.repository.update(id, category);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }
}
