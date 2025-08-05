import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow, ipcMain, screen} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';
import FullScreenDisplayChecker from '../fullscreen-display-checker/FullScreenDisplayChecker.js';
import Display = Electron.Display;

class WindowManager implements AppModule {
  readonly #preload: {path: string};
  readonly #renderer: {path: string} | URL;
  readonly #popup: {path: string} | URL;
  readonly #openDevTools;

  constructor({initConfig, openDevTools = false}: {initConfig: AppInitConfig, openDevTools?: boolean}) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#popup = initConfig.popup;
    this.#openDevTools = openDevTools;
  }

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    await this.restoreOrCreateWindow(true);
    app.on('second-instance', () => this.restoreOrCreateWindow(true));
    app.on('activate', () => this.restoreOrCreateWindow(true));

    ipcMain.handle('spawn-notification', async () => {
      const displaysToFullScreenApps: object = new FullScreenDisplayChecker().getDisplaysAndFullScreenApps();
      const displays = screen.getAllDisplays();

      const getFullScreenValuesForDisplay = (display: Display) => {
        for (const displayName of Object.getOwnPropertyNames(displaysToFullScreenApps)) {
          // @ts-ignore
          const displayNameMetaData: object = displaysToFullScreenApps[displayName];

          const hasSameOriginPoint =
            display.nativeOrigin.x === displayNameMetaData.nativePoint.x
            && display.nativeOrigin.y === displayNameMetaData.nativePoint.y;
          const hasSameSize =
            display.size.width === displayNameMetaData.size.width
            && display.size.height === displayNameMetaData.size.height;

          if (hasSameOriginPoint && hasSameSize) {
            return displayNameMetaData.fullScreenApps
          }
        }

        return [];
      }
      const electronDisplaysToFullScreenApps: Map<Display, string[]> = displays.reduce(
        (acc, currentDisplay, currentIndex) => {
          acc.set(currentDisplay, getFullScreenValuesForDisplay(currentDisplay));

          return acc;
        },
        new Map()
      );

      const displaysByPriority = Array.from(electronDisplaysToFullScreenApps.keys()).sort((aDisplay: Display, bDisplay: Display) => {
        // @ts-ignore
        const aFullScreenApps: string[] = electronDisplaysToFullScreenApps.get(aDisplay);
        // @ts-ignore
        const bFullScreenApps: string[] = electronDisplaysToFullScreenApps.get(bDisplay);

        const aHasFullScreenApps = aFullScreenApps.length !== 0;
        const bHasFullScreenApps = bFullScreenApps.length !== 0;

        if (aHasFullScreenApps && !bHasFullScreenApps) {
          return 1;
        }

        if (!aHasFullScreenApps && bHasFullScreenApps) {
          return -1;
        }

        const primaryDisplay = screen.getPrimaryDisplay();

        if (primaryDisplay === aDisplay) {
          return -1;
        }

        if (primaryDisplay === bDisplay) {
          return 1;
        }

        return 0;
      });

      const targetDisplay = displaysByPriority[0];

      const windowHeight = 500;
      const windowWidth = 500;
      const windowX = targetDisplay.workArea.x + targetDisplay.workArea.width - windowWidth - 10;
      const windowY = targetDisplay.workArea.y + targetDisplay.workArea.height - windowHeight - 10;

      const browserWindow = new BrowserWindow({
        x: windowX,
        y: windowY,

        height: windowHeight,
        width: windowWidth,

        show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
          webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
          preload: this.#preload.path,
        },
        titleBarStyle: "hidden",
        autoHideMenuBar: true
      });

      if (this.#popup instanceof URL) {
        await browserWindow.loadURL(this.#popup.href);
      } else {
        await browserWindow.loadFile(this.#popup.path);
      }

      browserWindow.show();

      if (this.#openDevTools) {
        //browserWindow?.webContents.openDevTools();
      }

      browserWindow.focus();
    });
  }

  async createWindow(): Promise<BrowserWindow> {
    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
      titleBarStyle: "hidden",
      autoHideMenuBar: true
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }

}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
