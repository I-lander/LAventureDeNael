import type { PixelGrid } from '../../game/elements';

type FootSide = 'left' | 'right';

const EMPTY = '.';

function gridWidth(rows: PixelGrid): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}

function toMatrix(rows: PixelGrid): string[][] {
  const width = gridWidth(rows);
  return rows.map((row) => [...row.padEnd(width, EMPTY)]);
}

function toRows(matrix: string[][]): PixelGrid {
  return matrix.map((cells) => cells.join(''));
}

function emptyRow(width: number): string[] {
  return new Array<string>(width).fill(EMPTY);
}

function filledSpan(matrix: string[][], firstRow: number): { left: number; right: number } {
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  for (let rowIndex = firstRow; rowIndex < matrix.length; rowIndex++) {
    matrix[rowIndex].forEach((cell, column) => {
      if (cell !== EMPTY) {
        left = Math.min(left, column);
        right = Math.max(right, column);
      }
    });
  }
  return { left, right };
}

export function feetCenter(rows: PixelGrid, footRows: number): number {
  const span = filledSpan(toMatrix(rows), rows.length - footRows);
  return (span.left + span.right + 1) / 2;
}

export function bobDown(rows: PixelGrid, footRows: number): PixelGrid {
  const matrix = toMatrix(rows);
  matrix.splice(matrix.length - footRows - 1, 1);
  matrix.unshift(emptyRow(gridWidth(rows)));
  return toRows(matrix);
}

export function liftFoot(rows: PixelGrid, side: FootSide, footRows: number, lift: number): PixelGrid {
  const matrix = toMatrix(rows);
  const firstFootRow = matrix.length - footRows;
  const middle = Math.floor(feetCenter(rows, footRows));
  const width = gridWidth(rows);
  const firstColumn = side === 'left' ? 0 : middle;
  const lastColumn = side === 'left' ? middle - 1 : width - 1;
  for (let rowIndex = firstFootRow; rowIndex < matrix.length; rowIndex++) {
    for (let column = firstColumn; column <= lastColumn; column++) {
      const cell = matrix[rowIndex][column];
      if (cell === EMPTY) {
        continue;
      }
      matrix[rowIndex - lift][column] = cell;
      matrix[rowIndex][column] = EMPTY;
    }
  }
  return toRows(matrix);
}

export function squashDown(rows: PixelGrid, removedRows: number): PixelGrid {
  const matrix = toMatrix(rows);
  const width = gridWidth(rows);
  const height = matrix.length;
  for (let index = removedRows; index >= 1; index--) {
    matrix.splice(Math.round((height * index) / (removedRows + 1)), 1);
  }
  for (let index = 0; index < removedRows; index++) {
    matrix.unshift(emptyRow(width));
  }
  return toRows(matrix);
}
