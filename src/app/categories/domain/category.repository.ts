import { Observable } from "rxjs";
import { Category } from "./category.model";

export abstract class CategoryRepository {
 abstract getAll(): Observable<Category[]>;
 abstract getById(id: number): Observable<Category>;
 abstract create(category: Category): Observable<Category>;
 abstract update(id: number, category: Category): Observable<Category>;
 abstract delete(id: number): Observable<void>;
}
