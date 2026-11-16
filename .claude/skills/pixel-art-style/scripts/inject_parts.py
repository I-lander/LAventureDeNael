import argparse
import importlib.util
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trace_lib import spec_to_rows

PROJECT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))


def part_pattern(name: str):
    return re.compile(r'const ' + re.escape(name) + r': PixelPart = \{\n.*?\n\};\n', re.S)


def part_block(name: str, spec: list) -> str:
    top, rows = spec_to_rows(spec)
    body = '\n'.join(f"    '{row}'," for row in rows)
    return f'const {name}: PixelPart = {{\n  left: 0,\n  top: {top},\n  rows: [\n{body}\n  ],\n}};\n'


def load_parts(parts_path: str) -> dict:
    specification = importlib.util.spec_from_file_location('sprite_parts', parts_path)
    module = importlib.util.module_from_spec(specification)
    sys.path.insert(0, os.path.dirname(os.path.abspath(parts_path)))
    specification.loader.exec_module(module)
    return module.PARTS


def main():
    parser = argparse.ArgumentParser(description='Write PixelPart grids into a sprite drawer: replace parts that exist, insert new ones before the anchor, remove the listed ones.')
    parser.add_argument('--art', required=True, help='sprite drawer source, e.g. src/tools/spriteBaker/DragonArt.ts')
    parser.add_argument('--parts', required=True, help='python file defining PARTS = {name: spec}')
    parser.add_argument('--anchor', required=True, help='line before which new parts are inserted, e.g. "const DRAGON_LEGEND"')
    parser.add_argument('--remove', default='', help='comma separated part names to delete')
    arguments = parser.parse_args()

    art_path = arguments.art if os.path.isabs(arguments.art) else os.path.join(PROJECT, arguments.art)
    text = open(art_path, encoding='utf-8').read()
    anchor_line = re.compile(r'^' + re.escape(arguments.anchor) + r'\b', re.M)
    anchor_matches = anchor_line.findall(text)
    if len(anchor_matches) != 1:
        sys.exit(f'anchor "{arguments.anchor}" must start exactly one line of {art_path}, found {len(anchor_matches)}')
    for name, spec in load_parts(arguments.parts).items():
        pattern = part_pattern(name)
        block = part_block(name, spec)
        if pattern.search(text):
            text = pattern.sub(lambda match: block, text)
            print(f'replaced {name}')
        else:
            text = anchor_line.sub(lambda match: block + '\n' + match.group(0), text, count=1)
            print(f'inserted {name}')
    for name in filter(None, arguments.remove.split(',')):
        text, count = part_pattern(name).subn('', text)
        print(f'removed {name}' if count else f'not found {name}')
    text = re.sub(r'\n{3,}', '\n\n', text)
    with open(art_path, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(text)
    print('remember to update the draw function for inserted or removed parts')


if __name__ == '__main__':
    main()
