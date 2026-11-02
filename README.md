# Estrategia de Comunicación 

Herramienta en 3 pasos para construir una estrategia de comunicación:

1. **Propuesta Única de Valor** — constructor "Ayudo a [avatar] a [beneficio] sin [objeción] con [sistema]", con cada bloque activable (icono del ojo).
2. **Tus 3 mensajes** — qué hacer, qué dejar de hacer, qué pasa si sigue igual.
3. **Mapa de creencias** — creencias conductuales, normativas y de control (Teoría del Comportamiento Planificado), con filas añadibles/eliminables y botón **Autorellenar con IA** (Gemini vía proxy de Google Apps Script).

Extras: guardar/importar la estrategia en JSON, vista previa de informe y exportación a PDF (html2pdf.js cargado bajo demanda), modal propio de avisos/confirmaciones, borrar todo.

## Uso rápido (sin instalar nada)

Abrir `estrategia-de-comunicacion.html` con doble clic. Es un único archivo con React y todo el JS incrustado.

Requiere conexión a internet para:
- `cdn.tailwindcss.com` — estilos (igual que el original).
- `cdnjs.cloudflare.com` — html2pdf.js, solo al pulsar "PDF".
- `script.google.com` — proxy de IA, solo al pulsar "Autorellenar con IA".

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
src/App.jsx                       Código de la app (idéntico al original)
src/main.jsx, src/style.css       Punto de entrada Vite
index.html                        Plantilla HTML (Tailwind CDN)
estrategia-de-comunicacion.html   Build autocontenido listo para abrir
original/                         Copia exacta del proyecto StackBlitz recuperado
```

## Procedencia del código

La página de WordPress (`institutofisiovirtual.com/estrategia-de-comunicacion/`) solo incrusta un iframe a `estrategia-de-comunicacion.stackblitz.io`. El código fuente se recuperó del proyecto StackBlitz `estrategia-de-comunicacion` (2026-11-02). `src/App.jsx` coincide byte a byte con el original (SHA-256 `5722c7acf2b369a59c99bc919e0002e7d492be59abaf3ddb2de6575bc072f5f0`).

Diferencias respecto a StackBlitz:
- Empaquetado con Vite en lugar de react-scripts.
- Versiones fijadas a las que StackBlitz resolvía realmente en ejecución (React 19.2.0, lucide-react 0.555.0), no a las de su `package.json` (18.2.0 / 0.263.1).
- Eliminada la dependencia `firebase`: estaba declarada pero no se usa.
- Los dos logos PNG de `public/` no se incluyen: no los referencia el código.

## Dependencia externa crítica

La IA depende del Apps Script desplegado en `PROXY_URL` (`src/App.jsx`), que guarda la API key de Gemini, la cascada de modelos y el límite diario. Ese código **no** está en este repositorio; si se pierde o se desactiva el despliegue, el botón de IA deja de funcionar. Conviene respaldarlo por separado.
