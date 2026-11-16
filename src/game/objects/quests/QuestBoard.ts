import {
  BREAKABLE_QUEST_XP,
  QUEST_BASE_XP,
  QUEST_BUSY,
  QUEST_COMPLAINTS,
  QUEST_GOALS,
  QUEST_THANKS,
  QUEST_WAITING,
  QUEST_XP_FACTOR,
  Quest,
  QuestGoal,
  getEnemyDef,
  getQuestGoalDef,
} from '../../elements';
import { GameState } from '../staticClasses/GameState';
import { PlacedVillager } from '../world/VillagePlanner';
import { createRandom, hash, pick } from '../world/WorldGenerator';

const MAX_LINE_LENGTH = 44;

function idSeed(id: string, salt: number): number {
  let value = salt;
  for (let i = 0; i < id.length; i++) {
    value = Math.imul(value ^ id.charCodeAt(i), 16777619);
  }
  return hash(value, salt, 77);
}

export function goalLabel(goal: QuestGoal, plural: boolean): string {
  if (goal === 'breakables') {
    return plural ? 'OBJETS CASSES' : 'OBJET CASSE';
  }
  const enemyDef = getEnemyDef(goal);
  return plural ? enemyDef.pluralName : enemyDef.name;
}

export function createQuest(villager: PlacedVillager): Quest {
  const done = GameState.questsDoneByGiver.get(villager.id) ?? 0;
  const random = createRandom(idSeed(villager.id, done + 1));
  const goalDef = pick(QUEST_GOALS, random);
  const count = goalDef.minCount + Math.floor(random() * (goalDef.maxCount - goalDef.minCount + 1)) + done;
  const xpPerTarget = goalDef.goal === 'breakables' ? BREAKABLE_QUEST_XP : getEnemyDef(goalDef.goal).xp;
  return {
    id: `${villager.id}#${done}`,
    giverId: villager.id,
    giverName: villager.name,
    goal: goalDef.goal,
    count,
    progress: 0,
    rewardXp: QUEST_BASE_XP + count * xpPerTarget * QUEST_XP_FACTOR,
    rewardCoins: count * goalDef.coinsPerTarget + 5,
    state: 'offered',
  };
}

export function offerLines(quest: Quest): string[] {
  const random = createRandom(idSeed(quest.id, 3));
  const goalDef = getQuestGoalDef(quest.goal);
  if (quest.goal === 'breakables') {
    return ["J'AI PERDU MES BILLES DANS LA NATURE !", `CASSE ${quest.count} BUISSONS OU POTS POUR MOI.`, goalDef.where + ' !'];
  }
  const plural = getEnemyDef(quest.goal).pluralName;
  const complaint = `LES ${plural} ` + pick(QUEST_COMPLAINTS, random).replace('ILS ', '');
  return [
    complaint.length <= MAX_LINE_LENGTH ? complaint : `AU SECOURS ! LES ${plural} !`,
    `PEUX-TU EN BATTRE ${quest.count} ?`,
    `ILS VIVENT ${goalDef.where}.`,
  ];
}

export function waitingLines(quest: Quest): string[] {
  const random = createRandom(idSeed(quest.id, quest.progress + 9));
  return [pick(QUEST_WAITING, random), `${goalLabel(quest.goal, true)} : ${quest.progress} / ${quest.count}`];
}

export function thanksLines(quest: Quest): string[] {
  const random = createRandom(idSeed(quest.id, 5));
  return [pick(QUEST_THANKS, random), `VOICI TA RECOMPENSE :`, `+${quest.rewardXp} XP   +${quest.rewardCoins} €`];
}

export function busyLines(): string[] {
  return [...QUEST_BUSY];
}

export function trackerLine(quest: Quest): string {
  if (quest.state === 'complete') {
    return `${goalLabel(quest.goal, true)} OK ! VA VOIR ${quest.giverName}`;
  }
  return `${goalLabel(quest.goal, true)} ${quest.progress}/${quest.count}`;
}
