export type AppInitConfig = {
  preload: {
    path: string;
  };

  renderer:
    | {
        path: string;
      }
    | URL;

  popup:
    | {
    path: string;
  }
    | URL;
};
