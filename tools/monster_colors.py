import sys

from ref_extract import cluster_report, hue_name
from ref_quantize import load_cells

NAMES = ['SLIME_FRONT', 'SLIME_SIDE', 'SLIME_BACK', 'KING_SLIME', 'ARCHER_FRONT', 'ARCHER_SIDE', 'ARCHER_BACK', 'BOMBER_FRONT']


def main():
    payload = load_cells('art-references/v4/monster/cells.json')
    threshold = float(sys.argv[1]) if len(sys.argv) > 1 else 22
    groups = {'slimes': [0, 1, 2, 3], 'archer': [4, 5, 6], 'bomber': [7]}
    for label, indices in groups.items():
        colors = [cell for index in indices for line in payload['sprites'][index]['cells'] for cell in line if cell is not None]
        print(label, len(colors), 'cells')
        for color, count in cluster_report(colors, threshold):
            if count >= 2:
                print('  #%02x%02x%02x' % color, hue_name(color).ljust(7), count)


if __name__ == '__main__':
    main()
