import Phaser from 'phaser';
import { CustomScene } from '../customClasses/CustomScene';
import { UIScene } from './UIScene';
import { DialogButton, DialogSceneData } from './DialogScene';
import { Player } from '../objects/Player';
import { Pet } from '../objects/Pet';
import { PlayerControls } from '../objects/input/PlayerControls';
import { Projectile, ProjectilePool } from '../objects/combat/ProjectilePool';
import { EffectsManager } from '../objects/combat/EffectsManager';
import { Enemy } from '../objects/combat/Enemy';
import { Slime } from '../objects/combat/Slime';
import { Goblin } from '../objects/combat/Goblin';
import { Golem } from '../objects/combat/Golem';
import { Bat } from '../objects/combat/Bat';
import { KingSlime } from '../objects/combat/KingSlime';
import { Pickup } from '../objects/combat/Pickup';
import { Bomb, BombOwner } from '../objects/combat/Bomb';
import { BrokenBreakable, ShopSite, VillagerSite, WorldMap } from '../objects/world/WorldMap';
import { biomeAt } from '../objects/world/WorldGenerator';
import { busyLines, createQuest, offerLines, thanksLines, waitingLines } from '../objects/quests/QuestBoard';
import {
  BALL_HIT_RADIUS,
  BOMB_RAIN_COUNT,
  BOMB_RAIN_DAMAGE,
  BOMB_RAIN_FALL_MS,
  BOMB_RAIN_INTERVAL_MS,
  BOMB_RAIN_RADIUS,
  BOSS_CONTACT_RADIUS,
  BOSS_HIT_RADIUS,
  BOSS_HOME_DISTANCE,
  BOSS_KILLS_REQUIRED,
  BOSS_MAX_HEALTH,
  BOSS_REWARD_COINS,
  BOSS_SPAWN_DISTANCE,
  BREAKABLE_COIN_CHANCE,
  BREAKABLE_COIN_STACK_CHANCE,
  BREAKABLE_HEART_CHANCE,
  BULLET_SPEED,
  COINS_PER_SLIME,
  COIN_STACK_VALUE,
  CRITICAL_DAMAGE_FACTOR,
  CombatContext,
  ENEMY_BASE_CAP,
  ENEMY_BOMB_ARC_HEIGHT,
  ENEMY_BOMB_FLIGHT_MS,
  ENEMY_BOMB_RADIUS,
  ENEMY_CAP_PER_ZONE,
  ENEMY_DESPAWN_DISTANCE,
  ENEMY_MAX_CAP,
  ENEMY_SPAWN_DISTANCE,
  ENEMY_SPAWN_INTERVAL_MS,
  EnemyKind,
  GOO_TEXTURE_BY_KIND,
  GamePhase,
  HEART_PICKUP_RADIUS,
  LAYOUT_UNIT,
  MEGA_LASER_DAMAGE_FACTOR,
  MEGA_LASER_DURATION_MS,
  MEGA_LASER_HEIGHT,
  MEGA_LASER_TICK_MS,
  NPC_RELEASE_RADIUS,
  NPC_TALK_RADIUS,
  PET_FIRE_INTERVAL_MS,
  PET_RANGE,
  PIXEL_SCALE,
  PLAYER_BODY_RADIUS,
  PLAYER_HIT_RADIUS,
  PickupKind,
  Quest,
  RESTART_DELAY_MS,
  SHIELD_DURATION_MS,
  SHIELD_RADIUS,
  SPECIAL_KINDS,
  SPECIAL_NAMES,
  SPRITE_ATLAS,
  STAR_PICKUP_RADIUS,
  SkillKind,
  SpecialKind,
  TEXTURE,
  TILE_SIZE,
  UpgradeKind,
  UpgradeOffer,
  VICTORY_BANNER_MS,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WeaponKind,
  ZONE_SIZE_TILES,
  getBiomeDef,
  getEnemyDef,
  getWeaponDef,
} from '../elements';
import { GameState } from '../objects/staticClasses/GameState';
import { bakePixelText } from '../utils/pixelArt';
import { FRONT_DEPTH, removeSplashScreen } from '../utils/utils';

interface AimTarget {
  x: number;
  y: number;
}

interface StepAttempt {
  x: number;
  y: number;
  travelled: number;
}

const CAMERA_LIFT = 8 * LAYOUT_UNIT;
const CLICK_ORIGIN_HEIGHT = 2 * LAYOUT_UNIT;
const WALKING_PROGRESS_RATIO = 0.25;
const BOSS_INTRO_MS = 3000;
const MAX_FRAME_MS = 50;
const MEGA_LASER_LENGTH = 220 * LAYOUT_UNIT;
const SKY_BOMB_DROP_HEIGHT = 170 * LAYOUT_UNIT;
const SKY_BOMB_AIM_CHANCE = 0.75;
const SKY_BOMB_JITTER = 6 * LAYOUT_UNIT;
const SKY_BOMB_SPREAD = { x: 110 * LAYOUT_UNIT, y: 60 * LAYOUT_UNIT };
const EXPLOSION_CENTER_HEIGHT = 4 * LAYOUT_UNIT;
const EXPLOSION_DEPTH_SQUASH = 1.5;
const SPAWN_SPEEDUP_PER_ZONE = 0.15;
const VILLAGE_ARROW_MIN_DISTANCE = 200 * LAYOUT_UNIT;
const VILLAGE_ARROW_ORBIT = 26 * LAYOUT_UNIT;
const BOSS_ESCAPE_DISTANCE = ENEMY_DESPAWN_DISTANCE * 1.3;
const PET_SHOT_SPEED_FACTOR = 0.8;
const HOME_SPAWN_OFFSET = 4 * TILE_SIZE;
const COIN_PICKUP_RADIUS = 8 * LAYOUT_UNIT;
const LOOT_SCATTER = 3 * LAYOUT_UNIT;
const BANNER_MS = 2600;
const BREAKABLE_AIM_RANGE = 60 * LAYOUT_UNIT;

