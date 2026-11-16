import json

PATH = 'art-references/v4/house/family.json'
CELLS = 'art-references/v4/house/cells-snap.json'


def main():
    with open(PATH, encoding='utf-8') as handle:
        family = json.load(handle)
    for sprite in family['sprites']:
        sprite['cells'] = CELLS
    with open(PATH, 'w', encoding='utf-8', newline='\n') as handle:
        json.dump(family, handle, indent=2)
        handle.write('\n')
    print('updated', PATH)


if __name__ == '__main__':
    main()
