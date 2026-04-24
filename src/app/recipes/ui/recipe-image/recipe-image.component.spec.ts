import { TestBed } from '@angular/core/testing';
import { RecipeImageComponent } from './recipe-image.component';

describe('RecipeImageComponent', () => {
  function createFixture(inputs: {
    imageUrl: string;
    alt?: string;
    uploading?: boolean;
    uploadVisible?: boolean;
  }) {
    const fixture = TestBed.createComponent(RecipeImageComponent);
    fixture.componentRef.setInput('imageUrl', inputs.imageUrl);
    if (inputs.alt !== undefined) fixture.componentRef.setInput('alt', inputs.alt);
    if (inputs.uploading !== undefined) fixture.componentRef.setInput('uploading', inputs.uploading);
    if (inputs.uploadVisible !== undefined) fixture.componentRef.setInput('uploadVisible', inputs.uploadVisible);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeImageComponent],
    }).compileComponents();
  });

  describe('image rendering', () => {
    it('should render img with the provided imageUrl', () => {
      const fixture = createFixture({ imageUrl: '/uploads/paella.jpg' });
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.src).toContain('/uploads/paella.jpg');
    });

    it('should render img with the provided alt text', () => {
      const fixture = createFixture({ imageUrl: '/uploads/paella.jpg', alt: 'Paella valenciana' });
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('Paella valenciana');
    });

    it('should render img with empty alt by default', () => {
      const fixture = createFixture({ imageUrl: '/uploads/paella.jpg' });
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('');
    });
  });

  describe('upload button visibility', () => {
    it('should show the upload button when uploadVisible is true (default)', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg' });
      const button = fixture.nativeElement.querySelector('button[aria-label="Subir imagen"]');
      expect(button).toBeTruthy();
    });

    it('should hide the upload button when uploadVisible is false', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg', uploadVisible: false });
      const button = fixture.nativeElement.querySelector('button[aria-label="Subir imagen"]');
      expect(button).toBeNull();
    });
  });

  describe('uploading state', () => {
    it('should disable the upload button when uploading is true', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg', uploading: true });
      const button = fixture.nativeElement.querySelector(
        'button[aria-label="Subir imagen"]',
      ) as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
    });

    it('should show spinner icon when uploading is true', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg', uploading: true });
      const icon = fixture.nativeElement.querySelector('button[aria-label="Subir imagen"] i');
      expect(icon.className).toContain('pi-spinner');
    });

    it('should enable the upload button when uploading is false', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg', uploading: false });
      const button = fixture.nativeElement.querySelector(
        'button[aria-label="Subir imagen"]',
      ) as HTMLButtonElement;
      expect(button.disabled).toBeFalse();
    });

    it('should show upload icon when uploading is false', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg', uploading: false });
      const icon = fixture.nativeElement.querySelector('button[aria-label="Subir imagen"] i');
      expect(icon.className).toContain('pi-upload');
    });
  });

  describe('openFilePicker()', () => {
    it('should trigger click on the hidden file input', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg' });
      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = spyOn(input, 'click');

      fixture.componentInstance.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('onFileChange()', () => {
    it('should emit fileSelected with the chosen file', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg' });
      let emittedFile: File | undefined;
      fixture.componentInstance.fileSelected.subscribe((f) => (emittedFile = f));

      const mockFile = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as unknown as Event;
      fixture.componentInstance.onFileChange(event);

      expect(emittedFile).toBe(mockFile);
    });

    it('should not emit fileSelected when no file is selected', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg' });
      let emitted = false;
      fixture.componentInstance.fileSelected.subscribe(() => (emitted = true));

      const event = { target: { files: [] } } as unknown as Event;
      fixture.componentInstance.onFileChange(event);

      expect(emitted).toBeFalse();
    });

    it('should not emit fileSelected when files is null', () => {
      const fixture = createFixture({ imageUrl: '/img.jpg' });
      let emitted = false;
      fixture.componentInstance.fileSelected.subscribe(() => (emitted = true));

      const event = { target: { files: null } } as unknown as Event;
      fixture.componentInstance.onFileChange(event);

      expect(emitted).toBeFalse();
    });
  });
});
