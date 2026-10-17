/* Carga, validación, selección de páginas y extracción de PDF. */
import * as pdfjsLib from "../pdfjs/pdf.mjs";
import { crearOCR } from "./ocr.js";
pdfjsLib.GlobalWorkerOptions.workerSrc = "../pdfjs/pdf.worker.mjs";
export function inicializarPDF(app) {
  const {
    archivoPDF,
    botonSeleccionar,
    nombreArchivo,
    zonaArchivo,
    selectorPaginas,
    modoPaginas,
    rangoPaginas,
    infoPaginas,
    botonExtraerPaginas,
    botonCancelarOCR,
    textoExtraido,
    textoResaltado,
    botonCopiar,
    botonExportarTXT,
    botonExportarMarkdown,
    contadorTexto,
    estadoExtraccion,
    buscarTexto,
    resultadoBusqueda,
    busquedaAnterior,
    busquedaSiguiente,
    reemplazarTexto,
    botonReemplazar,
    botonReemplazarTodo,
    botonDeshacer,
    botonRehacer,
  } = app.dom;
  let archivoPDFActual = null;
  let numeroPaginasPDF = 0;
  let identificadorPreparacion = 0;
  let identificadorExtraccion = 0;
  const ocr = crearOCR();

  botonCancelarOCR.addEventListener("click", async () => {
    identificadorExtraccion++;
    await ocr.cancelar();
    estadoExtraccion.textContent = "Operación cancelada";
    botonSeleccionar.disabled = false;
    botonExtraerPaginas.disabled = false;
    botonCancelarOCR.hidden = true;
  });
  // Abrir el selector de archivos.
  botonSeleccionar.addEventListener("click", () => {
    archivoPDF.click();
  });

  // Procesar el archivo seleccionado.
  archivoPDF.addEventListener("change", async () => {
    const archivo = archivoPDF.files[0];

    if (archivo) {
      await prepararDocumento(archivo);
    }

    archivoPDF.value = "";
  });

  // Indicar visualmente que la zona acepta un archivo arrastrado.
  zonaArchivo.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    zonaArchivo.classList.add("arrastrando");
  });

  // Retirar el indicador visual al abandonar la zona.
  zonaArchivo.addEventListener("dragleave", () => {
    zonaArchivo.classList.remove("arrastrando");
  });

  // Procesar el primer archivo soltado en la zona.
  zonaArchivo.addEventListener("drop", async (evento) => {
    evento.preventDefault();
    zonaArchivo.classList.remove("arrastrando");

    const archivo = evento.dataTransfer.files[0];

    if (archivo) {
      await prepararDocumento(archivo);
    }
  });

  // Aceptar el archivo por su tipo MIME o por su extensión.
  function esArchivoPDF(archivo) {
    return Boolean(
      archivo &&
      (archivo.type === "application/pdf" ||
        archivo.name.toLowerCase().endsWith(".pdf")),
    );
  }

  // Validar el archivo, leer su número de páginas, mostrar el selector de
  // páginas y lanzar la extracción del documento completo.
  async function prepararDocumento(archivo) {
    const idPreparacion = ++identificadorPreparacion;

    // Invalidar cualquier extracción que pertenezca al documento anterior.
    identificadorExtraccion++;

    if (!esArchivoPDF(archivo)) {
      estadoExtraccion.textContent = "Selecciona un archivo PDF";
      nombreArchivo.textContent = "Archivo no válido";
      return;
    }

    botonSeleccionar.disabled = true;
    botonExtraerPaginas.disabled = true;

    estadoExtraccion.textContent = "Preparando documento...";
    selectorPaginas.hidden = true;

    let tareaCargaPDF = null;

    try {
      const datos = new Uint8Array(await archivo.arrayBuffer());

      // Si el usuario seleccionó otro archivo mientras se leía este,
      // no continuar con una preparación que ya quedó obsoleta.
      if (idPreparacion !== identificadorPreparacion) return;

      tareaCargaPDF = pdfjsLib.getDocument({
        data: datos,
      });

      const documentoPDF = await tareaCargaPDF.promise;

      if (idPreparacion !== identificadorPreparacion) {
        return;
      }

      archivoPDFActual = archivo;
      numeroPaginasPDF = documentoPDF.numPages;

      nombreArchivo.textContent = archivo.name;

      infoPaginas.textContent = `El documento tiene ${numeroPaginasPDF} páginas.`;

      modoPaginas.value = "todas";
      rangoPaginas.value = "";
      rangoPaginas.hidden = true;
      selectorPaginas.hidden = false;
    } catch (error) {
      if (idPreparacion !== identificadorPreparacion) return;

      console.error("Error al preparar el PDF:", error);

      archivoPDFActual = null;
      numeroPaginasPDF = 0;

      estadoExtraccion.textContent = `No se pudo abrir el PDF: ${error.message || error}`;
    } finally {
      if (tareaCargaPDF) {
        try {
          await tareaCargaPDF.destroy();
        } catch (error) {
          console.warn("Error al liberar el PDF:", error);
        }
      }

      // Una preparación antigua no debe habilitar botones mientras
      // una preparación más reciente sigue trabajando.
      if (idPreparacion === identificadorPreparacion) {
        botonSeleccionar.disabled = false;
        botonExtraerPaginas.disabled = false;
      }
    }

    // Mantener la extracción automática del documento completo.
    if (
      idPreparacion === identificadorPreparacion &&
      archivoPDFActual === archivo &&
      numeroPaginasPDF > 0
    ) {
      await extraerTexto(archivo, listaDePaginas(1, numeroPaginasPDF));
    }
  }

  // Lista de números de página consecutivos, ambos extremos incluidos.
  function listaDePaginas(inicio, fin) {
    if (
      !Number.isInteger(inicio) ||
      !Number.isInteger(fin) ||
      inicio < 1 ||
      fin < inicio
    ) {
      return [];
    }

    return Array.from(
      { length: fin - inicio + 1 },
      (_, indice) => inicio + indice,
    );
  }

  // Actualizar la interfaz según el modo de selección.
  modoPaginas.addEventListener("change", () => {
    rangoPaginas.hidden = modoPaginas.value === "todas";

    if (modoPaginas.value === "rango") {
      rangoPaginas.placeholder = "Ej.: 2-5";

      infoPaginas.textContent = `Introduce un rango entre 1 y ${numeroPaginasPDF}.`;
    } else if (modoPaginas.value === "especificas") {
      rangoPaginas.placeholder = "Ej.: 1, 3, 7";

      infoPaginas.textContent = `Separa las páginas con comas. Máximo: ${numeroPaginasPDF}.`;
    } else {
      infoPaginas.textContent = `El documento tiene ${numeroPaginasPDF} páginas.`;
    }
  });

  // Mostrar un mensaje de validación y devolver el foco al campo de páginas.
  // Devuelve null para indicar que no hay una selección válida.
  function rechazarSeleccionPaginas(mensaje) {
    estadoExtraccion.textContent = mensaje;
    rangoPaginas.focus();

    return null;
  }

  // Interpretar un rango como "2-5". Devuelve las páginas o null.
  function leerRango(entrada) {
    const coincidencia = entrada.match(/^(\d+)\s*-\s*(\d+)$/);

    if (!coincidencia) {
      return rechazarSeleccionPaginas(
        "Formato incorrecto. Usa, por ejemplo, 2-5.",
      );
    }

    const inicio = Number(coincidencia[1]);
    const fin = Number(coincidencia[2]);

    if (inicio < 1 || fin > numeroPaginasPDF || inicio > fin) {
      return rechazarSeleccionPaginas(
        `El rango debe estar entre 1 y ${numeroPaginasPDF}.`,
      );
    }

    return listaDePaginas(inicio, fin);
  }

  // Interpretar páginas sueltas como "1, 3, 7". Devuelve las páginas
  // (sin repetidas) o null.
  function leerPaginasEspecificas(entrada) {
    const partes = entrada.split(",").map((parte) => parte.trim());

    if (partes.length === 0 || partes.some((parte) => !/^\d+$/.test(parte))) {
      return rechazarSeleccionPaginas(
        "Usa números separados por comas, por ejemplo: 1, 3, 7.",
      );
    }

    const paginas = [...new Set(partes.map(Number))];

    if (paginas.some((pagina) => pagina < 1 || pagina > numeroPaginasPDF)) {
      return rechazarSeleccionPaginas(
        `Las páginas deben estar entre 1 y ${numeroPaginasPDF}.`,
      );
    }

    return paginas.sort((a, b) => a - b);
  }

  // Obtener las páginas pedidas según el modo elegido, o null si la entrada
  // no es válida (el mensaje de error ya queda mostrado).
  function leerPaginasSolicitadas() {
    if (modoPaginas.value === "todas") {
      return listaDePaginas(1, numeroPaginasPDF);
    }

    const entrada = rangoPaginas.value.trim();

    if (!entrada) {
      return rechazarSeleccionPaginas(
        "Introduce las páginas que deseas extraer.",
      );
    }

    return modoPaginas.value === "rango"
      ? leerRango(entrada)
      : leerPaginasEspecificas(entrada);
  }

  // Validar la selección y solicitar la extracción.
  botonExtraerPaginas.addEventListener("click", async () => {
    if (!archivoPDFActual || numeroPaginasPDF < 1) {
      estadoExtraccion.textContent = "Primero selecciona un PDF.";
      return;
    }

    const paginasSeleccionadas = leerPaginasSolicitadas();

    if (!paginasSeleccionadas) return;

    botonSeleccionar.disabled = true;
    botonExtraerPaginas.disabled = true;

    try {
      await extraerTexto(archivoPDFActual, paginasSeleccionadas);
    } finally {
      // No habilitar los botones si otra operación sigue activa.
      if (!botonSeleccionar.disabled || !botonExtraerPaginas.disabled) {
        return;
      }

      botonSeleccionar.disabled = false;
      botonExtraerPaginas.disabled = false;
    }
  });

  // Calcular la mediana; utilizar 10 cuando no hay valores.
  function calcularMediana(valores) {
    if (!valores.length) return 10;

    const ordenados = [...valores].sort((a, b) => a - b);
    const medio = Math.floor(ordenados.length / 2);

    return ordenados.length % 2 === 0
      ? (ordenados[medio - 1] + ordenados[medio]) / 2
      : ordenados[medio];
  }

  // Normalizar el texto para comparar encabezados ignorando
  // mayúsculas, acentos y diferencias de espacios o puntuación.
  function normalizarLinea(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  // Identificar encabezados, logotipos y pies institucionales.
  function esTextoInstitucional(texto) {
    const normalizado = normalizarLinea(texto);

    const patrones = [
      /\bhonorable camara\b/,
      /\bcamara de diputados\b/,
      /\bdiputados\b/,
      /\bperucho cassani\b/,
      /\buna camara moderna\b/,
      /\bel futuro en sus manos\b/,
      /\bpresidencia\b/,
      /\bde los chicos\b/,
    ];

    return patrones.some((patron) => patron.test(normalizado));
  }

  // Eliminar caracteres de control que algunos PDF pueden introducir
  // en las cadenas de texto. Se sustituyen por espacios para no pegar
  // accidentalmente palabras que estaban separadas.
  function limpiarTextoPDF(texto) {
    return texto
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Ordenar los elementos por coordenada vertical y agruparlos
  // por proximidad, evitando un comparador no transitivo.
  function agruparLineas(elementos, tolerancia) {
    const ordenados = [...elementos].sort((a, b) => {
      const diferenciaY = b.y - a.y;

      if (Math.abs(diferenciaY) > 0.001) {
        return diferenciaY;
      }

      return a.x - b.x;
    });

    const grupos = [];

    for (const elemento of ordenados) {
      let grupo = grupos.find(
        (actual) => Math.abs(actual.yReferencia - elemento.y) <= tolerancia,
      );

      if (!grupo) {
        grupo = {
          yReferencia: elemento.y,
          elementos: [],
        };

        grupos.push(grupo);
      }

      grupo.elementos.push(elemento);

      grupo.yReferencia =
        grupo.elementos.reduce((suma, item) => suma + item.y, 0) /
        grupo.elementos.length;
    }

    return grupos
      .map((grupo) => {
        const elementosLinea = grupo.elementos.sort((a, b) => a.x - b.x);

        const texto = elementosLinea
          .map((elemento) => elemento.texto)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        // Conservar la posición relativa y la fuente de los elementos.
        // Esto permite que el detector de encabezados y pies repetidos
        // pueda distinguir las líneas cercanas a los márgenes.
        const posicionesRelativas = elementosLinea
          .map((elemento) => elemento.posicionRelativa)
          .filter(Number.isFinite);

        const posicionRelativa = posicionesRelativas.length
          ? posicionesRelativas.reduce((suma, posicion) => suma + posicion, 0) /
            posicionesRelativas.length
          : null;

        return {
          texto,
          y: grupo.yReferencia,
          fuente: Math.max(
            ...elementosLinea.map((elemento) => elemento.fuente),
          ),
          posicionRelativa,
        };
      })
      .filter((linea) => linea.texto.length > 0)
      .sort((a, b) => b.y - a.y);
  }

  // Detectar líneas repetidas entre páginas que se encuentran cerca
  // de los márgenes y probablemente pertenecen al diseño del documento.
  function detectarEncabezadosRepetidos(paginas) {
    const apariciones = new Map();

    for (let indicePagina = 0; indicePagina < paginas.length; indicePagina++) {
      const pagina = paginas[indicePagina];

      for (const linea of pagina.lineas) {
        const clave = normalizarLinea(linea.texto);

        if (!clave || clave.length < 4) continue;

        if (!apariciones.has(clave)) {
          apariciones.set(clave, {
            paginas: new Set(),
            texto: linea.texto,
            posiciones: [],
            fuentes: [],
          });
        }

        const registro = apariciones.get(clave);

        // Contabilizar como máximo una página por aparición.
        registro.paginas.add(indicePagina);

        if (Number.isFinite(linea.posicionRelativa)) {
          registro.posiciones.push(linea.posicionRelativa);
        }

        if (Number.isFinite(linea.fuente)) {
          registro.fuentes.push(linea.fuente);
        }
      }
    }

    const excluidas = new Set();

    for (const [clave, registro] of apariciones) {
      const repetidaEnVariasPaginas = registro.paginas.size >= 2;

      const estaEnMargen = registro.posiciones.some(
        (posicion) => posicion <= 0.22 || posicion >= 0.84,
      );

      // Excluir las referencias institucionales incluso si no están
      // ubicadas dentro de los márgenes habituales.
      if (esTextoInstitucional(registro.texto)) {
        excluidas.add(clave);
        continue;
      }

      if (!repetidaEnVariasPaginas || !estaEnMargen) {
        continue;
      }

      // Preservar las líneas grandes, que podrían ser títulos.
      const fuenteMediana = calcularMediana(registro.fuentes);

      const tieneFuenteGrande = registro.fuentes.some(
        (fuente) => fuente >= fuenteMediana * 1.25,
      );

      if (tieneFuenteGrande) {
        continue;
      }

      excluidas.add(clave);
    }

    return excluidas;
  }

  // Leer una página y devolver sus líneas ordenadas de arriba hacia abajo.
  async function leerLineasDePagina(documentoPDF, numeroPagina) {
    const paginaPDF = await documentoPDF.getPage(numeroPagina);

    try {
      const contenido = await paginaPDF.getTextContent();
      const vista = paginaPDF.view;

      const altoPagina = Math.max(1, vista[3] - vista[1]);

      const elementos = contenido.items
        .filter(
          (elemento) =>
            typeof elemento.str === "string" &&
            elemento.str.trim().length > 0 &&
            elemento.transform,
        )
        .map((elemento) => {
          const transformacion = elemento.transform;

          const fuente =
            Math.hypot(transformacion[0], transformacion[1]) ||
            elemento.height ||
            10;

          const y = transformacion[5];

          // Convertir la coordenada vertical del PDF,
          // cuyo origen está abajo, a una posición relativa
          // desde arriba en el intervalo aproximado 0..1.
          const posicionRelativa = Math.max(
            0,
            Math.min(1, (vista[3] - y) / altoPagina),
          );

          return {
            texto: limpiarTextoPDF(elemento.str),
            x: transformacion[4],
            y,
            fuente,
            posicionRelativa,
          };
        })
        .filter((elemento) => elemento.texto.length > 0);

      const fuenteBase = calcularMediana(
        elementos.map((elemento) => elemento.fuente),
      );

      return agruparLineas(elementos, Math.max(2, fuenteBase * 0.2));
    } finally {
      paginaPDF.cleanup();
    }
  }

  // Convertir las líneas de una página en bloques separados por una línea
  // en blanco: los títulos van solos y los renglones de un mismo párrafo
  // se unen. Registra los títulos en `app.estado.titulosDetectados`.
  function armarTextoDePagina(lineas) {
    if (!lineas.length) return "";

    const fuenteBase = calcularMediana(lineas.map((linea) => linea.fuente));

    const distanciasVerticales = [];

    for (let i = 1; i < lineas.length; i++) {
      const distancia = Math.abs(lineas[i - 1].y - lineas[i].y);

      if (distancia > 1) {
        distanciasVerticales.push(distancia);
      }
    }

    const espacioLineaMedio = calcularMediana(distanciasVerticales);

    const umbralParrafo = Math.max(
      fuenteBase * 1.4,
      espacioLineaMedio * 1.4,
      8,
    );

    const bloques = [];

    let parrafoActual = "";
    let lineaAnteriorY = null;

    for (const linea of lineas) {
      const textoLinea = linea.texto;
      const alturaLinea = linea.fuente;

      // Conservar los títulos como texto plano y registrar
      // su nivel para utilizarlos en la exportación Markdown.
      const esTitulo =
        alturaLinea >= fuenteBase * 1.25 && textoLinea.length < 100;

      const saltoGrande =
        lineaAnteriorY !== null &&
        Math.abs(linea.y - lineaAnteriorY) > umbralParrafo;

      if (esTitulo) {
        if (parrafoActual.trim()) {
          bloques.push(parrafoActual.trim());
          parrafoActual = "";
        }

        const nivel = alturaLinea >= fuenteBase * 1.6 ? 1 : 2;

        app.estado.titulosDetectados.set(textoLinea, nivel);
        bloques.push(textoLinea);
      } else {
        if (saltoGrande && parrafoActual.trim()) {
          bloques.push(parrafoActual.trim());
          parrafoActual = "";
        }

        // Unir los renglones de un mismo párrafo.
        // Los saltos entre bloques se conservan cuando
        // la separación vertical supera el umbral.
        parrafoActual += (parrafoActual ? " " : "") + textoLinea;
      }

      lineaAnteriorY = linea.y;
    }

    if (parrafoActual.trim()) {
      bloques.push(parrafoActual.trim());
    }

    return bloques.join("\n\n");
  }

  // Extraer el texto de las páginas indicadas y mostrarlo en el editor.
  async function extraerTexto(archivo, paginasSeleccionadas) {
    const idExtraccion = ++identificadorExtraccion;
    botonCancelarOCR.hidden = false;
    let documentoPDF = null;
    let errorOCR = null;

    textoExtraido.value = "";
    app.estado.titulosDetectados = new Map();

    app.funciones.actualizarTexto();
    app.funciones.buscarCoincidencias();

    if (!esArchivoPDF(archivo)) {
      estadoExtraccion.textContent = "Selecciona un archivo PDF";
      return;
    }

    nombreArchivo.textContent = archivo.name;
    app.estado.nombrePDFOriginal = archivo.name;

    estadoExtraccion.textContent = "Leyendo documento...";
    botonSeleccionar.disabled = true;
    botonExtraerPaginas.disabled = true;

    try {
      const datosPDF = new Uint8Array(await archivo.arrayBuffer());

      // Si comenzó otra extracción mientras se leía el archivo,
      // cancelar esta operación antes de abrir el documento.
      if (idExtraccion !== identificadorExtraccion) return;

      documentoPDF = await pdfjsLib.getDocument({
        data: datosPDF,
      }).promise;

      // PASO 1: extraer y organizar las líneas de cada página.
      const paginasProcesadas = [];

      for (const numeroPagina of paginasSeleccionadas) {
        if (idExtraccion !== identificadorExtraccion) return;

        estadoExtraccion.textContent = `Analizando página ${numeroPagina} de ${documentoPDF.numPages}...`;

        let lineas = await leerLineasDePagina(documentoPDF, numeroPagina);

        // OCR complementario para páginas sin una capa de texto seleccionable.
        if (lineas.length === 0) {
          estadoExtraccion.textContent = `Página ${numeroPagina}: preparando OCR en español...`;
          const paginaPDF = await documentoPDF.getPage(numeroPagina);
          const viewport = paginaPDF.getViewport({ scale: 1.75 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          try {
            await paginaPDF.render({
              canvasContext: canvas.getContext("2d"),
              viewport,
            }).promise;
            if (idExtraccion !== identificadorExtraccion) return;
            const resultadoOCR = await ocr.reconocer(canvas, (progreso) => {
              if (idExtraccion !== identificadorExtraccion) return;
              const porcentaje = Math.round((progreso.progress || 0) * 100);
              const etapa =
                progreso.status === "recognizing text"
                  ? "reconociendo texto"
                  : "cargando idioma español";
              estadoExtraccion.textContent = `OCR página ${numeroPagina}/${paginasSeleccionadas.length}: ${etapa} (${porcentaje}%)`;
            });
            lineas = (resultadoOCR.data.lines || [])
              .map((linea) => ({
                texto: linea.text.trim(),
                y: -linea.bbox.y0,
                fuente: Math.max(1, linea.bbox.y1 - linea.bbox.y0),
                posicionRelativa: null,
              }))
              .filter((linea) => linea.texto.length > 0);
          } catch (error) {
            if (idExtraccion !== identificadorExtraccion) return;
            errorOCR = error;
            console.error(
              `OCR no disponible en la página ${numeroPagina}:`,
              error,
            );
            lineas = [];
          } finally {
            canvas.width = 0;
            canvas.height = 0;
            paginaPDF.cleanup();
          }
        }

        if (idExtraccion !== identificadorExtraccion) return;

        paginasProcesadas.push({ numeroPagina, lineas });
      }

      if (idExtraccion !== identificadorExtraccion) return;

      // PASO 2: detectar encabezados y pies repetidos entre páginas.
      const lineasExcluidas = detectarEncabezadosRepetidos(paginasProcesadas);

      // PASO 3: construir el contenido excluyendo los elementos
      // de diseño identificados en el paso anterior.
      const paginasTexto = [];

      for (const pagina of paginasProcesadas) {
        const lineas = pagina.lineas.filter((linea) => {
          const clave = normalizarLinea(linea.texto);

          return !lineasExcluidas.has(clave);
        });

        paginasTexto.push(armarTextoDePagina(lineas));
      }

      if (idExtraccion !== identificadorExtraccion) return;

      const textoCompleto = paginasTexto
        .map((pagina) => pagina.trim())
        .filter(Boolean)
        .join("\n\n");

      textoExtraido.value = textoCompleto;

      app.funciones.actualizarTexto();
      app.funciones.buscarCoincidencias();
      app.funciones.reiniciarHistorial(textoCompleto);

      botonCancelarOCR.hidden = true;
      estadoExtraccion.textContent = textoCompleto.trim()
        ? errorOCR
          ? "Extracción completada; una o más páginas no pudieron procesarse con OCR"
          : "Extracción completada"
        : errorOCR
          ? `No se encontró texto extraíble y el OCR falló: ${errorOCR.message || errorOCR}`
          : "No se encontró texto seleccionable en el PDF";
    } catch (error) {
      if (idExtraccion !== identificadorExtraccion) return;

      console.error("Error al leer el PDF:", error);

      textoExtraido.value = "";
      app.estado.titulosDetectados = new Map();

      app.funciones.actualizarTexto();
      app.funciones.buscarCoincidencias();
      app.funciones.reiniciarHistorial("");

      estadoExtraccion.textContent = `Error al leer el PDF: ${error.message || error}`;
    } finally {
      if (documentoPDF) {
        try {
          await documentoPDF.destroy();
        } catch (error) {
          console.warn("No se pudieron liberar los recursos del PDF:", error);
        }
      }

      // Solo la extracción más reciente puede actualizar el estado
      // de los botones al terminar.
      if (idExtraccion === identificadorExtraccion) {
        botonSeleccionar.disabled = false;
        botonExtraerPaginas.disabled = false;
        botonCancelarOCR.hidden = true;
      }
    }
  }
}
