import Phaser from 'phaser';
import { CustomScene } from '../customClasses/CustomScene';
import { MainScene } from './MainScene';
import {
  LAYOUT_UNIT,
  PALETTE,
  UI_SCALE,
  ShopCardDef,
  ShopKind,
  UPGRADES,
  UpgradeOffer,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WEAPONS,
  getShopDef,
} from '../elements';
import { GameState } from '../objects/staticClasses/GameState';
import { PixelText } from '../ui/PixelText';
import { SHOP_CARD_WIDTH, ShopCard } from '../ui/ShopCard';

interface ShopEntry {
  card: ShopCard;
  getOffer: () => UpgradeOffer;
  select: () => boolean;
}

interface ShopItem {
  def: ShopCardDef;
  getOffer: () => UpgradeOffer;
  select: () => boolean;
}

interface ShopSceneData {
  shop?: ShopKind;
}

const INPUT_DELAY_MS = 350;
const CARD_GAP = 4 * LAYOUT_UNIT;
const TITLE_Y = 14 * LAYOUT_UNIT;
const COINS_Y = 28 * LAYOUT_UNIT;
const STATS_Y = 38 * LAYOUT_UNIT;
const CARDS_CENTER_Y = 96 * LAYOUT_UNIT;
const BUTTON_CENTER_Y = 156 * LAYOUT_UNIT;
const BUTTON_WIDTH = 64 * LAYOUT_UNIT;
const BUTTON_HEIGHT = 15 * LAYOUT_UNIT;
const FOOTER_Y = 172 * LAYOUT_UNIT;

export class ShopScene extends CustomScene {
  private mainScene!: MainScene;
  private entries: ShopEntry[] = [];
  private coinsText!: PixelText;
  private statsText!: PixelText;
  private continueButton!: Phaser.GameObjects.Graphics;
  private inputReadyAt: number = 0;
  private leaving: boolean = false;

  constructor() {
    super('ShopScene');
  }

  create(data: ShopSceneData = {}) {
    this.mainScene = this.scene.get('MainScene') as MainScene;
    this.entries = [];
    this.leaving = false;
    this.inputReadyAt = this.game.loop.time + INPUT_DELAY_MS;
    const shopKind: ShopKind = data.shop ?? 'weapons';
    const centerX = VIEW_WIDTH / 2;

    this.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, PALETTE.ink, 0.88).setOrigin(0, 0).setInteractive();

    new PixelText(this, centerX, TITLE_Y, getShopDef(shopKind).name, {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 4,
    });
    this.coinsText = new PixelText(this, centerX, COINS_Y, '', {
      color: 'goldLight',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    this.statsText = new PixelText(this, centerX, STATS_Y, '', {
      color: 'cyan',
      outline: 'ink',
      scale: UI_SCALE * 1.5,
    });

    this.createCardRow(this.itemsFor(shopKind));
    this.createContinueButton(centerX);
    new PixelText(this, centerX, FOOTER_Y, 'ENTREE POUR SORTIR', {
      color: 'whiteShade',
      outline: 'ink',
    });

    const leaveOnFreshPress = (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.leave();
      }
    };
    this.input.keyboard?.on('keydown-ENTER', leaveOnFreshPress);
    this.input.keyboard?.on('keydown-SPACE', leaveOnFreshPress);
    this.input.keyboard?.on('keydown-ESC', leaveOnFreshPress);

    this.refresh();
  }

  private itemsFor(shopKind: ShopKind): ShopItem[] {
    if (shopKind === 'weapons') {
      return WEAPONS.map((weaponDef) => ({
        def: weaponDef,
        getOffer: () => this.mainScene.getWeaponOffer(weaponDef.kind),
        select: () => this.mainScene.selectWeapon(weaponDef.kind),
      }));
    }
    return UPGRADES.filter((upgradeDef) => upgradeDef.shop === shopKind).map((upgradeDef) => ({
      def: upgradeDef,
      getOffer: () => this.mainScene.getUpgradeOffer(upgradeDef.kind),
      select: () => this.mainScene.purchaseUpgrade(upgradeDef.kind),
    }));
  }

