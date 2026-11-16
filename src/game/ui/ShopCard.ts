import Phaser from 'phaser';
import { LAYOUT_UNIT, PALETTE, UI_SCALE, ShopCardDef, UpgradeOffer } from '../elements';
import { bakePixelArt } from '../utils/pixelArt';
import { PixelText } from './PixelText';

export const SHOP_CARD_WIDTH = 55 * LAYOUT_UNIT;
export const SHOP_CARD_HEIGHT = 94 * LAYOUT_UNIT;

const BORDER = 2 * UI_SCALE;
const INSET = 6 * LAYOUT_UNIT;
const CARD_TOP = -SHOP_CARD_HEIGHT / 2;
const ICON_PANEL_HEIGHT = 34 * LAYOUT_UNIT;
const ICON_CENTER_Y = CARD_TOP + INSET + ICON_PANEL_HEIGHT / 2;
const NAME_Y = CARD_TOP + 48 * LAYOUT_UNIT;
const DESCRIPTION_Y = CARD_TOP + 58 * LAYOUT_UNIT;
const DESCRIPTION_LINE_HEIGHT = 6 * LAYOUT_UNIT;
const PIPS_Y = CARD_TOP + 72 * LAYOUT_UNIT;
const PIP_SIZE = 7 * UI_SCALE;
const PIP_GAP = 3 * UI_SCALE;
const PRICE_PLATE_HEIGHT = 12 * LAYOUT_UNIT;
const PRICE_PLATE_CENTER_Y = SHOP_CARD_HEIGHT / 2 - INSET - PRICE_PLATE_HEIGHT / 2;

const PLATE_COLORS: Record<UpgradeOffer['status'], { fill: number; light: number; dark: number }> = {
  available: { fill: PALETTE.green, light: PALETTE.greenLight, dark: PALETTE.greenDark },
  tooExpensive: { fill: PALETTE.redDeep, light: PALETTE.red, dark: PALETTE.ink },
  maxed: { fill: PALETTE.goldDark, light: PALETTE.gold, dark: PALETTE.barkDark },
  useless: { fill: PALETTE.midBark, light: PALETTE.midBarkLight, dark: PALETTE.midBarkDark },
  owned: { fill: PALETTE.blue, light: PALETTE.blueLight, dark: PALETTE.blueDark },
  equipped: { fill: PALETTE.goldDark, light: PALETTE.gold, dark: PALETTE.barkDark },
};

const SELECTABLE_STATUSES: UpgradeOffer['status'][] = ['available', 'owned'];

