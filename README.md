# Folio

Aplicación de escritorio para extraer texto de documentos PDF, revisarlo y editarlo antes de guardarlo como texto plano o Markdown. Cuando una página escaneada no contiene texto seleccionable, Folio puede reconocerlo mediante OCR en español.

## Funcionalidades

- Abrir un PDF mediante el selector de archivos o arrastrarlo a la aplicación.
- Elegir todas las páginas, un rango o páginas específicas para extraer.
- Extraer primero la capa de texto del PDF. Si una página no tiene texto seleccionable, renderizarla y aplicar OCR en español.
- Consultar el avance y cancelar una extracción en curso.
- Revisar y editar el resultado en el editor integrado.
- Buscar y reemplazar texto, deshacer y rehacer cambios.
- Copiar el resultado y exportarlo como `.txt` o `.md`.

El OCR complementa la extracción normal. El texto reconocido puede contener errores y conviene revisarlo antes de usarlo. El PDF original no se modifica.

## Tecnologías

- HTML, CSS y JavaScript con módulos ES.
- Electron para la aplicación de escritorio.
- PDF.js para leer y renderizar las páginas PDF.
- Tesseract.js y los datos de idioma español para el OCR.
- `electron-builder` para generar el instalador de Windows configurado por el proyecto.

La interfaz se ejecuta en el renderer de Electron. `main.js` crea la ventana y gestiona el diálogo para guardar archivos; `preload.js` expone la operación de guardado mediante una API limitada. La configuración compartida usa `contextIsolation: true` y `nodeIntegration: false`.

## Requisitos

- Node.js y npm instalados.
- Windows para generar el instalador NSIS configurado en el proyecto. Electron también puede ejecutarse en otros sistemas, pero este repositorio solo contiene una configuración de empaquetado para Windows.

## Instalación y ejecución

Clona el repositorio desde GitHub y entra en la carpeta del proyecto. Después ejecuta:

```bash
npm install
npm start
```

Para generar el instalador de Windows:

```bash
npm run dist
```

El instalador se genera con la configuración de `electron-builder` del proyecto. La ubicación exacta depende de la configuración y la versión de la herramienta.

## Uso

1. Selecciona un PDF o arrástralo a Folio.
2. Elige las páginas que quieres procesar.
3. Pulsa **Extraer selección**.
4. Si alguna página no tiene texto seleccionable, Folio intenta reconocerla con OCR. La primera inicialización del motor puede tardar; los documentos extensos tardan más porque las páginas se procesan secuencialmente.
5. Revisa el texto en el editor y utiliza búsqueda, reemplazo o el historial si lo necesitas.
6. Copia o exporta el resultado como TXT o Markdown.

El OCR automático se aplica a páginas sin texto seleccionable. Una página que combine texto seleccionable con texto dentro de una imagen puede requerir un tratamiento adicional.

## Estructura del proyecto

La siguiente estructura representa los archivos compartidos durante el desarrollo; puede haber otros archivos en el repositorio:

```text
folio/
├── assets/
│   └── folio.ico
├── pdfjs/
│   ├── pdf.mjs
│   └── pdf.worker.mjs
├── src/
│   ├── editor.js        # Edición, búsqueda y reemplazo
│   ├── exportacion.js   # Copia y exportación del resultado
│   ├── historial.js     # Deshacer y rehacer
│   ├── ocr.js           # Adaptador independiente de Tesseract.js
│   ├── pdf.js           # Importación, selección y extracción de páginas
│   └── script.js        # Inicio y conexión de los módulos del renderer
├── index.html           # Interfaz
├── main.js              # Proceso principal de Electron e IPC de guardado
├── package-lock.json    # Versiones concretas de dependencias
├── package.json         # Scripts, dependencias y configuración de empaquetado
├── preload.js           # API limitada entre el renderer y Electron
└── style.css            # Estilos de la interfaz
```

Los módulos `src/` separan la extracción PDF, OCR, edición, historial y exportación. `src/ocr.js` se mantiene independiente para que la integración de Tesseract no concentre la lógica en `main.js` o en el punto de entrada del renderer.

## Privacidad y procesamiento

Los PDF seleccionados se procesan localmente en la aplicación. La exportación utiliza el diálogo de guardado de Electron. No subas documentos personales o confidenciales al repositorio como ejemplos.

## Pruebas y estado

El `package.json` compartido define los comandos `start` y `dist`; no define un comando de pruebas automatizadas. La extracción y el OCR deben comprobarse manualmente con un PDF que tenga texto seleccionable y otro escaneado. Conviene revisar la calidad del resultado y comprobar búsqueda, historial y exportación después de procesar documentos largos.

Folio es actualmente una aplicación de escritorio Electron. Este repositorio no incluye una versión web desplegada.
