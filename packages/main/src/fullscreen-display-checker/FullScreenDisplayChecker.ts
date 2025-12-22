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
    // Try multiple possible locations for the DLL in packaged app
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@app', 'main', 'dist', 'fullscreen_display_checker.dll'),
      path.join(process.resourcesPath, 'node_modules', '@app', 'main', 'dist', 'fullscreen_display_checker.dll'),
      path.join(__dirname, 'fullscreen_display_checker.dll'),
    ];
    
    for (const dllPath of possiblePaths) {
      console.log('Checking DLL path:', dllPath);
      if (existsSync(dllPath)) {
        console.log('Found DLL at:', dllPath);
        return dllPath;
      }
    }
    
    console.error('DLL not found in any of these locations:', possiblePaths);
    throw new Error('fullscreen_display_checker.dll not found in packaged app');
  } else {
    // In development, use the local path
    const devPath = path.join(__dirname, 'fullscreen_display_checker.dll');
    console.log('Development DLL path:', devPath);
    return devPath;
  }
}

export default class FullScreenDisplayChecker {
    private lib: any = null;
    private GetDisplaysAndFullScreenApps: any = null;

    private initializeDLL() {
        if (!this.lib) {
            try {
                // Load the DLL using Koffi
                this.lib = koffi.load(getDllPath());
                
                // Define the function signatures
                this.GetDisplaysAndFullScreenApps = this.lib.func('GetDisplaysAndFullScreenApps', 'str', []);
            } catch (error) {
                console.error('Failed to load DLL:', error);
                throw new Error(`Failed to load fullscreen display checker DLL: ${error.message}`);
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
}
