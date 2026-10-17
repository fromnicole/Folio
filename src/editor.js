/* Contador, búsqueda, resaltado y reemplazo. */
export function inicializarEditor(app, historial) {
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
  let coincidenciasBusqueda = [];
  let indiceBusqueda = -1;
  // Actualizar el contador y habilitar los botones que dependen de que haya
  // texto. Se ejecuta en cada cambio del editor (ver listener en la sección 12).
  function actualizarTexto() {
    const texto = textoExtraido.value;
    const textoLimpio = texto.trim();

    const palabras = textoLimpio ? textoLimpio.split(/\s+/).length : 0;

    const hayTexto = textoLimpio.length > 0;

    contadorTexto.textContent = `${palabras} palabras · ${texto.length} caracteres`;

    botonCopiar.disabled = !hayTexto;
    botonExportarTXT.disabled = !hayTexto;
    botonExportarMarkdown.disabled = !hayTexto;
  }
  // Escapar caracteres HTML para representar el texto de forma segura
  // dentro de la capa visual de resaltado.
  function escaparHTML(texto) {
    return texto.replace(
      /[&<>"']/g,
      (caracter) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[caracter],
    );
  }

  // Escapar caracteres especiales para construir una expresión regular literal.
  function escaparRegExp(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Igualar el ancho útil de la capa de resaltado al del editor.
  function ajustarAnchoResaltado() {
    // El textarea reserva espacio para su barra de desplazamiento.
    // El overlay debe tener exactamente el mismo ancho útil.
    textoResaltado.style.width = `${textoExtraido.clientWidth}px`;
  }

  // Mantener sincronizado el desplazamiento del editor y su overlay.
  function sincronizarDesplazamiento() {
    textoResaltado.scrollTop = textoExtraido.scrollTop;
    textoResaltado.scrollLeft = textoExtraido.scrollLeft;
  }

  // Ajustar la capa cuando cambia el tamaño del editor.
  if ("ResizeObserver" in window) {
    const observadorEditor = new ResizeObserver(() => {
      ajustarAnchoResaltado();
      sincronizarDesplazamiento();
    });

    observadorEditor.observe(textoExtraido);
  }

  window.addEventListener("resize", () => {
    ajustarAnchoResaltado();
    sincronizarDesplazamiento();
  });

  // Construir la representación visual del texto y sus coincidencias.
  function actualizarResaltado() {
    const texto = textoExtraido.value;
    const fragmentos = [];

    let posicion = 0;

    for (let i = 0; i < coincidenciasBusqueda.length; i++) {
      const { inicio, fin } = coincidenciasBusqueda[i];

      fragmentos.push(escaparHTML(texto.slice(posicion, inicio)));

      const clase = i === indiceBusqueda ? "activa" : "coincidencia";

      fragmentos.push(
        `<mark class="${clase}">${escaparHTML(
          texto.slice(inicio, fin),
        )}</mark>`,
      );

      posicion = fin;
    }

    fragmentos.push(escaparHTML(texto.slice(posicion)));

    ajustarAnchoResaltado();

    textoResaltado.innerHTML = fragmentos.join("");

    requestAnimationFrame(() => {
      sincronizarDesplazamiento();
    });
  }

  // Actualizar el estado de los controles de navegación.
  function actualizarBotonesBusqueda() {
    const hayCoincidencias = coincidenciasBusqueda.length > 0;

    busquedaAnterior.disabled = !hayCoincidencias;
    busquedaSiguiente.disabled = !hayCoincidencias;
  }

  // Actualizar el estado de los controles de reemplazo.
  function actualizarBotonesReemplazo() {
    const hayCoincidencias = coincidenciasBusqueda.length > 0;

    botonReemplazar.disabled = !hayCoincidencias;
    botonReemplazarTodo.disabled = !hayCoincidencias;
  }

  // Buscar coincidencias sin distinguir mayúsculas y minúsculas.
  // Las posiciones se calculan sobre el texto original para que el resaltado
  // y los reemplazos no dependan de la longitud de la versión en minúsculas.
  function buscarCoincidencias() {
    const termino = buscarTexto.value.trim();
    const texto = textoExtraido.value;

    coincidenciasBusqueda = [];
    indiceBusqueda = -1;

    reemplazarTexto.disabled = !termino;

    if (!termino) {
      reemplazarTexto.value = "";
    } else {
      try {
        const expresion = new RegExp(escaparRegExp(termino), "giu");

        for (const coincidencia of texto.matchAll(expresion)) {
          if (coincidencia.index === undefined) continue;

          coincidenciasBusqueda.push({
            inicio: coincidencia.index,
            fin: coincidencia.index + coincidencia[0].length,
          });
        }
      } catch (error) {
        console.warn("No se pudo completar la búsqueda:", error);
      }
    }

    if (coincidenciasBusqueda.length > 0) {
      indiceBusqueda = 0;

      resultadoBusqueda.textContent = `1 de ${coincidenciasBusqueda.length}`;
    } else {
      resultadoBusqueda.textContent = termino ? "0 resultados" : "";
    }

    actualizarBotonesBusqueda();
    actualizarBotonesReemplazo();
    actualizarResaltado();
  }

  // Mostrar y centrar visualmente la coincidencia activa.
  function mostrarCoincidencia() {
    if (indiceBusqueda < 0 || coincidenciasBusqueda.length === 0) {
      return;
    }

    resultadoBusqueda.textContent = `${indiceBusqueda + 1} de ${coincidenciasBusqueda.length}`;

    actualizarResaltado();

    requestAnimationFrame(() => {
      const marcas = textoResaltado.querySelectorAll("mark");
      const marcaActiva = marcas[indiceBusqueda];

      if (!marcaActiva) return;

      const posiciones = marcaActiva.getClientRects();

      if (!posiciones.length) return;

      const area = textoExtraido.getBoundingClientRect();
      const palabra = posiciones[0];

      const centroArea = area.top + area.height / 2;
      const centroPalabra = palabra.top + palabra.height / 2;

      textoExtraido.scrollTop += centroPalabra - centroArea;

      sincronizarDesplazamiento();
    });
  }

  // Eventos de búsqueda y navegación.
  buscarTexto.addEventListener("input", buscarCoincidencias);

  busquedaAnterior.addEventListener("click", () => {
    if (!coincidenciasBusqueda.length) return;

    indiceBusqueda =
      (indiceBusqueda - 1 + coincidenciasBusqueda.length) %
      coincidenciasBusqueda.length;

    mostrarCoincidencia();
  });

  busquedaSiguiente.addEventListener("click", () => {
    if (!coincidenciasBusqueda.length) return;

    indiceBusqueda = (indiceBusqueda + 1) % coincidenciasBusqueda.length;

    mostrarCoincidencia();
  });

  // Actualizar contador y búsqueda cuando cambia el texto del editor.
  textoExtraido.addEventListener("input", () => {
    actualizarTexto();
    buscarCoincidencias();
  });

  // Mantener sincronizado el desplazamiento del overlay.
  textoExtraido.addEventListener("scroll", sincronizarDesplazamiento);
  // Reemplazar la coincidencia actualmente seleccionada.
  botonReemplazar.addEventListener("click", () => {
    if (indiceBusqueda < 0 || coincidenciasBusqueda.length === 0) {
      return;
    }

    historial.cancelarTemporizador();

    const textoOriginal = textoExtraido.value;
    historial.guardarEnHistorial(textoOriginal);

    const { inicio, fin } = coincidenciasBusqueda[indiceBusqueda];
    const reemplazo = reemplazarTexto.value;

    textoExtraido.setRangeText(reemplazo, inicio, fin, "start");

    actualizarTexto();
    buscarCoincidencias();

    historial.guardarEnHistorial(textoExtraido.value);
  });

  // Reemplazar todas las coincidencias encontradas.
  botonReemplazarTodo.addEventListener("click", () => {
    if (!coincidenciasBusqueda.length) {
      return;
    }

    historial.cancelarTemporizador();

    const textoOriginal = textoExtraido.value;
    const reemplazo = reemplazarTexto.value;

    historial.guardarEnHistorial(textoOriginal);

    const partes = [];
    let posicion = 0;

    for (const coincidencia of coincidenciasBusqueda) {
      partes.push(textoOriginal.slice(posicion, coincidencia.inicio));

      partes.push(reemplazo);

      posicion = coincidencia.fin;
    }

    partes.push(textoOriginal.slice(posicion));

    textoExtraido.value = partes.join("");

    actualizarTexto();
    buscarCoincidencias();

    historial.guardarEnHistorial(textoExtraido.value);
  });
  return { actualizarTexto, buscarCoincidencias };
}