export class MainScene extends CustomScene {
  uiScene!: UIScene;
  phase: GamePhase = 'title';
  private phaseStartedAt: number = 0;
  world!: WorldMap;
  private readonly view = new Phaser.Geom.Rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  player!: Player;
  private pet!: Pet;
  private controls!: PlayerControls;
  private bullets!: ProjectilePool;
  private enemyBalls!: ProjectilePool;
  private effects!: EffectsManager;
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private bombs: Bomb[] = [];
  boss: KingSlime | null = null;
  private homeX: number = 0;
  private homeY: number = 0;
  private fireCooldownMs: number = 0;
  private petCooldownMs: number = 0;
  private spawnCooldownMs: number = 0;
  private regenerationMs: number = 0;
  private killsSinceBoss: number = 0;
  private gameClockMs: number = 0;
  private combatContext!: CombatContext;
  private laserBeam!: Phaser.GameObjects.Image;
  private villageArrow!: Phaser.GameObjects.Image;
  private megaLaserUntil: number = 0;
  private nextLaserTickAt: number = 0;
  private pendingSkyBombs: number = 0;
  private nextSkyBombAt: number = 0;
  private lockedDoor: ShopSite | null = null;
  private lockedVillager: VillagerSite | null = null;
  private petVisible: boolean = false;
  private doorLockPressCount: number = 0;
  private aimTarget: AimTarget | null = null;
  specialAnnouncement: string | null = null;
  specialAnnouncedAt: number = 0;
  areaName: string = '';
  areaChangedAt: number = 0;
  bannerText: string | null = null;
  bannerSubtitle: string = '';
  bannerAt: number = 0;

  constructor() {
    super('MainScene');
  }

