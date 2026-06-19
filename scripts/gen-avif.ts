import sharp from 'sharp';
import { basename, resolve } from 'path';

const images = [
  'hero-bg.jpg',
  'hero-bg-skyline.jpg',
  'headshot.jpg',
  'james-casual.jpg',
];

for (const file of images) {
  const input = resolve('public', file);
  const output = resolve('public', `${basename(file, '.jpg')}.avif`);
  await sharp(input)
    .avif({ quality: 50, effort: 6 })
    .toFile(output);
  console.log(`Generated ${output}`);
}
