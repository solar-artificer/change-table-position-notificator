import {ipcRenderer } from 'electron';

async function spawnNotification() {
  return ipcRenderer.invoke("spawn-notification");
}

export {
  spawnNotification
}
