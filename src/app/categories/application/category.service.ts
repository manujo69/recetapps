import { inject, Injectable } from "@angular/core";
import { CategoryRepository } from "../domain/category.repository";

@Injectable()
export class CategoryService {
  private readonly repository = inject(CategoryRepository);

  getAll() {
    return this.repository.getAll();
  }

  getById(id: number) {
    return this.repository.getById(id);
  }
  create(category: any) {
    return this.repository.create(category);
  }

  update(id: number, category: any) {
    return this.repository.update(id, category);
  }

  delete(id: number) {
    return this.repository.delete(id);
  }

}
