import Phaser from 'phaser';
import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';
import { LAYOUT_UNIT, PALETTE, UI_SCALE, SKILLS, SKILL_BRANCHES, VIEW_HEIGHT, VIEW_WIDTH } from '../elements';
import { GameState } from '../objects/staticClasses/GameState';
import { PixelText } from '../ui/PixelText';
import { SKILL_CARD_HEIGHT, SkillCard } from '../ui/SkillCard';

const INPUT_DELAY_MS = 300;
const TITLE_Y = 12 * LAYOUT_UNIT;
const POINTS_Y = 24 * LAYOUT_UNIT;
const BRANCH_Y = 36 * LAYOUT_UNIT;
const FIRST_CARD_Y = 58 * LAYOUT_UNIT;
const CARD_STEP = 38 * LAYOUT_UNIT;
const COLUMN_GAP = 102 * LAYOUT_UNIT;
const BUTTON_Y = 166 * LAYOUT_UNIT;
const BUTTON_WIDTH = 64 * LAYOUT_UNIT;
const BUTTON_HEIGHT = 13 * LAYOUT_UNIT;
const LINK_WIDTH = 2 * UI_SCALE;

export class SkillTreeScene extends CustomScene {
  private mainScene!: MainScene;
  private cards: SkillCard[] = [];
  private pointsText!: PixelText;
  private links!: Phaser.GameObjects.Graphics;
  private inputReadyAt: number = 0;
  private leaving: boolean = false;

  constructor() {
    super('SkillTreeScene');
  }

  create() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
    this.cards = [];
    this.leaving = false;
    this.inputReadyAt = this.game.loop.time + INPUT_DELAY_MS;
    const centerX = VIEW_WIDTH / 2;

    this.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, PALETTE.ink, 0.9).setOrigin(0, 0).setInteractive();
    new PixelText(this, centerX, TITLE_Y, 'ARBRE DE COMPETENCES', { color: 'goldLight', outline: 'ink', scale: UI_SCALE * 3 });
    this.pointsText = new PixelText(this, centerX, POINTS_Y, '', { color: 'cyan', outline: 'ink', scale: UI_SCALE * 2 });
    this.links = this.add.graphics();

    SKILL_BRANCHES.forEach((branchEntry, column) => {
      const columnX = centerX + (column - 1) * COLUMN_GAP;
      new PixelText(this, columnX, BRANCH_Y, branchEntry.name, { color: 'white', outline: 'ink', scale: UI_SCALE * 2 });
      SKILLS.filter((skill) => skill.branch === branchEntry.branch).forEach((skill, row) => {
        const card = new SkillCard(this, columnX, FIRST_CARD_Y + row * CARD_STEP, skill, (selected) => this.handleSelect(selected));
        this.cards.push(card);
      });
    });
    this.drawLinks();
    this.createCloseButton(centerX);

    const leaveOnFreshPress = (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.leave();
      }
    };
    this.input.keyboard?.on('keydown-ESC', leaveOnFreshPress);
    this.input.keyboard?.on('keydown-K', leaveOnFreshPress);
    this.input.keyboard?.on('keydown-ENTER', leaveOnFreshPress);
    this.refresh();
  }

  private drawLinks() {
    this.links.clear();
    this.cards.forEach((card) => {
      const requires = card.def.requires;
      const parent = this.cards.find((other) => other.def.kind === requires);
      if (!parent) {
        return;
      }
      const unlocked = GameState.skillLevels[parent.def.kind] > 0;
      this.links.fillStyle(unlocked ? PALETTE.gold : PALETTE.midBark, 1);
      const top = parent.y + SKILL_CARD_HEIGHT / 2;
      this.links.fillRect(card.x - LINK_WIDTH / 2, top, LINK_WIDTH, card.y - SKILL_CARD_HEIGHT / 2 - top);
    });
  }

  private createCloseButton(centerX: number) {
    const button = this.add.graphics();
    const left = centerX - BUTTON_WIDTH / 2;
    const top = BUTTON_Y - BUTTON_HEIGHT / 2;
    const draw = (hovered: boolean) => {
      button.clear();
      button.fillStyle(PALETTE.ink, 1);
      button.fillRect(left - 2 * UI_SCALE, top - 2 * UI_SCALE, BUTTON_WIDTH + 4 * UI_SCALE, BUTTON_HEIGHT + 4 * UI_SCALE);
      button.fillStyle(hovered ? PALETTE.blueLight : PALETTE.blue, 1);
      button.fillRect(left, top, BUTTON_WIDTH, BUTTON_HEIGHT);
    };
    draw(false);
    new PixelText(this, centerX, BUTTON_Y, 'FERMER', { color: 'white', outline: 'ink', scale: UI_SCALE * 2 });
    const zone = this.add.zone(centerX, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT).setInteractive({ useHandCursor: true });
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => draw(true));
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => draw(false));
    zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.leave());
  }

  private handleSelect(card: SkillCard) {
    if (this.leaving || this.game.loop.time < this.inputReadyAt) {
      return;
    }
    if (this.mainScene.learnSkill(card.def.kind)) {
      card.playLearned();
    } else {
      card.playRefused();
    }
    this.refresh();
  }

  private refresh() {
    const points = GameState.skillPoints;
    this.pointsText.setText(`NIVEAU ${GameState.playerLevel}   POINTS A DEPENSER : ${points}`);
    this.cards.forEach((card) => card.setSkillState(GameState.skillStatus(card.def.kind), GameState.skillLevels[card.def.kind]));
    this.drawLinks();
  }

  private leave() {
    if (this.leaving || this.game.loop.time < this.inputReadyAt) {
      return;
    }
    this.leaving = true;
    this.mainScene.closeSkillTree();
  }
}
