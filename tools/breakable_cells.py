import argparse

from ref_quantize import load_cells


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/breakable/cells.json')
    parser.add_argument('--index', type=int, required=True)
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    matches = [candidate for candidate in payload['sprites'] if candidate['index'] == arguments.index]
    if not matches:
        raise SystemExit(f'no sprite with index {arguments.index} in {arguments.cells}')
    sprite = matches[0]
    for row_index, line in enumerate(sprite['cells']):
        print(str(row_index).rjust(2), ' '.join('%02x%02x%02x' % cell if cell else '......' for cell in line))


if __name__ == '__main__':
    main()
