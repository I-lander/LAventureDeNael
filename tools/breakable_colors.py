import argparse

from ref_extract import cluster_report, hue_name
from ref_quantize import load_cells


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/breakable/cells.json')
    parser.add_argument('--threshold', type=float, default=14)
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    for sprite in payload['sprites']:
        colors = [cell for line in sprite['cells'] for cell in line if cell is not None]
        print('sprite', sprite['index'], len(colors), 'cells')
        for color, count in cluster_report(colors, arguments.threshold):
            print('  #%02x%02x%02x' % color, hue_name(color).ljust(7), count)


if __name__ == '__main__':
    main()
