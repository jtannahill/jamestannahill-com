import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const svgPath = resolve('public/favicon.svg');
const svgData = readFileSync(svgPath, 'utf-8');

function render(size: number, outPath: string) {
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(outPath), png);
  console.log(`Generated ${outPath} (${size}×${size})`);
}

render(32, 'public/favicon-32.png');
render(180, 'public/apple-touch-icon.png');
