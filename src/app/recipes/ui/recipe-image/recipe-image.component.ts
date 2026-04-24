import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-recipe-image',
  standalone: true,
  templateUrl: './recipe-image.component.html',
  styleUrl: './recipe-image.component.scss',
})
export class RecipeImageComponent {
  readonly imageUrl = input.required<string>();
  readonly alt = input('');
  readonly uploading = input(false);
  readonly uploadVisible = input(true);

  readonly fileSelected = output<File>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.fileSelected.emit(file);
  }
}
