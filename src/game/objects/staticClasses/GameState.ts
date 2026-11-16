import {
  AUTO_AIM_RANGE,
  BULLET_DAMAGE,
  CRITICAL_CHANCE_PER_LEVEL,
  EnemyKind,
  FIRE_RATE_UPGRADE_FACTOR,
  LEVEL_HEALTH_GROWTH,
  LUCK_PER_LEVEL,
  MAX_ACTIVE_QUESTS,
  PLAYER_FIRE_INTERVAL_MS,
  PLAYER_MAX_HEALTH,
  PLAYER_WALK_SPEED,
  Quest,
  REACH_PER_LEVEL,
  REGENERATION_INTERVALS_MS,
  SWIFTNESS_PER_LEVEL,
  SkillKind,
  SkillStatus,
  UpgradeKind,
  WeaponDef,
  WeaponKind,
  createEmptySkillLevels,
  createEmptyUpgradeLevels,
  getSkillDef,
  getUpgradeDef,
  getWeaponDef,
  xpForNextLevel,
} from '../../elements';

const BEST_SCORE_KEY = 'slime-forest-best-score';

export class GameState {
  static score: number = 0;
  static bestScore: number = GameState.loadBestScore();
  static coins: number = 0;
  static level: number = 1;
  static playerLevel: number = 1;
  static xp: number = 0;
  static skillPoints: number = 0;
  static skillLevels: Record<SkillKind, number> = createEmptySkillLevels();
  static upgradeLevels: Record<UpgradeKind, number> = createEmptyUpgradeLevels();
  static ownedWeapons: Set<WeaponKind> = new Set<WeaponKind>(['pistol']);
  static equippedWeapon: WeaponKind = 'pistol';
  static quests: Quest[] = [];
  static questsDoneByGiver: Map<string, number> = new Map<string, number>();
  static brokenBreakables: Set<string> = new Set<string>();

  static resetRun() {
    GameState.score = 0;
    GameState.coins = 0;
    GameState.level = 1;
    GameState.playerLevel = 1;
    GameState.xp = 0;
    GameState.skillPoints = 0;
    GameState.skillLevels = createEmptySkillLevels();
    GameState.upgradeLevels = createEmptyUpgradeLevels();
    GameState.ownedWeapons = new Set<WeaponKind>(['pistol']);
    GameState.equippedWeapon = 'pistol';
    GameState.quests = [];
    GameState.questsDoneByGiver = new Map<string, number>();
    GameState.brokenBreakables = new Set<string>();
  }

  static loseHalfCoins() {
    GameState.coins = Math.floor(GameState.coins / 2);
  }

  static get petLevel(): number {
    return GameState.upgradeLevels.pet;
  }

  static addScore(points: number) {
    GameState.score += points;
  }

  static addCoins(amount: number) {
    GameState.coins += amount;
  }

  static spendCoins(amount: number): boolean {
    if (amount > GameState.coins) {
      return false;
    }
    GameState.coins -= amount;
    return true;
  }

  static get xpToNextLevel(): number {
    return xpForNextLevel(GameState.playerLevel);
  }

  static addXp(amount: number): number {
    GameState.xp += amount;
    let levelsGained = 0;
    while (GameState.xp >= GameState.xpToNextLevel) {
      GameState.xp -= GameState.xpToNextLevel;
      GameState.playerLevel += 1;
      GameState.skillPoints += 1;
      levelsGained += 1;
    }
    return levelsGained;
  }

  static skillStatus(kind: SkillKind): SkillStatus {
    const skillDef = getSkillDef(kind);
    if (GameState.skillLevels[kind] >= skillDef.maxLevel) {
      return 'maxed';
    }
    if (skillDef.requires && GameState.skillLevels[skillDef.requires] === 0) {
      return 'locked';
    }
    if (GameState.skillPoints <= 0) {
      return 'noPoints';
    }
    return 'available';
  }

  static learnSkill(kind: SkillKind): boolean {
    if (GameState.skillStatus(kind) !== 'available') {
      return false;
    }
    GameState.skillPoints -= 1;
    GameState.skillLevels[kind] += 1;
    return true;
  }

