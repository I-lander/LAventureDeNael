import argparse
import os
import re
import sys
from collections import Counter, deque

from PIL import Image

PROJECT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
BACKGROUND_TOLERANCE = 220
OUTLINE_DARKNESS_MARGIN = 6
OUTLINE_MAX_CHANNEL = 60
CORNER_SAMPLE = 20
MIN_CELL_PIXELS = 4
GAME_BACKGROUND = (0x2a, 0x20, 0x30)


def parse_legend(art_path: str, legend_name: str) -> dict:
    source = open(art_path, encoding='utf-8').read()
    match = re.search(r'const ' + re.escape(legend_name) + r': PixelLegend = \{(.*?)\n\};', source, re.S)
    if not match:
        sys.exit(f'legend {legend_name} not found in {art_path}')
    legend = {}
    for symbol, hex_value in re.findall(r"^\s*'?(\w)'?: 0x([0-9a-fA-F]{6}),", match.group(1), re.M):
        legend[symbol] = tuple(int(hex_value[index:index + 2], 16) for index in (0, 2, 4))
    if not legend:
        sys.exit(f'legend {legend_name} has no literal colors (spread legends are not supported)')
    return legend


def luminance(color: tuple) -> float:
    return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]


def squared_distance(first: tuple, second: tuple) -> int:
    return sum((first[channel] - second[channel]) ** 2 for channel in range(3))


def flood_background(image: Image.Image, corner: tuple, tolerance: int) -> set:
    pixels = image.load()
    width, height = image.size
    seeds = [(x, y) for x in range(width) for y in (0, height - 1)] + [(x, y) for y in range(height) for x in (0, width - 1)]
    background = set()
    queue = deque(seed for seed in seeds if squared_distance(pixels[seed], corner) < tolerance)
    background.update(queue)
    while queue:
        x, y = queue.popleft()
        for neighbor in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if neighbor in background or not (0 <= neighbor[0] < width and 0 <= neighbor[1] < height):
                continue
            if squared_distance(pixels[neighbor], corner) < tolerance:
                background.add(neighbor)
                queue.append(neighbor)
    return background


def trace(image_path: str, legend: dict, size: int, outline_symbol: str, outline_rule: bool, background_tolerance: int = BACKGROUND_TOLERANCE, flood_tolerance: int = 0) -> list:
    source = Image.open(image_path).convert('RGBA')
    image = Image.new('RGB', source.size, GAME_BACKGROUND)
    image.paste(source, mask=source.getchannel('A'))
    corner = Counter(image.getpixel((x, y)) for x in range(CORNER_SAMPLE) for y in range(CORNER_SAMPLE)).most_common(1)[0][0]
    background_luminance = luminance(corner)
    image = image.resize((image.width // 2, image.height // 2), Image.NEAREST)
    cell_width = image.width / size
    cell_height = image.height / size
    if cell_width < MIN_CELL_PIXELS or cell_height < MIN_CELL_PIXELS:
        sys.exit(f'reference too small: {image.width * 2}x{image.height * 2} px gives cells under {MIN_CELL_PIXELS} px for a {size} grid')
    flooded = flood_background(image, corner, flood_tolerance) if flood_tolerance else None
    cache = {}

    def classify(pixel: tuple) -> str:
        if pixel in cache:
            return cache[pixel]
        if flooded is None and squared_distance(pixel, corner) < background_tolerance:
            result = '.'
        elif outline_rule and luminance(pixel) < background_luminance - OUTLINE_DARKNESS_MARGIN and max(pixel) < OUTLINE_MAX_CHANNEL:
            result = outline_symbol
        else:
            result = min(legend, key=lambda symbol: squared_distance(pixel, legend[symbol]))
        cache[pixel] = result
        return result

    rows = []
    for y in range(size):
        row = ''
        for x in range(size):
            left, top = int(x * cell_width), int(y * cell_height)
            right, bottom = int((x + 1) * cell_width), int((y + 1) * cell_height)
            margin_x, margin_y = max(1, (right - left) // 5), max(1, (bottom - top) // 5)
            votes = Counter(
                '.' if flooded is not None and (sample_x, sample_y) in flooded else classify(image.getpixel((sample_x, sample_y)))
                for sample_y in range(top + margin_y, bottom - margin_y)
                for sample_x in range(left + margin_x, right - margin_x)
            )
            row += votes.most_common(1)[0][0]
        rows.append(row)
    return rows


def main():
    parser = argparse.ArgumentParser(description='Trace an approved reference image onto the game grid, one palette symbol per cell by majority vote.')
    parser.add_argument('--image', required=True, help='approved reference image')
    parser.add_argument('--art', required=True, help='sprite drawer source, e.g. src/tools/spriteBaker/DragonArt.ts')
    parser.add_argument('--legend', required=True, help='legend constant name in the drawer, e.g. DRAGON_LEGEND')
    parser.add_argument('--out', required=True, help='trace text file, one row per line')
    parser.add_argument('--size', type=int, default=64)
    parser.add_argument('--outline', default='o', help='legend symbol of the outline')
    parser.add_argument('--background-tolerance', type=int, default=BACKGROUND_TOLERANCE, help='squared RGB distance under which a pixel is background; lower it when a dark material comes out with holes')
    parser.add_argument('--flood', type=int, default=0, metavar='TOLERANCE', help='background = pixels connected to the image border within this squared RGB distance of the corner (e.g. 1500); use when the background is uneven or a dark material is close to it')
    parser.add_argument('--no-outline-rule', action='store_true', help='let the nearest color decide for dark pixels (use when a dark material such as a wing membrane is read as outline)')
    arguments = parser.parse_args()

    art_path = arguments.art if os.path.isabs(arguments.art) else os.path.join(PROJECT, arguments.art)
    legend = parse_legend(art_path, arguments.legend)
    if arguments.outline not in legend:
        sys.exit(f'outline symbol {arguments.outline} is not in {arguments.legend}')
    rows = trace(arguments.image, legend, arguments.size, arguments.outline, not arguments.no_outline_rule, arguments.background_tolerance, arguments.flood)
    with open(arguments.out, 'w', encoding='utf-8') as handle:
        handle.write('\n'.join(rows))
    print('   ' + ''.join(str(x // 10) for x in range(arguments.size)))
    print('   ' + ''.join(str(x % 10) for x in range(arguments.size)))
    for y, row in enumerate(rows):
        print(f'{y:2d} {row}')


if __name__ == '__main__':
    main()
