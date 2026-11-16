import Phaser from 'phaser';
import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';
import { LAYOUT_UNIT, PALETTE, PIXEL_SCALE, UI_SCALE, VIEW_HEIGHT, VIEW_WIDTH, WORLD_ATLAS } from '../elements';
import { PixelText } from '../ui/PixelText';

export interface DialogButton {
  label: string;
  action: () => void;
}

export interface DialogSceneData {
  speaker: string;
  portrait: string;
  lines: string[];
  buttons: DialogButton[];
}

const EMPTY_DIALOG: DialogSceneData = { speaker: '', portrait: '', lines: [], buttons: [] };
const INPUT_DELAY_MS = 350;
const PANEL_WIDTH = 270 * LAYOUT_UNIT;
const PANEL_HEIGHT = 66 * LAYOUT_UNIT;
const PANEL_CENTER_Y = 138 * LAYOUT_UNIT;
const BORDER = 2 * UI_SCALE;
const PORTRAIT_X = 26 * LAYOUT_UNIT;
const TEXT_X = 52 * LAYOUT_UNIT;
const NAME_Y = 9 * LAYOUT_UNIT;
const FIRST_LINE_Y = 20 * LAYOUT_UNIT;
const LINE_HEIGHT = 9 * LAYOUT_UNIT;
const BUTTON_WIDTH = 58 * LAYOUT_UNIT;
const BUTTON_HEIGHT = 12 * LAYOUT_UNIT;
const BUTTON_GAP = 8 * LAYOUT_UNIT;
const BUTTON_BOTTOM_GAP = 6 * LAYOUT_UNIT;

export class DialogScene extends CustomScene {
  private mainScene!: MainScene;
  private buttons: DialogButton[] = [];
  private inputReadyAt: number = 0;
  private closed: boolean = false;

  constructor() {
    super('DialogScene');
  }

  create(data: DialogSceneData = EMPTY_DIALOG) {
    this.mainScene = this.scene.get('MainScene') as MainScene;
    this.buttons = data.buttons;
    this.closed = false;
    this.inputReadyAt = this.game.loop.time + INPUT_DELAY_MS;
    const left = (VIEW_WIDTH - PANEL_WIDTH) / 2;
    const top = PANEL_CENTER_Y - PANEL_HEIGHT / 2;

    this.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, PALETTE.ink, 0.35).setOrigin(0, 0).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(PALETTE.ink, 1);
    panel.fillRect(left - BORDER, top - BORDER, PANEL_WIDTH + 2 * BORDER, PANEL_HEIGHT + 2 * BORDER);
    panel.fillStyle(PALETTE.goldLight, 1);
    panel.fillRect(left, top, PANEL_WIDTH, PANEL_HEIGHT);
    panel.fillStyle(PALETTE.night, 1);
    panel.fillRect(left + BORDER, top + BORDER, PANEL_WIDTH - 2 * BORDER, PANEL_HEIGHT - 2 * BORDER);
    panel.fillStyle(PALETTE.mossDark, 1);
    panel.fillRect(left + 6 * LAYOUT_UNIT, top + 6 * LAYOUT_UNIT, 40 * LAYOUT_UNIT, PANEL_HEIGHT - 12 * LAYOUT_UNIT);

    this.add
      .image(left + PORTRAIT_X, top + PANEL_HEIGHT - 8 * LAYOUT_UNIT, WORLD_ATLAS, data.portrait)
      .setOrigin(0.5, 1)
      .setScale(PIXEL_SCALE);
    new PixelText(this, left + TEXT_X, top + NAME_Y, data.speaker, {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setOrigin(0, 0.5);
    data.lines.forEach((line, index) => {
      new PixelText(this, left + TEXT_X, top + FIRST_LINE_Y + index * LINE_HEIGHT, line, {
        color: 'white',
        outline: 'ink',
        scale: UI_SCALE * 1.5,
      }).setOrigin(0, 0.5);
    });

    const buttonsWidth = data.buttons.length * BUTTON_WIDTH + (data.buttons.length - 1) * BUTTON_GAP;
    const buttonY = top + PANEL_HEIGHT - BUTTON_BOTTOM_GAP - BUTTON_HEIGHT / 2;
    data.buttons.forEach((button, index) => {
      const buttonX = left + PANEL_WIDTH - 8 * LAYOUT_UNIT - buttonsWidth + BUTTON_WIDTH / 2 + index * (BUTTON_WIDTH + BUTTON_GAP);
      this.createButton(buttonX, buttonY, button, index === 0);
    });

    const pressFirst = (event: KeyboardEvent) => {
      if (!event.repeat && this.buttons.length > 0) {
        this.press(this.buttons[0]);
      }
    };
    const pressLast = (event: KeyboardEvent) => {
      if (!event.repeat && this.buttons.length > 0) {
        this.press(this.buttons[this.buttons.length - 1]);
      }
    };
    this.input.keyboard?.on('keydown-ENTER', pressFirst);
    this.input.keyboard?.on('keydown-SPACE', pressFirst);
    this.input.keyboard?.on('keydown-ESC', pressLast);
  }

  private createButton(x: number, y: number, button: DialogButton, primary: boolean) {
    const graphics = this.add.graphics();
    const left = x - BUTTON_WIDTH / 2;
    const top = y - BUTTON_HEIGHT / 2;
    const draw = (hovered: boolean) => {
      graphics.clear();
      graphics.fillStyle(PALETTE.ink, 1);
      graphics.fillRect(left - BORDER, top - BORDER, BUTTON_WIDTH + 2 * BORDER, BUTTON_HEIGHT + 2 * BORDER);
      const base = primary ? PALETTE.green : PALETTE.blueDark;
      const light = primary ? PALETTE.greenLight : PALETTE.blue;
      graphics.fillStyle(hovered ? light : base, 1);
      graphics.fillRect(left, top, BUTTON_WIDTH, BUTTON_HEIGHT);
    };
    draw(false);
    new PixelText(this, x, y, button.label, { color: 'white', outline: 'ink', scale: UI_SCALE * 1.5 });
    const zone = this.add.zone(x, y, BUTTON_WIDTH, BUTTON_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => draw(true));
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => draw(false));
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.press(button));
  }

  private press(button: DialogButton) {
    if (this.closed || this.game.loop.time < this.inputReadyAt) {
      return;
    }
    this.closed = true;
    button.action();
    this.mainScene.closeDialog();
  }
}
