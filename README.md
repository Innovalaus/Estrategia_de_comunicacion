# Estrategia de Comunicación · INNOVALAUS

Herramienta en 4 pasos para identificar al cliente ideal de una consultoría que gestiona subvenciones para empresas y transformar sus necesidades en mensajes para redes sociales:

1. **Propuesta Única de Valor** — constructor "Ayudo a [tipo de empresa] a [objetivo de financiación] sin [barrera] con [servicio]", con cada bloque activable (icono del ojo).
2. **Psicología del cliente ideal** — persona que decide, problema actual, miedos, deseos, objeciones y palabras que utiliza.
3. **Mensajes para redes** — contenido que reconoce el problema, aborda el miedo y explica una solución posible.
4. **Mapa visual del cliente ideal** — tres bloques: miedos y problemas, motivaciones y deseos, barreras y soluciones. Cada bloque tiene tres filas fijas con dos campos obligatorios para abrir o exportar el informe.

Extras: vista previa del informe y exportación a PDF (html2pdf.js cargado bajo demanda), con avisos para los campos obligatorios.

## Uso rápido (sin instalar nada)

Abrir `estrategia-de-comunicacion.html` con doble clic. Es un único archivo con React y todo el JS incrustado.

Requiere conexión a internet para:
- `cdn.tailwindcss.com` — estilos (igual que el original).
- `cdnjs.cloudflare.com` — html2pdf.js, solo al pulsar "PDF".

Si el navegador bloquea algo desde `file://`, servirlo en local:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/estrategia-de-comunicacion.html
```

## Desarrollo

```bash
npm install
npm run dev     # servidor de desarrollo con recarga en caliente
npm run build   # regenera dist/index.html y estrategia-de-comunicacion.html
```

## Estructura

```
src/App.jsx                       Código de la app con identidad INNOVALAUS
src/assets/innovalaus-logo.png   Logo integrado en la app y en el informe
src/main.jsx, src/style.css       Punto de entrada Vite
index.html                        Plantilla HTML (Tailwind CDN)
estrategia-de-comunicacion.html   Build autocontenido listo para abrir
original/                         Copia exacta del proyecto StackBlitz recuperado
```

## Procedencia del código

La página de WordPress (`institutofisiovirtual.com/estrategia-de-comunicacion/`) solo incrusta un iframe a `estrategia-de-comunicacion.stackblitz.io`. El código fuente se recuperó del proyecto StackBlitz `estrategia-de-comunicacion` (2026-11-02). La copia histórica sin modificar permanece en `original/`; `src/App.jsx` incorpora la identidad de INNOVALAUS.

Diferencias respecto a StackBlitz:
- Empaquetado con Vite en lugar de react-scripts.
- Versiones fijadas a las que StackBlitz resolvía realmente en ejecución (React 19.2.0, lucide-react 0.555.0), no a las de su `package.json` (18.2.0 / 0.263.1).
- Eliminada la dependencia `firebase`: estaba declarada pero no se usa.
- El logo de INNOVALAUS se incrusta en el HTML autocontenido durante el build.

