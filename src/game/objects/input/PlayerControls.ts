import Phaser from 'phaser';
import { LAYOUT_UNIT } from '../../elements';

const DEAD_ZONE = 3 * LAYOUT_UNIT;

type KeyDirection = 'up' | 'down' | 'left' | 'right';

const KEY_DIRECTIONS: Record<string, KeyDirection> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export class PlayerControls {
  private readonly scene: Phaser.Scene;
  private heldPointer: Phaser.Input.Pointer | null = null;
  private readonly pointerWorld = new Phaser.Math.Vector2();
  private readonly lastPress = new Phaser.Math.Vector2();
  private pressedDirections = new Set<KeyDirection>();
  pressCount: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.addPointer(2);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      this.pressCount += 1;
      pointer.positionToCamera(this.scene.cameras.main, this.lastPress);
      if (this.heldPointer === null) {
        this.heldPointer = pointer;
      }
    });

    const releasePointer = (pointer: Phaser.Input.Pointer) => {
      if (pointer === this.heldPointer) {
        this.heldPointer = null;
      }
    };
    scene.input.on(Phaser.Input.Events.POINTER_UP, releasePointer);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, releasePointer);

    scene.game.events.on(Phaser.Core.Events.BLUR, () => this.reset());

    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.code];
      if (direction) {
        this.pressedDirections.add(direction);
      }
    });
    scene.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.code];
      if (direction) {
        this.pressedDirections.delete(direction);
      }
    });
  }

  reset() {
    this.pressedDirections.clear();
    this.heldPointer = null;
  }

  releasePointer() {
    this.heldPointer = null;
  }

  wasPressedNear(x: number, y: number, radius: number): boolean {
    return Math.hypot(this.lastPress.x - x, this.lastPress.y - y) <= radius;
  }

  readMovement(fromX: number, fromY: number): { x: number; y: number } {
    let horizontal = 0;
    let vertical = 0;
    if (this.pressedDirections.has('left')) horizontal -= 1;
    if (this.pressedDirections.has('right')) horizontal += 1;
    if (this.pressedDirections.has('up')) vertical -= 1;
    if (this.pressedDirections.has('down')) vertical += 1;
    if (horizontal !== 0 || vertical !== 0) {
      const length = Math.hypot(horizontal, vertical);
      return { x: horizontal / length, y: vertical / length };
    }
    if (this.heldPointer && !this.heldPointer.isDown) {
      this.heldPointer = null;
    }
    if (!this.heldPointer) {
      return { x: 0, y: 0 };
    }
    this.heldPointer.positionToCamera(this.scene.cameras.main, this.pointerWorld);
    const dx = this.pointerWorld.x - fromX;
    const dy = this.pointerWorld.y - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance <= DEAD_ZONE) {
      return { x: 0, y: 0 };
    }
    return { x: dx / distance, y: dy / distance };
  }
}
