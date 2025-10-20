import path from 'node:path';
import {koffi} from 'libwin32';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct DLL path based on whether we're in development or production
function getDllPath() {
  if (app.isPackaged) {
    // In packaged app, the DLL is in the unpacked resources
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@app', 'main', 'dist', 'fullscreen_display_checker.dll');
  } else {
    // In development, use the local path
    return path.join(__dirname, 'fullscreen_display_checker.dll');
  }
}

// Load the DLL using Koffi
const lib = koffi.load(getDllPath());

// Define the function signatures
const GetDisplaysAndFullScreenApps = lib.func('GetDisplaysAndFullScreenApps', 'str', []);

export default class FullScreenDisplayChecker {
    /**
     * Get fullscreen windows data as JSON object
     */
    getDisplaysAndFullScreenApps() {
        try {
            const jsonString = GetDisplaysAndFullScreenApps();
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Failed to get display and fullscreen apps data:', error);
            throw error;
        }
    }
}
