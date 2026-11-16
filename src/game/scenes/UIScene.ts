import Phaser from 'phaser';
import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';
import {
  BOSS_REWARD_COINS,
  GamePhase,
  PALETTE,
  LAYOUT_UNIT,
  MAX_ACTIVE_QUESTS,
  UI_SCALE,
  RESTART_DELAY_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '../elements';
import { GameState } from '../objects/staticClasses/GameState';
import { trackerLine } from '../objects/quests/QuestBoard';
import { BossBar } from '../ui/BossBar';
import { HeartsBar } from '../ui/HeartsBar';
import { PixelText } from '../ui/PixelText';

const AREA_BANNER_MS = 2200;
const SPECIAL_BANNER_MS = 1600;
const QUEST_FIRST_Y = 36 * LAYOUT_UNIT;
const QUEST_LINE_HEIGHT = 8 * LAYOUT_UNIT;
const XP_BAR_WIDTH = 40 * LAYOUT_UNIT;
const XP_BAR_HEIGHT = 3 * UI_SCALE;
const SKILL_BUTTON_WIDTH = 48 * LAYOUT_UNIT;
const SKILL_BUTTON_HEIGHT = 10 * LAYOUT_UNIT;
const SKILL_BUTTON_Y = 30 * LAYOUT_UNIT;
const GAME_TITLE = "L'AVENTURE DE NAEL";

export class UIScene extends CustomScene {
  mainScene!: MainScene;
  private hearts!: HeartsBar;
  private scoreText!: PixelText;
  private coinsText!: PixelText;
  private levelText!: PixelText;
  private levelBanner!: PixelText;
  private bossBar!: BossBar;
  private dimmer!: Phaser.GameObjects.Rectangle;
  private titleText!: PixelText;
  private subtitleText!: PixelText;
  private hintText!: PixelText;
  private promptText!: PixelText;
  private warningText!: PixelText;
  private specialText!: PixelText;
  private playerLevelText!: PixelText;
  private xpBar!: Phaser.GameObjects.Graphics;
  private questTexts: PixelText[] = [];
  private skillButton!: Phaser.GameObjects.Graphics;
  private skillButtonText!: PixelText;
  private skillBadge!: PixelText;
  private skillZone!: Phaser.GameObjects.Zone;
  private bannerTitle!: PixelText;
  private bannerSubtitle!: PixelText;
  private displayedPhase: GamePhase | null = null;

  constructor() {
    super('UIScene');
  }

  create() {
    this.mainScene = this.scene.get('MainScene') as MainScene;
    this.tileSize = this.cameras.main.height / 18;
    this.pixelUnit = this.tileSize / 16;

    const centerX = VIEW_WIDTH / 2;
    this.hearts = new HeartsBar(this, 6 * LAYOUT_UNIT, 5 * LAYOUT_UNIT);
    this.scoreText = new PixelText(this, VIEW_WIDTH - 6 * LAYOUT_UNIT, 5 * LAYOUT_UNIT, '0', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setOrigin(1, 0);
    this.coinsText = new PixelText(this, 6 * LAYOUT_UNIT, 16 * LAYOUT_UNIT, '0 €', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setOrigin(0, 0);
    this.levelText = new PixelText(this, VIEW_WIDTH - 6 * LAYOUT_UNIT, 16 * LAYOUT_UNIT, '', {
      color: 'cyan',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    }).setOrigin(1, 0);
    this.levelBanner = new PixelText(this, centerX, 64 * LAYOUT_UNIT, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 3,
    }).setVisible(false);
    this.bossBar = new BossBar(this, centerX, 16 * LAYOUT_UNIT).setVisible(false);
    this.playerLevelText = new PixelText(this, 6 * LAYOUT_UNIT, 26 * LAYOUT_UNIT, '', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    }).setOrigin(0, 0);
    this.xpBar = this.add.graphics();
    for (let i = 0; i < MAX_ACTIVE_QUESTS; i++) {
      this.questTexts.push(
        new PixelText(this, 6 * LAYOUT_UNIT, QUEST_FIRST_Y + i * QUEST_LINE_HEIGHT, '', {
          color: 'cyan',
          outline: 'ink',
          scale: UI_SCALE * 1.5,
        }).setOrigin(0, 0),
      );
    }
    this.createSkillButton();
    this.bannerTitle = new PixelText(this, centerX, 46 * LAYOUT_UNIT, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 4,
    }).setVisible(false);
    this.bannerSubtitle = new PixelText(this, centerX, 60 * LAYOUT_UNIT, '', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setVisible(false);

    this.dimmer = this.add
      .rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, PALETTE.ink, 0.55)
      .setOrigin(0, 0);
    this.titleText = new PixelText(this, centerX, 52 * LAYOUT_UNIT, GAME_TITLE, {
      color: 'greenLight',
      outline: 'ink',
      scale: UI_SCALE * 4,
    });
    this.subtitleText = new PixelText(this, centerX, 78 * LAYOUT_UNIT, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    this.hintText = new PixelText(this, centerX, 96 * LAYOUT_UNIT, 'RESTE APPUYE VERS OU TU VEUX ALLER - TIR AUTO', {
      color: 'cyan',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    this.promptText = new PixelText(this, centerX, 120 * LAYOUT_UNIT, 'TOUCHE OU CLIQUE POUR JOUER', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    this.warningText = new PixelText(this, centerX, 70 * LAYOUT_UNIT, 'ATTENTION ! LE ROI SLIME ARRIVE', {
      color: 'redLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setVisible(false);
    this.specialText = new PixelText(this, centerX, 36 * LAYOUT_UNIT, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 3,
    }).setVisible(false);
  }

  private createSkillButton() {
    const left = VIEW_WIDTH - 6 * LAYOUT_UNIT - SKILL_BUTTON_WIDTH;
    const top = SKILL_BUTTON_Y - SKILL_BUTTON_HEIGHT / 2;
    this.skillButton = this.add.graphics();
    const draw = (hovered: boolean) => {
      this.skillButton.clear();
      this.skillButton.fillStyle(PALETTE.ink, 1);
      this.skillButton.fillRect(
        left - 2 * UI_SCALE,
        top - 2 * UI_SCALE,
        SKILL_BUTTON_WIDTH + 4 * UI_SCALE,
        SKILL_BUTTON_HEIGHT + 4 * UI_SCALE,
      );
      this.skillButton.fillStyle(hovered ? PALETTE.greenLight : PALETTE.green, 1);
      this.skillButton.fillRect(left, top, SKILL_BUTTON_WIDTH, SKILL_BUTTON_HEIGHT);
      this.skillButton.fillStyle(PALETTE.greenDark, 1);
      this.skillButton.fillRect(left, top + SKILL_BUTTON_HEIGHT - UI_SCALE, SKILL_BUTTON_WIDTH, UI_SCALE);
    };
    draw(false);
    const centerX = left + SKILL_BUTTON_WIDTH / 2;
    this.skillButtonText = new PixelText(this, centerX, SKILL_BUTTON_Y, 'ARBRE - K', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    });
    this.skillBadge = new PixelText(this, left - 3 * LAYOUT_UNIT, SKILL_BUTTON_Y, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    }).setOrigin(1, 0.5);
    this.skillZone = this.add
      .zone(centerX, SKILL_BUTTON_Y, SKILL_BUTTON_WIDTH, SKILL_BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true });
    this.skillZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => draw(true));
    this.skillZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => draw(false));
    this.skillZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.mainScene.openSkillTree());
  }

  private updateProgress(time: number) {
    this.playerLevelText.setText(`NIV ${GameState.playerLevel}`);
    const barLeft = 6 * LAYOUT_UNIT + this.playerLevelText.displayWidth + 3 * LAYOUT_UNIT;
    const barTop = 26 * LAYOUT_UNIT + UI_SCALE;
    const ratio = Math.min(1, GameState.xp / GameState.xpToNextLevel);
    this.xpBar.clear();
    this.xpBar.fillStyle(PALETTE.ink, 1);
    this.xpBar.fillRect(barLeft, barTop, XP_BAR_WIDTH + 2 * UI_SCALE, XP_BAR_HEIGHT + 2 * UI_SCALE);
    this.xpBar.fillStyle(PALETTE.mossDark, 1);
    this.xpBar.fillRect(barLeft + UI_SCALE, barTop + UI_SCALE, XP_BAR_WIDTH, XP_BAR_HEIGHT);
    this.xpBar.fillStyle(PALETTE.cyan, 1);
    const filled = Math.floor((XP_BAR_WIDTH * ratio) / UI_SCALE) * UI_SCALE;
    this.xpBar.fillRect(barLeft + UI_SCALE, barTop + UI_SCALE, filled, XP_BAR_HEIGHT);

    const quests = GameState.activeQuests;
    this.questTexts.forEach((text, index) => {
      const quest = quests[index];
      text.setVisible(quest !== undefined);
      if (quest) {
        text.setText(trackerLine(quest));
        text.setTint(quest.state === 'complete' ? PALETTE.goldLight : 0xffffff);
      }
    });

    const points = GameState.skillPoints;
    const blink = Math.floor(time / 350) % 2 === 0;
    this.skillBadge.setText(points > 0 ? `+${points}` : '').setAlpha(blink ? 1 : 0.4);

    const bannerOn = this.mainScene.bannerVisible;
    this.bannerTitle.setVisible(bannerOn);
    this.bannerSubtitle.setVisible(bannerOn);
    if (bannerOn) {
      this.bannerTitle.setText(this.mainScene.bannerText ?? '');
      this.bannerSubtitle.setText(this.mainScene.bannerSubtitle);
    }
  }

  private updateSpecialText(phase: GamePhase) {
    const announcement = this.mainScene.specialAnnouncement;
    const sinceAnnounced = this.mainScene.time.now - this.mainScene.specialAnnouncedAt;
    const inCombat = phase === 'playing' || phase === 'bossIntro' || phase === 'boss' || phase === 'victory';
    const visible = announcement !== null && inCombat && sinceAnnounced < SPECIAL_BANNER_MS;
    this.specialText.setVisible(visible);
    if (!visible || announcement === null) {
      return;
    }
    this.specialText.setText(announcement);
    const pop = Math.max(0, 1 - sinceAnnounced / 250);
    this.specialText.setScale(UI_SCALE * (3 + pop * 1.5));
  }

  update(time: number) {
    if (!this.mainScene?.player) {
      return;
    }
    this.hearts.setHealth(this.mainScene.player.health, this.mainScene.player.maxHealth);
    this.scoreText.setText(String(GameState.score));
    this.coinsText.setText(`${GameState.coins} €`);
    this.levelText.setText(`ZONE ${GameState.level}`);

    const boss = this.mainScene.boss;
    this.bossBar.setVisible(this.mainScene.phase === 'boss' && boss !== null);
    if (boss) {
      this.bossBar.setRatio(boss.healthRatio, boss.enraged);
    }

    const phase = this.mainScene.phase;
    if (phase !== this.displayedPhase) {
      this.applyPhase(phase);
    }

    const blinkOn = Math.floor(time / 400) % 2 === 0;
    this.promptText.setAlpha(blinkOn ? 1 : 0.25);
    this.warningText.setVisible(phase === 'bossIntro' && Math.floor(time / 250) % 2 === 0);
    const areaFresh = this.mainScene.time.now - this.mainScene.areaChangedAt < AREA_BANNER_MS;
    this.levelBanner.setVisible(phase === 'playing' && areaFresh);
    this.levelBanner.setText(this.mainScene.areaName);
    this.updateSpecialText(phase);
    if (phase !== 'title') {
      this.updateProgress(time);
    }
    if (phase === 'gameOver') {
      this.promptText.setVisible(this.mainScene.phaseElapsedMs > RESTART_DELAY_MS);
    }
  }

  private applyPhase(phase: GamePhase) {
    this.displayedPhase = phase;
    const overlay = phase === 'title' || phase === 'gameOver';
    const banner = overlay || phase === 'victory';
    this.dimmer.setVisible(overlay);
    this.titleText.setVisible(banner);
    this.subtitleText.setVisible(banner);
    this.hintText.setVisible(phase === 'title');
    this.promptText.setVisible(overlay);
    const hudVisible = phase !== 'title';
    this.hearts.setVisible(hudVisible);
    this.scoreText.setVisible(hudVisible);
    this.coinsText.setVisible(hudVisible);
    this.levelText.setVisible(hudVisible);
    this.playerLevelText.setVisible(hudVisible);
    this.xpBar.setVisible(hudVisible);
    this.skillButton.setVisible(hudVisible);
    this.skillButtonText.setVisible(hudVisible);
    this.skillBadge.setVisible(hudVisible);
    this.skillZone.setVisible(hudVisible);
    if (hudVisible) {
      this.skillZone.setInteractive({ useHandCursor: true });
    } else {
      this.skillZone.disableInteractive();
      this.questTexts.forEach((text) => text.setVisible(false));
      this.bannerTitle.setVisible(false);
      this.bannerSubtitle.setVisible(false);
    }

    if (phase === 'title') {
      this.titleText.setText(GAME_TITLE);
      this.subtitleText.setText(GameState.bestScore > 0 ? `RECORD ${GameState.bestScore}` : 'EXPLORE LE MONDE !');
      this.promptText.setText('TOUCHE OU CLIQUE POUR JOUER');
    }
    if (phase === 'gameOver') {
      this.titleText.setText('PERDU...');
      this.subtitleText.setText('TU PERDS LA MOITIE DE TES PIECES');
      this.promptText.setText('TOUCHE POUR REVENIR AU VILLAGE');
    }
    if (phase === 'victory') {
      this.titleText.setText('VICTOIRE !');
      this.subtitleText.setText(`LE ROI SLIME EST BATTU  +${BOSS_REWARD_COINS} €`);
    }
  }
}
