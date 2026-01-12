import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow, ipcMain, screen, Display, globalShortcut} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';
import FullScreenDisplayChecker from '../fullscreen-display-checker/FullScreenDisplayChecker.js';
import path from 'node:path';

class WindowManager implements AppModule {
  readonly #preload: {path: string};
  readonly #renderer: {path: string} | URL;
  readonly #openDevTools;

  #mainWindow: BrowserWindow | null = null;

  constructor({initConfig, openDevTools = true}: {initConfig: AppInitConfig, openDevTools?: boolean}) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
    console.log(process.pid);
  }

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();

    globalShortcut.register('F13', () => {
      this.#mainWindow!.webContents.send('stop-notification');
    })
    globalShortcut.register('F14', () => {
      this.#mainWindow!.webContents.send('toggle-play-status');
    })
    globalShortcut.register('F15', () => {
      if (this.#mainWindow.isVisible()) {
        this.#mainWindow.hide();
      } else {
        this.#mainWindow.show();
        this.tryPositionWindowAsVisible(this.#mainWindow!);
      }
    })

    await this.restoreOrCreateWindow(true);

    app.on('second-instance', () => this.restoreOrCreateWindow(true));
    app.on('activate', () => this.restoreOrCreateWindow(true));

    ipcMain.handle('minimize-window', async () => {
      this.#mainWindow!.minimize();
    });
    ipcMain.handle('maximize-window', async () => {
      this.#mainWindow!.maximize();
    });
    ipcMain.handle('close-window', async () => {
      this.#mainWindow!.close();
    });

    ipcMain.handle('show-window', async () => {
      new FullScreenDisplayChecker().showWindowByPID(process.pid)
      this.tryPositionWindowAsVisible(this.#mainWindow!);

      if (this.#mainWindow!.isMinimized()) {
        this.#mainWindow!.restore();
      }
      this.#mainWindow!.show();
    });
  }

  tryPositionWindowAsVisible(window: BrowserWindow) {
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

    const windowWidth = window.getSize()[0];
    const windowHeight = window.getSize()[1];
    const windowX = targetDisplay.workArea.x + targetDisplay.workArea.width - windowWidth - 10;
    const windowY = targetDisplay.workArea.y + targetDisplay.workArea.height - windowHeight - 10;

    window.setPosition(windowX, windowY);
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
        backgroundThrottling: false  // Prevents throttling when hidden
      },
      titleBarStyle: "hidden",
      autoHideMenuBar: true,

      width: 295,
      height: 600,
      resizable: false,

      frame: false,
      transparent: true
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    this.tryPositionWindowAsVisible(browserWindow);

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    this.#mainWindow = window;

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      /*
      window?.webContents.openDevTools({
        mode: 'detach'
      });
       */
    }

    window.focus();

    return window;
  }

}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
