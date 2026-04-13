import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Category } from '../domain/category.model';
import { CategoryRepository } from '../domain/category.repository';

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Platos principales', description: 'Recetas para el plato fuerte de la comida' },
  { id: 2, name: 'Sopas y cremas', description: 'Caldos, sopas y cremas calientes y frías' },
  { id: 3, name: 'Ensaladas', description: 'Ensaladas frescas y nutritivas' },
  { id: 4, name: 'Postres', description: 'Dulces, tartas y helados' },
  { id: 5, name: 'Aperitivos', description: 'Tapas y entrantes para compartir' },
];

let nextId = MOCK_CATEGORIES.length + 1;

@Injectable()
export class CategoryMockRepository extends CategoryRepository {
  private categories: Category[] = [...MOCK_CATEGORIES];

  getAll(): Observable<Category[]> {
    return of([...this.categories]);
  }

  getById(id: number): Observable<Category> {
    const category = this.categories.find((c) => c.id === id);
    return category ? of({ ...category }) : throwError(() => new Error(`Category ${id} not found`));
  }

  create(category: Category): Observable<Category> {
    const created: Category = { ...category, id: nextId++ };
    this.categories.push(created);
    return of({ ...created });
  }

  update(id: number, category: Category): Observable<Category> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return throwError(() => new Error(`Category ${id} not found`));
    this.categories[index] = { ...category, id };
    return of({ ...this.categories[index] });
  }

  delete(id: number): Observable<void> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return throwError(() => new Error(`Category ${id} not found`));
    this.categories.splice(index, 1);
    return of(undefined);
  }
}
