import {ipcRenderer } from 'electron';

async function spawnNotification() {
  setTimeout(() => {
    return ipcRenderer.invoke("spawn-notification");
  }, 5000);
}

export {
  spawnNotification
}
