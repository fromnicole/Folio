/* Punto de entrada de la interfaz (renderer). */
import { inicializarPDF } from "./pdf.js";
import { inicializarEditor } from "./editor.js";
import { crearHistorial } from "./historial.js";
import { inicializarExportacion } from "./exportacion.js";

const dom = {
  archivoPDF: document.getElementById("archivoPDF"),
  botonSeleccionar: document.getElementById("botonSeleccionar"),
  nombreArchivo: document.getElementById("nombreArchivo"),
  zonaArchivo: document.getElementById("zonaArchivo"),
  selectorPaginas: document.getElementById("selectorPaginas"),
  modoPaginas: document.getElementById("modoPaginas"),
  rangoPaginas: document.getElementById("rangoPaginas"),
  infoPaginas: document.getElementById("infoPaginas"),
  botonExtraerPaginas: document.getElementById("botonExtraerPaginas"),
  botonCancelarOCR: document.getElementById("botonCancelarOCR"),
  textoExtraido: document.getElementById("textoExtraido"),
  textoResaltado: document.getElementById("textoResaltado"),
  botonCopiar: document.getElementById("botonCopiar"),
  botonExportarTXT: document.getElementById("botonExportarTXT"),
  botonExportarMarkdown: document.getElementById("botonExportarMarkdown"),
  contadorTexto: document.getElementById("contadorTexto"),
  estadoExtraccion: document.getElementById("estadoExtraccion"),
  buscarTexto: document.getElementById("buscarTexto"),
  resultadoBusqueda: document.getElementById("resultadoBusqueda"),
  busquedaAnterior: document.getElementById("busquedaAnterior"),
  busquedaSiguiente: document.getElementById("busquedaSiguiente"),
  reemplazarTexto: document.getElementById("reemplazarTexto"),
  botonReemplazar: document.getElementById("botonReemplazar"),
  botonReemplazarTodo: document.getElementById("botonReemplazarTodo"),
  botonDeshacer: document.getElementById("botonDeshacer"),
  botonRehacer: document.getElementById("botonRehacer"),
};

const app = {
  dom,
  estado: { nombrePDFOriginal: "documento.pdf", titulosDetectados: new Map() },
  funciones: {},
};

const historial = crearHistorial(app);
const editor = inicializarEditor(app, historial);
app.funciones = { ...editor, reiniciarHistorial: historial.reiniciarHistorial };
historial.conectar(app.funciones);
inicializarPDF(app);
inicializarExportacion(app);
editor.actualizarTexto();
historial.reiniciarHistorial(dom.textoExtraido.value);
editor.buscarCoincidencias();
