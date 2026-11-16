interface Window {
  electron: {
    quitApp: () => void;
  };
  splashStartTime: number;
  phaserGame?: import('phaser').Game;
}
