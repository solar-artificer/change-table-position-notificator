import path from 'node:path';
import {koffi} from 'libwin32';
import { fileURLToPath } from 'node:url';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the DLL using Koffi
const lib = koffi.load(path.join(__dirname, 'fullscreen_display_checker.dll'));

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
