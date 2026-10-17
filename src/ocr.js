/* OCR local de páginas PDF renderizadas por PDF.js. */

const TESSERACT = globalThis.Tesseract;

function crearRutasLocales() {
  const baseDocumento = document.baseURI.includes("/app.asar/")
    ? document.baseURI.replace("/app.asar/", "/app.asar.unpacked/")
    : document.baseURI;
  const desdeDocumento = (ruta) => new URL(ruta, baseDocumento).href;

  return {
    workerPath: desdeDocumento("node_modules/tesseract.js/dist/worker.min.js"),
    langPath: desdeDocumento(
      "node_modules/@tesseract.js-data/spa/4.0.0_best_int/",
    ),
    corePath: desdeDocumento("node_modules/tesseract.js-core/"),
    workerBlobURL: false,
  };
}

export function crearOCR() {
  let trabajador = null;
  let promesaTrabajador = null;
  let callbackProgreso = () => {};
  let generacion = 0;

  async function obtenerTrabajador(onProgress) {
    callbackProgreso = onProgress;

    if (!TESSERACT?.createWorker) {
      throw new Error("No se pudo cargar el motor OCR local de Folio.");
    }

    if (!promesaTrabajador) {
      const generacionActual = generacion;
      promesaTrabajador = TESSERACT.createWorker("spa", 1, {
        ...crearRutasLocales(),
        logger: (mensaje) => callbackProgreso(mensaje),
      })
        .then((nuevoTrabajador) => {
          if (generacionActual !== generacion) {
            nuevoTrabajador.terminate();
            throw new Error("OCR_CANCELADO");
          }

          trabajador = nuevoTrabajador;
          return nuevoTrabajador;
        })
        .catch((error) => {
          promesaTrabajador = null;
          throw error;
        });
    }

    return promesaTrabajador;
  }

  return {
    async reconocer(canvas, onProgress = () => {}) {
      const trabajadorActual = await obtenerTrabajador(onProgress);
      const generacionActual = generacion;
      const resultado = await trabajadorActual.recognize(canvas);

      if (generacionActual !== generacion) {
        throw new Error("OCR_CANCELADO");
      }

      return resultado;
    },

    async cancelar() {
      generacion++;
      const trabajadorActual = trabajador;
      trabajador = null;
      promesaTrabajador = null;
      if (trabajadorActual) await trabajadorActual.terminate();
    },
  };
}
