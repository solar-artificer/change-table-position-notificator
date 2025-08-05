import {build, createServer} from 'vite';
import path from 'path';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * This script is designed to run multiple packages of your application in a special development mode.
 * To do this, you need to follow a few steps:
 */


/**
 * 1. We create a few flags to let everyone know that we are in development mode.
 */
const mode = 'development';
process.env.NODE_ENV = mode;
process.env.MODE = mode;


/**
 * 2. We create a development server for the renderer. It is assumed that the renderer exists and is located in the “renderer” package.
 * This server should be started first because other packages depend on its settings.
 */
/**
 * @type {import('vite').ViteDevServer}
 */
const rendererWatchServer = await createServer({
  mode,
  root: path.resolve('packages/renderer'),
});

await rendererWatchServer.listen();

const popupWatchServer = await createServer({
  mode,
  root: path.resolve('packages/popup'),
});

await popupWatchServer.listen();


/**
 * 3. We are creating a simple provider plugin.
 * Its only purpose is to provide access to the renderer dev-server to all other build processes.
 */
/** @type {import('vite').Plugin} */
const rendererWatchServerProvider = {
  name: '@app/renderer-watch-server-provider',
  api: {
    provideRendererWatchServer() {
      return rendererWatchServer;
    },
  },
};
const popupWatchServerProvider = {
  name: '@app/popup-watch-server-provider',
  api: {
    providePopupWatchServer() {
      return popupWatchServer;
    },
  },
};


/**
 * 4. Start building all other packages.
 * For each of them, we add a plugin provider so that each package can implement its own hot update mechanism.
 */
/** @type {string[]} */
const packagesToStart = {
  'packages/preload': {},
  'packages/popup': {},
  'packages/main': {}
};

for (const packageName in packagesToStart) {
  const packageConfig = packagesToStart[packageName];

  console.log('PACKAGE', packageName);

  await build({
    mode,
    root: path.resolve(packageName),
    plugins: [
      rendererWatchServerProvider,
      popupWatchServerProvider,
    ],
    ...packageConfig,
  });

  // Copy DLL for main package after build completes
  if (packageName === 'packages/main') {
    const dllSource = join(path.resolve(packageName), 'src', 'fullscreen-display-checker', 'fullscreen_display_checker.dll');
    const dllDest = join(path.resolve(packageName), 'dist', 'fullscreen_display_checker.dll');
    
    console.log('[DEV MODE] Package name:', packageName);
    console.log('[DEV MODE] Resolved package path:', path.resolve(packageName));
    console.log('[DEV MODE] DLL source:', dllSource);
    console.log('[DEV MODE] DLL dest:', dllDest);
    console.log('[DEV MODE] Source exists:', existsSync(dllSource));
    
    if (existsSync(dllSource)) {
      copyFileSync(dllSource, dllDest);
      console.log(`[DEV MODE] Copied ${dllSource} to ${dllDest}`);
    } else {
      console.warn(`[DEV MODE] DLL file not found at ${dllSource}`);
    }
  }
}
