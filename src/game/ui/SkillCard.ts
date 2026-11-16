import Phaser from 'phaser';
import { LAYOUT_UNIT, PALETTE, UI_SCALE, SkillDef, SkillStatus } from '../elements';
import { bakePixelArt } from '../utils/pixelArt';
import { PixelText } from './PixelText';

export const SKILL_CARD_WIDTH = 92 * LAYOUT_UNIT;
export const SKILL_CARD_HEIGHT = 30 * LAYOUT_UNIT;

const BORDER = 2 * UI_SCALE;
const LEFT = -SKILL_CARD_WIDTH / 2;
const TOP = -SKILL_CARD_HEIGHT / 2;
const ICON_X = LEFT + 14 * LAYOUT_UNIT;
const TEXT_X = LEFT + 28 * LAYOUT_UNIT;
const NAME_Y = TOP + 7 * LAYOUT_UNIT;
const DESCRIPTION_Y = TOP + 14 * LAYOUT_UNIT;
const LINE_HEIGHT = 5 * LAYOUT_UNIT;
const PIPS_Y = TOP + 25 * LAYOUT_UNIT;
const PIP_SIZE = 5 * UI_SCALE;
const PIP_GAP = 2 * UI_SCALE;

const BORDER_COLORS: Record<SkillStatus, number> = {
  available: PALETTE.greenLight,
  noPoints: PALETTE.mistLight,
  locked: PALETTE.midBark,
  maxed: PALETTE.gold,
};

export class SkillCard extends Phaser.GameObjects.Container {
  readonly def: SkillDef;
  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly pips: Phaser.GameObjects.Graphics;
  private readonly statusText: PixelText;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private readonly baseX: number;
  private hovered: boolean = false;
  private status: SkillStatus = 'noPoints';
  private level: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: SkillDef, onSelect: (card: SkillCard) => void) {
    super(scene, x, y);
    this.def = def;
    this.baseX = x;
    this.frame = scene.add.graphics();
    bakePixelArt(scene, def.icon);
    this.icon = scene.add.image(ICON_X, 0, def.icon.key).setScale(UI_SCALE * 2);
    const nameText = new PixelText(scene, TEXT_X, NAME_Y, def.name, {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    }).setOrigin(0, 0.5);
    const descriptionTexts = def.description.map((line, index) =>
      new PixelText(scene, TEXT_X, DESCRIPTION_Y + index * LINE_HEIGHT, line, { color: 'white', outline: 'ink' }).setOrigin(
        0,
        0.5,
      ),
    );
    this.pips = scene.add.graphics();
    this.statusText = new PixelText(scene, -LEFT - 4 * LAYOUT_UNIT, PIPS_Y, '', { color: 'cyan', outline: 'ink' }).setOrigin(
      1,
      0.5,
    );
    this.flash = scene.add.rectangle(0, 0, SKILL_CARD_WIDTH, SKILL_CARD_HEIGHT, PALETTE.white, 1).setAlpha(0);
    this.add([this.frame, this.icon, nameText, ...descriptionTexts, this.pips, this.statusText, this.flash]);
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(LEFT, TOP, SKILL_CARD_WIDTH, SKILL_CARD_HEIGHT),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.setHovered(true));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.setHovered(false));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => onSelect(this));
    scene.add.existing(this);
  }

  setSkillState(status: SkillStatus, level: number) {
    this.status = status;
    this.level = level;
    this.redraw();
  }

  playLearned() {
    this.flash.setAlpha(0.7);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 260, ease: 'Quad.easeOut' });
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
    const highlighted = this.status === 'available' && this.hovered;
    this.frame.clear();
    this.frame.fillStyle(PALETTE.ink, 1);
    this.frame.fillRect(LEFT - BORDER, TOP - BORDER, SKILL_CARD_WIDTH + 2 * BORDER, SKILL_CARD_HEIGHT + 2 * BORDER);
    this.frame.fillStyle(highlighted ? PALETTE.goldLight : BORDER_COLORS[this.status], 1);
    this.frame.fillRect(LEFT, TOP, SKILL_CARD_WIDTH, SKILL_CARD_HEIGHT);
    this.frame.fillStyle(this.status === 'locked' ? PALETTE.mossDeep : PALETTE.night, 1);
    this.frame.fillRect(LEFT + BORDER, TOP + BORDER, SKILL_CARD_WIDTH - 2 * BORDER, SKILL_CARD_HEIGHT - 2 * BORDER);
    this.frame.fillStyle(PALETTE.mossDark, 1);
    this.frame.fillRect(ICON_X - 10 * LAYOUT_UNIT, -10 * LAYOUT_UNIT, 20 * LAYOUT_UNIT, 20 * LAYOUT_UNIT);
    this.icon.setAlpha(this.status === 'locked' ? 0.35 : 1);

    this.pips.clear();
    for (let i = 0; i < this.def.maxLevel; i++) {
      const pipX = TEXT_X + i * (PIP_SIZE + PIP_GAP);
      const owned = i < this.level;
      this.pips.fillStyle(PALETTE.ink, 1);
      this.pips.fillRect(pipX - UI_SCALE, PIPS_Y - PIP_SIZE / 2 - UI_SCALE, PIP_SIZE + 2 * UI_SCALE, PIP_SIZE + 2 * UI_SCALE);
      this.pips.fillStyle(owned ? PALETTE.gold : PALETTE.moss, 1);
      this.pips.fillRect(pipX, PIPS_Y - PIP_SIZE / 2, PIP_SIZE, PIP_SIZE);
    }
    this.statusText.setText(this.statusLabel());
  }

  private statusLabel(): string {
    if (this.status === 'maxed') {
      return 'MAX';
    }
    if (this.status === 'locked') {
      return 'BLOQUE';
    }
    if (this.status === 'available') {
      return '+1';
    }
    return '';
  }
}
