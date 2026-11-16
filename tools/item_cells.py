import argparse
import json
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--index', type=int, required=True)
    arguments = parser.parse_args()
    with open(arguments.cells, encoding='utf-8') as handle:
        data = json.load(handle)
    matches = [sprite for sprite in data['sprites'] if sprite['index'] == arguments.index]
    if not matches:
        sys.exit(f'no sprite with index {arguments.index} in {arguments.cells}')
    for row_index, row in enumerate(matches[0]['rows']):
        print(f'{row_index:2d} ' + ' '.join(cell[1:] if cell else '......' for cell in row))


if __name__ == '__main__':
    main()
