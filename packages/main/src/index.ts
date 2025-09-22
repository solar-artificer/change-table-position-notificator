import type {AppInitConfig} from './AppInitConfig.js';
import {createModuleRunner} from './ModuleRunner.js';
import {disallowMultipleAppInstance} from './modules/SingleInstanceApp.js';
import {createWindowManagerModule} from './modules/WindowManager.js';
import {terminateAppOnLastWindowClose} from './modules/ApplicationTerminatorOnLastWindowClose.js';
import {hardwareAccelerationMode} from './modules/HardwareAccelerationModule.js';
import {autoUpdater} from './modules/AutoUpdater.js';
import {allowInternalOrigins} from './modules/BlockNotAllowdOrigins.js';
import {allowExternalUrls} from './modules/ExternalUrls.js';


export async function initApp(initConfig: AppInitConfig) {
  let moduleRunner = createModuleRunner()
    .init(createWindowManagerModule({initConfig, openDevTools: false && import.meta.env.DEV}))
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(hardwareAccelerationMode({enable: false}))
    // Install DevTools extension if needed
    // .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))
    .init(autoUpdater());

  // Security
  const allowedInternalOrigins = [];
  if (initConfig.renderer instanceof URL) {
    allowedInternalOrigins.push(initConfig.renderer.origin);
  }
  if (initConfig.popup instanceof URL) {
    allowedInternalOrigins.push(initConfig.popup.origin);
  }
  moduleRunner = moduleRunner.init(allowInternalOrigins(
    new Set(allowedInternalOrigins)
  ));

  moduleRunner.init(allowExternalUrls(
      new Set(
        initConfig.renderer instanceof URL
          ? [
            'https://vite.dev',
            'https://developer.mozilla.org',
            'https://solidjs.com',
            'https://qwik.dev',
            'https://lit.dev',
            'https://react.dev',
            'https://preactjs.com',
            'https://www.typescriptlang.org',
            'https://vuejs.org',
          ]
          : [],
      )),
    );

  await moduleRunner;
}
