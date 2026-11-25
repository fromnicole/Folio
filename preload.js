const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("folio", {
  abrirPDF: () => ipcRenderer.invoke("abrir-pdf"),

  guardarTexto: (contenido, nombreArchivo, formato = "txt") =>
    ipcRenderer.invoke("guardar-texto", {
      contenido,
      nombreArchivo,
      formato,
    }),
});
