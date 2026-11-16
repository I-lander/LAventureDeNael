import argparse
import json
import os

from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/breakable/cells.json')
    parser.add_argument('--out', default='art-references/v4/breakable/view')
    parser.add_argument('--zoom', type=int, default=3)
    parser.add_argument('--image', default='')
    arguments = parser.parse_args()

    with open(arguments.cells, encoding='utf-8') as handle:
        payload = json.load(handle)
    image = Image.open(arguments.image or payload['image']).convert('RGB')
    os.makedirs(arguments.out, exist_ok=True)
    for sprite in payload['sprites']:
        period_x, period_y = sprite['period']
        origin_x, origin_y = sprite['origin']
        columns = len(sprite['rows'][0])
        rows = len(sprite['rows'])
        print(sprite['index'], 'box', sprite['box'], 'period', sprite['period'], 'origin', sprite['origin'], f'{columns}x{rows}')
        left = int(round(origin_x - period_x))
        top = int(round(origin_y - period_y))
        right = int(round(origin_x + (columns + 1) * period_x))
        bottom = int(round(origin_y + (rows + 1) * period_y))
        crop = image.crop((left, top, right, bottom))
        zoom = arguments.zoom
        tile = crop.resize((crop.width * zoom, crop.height * zoom), Image.NEAREST)
        draw = ImageDraw.Draw(tile)
        for column in range(columns + 1):
            x = (origin_x + column * period_x - left) * zoom
            draw.line([(x, 0), (x, tile.height)], fill=(255, 0, 255), width=1)
            if column < columns:
                draw.text((x + 2, 1), str(column), fill=(255, 255, 255))
        for row in range(rows + 1):
            y = (origin_y + row * period_y - top) * zoom
            draw.line([(0, y), (tile.width, y)], fill=(255, 0, 255), width=1)
            if row < rows:
                draw.text((1, y + 2), str(row), fill=(255, 255, 255))
        tile.save(os.path.join(arguments.out, f'ref-{sprite["index"]}.png'))


if __name__ == '__main__':
    main()