  static get playerMaxHealth(): number {
    return PLAYER_MAX_HEALTH + GameState.skillLevels.vitality;
  }

  static get bulletDamage(): number {
    return BULLET_DAMAGE + GameState.skillLevels.power;
  }

  static get criticalChance(): number {
    return GameState.skillLevels.critical * CRITICAL_CHANCE_PER_LEVEL;
  }

  static get regenerationIntervalMs(): number {
    return REGENERATION_INTERVALS_MS[GameState.skillLevels.regeneration] ?? 0;
  }

  static get luckFactor(): number {
    return 1 + GameState.skillLevels.luck * LUCK_PER_LEVEL * 3;
  }

  static get walkSpeed(): number {
    return PLAYER_WALK_SPEED * (1 + GameState.skillLevels.swiftness * SWIFTNESS_PER_LEVEL);
  }

  static get aimRange(): number {
    return AUTO_AIM_RANGE * (1 + GameState.skillLevels.reach * REACH_PER_LEVEL);
  }

  static get weaponDef(): WeaponDef {
    return getWeaponDef(GameState.equippedWeapon);
  }

  static get fireIntervalMs(): number {
    return (
      PLAYER_FIRE_INTERVAL_MS *
      FIRE_RATE_UPGRADE_FACTOR ** GameState.skillLevels.fireRate *
      GameState.weaponDef.fireIntervalFactor
    );
  }

  static get projectilesPerShot(): number {
    const weapon = GameState.weaponDef;
    return weapon.basePellets + weapon.pelletsPerMultishot * GameState.skillLevels.multishot;
  }

  static get enemyHealthMultiplier(): number {
    return 1 + LEVEL_HEALTH_GROWTH * (GameState.level - 1);
  }

  static upgradePrice(kind: UpgradeKind): number {
    const upgradeDef = getUpgradeDef(kind);
    return Math.round(upgradeDef.basePrice * upgradeDef.priceGrowth ** GameState.upgradeLevels[kind]);
  }

  static isUpgradeMaxed(kind: UpgradeKind): boolean {
    const maxLevel = getUpgradeDef(kind).maxLevel;
    return maxLevel !== null && GameState.upgradeLevels[kind] >= maxLevel;
  }

  static get activeQuests(): Quest[] {
    return GameState.quests.filter((quest) => quest.state !== 'offered');
  }

  static get canTakeQuest(): boolean {
    return GameState.activeQuests.length < MAX_ACTIVE_QUESTS;
  }

  static questOf(giverId: string): Quest | null {
    return GameState.quests.find((quest) => quest.giverId === giverId) ?? null;
  }

  static acceptQuest(quest: Quest) {
    quest.state = 'active';
    if (!GameState.quests.includes(quest)) {
      GameState.quests.push(quest);
    }
  }

  static finishQuest(quest: Quest) {
    GameState.quests = GameState.quests.filter((entry) => entry !== quest);
    GameState.questsDoneByGiver.set(quest.giverId, (GameState.questsDoneByGiver.get(quest.giverId) ?? 0) + 1);
  }

  static recordKill(kind: EnemyKind): Quest[] {
    return GameState.advanceQuests((quest) => quest.goal === kind);
  }

  static recordBreak(): Quest[] {
    return GameState.advanceQuests((quest) => quest.goal === 'breakables');
  }

  private static advanceQuests(matches: (quest: Quest) => boolean): Quest[] {
    const completed: Quest[] = [];
    GameState.quests.forEach((quest) => {
      if (quest.state !== 'active' || !matches(quest)) {
        return;
      }
      quest.progress = Math.min(quest.count, quest.progress + 1);
      if (quest.progress >= quest.count) {
        quest.state = 'complete';
        completed.push(quest);
      }
    });
    return completed;
  }

  static commitBestScore() {
    if (GameState.score <= GameState.bestScore) {
      return;
    }
    GameState.bestScore = GameState.score;
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(GameState.bestScore));
    } catch (error) {
      console.warn('Best score not saved', error);
    }
  }

  private static loadBestScore(): number {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0) || 0;
    } catch (error) {
      console.warn('Best score not loaded', error);
      return 0;
    }
  }
}
