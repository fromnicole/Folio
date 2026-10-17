const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("folio", {
  guardarTexto: (contenido, nombreArchivo, formato = "txt") =>
    ipcRenderer.invoke("guardar-texto", {
      contenido,
      nombreArchivo,
      formato,
    }),
});
