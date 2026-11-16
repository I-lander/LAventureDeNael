import argparse

from ref_extract import cluster_report, hue_name
from ref_quantize import load_cells


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--index', type=int, required=True)
    parser.add_argument('--cluster', type=float, default=22)
    parser.add_argument('--minimum', type=int, default=6)
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    sprite = payload['sprites'][arguments.index]
    colors = [cell for line in sprite['cells'] for cell in line if cell is not None]
    parts = []
    for color, count in cluster_report(colors, arguments.cluster):
        if count >= arguments.minimum:
            parts.append('#%02x%02x%02x %s %d' % (color[0], color[1], color[2], hue_name(color), count))
    print(len(colors), 'cells;', ' | '.join(parts))


if __name__ == '__main__':
    main()