  create() {
    super.create();
    removeSplashScreen(this);

    this.tileSize = this.cameras.main.height / 18;
    this.pixelUnit = this.tileSize / 16;
    this.uiScene = this.scene.get('UIScene') as UIScene;

    this.world = new WorldMap(this);
    const home = this.world.planner.home;
    this.homeX = home.centerX;
    this.homeY = home.centerY + HOME_SPAWN_OFFSET;
    this.areaName = home.name;
    this.player = new Player(this, this.homeX, this.homeY);
    this.pet = new Pet(this, this.homeX, this.homeY);
    this.pet.setVisible(false);
    this.controls = new PlayerControls(this);
    this.bullets = new ProjectilePool(this, TEXTURE.bullet);
    this.enemyBalls = new ProjectilePool(this, TEXTURE.slimeBall);
    this.effects = new EffectsManager(this);
    this.laserBeam = this.add
      .image(0, 0, SPRITE_ATLAS, TEXTURE.megaLaser)
      .setOrigin(0, 0.5)
      .setDepth(FRONT_DEPTH - 10)
      .setVisible(false);
    this.villageArrow = this.add
      .image(0, 0, SPRITE_ATLAS, TEXTURE.villageArrow)
      .setScale(PIXEL_SCALE)
      .setDepth(FRONT_DEPTH)
      .setVisible(false);

    this.combatContext = {
      timeMs: 0,
      playerX: this.player.x,
      playerY: this.player.y,
      fireEnemyBall: (x, y, angle, speed, texture) => {
        this.enemyBalls.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, y, { texture });
      },
      spawnEnemy: (kind, x, groundY) => this.spawnEnemy(kind, x, groundY),
      throwBomb: (fromX, fromY, targetX, targetGroundY) => {
        this.bombs.push(
          new Bomb(this, {
            owner: 'enemy',
            startX: fromX,
            startY: fromY,
            targetX,
            targetGroundY,
            durationMs: ENEMY_BOMB_FLIGHT_MS,
            arcHeight: ENEMY_BOMB_ARC_HEIGHT,
          }),
        );
      },
      shake: (intensity) => this.cameras.main.shake(120 + intensity * 40, 0.002 * intensity),
      burstGoo: (x, y, groundY, texture, count) => this.effects.burst(x, y, groundY, texture, count),
    };

    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.handleTap());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleTap());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleTap());
    this.input.keyboard?.on('keydown-K', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.openSkillTree();
      }
    });

    this.followCamera();
    this.setPhase('title');
  }

  get phaseElapsedMs(): number {
    return this.time.now - this.phaseStartedAt;
  }

  private get inCombat(): boolean {
    return (
      this.phase === 'playing' || this.phase === 'bossIntro' || this.phase === 'boss' || this.phase === 'victory'
    );
  }

  private get isPaused(): boolean {
    return this.phase === 'shop' || this.phase === 'dialog' || this.phase === 'skills';
  }

  private get zone(): number {
    const distanceTiles = Math.hypot(this.player.x - this.homeX, this.player.y - this.homeY) / TILE_SIZE;
    return 1 + Math.floor(distanceTiles / ZONE_SIZE_TILES);
  }

  private setPhase(phase: GamePhase) {
    this.phase = phase;
    this.phaseStartedAt = this.time.now;
  }

  private handleTap() {
    if (this.phase === 'title') {
      GameState.resetRun();
      this.startAtHome();
      return;
    }
    if (this.phase === 'gameOver' && this.phaseElapsedMs > RESTART_DELAY_MS) {
      GameState.loseHalfCoins();
      this.startAtHome();
    }
  }

  private startAtHome() {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
    this.pickups.forEach((pickup) => pickup.destroy());
    this.pickups = [];
    this.bombs.forEach((bomb) => bomb.destroy());
    this.bombs = [];
    this.boss?.destroy();
    this.boss = null;
    this.bullets.clear();
    this.enemyBalls.clear();
    this.effects.clear();
    this.player.reset(this.homeX, this.homeY, GameState.playerMaxHealth, GameState.playerMaxHealth);
    this.controls.reset();
    this.syncPet();
    this.fireCooldownMs = 0;
    this.regenerationMs = 0;
    this.spawnCooldownMs = ENEMY_SPAWN_INTERVAL_MS;
    this.killsSinceBoss = 0;
    this.megaLaserUntil = 0;
    this.pendingSkyBombs = 0;
    this.lockedDoor = null;
    this.lockedVillager = null;
    this.laserBeam.setVisible(false);
    this.specialAnnouncement = null;
    this.bannerText = null;
    this.areaName = this.world.planner.home.name;
    this.areaChangedAt = this.time.now;
    this.followCamera();
    this.setPhase('playing');
  }

  private syncPet() {
    const owned = GameState.petLevel > 0;
    this.petVisible = owned;
    this.pet.setVisible(owned);
    if (owned) {
      this.pet.placeAt(this.player.x - 6 * LAYOUT_UNIT, this.player.y);
    }
  }

  private pauseFor(phase: GamePhase) {
    this.setPhase(phase);
    this.controls.reset();
    this.player.setMotion(false, 0, 0);
    this.input.enabled = false;
  }

  private resume() {
    this.input.enabled = true;
    this.controls.releasePointer();
    this.doorLockPressCount = this.controls.pressCount;
    this.setPhase('playing');
  }

  private openShop(shop: ShopSite) {
    this.lockedDoor = shop;
    this.pauseFor('shop');
    this.scene.launch('ShopScene', { shop: shop.kind });
    this.scene.bringToTop('ShopScene');
  }

  leaveShop() {
    this.scene.stop('ShopScene');
    if (this.lockedDoor) {
      this.player.moveTo(this.lockedDoor.doorX, this.lockedDoor.doorY);
      this.player.setMotion(false, 0, 1);
      this.lockedDoor = null;
    }
    this.followCamera();
    this.resume();
  }

  openSkillTree() {
    if (this.phase !== 'playing' && this.phase !== 'victory') {
      return;
    }
    this.pauseFor('skills');
    this.scene.launch('SkillTreeScene');
    this.scene.bringToTop('SkillTreeScene');
  }

  closeSkillTree() {
    this.scene.stop('SkillTreeScene');
    this.resume();
  }

  closeDialog() {
    this.scene.stop('DialogScene');
    this.resume();
  }

  learnSkill(kind: SkillKind): boolean {
    if (!GameState.learnSkill(kind)) {
      return false;
    }
    if (kind === 'vitality') {
      this.player.setMaxHealth(GameState.playerMaxHealth);
      this.player.heal();
    }
    return true;
  }

  private talkTo(site: VillagerSite) {
    this.lockedVillager = site;
    const villager = site.villager;
    let quest = GameState.questOf(villager.id);
    let lines: string[];
    let buttons: DialogButton[];
    if (quest?.state === 'complete') {
      const finished = quest;
      lines = thanksLines(finished);
      buttons = [{ label: 'SUPER !', action: () => this.rewardQuest(finished) }];
    } else if (quest?.state === 'active') {
      lines = waitingLines(quest);
      buttons = [{ label: "D'ACCORD", action: () => undefined }];
    } else if (!GameState.canTakeQuest) {
      lines = busyLines();
      buttons = [{ label: "D'ACCORD", action: () => undefined }];
    } else {
      if (!quest) {
        quest = createQuest(villager);
        GameState.quests.push(quest);
      }
      const offered = quest;
      lines = offerLines(offered);
      buttons = [
        { label: 'OUI !', action: () => GameState.acceptQuest(offered) },
        { label: 'PLUS TARD', action: () => undefined },
      ];
    }
    const data: DialogSceneData = { speaker: villager.name, portrait: villager.texture, lines, buttons };
    this.pauseFor('dialog');
    this.scene.launch('DialogScene', data);
    this.scene.bringToTop('DialogScene');
  }

  private rewardQuest(quest: Quest) {
    GameState.finishQuest(quest);
    GameState.addCoins(quest.rewardCoins);
    GameState.addScore(quest.rewardXp * 20);
    this.gainXp(quest.rewardXp);
    this.showBanner('QUETE REUSSIE !', `+${quest.rewardXp} XP  +${quest.rewardCoins} €`);
  }

  private gainXp(amount: number) {
    const levels = GameState.addXp(amount);
    if (levels > 0) {
      this.player.heal();
      this.showBanner(`NIVEAU ${GameState.playerLevel} !`, 'APPUIE SUR ARBRE POUR TES POINTS');
    }
  }

  private showBanner(text: string, subtitle: string) {
    this.bannerText = text;
    this.bannerSubtitle = subtitle;
    this.bannerAt = this.time.now;
  }

  get bannerVisible(): boolean {
    return this.bannerText !== null && this.time.now - this.bannerAt < BANNER_MS;
  }

  getUpgradeOffer(kind: UpgradeKind): UpgradeOffer {
    const price = GameState.upgradePrice(kind);
    const level = GameState.upgradeLevels[kind];
    if (GameState.isUpgradeMaxed(kind)) {
      return { status: 'maxed', price, level };
    }
    if (kind === 'potion' && this.player.health >= this.player.maxHealth) {
      return { status: 'useless', price, level };
    }
    if (GameState.coins < price) {
      return { status: 'tooExpensive', price, level };
    }
    return { status: 'available', price, level };
  }

  purchaseUpgrade(kind: UpgradeKind): boolean {
    const offer = this.getUpgradeOffer(kind);
    if (offer.status !== 'available' || !GameState.spendCoins(offer.price)) {
      return false;
    }
    if (kind === 'potion') {
      this.player.healFull();
      return true;
    }
    GameState.upgradeLevels[kind] += 1;
    return true;
  }

  getWeaponOffer(kind: WeaponKind): UpgradeOffer {
    const price = getWeaponDef(kind).price;
    if (GameState.equippedWeapon === kind) {
      return { status: 'equipped', price, level: 0 };
    }
    if (GameState.ownedWeapons.has(kind)) {
      return { status: 'owned', price, level: 0 };
    }
    if (GameState.coins < price) {
      return { status: 'tooExpensive', price, level: 0 };
    }
    return { status: 'available', price, level: 0 };
  }

  selectWeapon(kind: WeaponKind): boolean {
    const offer = this.getWeaponOffer(kind);
    if (offer.status === 'owned') {
      GameState.equippedWeapon = kind;
      return true;
    }
    if (offer.status !== 'available' || !GameState.spendCoins(offer.price)) {
      return false;
    }
    GameState.ownedWeapons.add(kind);
    GameState.equippedWeapon = kind;
    return true;
  }

  private spawnEnemy(kind: EnemyKind, x: number, groundY: number) {
    const baseDef = getEnemyDef(kind);
    const scaledDef = { ...baseDef, hitPoints: Math.ceil(baseDef.hitPoints * GameState.enemyHealthMultiplier) };
    const movement = scaledDef.movement;
    if (movement === 'archer' || movement === 'bomber' || movement === 'thrower') {
      this.enemies.push(new Goblin(this, scaledDef, x, groundY));
    } else if (movement === 'golem') {
      this.enemies.push(new Golem(this, scaledDef, x, groundY));
    } else if (movement === 'flutter') {
      this.enemies.push(new Bat(this, scaledDef, x, groundY));
    } else {
      this.enemies.push(new Slime(this, scaledDef, x, groundY));
    }
  }

  update(_time: number, delta: number) {
    if (this.isPaused) {
      return;
    }
    const deltaMs = Math.min(delta, MAX_FRAME_MS);
    this.gameClockMs += deltaMs;
    const time = this.gameClockMs;

    this.effects.update(deltaMs);
    this.player.update(time);
    this.updateBombs(deltaMs, time);
    this.world.updateVillagers(time);

    if (!this.inCombat) {
      this.laserBeam.setVisible(false);
      this.villageArrow.setVisible(false);
      this.followCamera();
      this.bullets.update(deltaMs, this.view);
      this.enemyBalls.update(deltaMs, this.view);
      this.pickups.forEach((pickup) => pickup.update(deltaMs));
      this.cleanupEntities();
      return;
    }

    this.movePlayer(deltaMs);
    this.followCamera();
    this.combatContext.timeMs = time;
    this.combatContext.playerX = this.player.x;
    this.combatContext.playerY = this.player.y;
    GameState.level = this.zone;
    this.updateArea();
    this.updateVillageArrow();
    this.updateRegeneration(deltaMs);
    this.updateFiring(time, deltaMs);
    this.updateMegaLaser(time);
    this.updateBombRain(time);
    this.updatePet(deltaMs);
    this.updatePhase(deltaMs);

    this.bullets.update(deltaMs, this.view);
    this.enemyBalls.update(deltaMs, this.view);
    this.enemies.forEach((enemy) => enemy.update(deltaMs, this.combatContext));
    this.pickups.forEach((pickup) => pickup.update(deltaMs));
    this.boss?.update(deltaMs, this.combatContext);

    this.resolveBulletHits();
    this.resolvePlayerHits(time);
    this.collectPickups(time);
    this.cleanupEntities();
    this.checkInteractions();
  }

  private updateRegeneration(deltaMs: number) {
    const interval = GameState.regenerationIntervalMs;
    if (interval <= 0 || this.player.isDown || this.player.health >= this.player.maxHealth) {
      this.regenerationMs = 0;
      return;
    }
    this.regenerationMs += deltaMs;
    if (this.regenerationMs >= interval) {
      this.regenerationMs = 0;
      this.player.heal();
      const center = this.player.hitCenter;
      this.effects.burst(center.x, center.y, this.player.y, TEXTURE.leafBits, 5, 0.6);
    }
  }

  private updatePhase(deltaMs: number) {
    const inVillage = this.world.isInVillage(this.player.x, this.player.y);
    if (this.phase === 'playing') {
      this.updateSpawning(deltaMs, inVillage);
      if (this.killsSinceBoss >= BOSS_KILLS_REQUIRED && !inVillage) {
        this.setPhase('bossIntro');
      }
    } else if (this.phase === 'bossIntro' && inVillage) {
      this.setPhase('playing');
    } else if (this.phase === 'boss' && this.boss && !this.boss.isDying && inVillage) {
      this.boss.destroy();
      this.boss = null;
      this.killsSinceBoss = Math.floor(BOSS_KILLS_REQUIRED / 2);
      this.setPhase('playing');
    } else if (this.phase === 'bossIntro' && this.phaseElapsedMs >= BOSS_INTRO_MS) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const bossHealth = Math.round(BOSS_MAX_HEALTH * GameState.enemyHealthMultiplier);
      this.boss = new KingSlime(
        this,
        this.player.x + side * BOSS_SPAWN_DISTANCE,
        this.player.y,
        this.player.x + side * BOSS_HOME_DISTANCE,
        this.player.y,
        bossHealth,
        () => this.handleVictory(),
      );
      this.setPhase('boss');
    } else if (this.phase === 'boss' && this.boss && !this.boss.isDying) {
      const gap = Math.hypot(this.boss.x - this.player.x, this.boss.groundY - this.player.y);
      if (gap > BOSS_ESCAPE_DISTANCE) {
        this.boss.destroy();
        this.boss = null;
        this.killsSinceBoss = Math.floor(BOSS_KILLS_REQUIRED / 2);
        this.setPhase('playing');
      }
    } else if (this.phase === 'victory' && this.phaseElapsedMs >= VICTORY_BANNER_MS) {
      this.setPhase('playing');
    }
  }

  private movePlayer(deltaMs: number) {
    if (this.player.isDown) {
      this.aimTarget = null;
      return;
    }
    const movement = this.controls.readMovement(this.player.x, this.player.y - CLICK_ORIGIN_HEIGHT);
    let moving = movement.x !== 0 || movement.y !== 0;
    let lookX = movement.x;
    let lookY = movement.y;
    if (moving) {
      const step = (GameState.walkSpeed * deltaMs) / 1000;
      const attempt = this.tryStep(movement.x, movement.y, step);
      moving = attempt.travelled >= step * WALKING_PROGRESS_RATIO;
      this.player.moveTo(attempt.x, attempt.y);
    }
    this.aimTarget = this.findAimTarget();
    if (this.aimTarget) {
      const center = this.player.hitCenter;
      this.player.setMotion(moving, this.aimTarget.x - center.x, this.aimTarget.y - center.y);
    } else {
      this.player.setMotion(moving, lookX, lookY);
    }
  }

  private tryStep(directionX: number, directionY: number, step: number): StepAttempt {
    const body = this.world.pushOut(
      this.player.x + directionX * step,
      this.player.y + directionY * step - PLAYER_BODY_RADIUS,
      PLAYER_BODY_RADIUS,
    );
    const y = body.y + PLAYER_BODY_RADIUS;
    return { x: body.x, y, travelled: Math.hypot(body.x - this.player.x, y - this.player.y) };
  }

  private followCamera() {
    this.view.x = Math.round(this.player.x - VIEW_WIDTH / 2);
    this.view.y = Math.round(this.player.y - CAMERA_LIFT - VIEW_HEIGHT / 2);
    this.cameras.main.setScroll(this.view.x, this.view.y);
    this.world.update(this.view);
  }

  private updateArea() {
    const village = this.world.planner.villageAt(this.player.x, this.player.y);
    const areaName = village ? village.name : getBiomeDef(biomeAt(this.player.x, this.player.y)).name;
    if (areaName !== this.areaName) {
      this.areaName = areaName;
      this.areaChangedAt = this.time.now;
    }
  }

  private updateVillageArrow() {
    const { village, distance } = this.world.planner.nearestVillage(this.player.x, this.player.y);
    const visible = distance > Math.max(VILLAGE_ARROW_MIN_DISTANCE, village.safeRadius) && !this.player.isDown;
    this.villageArrow.setVisible(visible);
    if (!visible) {
      return;
    }
    const center = this.player.hitCenter;
    const angle = Math.atan2(village.centerY - center.y, village.centerX - center.x);
    this.villageArrow
      .setPosition(
        Math.round(center.x + Math.cos(angle) * VILLAGE_ARROW_ORBIT),
        Math.round(center.y + Math.sin(angle) * VILLAGE_ARROW_ORBIT),
      )
      .setRotation(angle)
      .setAlpha(0.6 + Math.sin(this.gameClockMs / 200) * 0.3);
  }

  private checkInteractions() {
    if (this.lockedVillager) {
      const villager = this.lockedVillager.villager;
      const gap = Math.hypot(villager.x - this.player.x, villager.y - this.player.y);
      const pressedVillager =
        this.controls.pressCount !== this.doorLockPressCount &&
        this.controls.wasPressedNear(villager.x, villager.y - 6 * LAYOUT_UNIT, NPC_TALK_RADIUS);
      if (gap <= NPC_RELEASE_RADIUS && !pressedVillager) {
        return;
      }
      this.lockedVillager = null;
    }
    if (this.phase !== 'playing' && this.phase !== 'victory') {
      return;
    }
    const shop = this.world.shopAt(this.player.x, this.player.y - PLAYER_BODY_RADIUS);
    if (shop) {
      this.openShop(shop);
      return;
    }
    const villager = this.world.villagerNear(this.player.x, this.player.y, NPC_TALK_RADIUS);
    if (villager) {
      this.talkTo(villager);
    }
  }

  private updateSpawning(deltaMs: number, inVillage: boolean) {
    this.spawnCooldownMs -= deltaMs;
    if (this.spawnCooldownMs > 0) {
      return;
    }
    const zone = this.zone;
    this.spawnCooldownMs = ENEMY_SPAWN_INTERVAL_MS / (1 + SPAWN_SPEEDUP_PER_ZONE * (zone - 1));
    const cap = Math.min(ENEMY_MAX_CAP, ENEMY_BASE_CAP + ENEMY_CAP_PER_ZONE * (zone - 1));
    if (inVillage || this.enemies.length >= cap) {
      return;
    }
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = this.player.x + Math.cos(angle) * ENEMY_SPAWN_DISTANCE;
    const y = this.player.y + Math.sin(angle) * ENEMY_SPAWN_DISTANCE;
    if (this.world.isInVillage(x, y)) {
      return;
    }
    const candidates = getBiomeDef(biomeAt(x, y)).enemies;
    const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        this.spawnEnemy(candidate.kind, x, y);
        return;
      }
    }
  }

  private findAimTarget(): AimTarget | null {
    const center = this.player.hitCenter;
    let nearest: AimTarget | null = null;
    let nearestDistance = GameState.aimRange;
    this.enemies.forEach((enemy) => {
      const body = enemy.bodyCenter;
      if (enemy.dead || !this.view.contains(body.x, body.y)) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(center.x, center.y, body.x, body.y);
      if (distance < nearestDistance) {
        nearest = body;
        nearestDistance = distance;
      }
    });
    if (this.boss && this.boss.isVulnerable) {
      const body = this.boss.bodyCenter;
      if (Phaser.Math.Distance.Between(center.x, center.y, body.x, body.y) - BOSS_HIT_RADIUS < nearestDistance) {
        nearest = body;
      }
    }
    return nearest ?? this.world.nearestBreakable(center.x, center.y, BREAKABLE_AIM_RANGE);
  }

  private updateFiring(time: number, deltaMs: number) {
    this.fireCooldownMs = Math.max(0, this.fireCooldownMs - deltaMs);
    if (this.fireCooldownMs > 0 || this.player.isDown || !this.aimTarget) {
      return;
    }
    this.fireCooldownMs = GameState.fireIntervalMs;
    const weapon = GameState.weaponDef;
    const muzzle = this.player.muzzlePoint;
    const aimX = Math.cos(this.player.aimAngle);
    const aimY = Math.sin(this.player.aimAngle);
    const projectileCount = GameState.projectilesPerShot;
    const speed = BULLET_SPEED * weapon.speedFactor;
    for (let i = 0; i < projectileCount; i++) {
      const spreadOffset = i - (projectileCount - 1) / 2;
      const sideShift = spreadOffset * weapon.pelletSpacing;
      const sideSpeed = spreadOffset * weapon.spreadSpeed;
      const critical = Math.random() < GameState.criticalChance;
      this.bullets.spawn(
        muzzle.x - aimY * sideShift,
        muzzle.y + aimX * sideShift,
        aimX * speed - aimY * sideSpeed,
        aimY * speed + aimX * sideSpeed,
        this.player.y,
        {
          texture: weapon.projectileTexture,
          damage: GameState.bulletDamage * weapon.damageFactor * (critical ? CRITICAL_DAMAGE_FACTOR : 1),
          piercing: weapon.piercing,
          explosionRadius: weapon.explosionRadius,
          lifetimeMs: weapon.lifetimeMs,
        },
      );
    }
    this.player.flashMuzzle(time);
  }

  private updatePet(deltaMs: number) {
    const owned = GameState.petLevel > 0;
    if (owned !== this.petVisible) {
      this.syncPet();
    }
    if (!owned) {
      return;
    }
    this.pet.update(deltaMs, this.player.x, this.player.y);
    this.petCooldownMs = Math.max(0, this.petCooldownMs - deltaMs);
    if (this.petCooldownMs > 0 || this.player.isDown) {
      return;
    }
    const center = this.pet.center;
    let target: AimTarget | null = null;
    let targetDistance = PET_RANGE;
    this.enemies.forEach((enemy) => {
      const body = enemy.bodyCenter;
      const distance = Phaser.Math.Distance.Between(center.x, center.y, body.x, body.y);
      if (!enemy.dead && distance < targetDistance) {
        target = body;
        targetDistance = distance;
      }
    });
    if (!target && this.boss && this.boss.isVulnerable) {
      const body = this.boss.bodyCenter;
      if (Phaser.Math.Distance.Between(center.x, center.y, body.x, body.y) < PET_RANGE + BOSS_HIT_RADIUS) {
        target = body;
      }
    }
    if (!target) {
      return;
    }
    const aim: AimTarget = target;
    this.petCooldownMs = PET_FIRE_INTERVAL_MS;
    const angle = Math.atan2(aim.y - center.y, aim.x - center.x);
    const speed = BULLET_SPEED * PET_SHOT_SPEED_FACTOR;
    this.pet.lookAt(aim.x, aim.y);
    this.bullets.spawn(center.x, center.y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.pet.y, {
      texture: TEXTURE.spark,
      damage: GameState.petLevel,
    });
  }

  private resolveBulletHits() {
    this.bullets.forEachActive((bullet) => {
      const bulletX = bullet.image.x;
      const bulletY = bullet.image.y;
      for (const enemy of this.enemies) {
        if (enemy.dead || bullet.hitTargets.has(enemy)) {
          continue;
        }
        const center = enemy.bodyCenter;
        if (Phaser.Math.Distance.Between(bulletX, bulletY, center.x, center.y) > enemy.def.hitRadius) {
          continue;
        }
        if (this.applyBulletImpact(bullet, enemy, enemy.groundY, () => this.damageEnemy(enemy, bullet.damage))) {
          return;
        }
      }
      const boss = this.boss;
      if (boss && boss.isVulnerable && !bullet.hitTargets.has(boss)) {
        const center = boss.bodyCenter;
        if (Phaser.Math.Distance.Between(bulletX, bulletY, center.x, center.y) <= BOSS_HIT_RADIUS) {
          if (this.applyBulletImpact(bullet, boss, boss.groundY, () => this.damageBoss(bullet.damage))) {
            return;
          }
        }
      }
      if (!bullet.active) {
        return;
      }
      const broken = this.world.hitBreakable(bulletX, bulletY, 0);
      if (broken) {
        this.handleBreak(broken);
        if (bullet.explosionRadius > 0) {
          this.bullets.release(bullet);
          this.explode(bulletX, bulletY, broken.y, bullet.explosionRadius, bullet.damage, 'player');
        } else if (!bullet.piercing) {
          this.bullets.release(bullet);
        }
      }
    });
  }

  private applyBulletImpact(bullet: Projectile, target: object, groundY: number, dealDamage: () => void): boolean {
    const bulletX = bullet.image.x;
    const bulletY = bullet.image.y;
    this.effects.spark(bulletX, bulletY, groundY + 5, TEXTURE.spark);
    if (bullet.explosionRadius > 0) {
      this.bullets.release(bullet);
      this.explode(bulletX, bulletY, groundY, bullet.explosionRadius, bullet.damage, 'player');
      return true;
    }
    dealDamage();
    if (bullet.piercing) {
      bullet.hitTargets.add(target);
      return false;
    }
    this.bullets.release(bullet);
    return true;
  }

  private handleBreak(broken: BrokenBreakable) {
    const centerY = broken.y - 4 * LAYOUT_UNIT;
    this.effects.burst(broken.x, centerY, broken.y, broken.def.debrisTexture, 10, 0.8);
    GameState.addScore(20);
    this.notifyQuests(GameState.recordBreak());
    const luck = GameState.luckFactor;
    const roll = Math.random();
    if (roll < BREAKABLE_HEART_CHANCE * luck && this.player.health < this.player.maxHealth) {
      this.dropLoot('heart', broken.x, broken.y);
    } else if (roll < (BREAKABLE_HEART_CHANCE + BREAKABLE_COIN_CHANCE) * luck) {
      this.dropLoot(Math.random() < BREAKABLE_COIN_STACK_CHANCE * luck ? 'coinStack' : 'coin', broken.x, broken.y);
    }
  }

  private dropLoot(kind: PickupKind, x: number, groundY: number) {
    const scatterX = Phaser.Math.FloatBetween(-LOOT_SCATTER, LOOT_SCATTER);
    const scatterY = Phaser.Math.FloatBetween(0, LOOT_SCATTER);
    this.pickups.push(new Pickup(this, kind, Math.round(x + scatterX), Math.round(groundY + scatterY)));
  }

  private notifyQuests(completed: Quest[]) {
    completed.forEach((quest) => this.showBanner('QUETE FINIE !', `RETOURNE VOIR ${quest.giverName}`));
  }

  private damageEnemy(enemy: Enemy, damage: number) {
    if (enemy.dead) {
      return;
    }
    if (enemy.hit(damage)) {
      this.killEnemy(enemy);
    }
  }

  private damageBoss(damage: number) {
    if (!this.boss || !this.boss.isVulnerable) {
      return;
    }
    this.boss.hit(damage, this.combatContext);
    GameState.addScore(5);
  }

  private killEnemy(enemy: Enemy) {
    const center = enemy.bodyCenter;
    GameState.addScore(enemy.def.score);
    GameState.addCoins(COINS_PER_SLIME);
    if (this.phase === 'playing') {
      this.killsSinceBoss += 1;
    }
    this.showPopup(center.x, center.y, `+${COINS_PER_SLIME} €`);
    this.effects.burst(center.x, center.y, enemy.groundY, GOO_TEXTURE_BY_KIND[enemy.def.kind], 9);
    this.notifyQuests(GameState.recordKill(enemy.def.kind));
    this.gainXp(enemy.def.xp);
    if (Math.random() < enemy.def.specialDropChance) {
      this.pickups.push(new Pickup(this, 'star', enemy.x, enemy.groundY));
    } else if (Math.random() < enemy.def.heartDropChance * GameState.luckFactor) {
      this.pickups.push(new Pickup(this, 'heart', enemy.x, enemy.groundY));
    }
  }

  private showPopup(x: number, y: number, text: string) {
    const key = `popup-${text}`;
    if (!this.textures.exists(key)) {
      bakePixelText(this, key, text, 'goldLight', 'ink');
    }
    const popup = this.add
      .image(Math.round(x), Math.round(y - 4 * LAYOUT_UNIT), key)
      .setScale(PIXEL_SCALE)
      .setDepth(FRONT_DEPTH);
    this.tweens.add({
      targets: popup,
      y: popup.y - 14 * LAYOUT_UNIT,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  private resolvePlayerHits(time: number) {
    const playerCenter = this.player.hitCenter;
    if (this.player.isShielded(time)) {
      this.enemyBalls.forEachActive((ball) => {
        const distance = Phaser.Math.Distance.Between(ball.image.x, ball.image.y, playerCenter.x, playerCenter.y);
        if (distance <= BALL_HIT_RADIUS + SHIELD_RADIUS) {
          this.enemyBalls.release(ball);
          this.effects.spark(ball.image.x, ball.image.y, this.player.y + 3, TEXTURE.spark);
        }
      });
      return;
    }
    if (this.player.isInvulnerable(time) || this.boss?.isDying) {
      return;
    }
    let hurt = false;

    this.enemyBalls.forEachActive((ball) => {
      if (hurt) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(ball.image.x, ball.image.y, playerCenter.x, playerCenter.y);
      if (distance <= BALL_HIT_RADIUS + PLAYER_HIT_RADIUS) {
        this.enemyBalls.release(ball);
        hurt = true;
      }
    });

    if (!hurt) {
      hurt = this.enemies.some((enemy) => {
        if (enemy.dead || Math.abs(enemy.groundY - this.player.y) > 9 * LAYOUT_UNIT) {
          return false;
        }
        const center = enemy.bodyCenter;
        const distance = Phaser.Math.Distance.Between(center.x, center.y, playerCenter.x, playerCenter.y);
        return distance <= enemy.def.hitRadius + PLAYER_HIT_RADIUS - 2 * LAYOUT_UNIT;
      });
    }

    if (!hurt && this.boss && this.boss.isDangerous) {
      const center = this.boss.bodyCenter;
      const closeInDepth = Math.abs(this.boss.groundY - this.player.y) < 14 * LAYOUT_UNIT;
      const distance = Phaser.Math.Distance.Between(center.x, center.y, playerCenter.x, playerCenter.y);
      hurt = closeInDepth && distance <= BOSS_CONTACT_RADIUS + PLAYER_HIT_RADIUS;
    }

    if (hurt) {
      this.damagePlayer(time);
    }
  }

  private damagePlayer(time: number) {
    if (!this.player.takeHit(time)) {
      return;
    }
    const playerCenter = this.player.hitCenter;
    this.combatContext.shake(2);
    this.effects.burst(playerCenter.x, playerCenter.y, this.player.y, TEXTURE.redGoo, 6, 0.7);
    if (this.player.health <= 0) {
      this.handleGameOver();
    }
  }

  private collectPickups(time: number) {
    if (this.player.isDown) {
      return;
    }
    const playerCenter = this.player.hitCenter;
    this.pickups.forEach((pickup) => {
      if (!pickup.canBeCollected) {
        return;
      }
      const center = pickup.center;
      const radius =
        pickup.kind === 'star' ? STAR_PICKUP_RADIUS : pickup.kind === 'heart' ? HEART_PICKUP_RADIUS : COIN_PICKUP_RADIUS;
      if (Phaser.Math.Distance.Between(center.x, center.y, playerCenter.x, playerCenter.y) > radius) {
        return;
      }
      pickup.collected = true;
      this.effects.burst(center.x, center.y, pickup.groundY, TEXTURE.spark, 6, 0.6);
      if (pickup.kind === 'heart') {
        this.player.heal();
      } else if (pickup.kind === 'coin' || pickup.kind === 'coinStack') {
        const value = pickup.kind === 'coin' ? 1 : COIN_STACK_VALUE;
        GameState.addCoins(value);
        this.showPopup(center.x, center.y, `+${value} €`);
      } else {
        this.activateSpecial(Phaser.Utils.Array.GetRandom(SPECIAL_KINDS), time);
      }
    });
  }

  private activateSpecial(kind: SpecialKind, time: number) {
    this.specialAnnouncement = SPECIAL_NAMES[kind];
    this.specialAnnouncedAt = this.time.now;
    if (kind === 'shield') {
      this.player.activateShield(time, SHIELD_DURATION_MS);
    } else if (kind === 'megaLaser') {
      this.megaLaserUntil = Math.max(this.megaLaserUntil, time) + MEGA_LASER_DURATION_MS;
      this.nextLaserTickAt = time;
      this.combatContext.shake(2);
    } else {
      this.pendingSkyBombs += BOMB_RAIN_COUNT;
      this.nextSkyBombAt = time;
    }
  }

  private isInBeam(x: number, y: number, radius: number): boolean {
    const muzzle = this.player.muzzlePoint;
    const aimX = Math.cos(this.player.aimAngle);
    const aimY = Math.sin(this.player.aimAngle);
    const along = (x - muzzle.x) * aimX + (y - muzzle.y) * aimY;
    const across = Math.abs((x - muzzle.x) * aimY - (y - muzzle.y) * aimX);
    return along >= -radius && along <= MEGA_LASER_LENGTH && across <= MEGA_LASER_HEIGHT / 2 + radius;
  }

  private updateMegaLaser(time: number) {
    const active = time < this.megaLaserUntil && !this.player.isDown;
    this.laserBeam.setVisible(active);
    if (!active) {
      return;
    }
    const muzzle = this.player.muzzlePoint;
    const flicker = 1 + Math.sin(time / 30) * 0.12;
    this.laserBeam
      .setPosition(muzzle.x, muzzle.y)
      .setRotation(this.player.aimAngle)
      .setDisplaySize(MEGA_LASER_LENGTH, MEGA_LASER_HEIGHT * flicker);
    if (time < this.nextLaserTickAt) {
      return;
    }
    this.nextLaserTickAt = time + MEGA_LASER_TICK_MS;
    const damage = GameState.bulletDamage * MEGA_LASER_DAMAGE_FACTOR;
    this.enemies.forEach((enemy) => {
      const center = enemy.bodyCenter;
      if (!enemy.dead && this.isInBeam(center.x, center.y, enemy.def.hitRadius)) {
        this.effects.spark(center.x, center.y, enemy.groundY + 5, TEXTURE.spark);
        this.damageEnemy(enemy, damage);
      }
    });
    if (this.boss && this.boss.isVulnerable) {
      const center = this.boss.bodyCenter;
      if (this.isInBeam(center.x, center.y, BOSS_HIT_RADIUS)) {
        this.effects.spark(center.x, center.y, this.boss.groundY + 5, TEXTURE.spark);
        this.damageBoss(damage);
      }
    }
  }

  private updateBombRain(time: number) {
    if (this.pendingSkyBombs <= 0 || time < this.nextSkyBombAt) {
      return;
    }
    this.pendingSkyBombs -= 1;
    this.nextSkyBombAt = time + BOMB_RAIN_INTERVAL_MS;
    const target = this.pickSkyBombTarget();
    this.bombs.push(
      new Bomb(this, {
        owner: 'player',
        startX: target.x,
        startY: target.groundY - SKY_BOMB_DROP_HEIGHT,
        targetX: target.x,
        targetGroundY: target.groundY,
        durationMs: BOMB_RAIN_FALL_MS,
        arcHeight: 0,
      }),
    );
  }

  private pickSkyBombTarget(): { x: number; groundY: number } {
    const candidates: { x: number; groundY: number }[] = this.enemies
      .filter((enemy) => !enemy.dead && this.view.contains(enemy.x, enemy.groundY))
      .map((enemy) => ({ x: enemy.x, groundY: enemy.groundY }));
    if (this.boss && this.boss.isVulnerable) {
      candidates.push({ x: this.boss.x, groundY: this.boss.groundY });
    }
    if (candidates.length > 0 && Math.random() < SKY_BOMB_AIM_CHANCE) {
      const chosen = Phaser.Utils.Array.GetRandom(candidates);
      return {
        x: chosen.x + Phaser.Math.FloatBetween(-SKY_BOMB_JITTER, SKY_BOMB_JITTER),
        groundY: chosen.groundY + Phaser.Math.FloatBetween(-SKY_BOMB_JITTER, SKY_BOMB_JITTER),
      };
    }
    return {
      x: this.player.x + Phaser.Math.FloatBetween(-SKY_BOMB_SPREAD.x, SKY_BOMB_SPREAD.x),
      groundY: this.player.y + Phaser.Math.FloatBetween(-SKY_BOMB_SPREAD.y, SKY_BOMB_SPREAD.y),
    };
  }

  private updateBombs(deltaMs: number, time: number) {
    this.bombs.forEach((bomb) => {
      bomb.update(deltaMs);
      if (!bomb.landed) {
        return;
      }
      const isEnemyBomb = bomb.owner === 'enemy';
      this.explode(
        bomb.targetX,
        bomb.targetGroundY - EXPLOSION_CENTER_HEIGHT,
        bomb.targetGroundY,
        isEnemyBomb ? ENEMY_BOMB_RADIUS : BOMB_RAIN_RADIUS,
        isEnemyBomb ? 1 : BOMB_RAIN_DAMAGE + GameState.bulletDamage,
        bomb.owner,
        time,
      );
    });
    this.bombs = this.bombs.filter((bomb) => {
      if (bomb.landed) {
        bomb.destroy();
        return false;
      }
      return true;
    });
  }

  private explode(
    x: number,
    y: number,
    groundY: number,
    radius: number,
    damage: number,
    owner: BombOwner,
    time: number = this.gameClockMs,
  ) {
    this.effects.explosion(x, y, groundY + 4 * LAYOUT_UNIT, radius);
    this.effects.burst(x, y, groundY, TEXTURE.spark, 8, 0.8);
    this.combatContext.shake(owner === 'player' ? 1 : 2);
    if (!this.inCombat) {
      return;
    }
    if (owner === 'enemy') {
      if (this.boss?.isDying) {
        return;
      }
      const playerCenter = this.player.hitCenter;
      const depthGap = (this.player.y - groundY) * EXPLOSION_DEPTH_SQUASH;
      if (Math.hypot(playerCenter.x - x, depthGap) <= radius + PLAYER_HIT_RADIUS) {
        this.damagePlayer(time);
      }
      return;
    }
    this.world.breakAllInRadius(x, y, radius).forEach((broken) => this.handleBreak(broken));
    this.enemies.forEach((enemy) => {
      const center = enemy.bodyCenter;
      if (Phaser.Math.Distance.Between(center.x, center.y, x, y) <= radius + enemy.def.hitRadius) {
        this.damageEnemy(enemy, damage);
      }
    });
    if (this.boss && this.boss.isVulnerable) {
      const center = this.boss.bodyCenter;
      if (Phaser.Math.Distance.Between(center.x, center.y, x, y) <= radius + BOSS_HIT_RADIUS) {
        this.damageBoss(damage);
      }
    }
  }

  private cleanupEntities() {
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.dead) {
        enemy.destroy();
        return false;
      }
      const tooFar =
        Math.hypot(enemy.x - this.player.x, enemy.groundY - this.player.y) > ENEMY_DESPAWN_DISTANCE;
      const inVillage = this.world.isInVillage(enemy.x, enemy.groundY);
      if (inVillage) {
        const center = enemy.bodyCenter;
        this.effects.burst(center.x, center.y, enemy.groundY, TEXTURE.spark, 5, 0.6);
      }
      if (tooFar || inVillage) {
        enemy.destroy();
        return false;
      }
      return true;
    });
    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.isGone) {
        pickup.destroy();
        return false;
      }
      return true;
    });
    if (this.boss?.isDestroyed) {
      this.boss = null;
    }
  }

  private handleGameOver() {
    this.player.knockOut();
    this.megaLaserUntil = 0;
    this.pendingSkyBombs = 0;
    this.bombs.forEach((bomb) => bomb.destroy());
    this.bombs = [];
    this.laserBeam.setVisible(false);
    this.villageArrow.setVisible(false);
    GameState.commitBestScore();
    this.setPhase('gameOver');
  }

  private handleVictory() {
    this.enemies.forEach((enemy) => {
      const center = enemy.bodyCenter;
      this.effects.burst(center.x, center.y, enemy.groundY, GOO_TEXTURE_BY_KIND[enemy.def.kind], 6);
      enemy.destroy();
    });
    this.enemies = [];
    this.bombs.forEach((bomb) => bomb.destroy());
    this.bombs = [];
    this.enemyBalls.clear();
    this.killsSinceBoss = 0;
    GameState.addScore(5000);
    GameState.addCoins(BOSS_REWARD_COINS);
    this.gainXp(40);
    GameState.commitBestScore();
    this.setPhase('victory');
  }
}
