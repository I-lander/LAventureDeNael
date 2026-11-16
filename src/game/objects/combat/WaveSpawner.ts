import Phaser from 'phaser';
import {
  EnemyKind,
  LAYOUT_UNIT,
  PLAYFIELD_BOTTOM,
  PLAYFIELD_TOP,
  WaveEntry,
} from '../../elements';

interface ScheduledSpawn {
  atMs: number;
  kind: EnemyKind;
  lane: WaveEntry['lane'];
}

export class WaveSpawner {
  private schedule: ScheduledSpawn[] = [];
  private cursor: number = 0;

  constructor(private readonly waves: WaveEntry[]) {
    this.reset();
  }

  reset() {
    this.schedule = this.waves
      .flatMap((wave) =>
        Array.from({ length: wave.count }, (unusedEntry, index) => ({
          atMs: (wave.atSecond + index * wave.intervalSeconds) * 1000,
          kind: wave.kind,
          lane: wave.lane,
        })),
      )
      .sort((first, second) => first.atMs - second.atMs);
    this.cursor = 0;
  }

  update(elapsedMs: number, playerY: number, spawn: (kind: EnemyKind, groundY: number) => void) {
    while (this.cursor < this.schedule.length && this.schedule[this.cursor].atMs <= elapsedMs) {
      const entry = this.schedule[this.cursor];
      spawn(entry.kind, this.resolveLane(entry.lane, playerY));
      this.cursor += 1;
    }
  }

  private resolveLane(lane: WaveEntry['lane'], playerY: number): number {
    const span = PLAYFIELD_BOTTOM - PLAYFIELD_TOP;
    const jitter = Phaser.Math.Between(-5, 5) * LAYOUT_UNIT;
    const laneY: Record<WaveEntry['lane'], number> = {
      top: PLAYFIELD_TOP + span * 0.15 + jitter,
      middle: PLAYFIELD_TOP + span * 0.5 + jitter,
      bottom: PLAYFIELD_TOP + span * 0.85 + jitter,
      player: playerY + jitter,
      random: Phaser.Math.Between(PLAYFIELD_TOP, PLAYFIELD_BOTTOM),
    };
    return Phaser.Math.Clamp(laneY[lane], PLAYFIELD_TOP, PLAYFIELD_BOTTOM);
  }
}
