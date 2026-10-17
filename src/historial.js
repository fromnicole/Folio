/* Historial de cambios, deshacer y rehacer. */
export function crearHistorial(app) {
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
  let funciones = { actualizarTexto() {}, buscarCoincidencias() {} };
  let historialTexto = [];
  let indiceHistorial = -1;
  let temporizadorHistorial = null;
  // Guardar una nueva versión del texto y descartar la rama posterior
  // del historial cuando se edita después de deshacer.
  function guardarEnHistorial(texto) {
    if (historialTexto[indiceHistorial] === texto) {
      return;
    }

    historialTexto = historialTexto.slice(0, indiceHistorial + 1);

    historialTexto.push(texto);

    if (historialTexto.length > 100) {
      historialTexto.shift();
    }

    indiceHistorial = historialTexto.length - 1;

    actualizarBotonesHistorial();
  }

  // Reiniciar el historial al establecer un nuevo texto base.
  function reiniciarHistorial(texto) {
    clearTimeout(temporizadorHistorial);

    historialTexto = [texto];
    indiceHistorial = 0;

    actualizarBotonesHistorial();
  }

  // Sincronizar los botones con la posición actual del historial.
  function actualizarBotonesHistorial() {
    botonDeshacer.disabled = indiceHistorial <= 0;

    botonRehacer.disabled = indiceHistorial >= historialTexto.length - 1;
  }

  // Restaurar una versión del texto en el editor.
  function restaurarTexto(texto) {
    clearTimeout(temporizadorHistorial);

    textoExtraido.value = texto;

    funciones.actualizarTexto();
    funciones.buscarCoincidencias();
    actualizarBotonesHistorial();
  }

  // Retroceder una posición en el historial.
  function deshacerCambio() {
    clearTimeout(temporizadorHistorial);

    if (indiceHistorial <= 0) return;

    indiceHistorial--;

    restaurarTexto(historialTexto[indiceHistorial]);
  }

  // Avanzar una posición en el historial.
  function rehacerCambio() {
    clearTimeout(temporizadorHistorial);

    if (indiceHistorial >= historialTexto.length - 1) {
      return;
    }

    indiceHistorial++;

    restaurarTexto(historialTexto[indiceHistorial]);
  }

  // Agrupar las modificaciones de escritura realizadas en un intervalo
  // de 400 ms antes de guardarlas en el historial.
  textoExtraido.addEventListener("input", () => {
    clearTimeout(temporizadorHistorial);

    temporizadorHistorial = setTimeout(() => {
      guardarEnHistorial(textoExtraido.value);
    }, 400);
  });

  // Eventos de los botones del historial.
  botonDeshacer.addEventListener("click", deshacerCambio);
  botonRehacer.addEventListener("click", rehacerCambio);

  // Atajos de teclado para deshacer y rehacer.
  document.addEventListener("keydown", (evento) => {
    if (!(evento.ctrlKey || evento.metaKey) || evento.altKey) {
      return;
    }

    const objetivo = evento.target;

    if (objetivo !== textoExtraido && objetivo.tagName !== "BODY") {
      return;
    }

    const tecla = evento.key.toLowerCase();

    if (tecla === "z" && !evento.shiftKey) {
      evento.preventDefault();
      deshacerCambio();
    } else if (tecla === "y" || (tecla === "z" && evento.shiftKey)) {
      evento.preventDefault();
      rehacerCambio();
    }
  });
  return {
    conectar(nuevasFunciones) {
      funciones = nuevasFunciones;
    },
    guardarEnHistorial,
    reiniciarHistorial,
    cancelarTemporizador() {
      clearTimeout(temporizadorHistorial);
    },
  };
}
