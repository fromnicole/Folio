# Folio

**Folio** es una aplicación de escritorio desarrollada con Electron que permite extraer texto de documentos PDF, editarlo y exportarlo en formato TXT o Markdown.

También incorpora reconocimiento óptico de caracteres (OCR) en español para recuperar texto de documentos escaneados o páginas que no contienen texto seleccionable.

## Funcionalidades

- **Importación de PDF:** abre documentos mediante el selector de archivos o arrastrándolos a la aplicación.
- **Selección de páginas:** procesa el documento completo, un rango de páginas o páginas específicas.
- **Extracción de texto:** obtiene el texto directamente del PDF cuando está disponible.
- **Reconocimiento OCR:** reconoce texto en páginas escaneadas que no contienen texto seleccionable.
- **Editor integrado:** permite revisar y modificar el texto extraído.
- **Herramientas de edición:** incluye búsqueda, reemplazo, deshacer y rehacer.
- **Exportación:** copia el resultado o guárdalo como archivo TXT o Markdown.
- **Control del proceso:** muestra el progreso de extracción y permite cancelar una operación.

El documento PDF original permanece sin modificaciones. El texto obtenido mediante OCR puede contener errores, por lo que se recomienda revisarlo antes de exportarlo.

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML, CSS y JavaScript | Interfaz y lógica de la aplicación |
| Electron | Aplicación de escritorio |
| PDF.js | Lectura y renderizado de documentos PDF |
| Tesseract.js | Reconocimiento óptico de caracteres |
| electron-builder | Generación del instalador |

La aplicación utiliza una arquitectura dividida entre el proceso principal de Electron y el renderer. La comunicación necesaria entre ambos se realiza mediante una API limitada expuesta desde `preload.js`, con `contextIsolation` habilitado y `nodeIntegration` deshabilitado.

## Instalación y ejecución

### Requisitos

- Node.js
- npm
- Windows para generar el instalador configurado en el proyecto.

### Ejecutar en desarrollo

Clona el repositorio:

```bash
git clone https://github.com/fromnicole/Folio.git
cd Folio
```

Instala las dependencias:

```bash
npm install
```

Inicia la aplicación:

```bash
npm start
```

### Generar el instalador

Para crear el instalador de Windows:

```bash
npm run dist -- --win nsis
```

El archivo `.exe` generado se encuentra en la carpeta `dist`.

## Cómo utilizar Folio

1. Abre Folio y selecciona un documento PDF o arrástralo a la aplicación.
2. Selecciona las páginas que deseas procesar.
3. Pulsa **Extraer selección**.
4. Espera a que finalice la extracción. Si una página no contiene texto seleccionable, se intentará reconocer su contenido mediante OCR.
5. Revisa y edita el resultado en el editor integrado.
6. Copia el texto o expórtalo como TXT o Markdown.

El tiempo de procesamiento depende de la cantidad de páginas y del uso de OCR. La primera inicialización del motor de reconocimiento puede tardar unos momentos.

## Estructura del proyecto

```text
Folio/
├── assets/
│   └── folio.ico
├── pdfjs/
│   ├── pdf.mjs
│   └── pdf.worker.mjs
├── src/
│   ├── editor.js
│   ├── exportacion.js
│   ├── historial.js
│   ├── ocr.js
│   ├── pdf.js
│   └── script.js
├── index.html
├── main.js
├── preload.js
├── package.json
├── package-lock.json
└── style.css
```

## Privacidad

El procesamiento de los documentos se realiza localmente en la aplicación. Los archivos PDF no necesitan enviarse a un servidor externo para realizar la extracción de texto o el reconocimiento OCR.

## Estado del proyecto

Folio es una aplicación de escritorio para Windows desarrollada con Electron. El repositorio contiene el código fuente y la configuración necesaria para ejecutar la aplicación y generar su instalador.