  private createCardRow(items: ShopItem[]) {
    const rowWidth = items.length * SHOP_CARD_WIDTH + (items.length - 1) * CARD_GAP;
    const firstCardX = (VIEW_WIDTH - rowWidth) / 2 + SHOP_CARD_WIDTH / 2;
    items.forEach((item, index) => {
      const cardX = firstCardX + index * (SHOP_CARD_WIDTH + CARD_GAP);
      const entry: ShopEntry = {
        card: new ShopCard(this, cardX, CARDS_CENTER_Y, item.def, () => this.handleCardSelected(entry)),
        getOffer: item.getOffer,
        select: item.select,
      };
      entry.card.setAlpha(0);
      this.tweens.add({
        targets: entry.card,
        alpha: 1,
        y: { from: CARDS_CENTER_Y + 6 * LAYOUT_UNIT, to: CARDS_CENTER_Y },
        delay: index * 60,
        duration: 240,
        ease: 'Back.easeOut',
      });
      this.entries.push(entry);
    });
  }

  private createContinueButton(centerX: number) {
    this.continueButton = this.add.graphics();
    new PixelText(this, centerX, BUTTON_CENTER_Y, 'SORTIR', {
      color: 'white',
      outline: 'ink',
      scale: UI_SCALE * 2,
    });
    const hitZone = this.add
      .zone(centerX, BUTTON_CENTER_Y, BUTTON_WIDTH, BUTTON_HEIGHT)
      .setInteractive({ useHandCursor: true });
    hitZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.drawContinueButton(true));
    hitZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.drawContinueButton(false));
    hitZone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.leave());
    this.drawContinueButton(false);
  }

  private drawContinueButton(hovered: boolean) {
    const left = (VIEW_WIDTH - BUTTON_WIDTH) / 2;
    const top = BUTTON_CENTER_Y - BUTTON_HEIGHT / 2;
    const border = 2 * UI_SCALE;
    this.continueButton.clear();
    this.continueButton.fillStyle(PALETTE.ink, 1);
    this.continueButton.fillRect(left - border, top - border, BUTTON_WIDTH + 2 * border, BUTTON_HEIGHT + 2 * border);
    this.continueButton.fillStyle(hovered ? PALETTE.blueLight : PALETTE.blue, 1);
    this.continueButton.fillRect(left, top, BUTTON_WIDTH, BUTTON_HEIGHT);
    this.continueButton.fillStyle(PALETTE.cyan, 1);
    this.continueButton.fillRect(left, top, BUTTON_WIDTH, UI_SCALE);
    this.continueButton.fillStyle(PALETTE.blueDark, 1);
    this.continueButton.fillRect(left, top + BUTTON_HEIGHT - UI_SCALE, BUTTON_WIDTH, UI_SCALE);
  }

  private get inputReady(): boolean {
    return !this.leaving && this.game.loop.time >= this.inputReadyAt;
  }

  private handleCardSelected(entry: ShopEntry) {
    if (!this.inputReady) {
      return;
    }
    const wasAvailable = entry.getOffer().status === 'available';
    if (entry.select()) {
      entry.card.playPurchased();
      if (wasAvailable) {
        this.tweens.add({
          targets: this.coinsText,
          scale: { from: UI_SCALE * 2.4, to: UI_SCALE * 2 },
          duration: 180,
          ease: 'Quad.easeOut',
        });
      }
    } else {
      entry.card.playRefused();
    }
    this.refresh();
  }

  private leave() {
    if (!this.inputReady) {
      return;
    }
    this.leaving = true;
    this.mainScene.leaveShop();
  }

  private refresh() {
    const player = this.mainScene.player;
    const shotsPerSecond = (1000 / GameState.fireIntervalMs).toFixed(1);
    this.coinsText.setText(`BOURSE : ${GameState.coins} €`);
    this.statsText.setText(
      `${GameState.weaponDef.name}   COEURS ${player.health}/${player.maxHealth}   DEGATS ${GameState.bulletDamage * GameState.weaponDef.damageFactor}   TIRS/S ${shotsPerSecond}   BALLES ${GameState.projectilesPerShot}`,
    );
    this.entries.forEach((entry) => entry.card.setOffer(entry.getOffer()));
  }
}
