import os
import re
from collections import deque

from PIL import Image, ImageDraw

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ELEMENTS = os.path.join(PROJECT, 'src', 'game', 'elements')
BAKER = os.path.join(PROJECT, 'src', 'tools', 'spriteBaker')
HALF = os.path.join(BAKER, 'half')
HALF_PALETTES = os.path.join(ELEMENTS, 'halfPalette')
BACKGROUND = (0x2a, 0x20, 0x30)
EMPTY = '.'

GRID_PATTERN = re.compile(r'export const (\w+): PixelGrid = \[(.*?)\];', re.S)
LEGEND_PATTERN = re.compile(r'export const (\w+): PixelLegend = \{(.*?)\};', re.S)
ROW_PATTERN = re.compile(r"'((?:[^'\\]|\\.)*)'")
PAIR_PATTERN = re.compile(r"(?:'((?:[^'\\]|\\.))'|\"(.)\"|([A-Za-z0-9_$]))\s*:\s*'(\w+)'")
COLOR_PATTERN = re.compile(r'^\s*(\w+): 0x([0-9a-fA-F]{6}),', re.M)


def read_text(path):
    with open(path, encoding='utf-8') as handle:
        return handle.read()


def palette_paths():
    paths = []
    for folder in (ELEMENTS, HALF_PALETTES):
        if not os.path.isdir(folder):
            continue
        for name in sorted(os.listdir(folder)):
            if name.endswith('Palette.ts'):
                paths.append(os.path.join(folder, name))
    return paths


def load_palette():
    palette = {}
    for path in palette_paths():
        for key, value in COLOR_PATTERN.findall(read_text(path)):
            number = int(value, 16)
            palette[key] = ((number >> 16) & 255, (number >> 8) & 255, number & 255)
    return palette


def unescape(text):
    return text.replace("\\'", "'").replace('\\\\', '\\')


def load_art(path):
    source = read_text(path)
    grids = {}
    for name, body in GRID_PATTERN.findall(source):
        rows = [unescape(row) for row in ROW_PATTERN.findall(body)]
        width = max((len(row) for row in rows), default=0)
        grids[name] = [row.ljust(width, EMPTY) for row in rows]
    legends = {}
    for name, body in LEGEND_PATTERN.findall(source):
        legend = {}
        for quoted, double_quoted, bare, key in PAIR_PATTERN.findall(body):
            symbol = unescape(quoted) if quoted else (double_quoted or bare)
            legend[symbol] = key
        legends[name] = legend
    return grids, legends


def symbols_of(rows):
    return {symbol for row in rows for symbol in row if symbol != EMPTY}


def legend_for(rows, legends, preferred=None):
    if preferred:
        return preferred, legends[preferred]
    used = symbols_of(rows)
    for name, legend in legends.items():
        if used <= set(legend):
            return name, legend
    best = max(legends.items(), key=lambda item: len(used & set(item[1])))
    return best


def grid_colors(rows, legend, palette):
    result = []
    for row in rows:
        line = []
        for symbol in row:
            if symbol == EMPTY:
                line.append(None)
            else:
                key = legend.get(symbol)
                line.append(palette.get(key) if key else None)
        result.append(line)
    return result


def render_colors(colors, scale=1, background=None):
    height = len(colors)
    width = max((len(row) for row in colors), default=0)
    image = Image.new('RGBA', (max(width, 1), max(height, 1)), (0, 0, 0, 0) if background is None else background + (255,))
    for y, row in enumerate(colors):
        for x, color in enumerate(row):
            if color is not None:
                image.putpixel((x, y), tuple(color) + (255,))
    if scale != 1:
        image = image.resize((image.width * scale, image.height * scale), Image.NEAREST)
    return image


def render_grid(rows, legend, palette, scale=1, background=None):
    return render_colors(grid_colors(rows, legend, palette), scale, background)


def outside_mask(opaque):
    height = len(opaque)
    width = len(opaque[0]) if height else 0
    outside = [[False] * width for _ in range(height)]
    queue = deque()
    for y in range(height):
        for x in range(width):
            if (x in (0, width - 1) or y in (0, height - 1)) and not opaque[y][x]:
                outside[y][x] = True
                queue.append((x, y))
    while queue:
        x, y = queue.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not opaque[ny][nx] and not outside[ny][nx]:
                outside[ny][nx] = True
                queue.append((nx, ny))
    return outside


def luminance(color):
    return 0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]


def color_distance(first, second):
    return sum((first[channel] - second[channel]) ** 2 for channel in range(3)) ** 0.5


def labelled_sheet(tiles, columns=4, gap=16, background=BACKGROUND, label_color=(244, 242, 234)):
    if not tiles:
        return Image.new('RGB', (64, 64), background)
    label_height = 14
    cell_width = max(image.width for _, image in tiles) + gap
    cell_height = max(image.height for _, image in tiles) + gap + label_height
    rows = (len(tiles) + columns - 1) // columns
    sheet = Image.new('RGB', (gap + cell_width * min(columns, len(tiles)), gap + cell_height * rows), background)
    draw = ImageDraw.Draw(sheet)
    for index, (label, image) in enumerate(tiles):
        left = gap + (index % columns) * cell_width
        top = gap + (index // columns) * cell_height
        draw.text((left, top), label, fill=label_color)
        sheet.paste(image.convert('RGB'), (left, top + label_height), image if image.mode == 'RGBA' else None)
    return sheet
