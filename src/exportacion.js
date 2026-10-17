/* Copia y exportación TXT/Markdown. */
export function inicializarExportacion(app) {
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
  botonCopiar.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textoExtraido.value);

      estadoExtraccion.textContent = "Texto copiado al portapapeles";
    } catch (error) {
      textoExtraido.focus();
      textoExtraido.select();

      estadoExtraccion.textContent =
        "Selecciona el texto y cópialo con Ctrl + C";
    }
  });
  // Convertir los títulos a Markdown únicamente al exportar.
  // Esta conversión nunca modifica el texto del editor.
  function convertirAMarkdown(texto) {
    return (
      texto
        .split("\n")
        .map((linea) => {
          const textoLinea = linea.trim();

          if (!textoLinea) {
            return "";
          }

          const nivel = app.estado.titulosDetectados.get(textoLinea);

          if (nivel) {
            return `${"#".repeat(nivel)} ${textoLinea}`;
          }

          return linea;
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim() + "\n"
    );
  }

  // Guardar el contenido mediante el contrato de integración con Electron.
  async function guardarTextoComo(formato) {
    const texto = textoExtraido.value;

    if (!texto.trim()) {
      estadoExtraccion.textContent = "No hay texto para exportar";

      return;
    }

    try {
      // TXT conserva el texto del editor, salvo el ajuste final
      // de salto de línea. Markdown convierte los títulos detectados.
      const contenido =
        formato === "md" ? convertirAMarkdown(texto) : texto.trimEnd() + "\n";

      if (!window.folio || typeof window.folio.guardarTexto !== "function") {
        throw new Error(
          "La función de guardado de Electron no está disponible.",
        );
      }

      const resultado = await window.folio.guardarTexto(
        contenido,
        app.estado.nombrePDFOriginal,
        formato,
      );

      if (!resultado || resultado.cancelado) {
        estadoExtraccion.textContent = "Guardado cancelado";
        return;
      }

      estadoExtraccion.textContent =
        formato === "md"
          ? "Archivo Markdown guardado correctamente"
          : "Archivo TXT guardado correctamente";
    } catch (error) {
      console.error("Error al guardar:", error);

      estadoExtraccion.textContent = `Error al guardar: ${error.message || error}`;
    }
  }

  // Conectar los botones con sus formatos respectivos.
  botonExportarTXT.addEventListener("click", () => {
    guardarTextoComo("txt");
  });

  botonExportarMarkdown.addEventListener("click", () => {
    guardarTextoComo("md");
  });
}