export class ShopCard extends Phaser.GameObjects.Container {
  readonly def: ShopCardDef;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly pips: Phaser.GameObjects.Graphics;
  private readonly pricePlate: Phaser.GameObjects.Graphics;
  private readonly priceText: PixelText;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private readonly baseX: number;
  private hovered: boolean = false;
  private offer: UpgradeOffer = { status: 'available', price: 0, level: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, def: ShopCardDef, onSelect: (card: ShopCard) => void) {
    super(scene, x, y);
    this.def = def;
    this.baseX = x;

    this.frame = scene.add.graphics();
    bakePixelArt(scene, def.icon);
    const icon = scene.add.image(0, ICON_CENTER_Y, def.icon.key).setScale(UI_SCALE * 3);
    const nameText = new PixelText(scene, 0, NAME_Y, def.name, {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    });
    const descriptionTexts = def.description.map(
      (line, index) =>
        new PixelText(scene, 0, DESCRIPTION_Y + index * DESCRIPTION_LINE_HEIGHT, line, {
          color: 'white',
          outline: 'ink',
        }),
    );
    this.pips = scene.add.graphics();
    const children: Phaser.GameObjects.GameObject[] = [this.frame, icon, nameText, ...descriptionTexts, this.pips];
    if (def.maxLevel === null) {
      children.push(new PixelText(scene, 0, PIPS_Y, def.badge ?? 'USAGE UNIQUE', { color: 'cyan', outline: 'ink' }));
    }
    this.pricePlate = scene.add.graphics();
    this.priceText = new PixelText(scene, 0, PRICE_PLATE_CENTER_Y, '', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    this.flash = scene.add
      .rectangle(0, 0, SHOP_CARD_WIDTH, SHOP_CARD_HEIGHT, PALETTE.white, 1)
      .setAlpha(0);
    this.add([...children, this.pricePlate, this.priceText, this.flash]);

    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-SHOP_CARD_WIDTH / 2, CARD_TOP, SHOP_CARD_WIDTH, SHOP_CARD_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.setHovered(true));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.setHovered(false));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => onSelect(this));

    scene.add.existing(this);
    this.redraw();
  }

  setOffer(offer: UpgradeOffer) {
    this.offer = offer;
    this.redraw();
  }

  playPurchased() {
    this.flash.setAlpha(0.7);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 260, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this, scale: { from: 1.06, to: 1 }, duration: 200, ease: 'Back.easeOut' });
  }

  playRefused() {
    this.scene.tweens.add({
      targets: this,
      x: { from: this.baseX + 3 * LAYOUT_UNIT, to: this.baseX },
      duration: 220,
      ease: 'Bounce.easeOut',
    });
  }

  private setHovered(hovered: boolean) {
    this.hovered = hovered;
    this.redraw();
  }

  private redraw() {
    this.drawFrame();
    this.drawPips();
    this.drawPricePlate();
    this.priceText.setText(this.priceLabel());
  }

  private priceLabel(): string {
    if (this.offer.status === 'maxed') {
      return 'MAX';
    }
    if (this.offer.status === 'useless') {
      return 'PLEIN';
    }
    if (this.offer.status === 'owned') {
      return 'PRENDRE';
    }
    if (this.offer.status === 'equipped') {
      return 'EN MAIN';
    }
    return `${this.offer.price} €`;
  }

  private drawFrame() {
    const highlighted = this.offer.status === 'equipped' || (this.hovered && SELECTABLE_STATUSES.includes(this.offer.status));
    const borderColor = highlighted ? PALETTE.goldLight : PALETTE.mistLight;
    const left = -SHOP_CARD_WIDTH / 2;
    this.frame.clear();
    this.frame.fillStyle(PALETTE.ink, 1);
    this.frame.fillRect(left - BORDER, CARD_TOP - BORDER, SHOP_CARD_WIDTH + 2 * BORDER, SHOP_CARD_HEIGHT + 2 * BORDER);
    this.frame.fillStyle(borderColor, 1);
    this.frame.fillRect(left, CARD_TOP, SHOP_CARD_WIDTH, SHOP_CARD_HEIGHT);
    this.frame.fillStyle(PALETTE.night, 1);
    this.frame.fillRect(left + BORDER, CARD_TOP + BORDER, SHOP_CARD_WIDTH - 2 * BORDER, SHOP_CARD_HEIGHT - 2 * BORDER);
    this.frame.fillStyle(PALETTE.mossDark, 1);
    this.frame.fillRect(left + INSET, CARD_TOP + INSET, SHOP_CARD_WIDTH - 2 * INSET, ICON_PANEL_HEIGHT);
    this.frame.fillStyle(PALETTE.moss, 1);
    this.frame.fillRect(left + INSET, CARD_TOP + INSET, SHOP_CARD_WIDTH - 2 * INSET, UI_SCALE);
  }

  private drawPips() {
    this.pips.clear();
    const maxLevel = this.def.maxLevel;
    if (maxLevel === null) {
      return;
    }
    const totalWidth = maxLevel * PIP_SIZE + (maxLevel - 1) * PIP_GAP;
    for (let i = 0; i < maxLevel; i++) {
      const pipX = -totalWidth / 2 + i * (PIP_SIZE + PIP_GAP);
      const owned = i < this.offer.level;
      this.pips.fillStyle(PALETTE.ink, 1);
      this.pips.fillRect(pipX - UI_SCALE, PIPS_Y - PIP_SIZE / 2 - UI_SCALE, PIP_SIZE + 2 * UI_SCALE, PIP_SIZE + 2 * UI_SCALE);
      this.pips.fillStyle(owned ? PALETTE.gold : PALETTE.moss, 1);
      this.pips.fillRect(pipX, PIPS_Y - PIP_SIZE / 2, PIP_SIZE, PIP_SIZE);
      if (owned) {
        this.pips.fillStyle(PALETTE.goldLight, 1);
        this.pips.fillRect(pipX, PIPS_Y - PIP_SIZE / 2, PIP_SIZE, UI_SCALE);
      }
    }
  }

  private drawPricePlate() {
    const colors = PLATE_COLORS[this.offer.status];
    const plateWidth = SHOP_CARD_WIDTH - 2 * INSET;
    const plateTop = PRICE_PLATE_CENTER_Y - PRICE_PLATE_HEIGHT / 2;
    const left = -plateWidth / 2;
    this.pricePlate.clear();
    this.pricePlate.fillStyle(PALETTE.ink, 1);
    this.pricePlate.fillRect(left - UI_SCALE, plateTop - UI_SCALE, plateWidth + 2 * UI_SCALE, PRICE_PLATE_HEIGHT + 2 * UI_SCALE);
    this.pricePlate.fillStyle(colors.fill, 1);
    this.pricePlate.fillRect(left, plateTop, plateWidth, PRICE_PLATE_HEIGHT);
    this.pricePlate.fillStyle(colors.light, 1);
    this.pricePlate.fillRect(left, plateTop, plateWidth, UI_SCALE);
    this.pricePlate.fillStyle(colors.dark, 1);
    this.pricePlate.fillRect(left, plateTop + PRICE_PLATE_HEIGHT - UI_SCALE, plateWidth, UI_SCALE);
  }
}
