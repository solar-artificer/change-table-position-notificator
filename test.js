import {EnumWindows, MessageBox} from 'libwin32';

const windows = [];

const result = EnumWindows(
  (window) => {
    windows.push(window);
  },
  0
)

console.log(windows.length)
