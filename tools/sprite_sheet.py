import argparse
import os

from PIL import Image

from spritelib import BACKGROUND, grid_colors, labelled_sheet, legend_for, load_art, load_palette, outside_mask, render_colors

HOLE = (255, 0, 255)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--scale', type=int, default=10)
    parser.add_argument('--names', default='')
    parser.add_argument('--legend', default='')
    parser.add_argument('--columns', type=int, default=4)
    parser.add_argument('--holes', action='store_true')
    parser.add_argument('--light', action='store_true')
    arguments = parser.parse_args()

    palette = load_palette()
    grids, legends = load_art(arguments.file)
    wanted = [name for name in arguments.names.split(',') if name] or list(grids)
    background = (0x6a, 0xa8, 0x4a) if arguments.light else BACKGROUND
    tiles = []
    for name in wanted:
        rows = grids[name]
        legend_name, legend = legend_for(rows, legends, arguments.legend or None)
        colors = grid_colors(rows, legend, palette)
        if arguments.holes:
            opaque = [[color is not None for color in row] for row in colors]
            outside = outside_mask(opaque)
            for y, row in enumerate(colors):
                for x, color in enumerate(row):
                    if color is None and not outside[y][x]:
                        colors[y][x] = HOLE
        image = render_colors(colors, arguments.scale)
        tiles.append((f'{name} {len(rows[0])}x{len(rows)}', image))
    sheet = labelled_sheet(tiles, arguments.columns, background=background)
    os.makedirs(os.path.dirname(os.path.abspath(arguments.out)), exist_ok=True)
    sheet.save(arguments.out)
    print('wrote', arguments.out, sheet.size)


if __name__ == '__main__':
    main()
