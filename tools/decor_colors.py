import argparse
import json

from ref_extract import cluster_report, hue_name
from ref_quantize import load_cells

NAMES = ['FOUNTAIN', 'STREET_LAMP', 'WELL', 'BENCH', 'MARKET_STALL', 'FLOWER_BED', 'BARRELS', 'FENCE']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/decor/cells.json')
    parser.add_argument('--threshold', type=float, default=22)
    parser.add_argument('--names', default='')
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    wanted = [name for name in arguments.names.split(',') if name]
    for index, sprite in enumerate(payload['sprites']):
        name = NAMES[index]
        if wanted and name not in wanted:
            continue
        colors = [cell for line in sprite['cells'] for cell in line if cell is not None]
        print(name, f"{len(sprite['cells'][0])}x{len(sprite['cells'])}")
        for color, count in cluster_report(colors, arguments.threshold):
            print('  #%02x%02x%02x' % color, hue_name(color).ljust(7), count)


if __name__ == '__main__':
    main()
