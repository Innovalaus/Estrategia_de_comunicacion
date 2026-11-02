import { copyFileSync } from 'node:fs';
copyFileSync('dist/index.html', 'estrategia-de-comunicacion.html');
console.log('-> estrategia-de-comunicacion.html actualizado');
