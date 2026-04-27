import { latestImage, RecipeImage } from './recipe.model';

const IMG_5: RecipeImage = { id: 5, filename: 'old.jpg', url: '/uploads/old.jpg' };
const IMG_32: RecipeImage = { id: 32, filename: 'mid.jpg', url: '/uploads/mid.jpg' };
const IMG_33: RecipeImage = { id: 33, filename: 'newest.jpg', url: '/uploads/newest.jpg' };

describe('latestImage()', () => {
  it('should return undefined when images is undefined', () => {
    expect(latestImage(undefined)).toBeUndefined();
  });

  it('should return undefined when images is empty', () => {
    expect(latestImage([])).toBeUndefined();
  });

  it('should return the only image when there is one', () => {
    expect(latestImage([IMG_5])).toEqual(IMG_5);
  });

  it('should return the image with the highest id', () => {
    expect(latestImage([IMG_5, IMG_32, IMG_33])).toEqual(IMG_33);
  });

  it('should return the correct image regardless of array order', () => {
    expect(latestImage([IMG_33, IMG_5, IMG_32])).toEqual(IMG_33);
  });
});
