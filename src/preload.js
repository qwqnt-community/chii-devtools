const { ipcRenderer } = require("electron");

function injectChiiDevtools({ id: windowId, port: chiiPort }) {
  sessionStorage.setItem("window-id", windowId);
  const script = document.createElement("script");
  script.defer = "defer";
  script.src = `http://localhost:${chiiPort}/target.js`;
  document.head.append(script);
}

ipcRenderer.invoke("chii.ready").then(chiiConfig => {
  injectChiiDevtools(chiiConfig);
  navigation.addEventListener("navigatesuccess", () => {
    injectChiiDevtools(chiiConfig);
  });
});
