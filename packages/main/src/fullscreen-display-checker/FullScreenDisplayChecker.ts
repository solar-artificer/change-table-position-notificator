import path from 'node:path';
import {koffi} from 'libwin32';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';
import { existsSync } from 'node:fs';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct DLL path based on whether we're in development or production
function getDllPath() {
  if (app.isPackaged) {
    // In packaged app, the DLL should be in app.asar.unpacked
    // The path structure is: resources/app.asar.unpacked/node_modules/@app/main/dist/fullscreen_display_checker.dll
    const dllPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@app', 'main', 'dist', 'fullscreen_display_checker.dll');

    if (existsSync(dllPath)) {
      return dllPath;
    }

    throw new Error(`fullscreen_display_checker.dll not found at: ${dllPath}`);
  } else {
    // In development, use the local path
    return path.join(__dirname, 'fullscreen_display_checker.dll');
  }
}

export default class FullScreenDisplayChecker {
    private lib: any = null;
    private GetDisplaysAndFullScreenApps: any = null;
    private ShowWindowByPIDFn: any = null;

    private initializeDLL() {
        if (!this.lib) {
            try {
                // Load the DLL using Koffi
                this.lib = koffi.load(getDllPath());

                // Define the function signatures
                this.GetDisplaysAndFullScreenApps = this.lib.func('GetDisplaysAndFullScreenApps', 'str', []);
                this.ShowWindowByPIDFn = this.lib.func('ShowWindowByPID', 'int', ['int']);
            } catch (error) {
                console.error('Failed to load DLL:', error);
                throw new Error(`Failed to load fullscreen display checker DLL: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

  /**
   * Get fullscreen windows data as JSON object
   */
  getDisplaysAndFullScreenApps() {
    try {
      this.initializeDLL();
      const jsonString = this.GetDisplaysAndFullScreenApps();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to get display and fullscreen apps data:', error);
      throw error;
    }
  }

  /**
   * Bring a window to the front by its process ID
   * @param pid - The process ID
   * @returns Result code from the DLL (non-zero on success)
   */
  showWindowByPID(pid: number): number {
    try {
      this.initializeDLL();
      return this.ShowWindowByPIDFn(pid);
    } catch (error) {
      console.error('Failed to show window by PID:', error);
      throw error;
    }
  }
}
