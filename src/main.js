const chii = require("../chii-build");
const path = require("path");
const net = require("net");
const { BrowserWindow, ipcMain, session } = require("electron");

// 获取空闲端口号
const port = (() => {
  const server = net.createServer().listen(0);
  const { port } = server.address();
  return server.close() && port;
})();

// 启动chii服务器
chii.start({ port });

// 传递端口和窗口id给渲染进程
ipcMain.handle("chii.ready", (event) => {
  return { port, id: event.sender.id };
});

// 打开DevTools
async function openDevTools(window) {
  const targets_url = `http://localhost:${port}/targets`;
  const targets = await (await fetch(targets_url)).json();
  const chiiId = await getChiiTargetId(window);
  for (const target of targets.targets.reverse()) {
    if (target.id === chiiId) {
      const devtools_params = `?ws=localhost:${port}/client/test?target=${target.id}`;
      const devtools_url = `http://localhost:${port}/front_end/chii_app.html${devtools_params}`;
      const devtools_window = new BrowserWindow({
        autoHideMenuBar: true,
      });
      devtools_window.loadURL(devtools_url);
      return devtools_window;
    }
  }
}

// 获取当前窗口的chii id
async function getChiiTargetId(win) {
  return win.webContents.executeJavaScript(
    "sessionStorage.getItem('chii-id')",
    true
  );
}

// 创建窗口时触发
const onBrowserWindowCreated = (window) => {
  let devtools_window = null;
  window.webContents.on("before-input-event", async (event, input) => {
    if ((input.key == "F12" || (
      input.key == "I" && (process.platform === "darwin" ? input.meta : input.control) && input.shift)
    ) && input.type == "keyUp") {
      if (devtools_window) {
        devtools_window.close();
        devtools_window = null;
      }
      else {
        devtools_window = await openDevTools(window);
        devtools_window.on("closed", () => devtools_window = null);
      }
    }
  });
}

if ("qwqnt" in globalThis) {
  qwqnt.main.hooks.whenBrowserWindowCreated.peek(onBrowserWindowCreated);
}

module.exports = { onBrowserWindowCreated };
