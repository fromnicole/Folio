const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

let ventanaPrincipal = null;

function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ventanaPrincipal.once("ready-to-show", () => {
    ventanaPrincipal.show();
  });

  ventanaPrincipal.loadFile(path.join(__dirname, "index.html"));

  ventanaPrincipal.on("closed", () => {
    ventanaPrincipal = null;
  });
}

ipcMain.handle("guardar-texto", async (event, datos = {}) => {
  const {
    contenido = "",
    nombreArchivo = "documento",
    formato = "txt",
  } = datos;

  const esMarkdown = formato === "markdown" || formato === "md";
  const extension = esMarkdown ? "md" : "txt";
  const tipoArchivo = esMarkdown ? "Markdown" : "Texto";

  const nombreBase = path.basename(
    String(nombreArchivo || "documento").replace(/\.pdf$/i, ""),
  );

  const nombreSeguro = nombreBase.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

  const resultado = await dialog.showSaveDialog(ventanaPrincipal, {
    title: `Guardar archivo ${tipoArchivo}`,
    defaultPath: `${nombreSeguro || "documento"}.${extension}`,
    buttonLabel: "Guardar",
    filters: [{ name: tipoArchivo, extensions: [extension] }],
  });

  if (resultado.canceled || !resultado.filePath) {
    return { cancelado: true };
  }

  await fs.writeFile(resultado.filePath, String(contenido), "utf8");

  return {
    cancelado: false,
    ruta: resultado.filePath,
  };
});

app.whenReady().then(() => {
  crearVentana();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      crearVentana();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
