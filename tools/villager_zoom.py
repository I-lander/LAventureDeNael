import argparse
import json

from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/villager/cells.json')
    parser.add_argument('--index', type=int, required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--zoom', type=int, default=3)
    arguments = parser.parse_args()

    with open(arguments.cells, encoding='utf-8') as handle:
        payload = json.load(handle)
    sprite = payload['sprites'][arguments.index]
    image = Image.open(payload['image']).convert('RGB')
    origin_x, origin_y = sprite['origin']
    period_x, period_y = sprite['period']
    rows = sprite['rows']
    columns = len(rows[0])
    margin = 24
    zoom = arguments.zoom
    left, top = int(origin_x), int(origin_y)
    right = int(origin_x + columns * period_x) + 1
    bottom = int(origin_y + len(rows) * period_y) + 1
    crop = image.crop((left, top, right, bottom))
    crop = crop.resize((crop.width * zoom, crop.height * zoom), Image.NEAREST)
    sheet = Image.new('RGB', (crop.width + margin, crop.height + margin), (20, 20, 20))
    sheet.paste(crop, (margin, margin))
    draw = ImageDraw.Draw(sheet)
    for column in range(columns + 1):
        position = margin + (origin_x - left + column * period_x) * zoom
        draw.line((position, margin, position, sheet.height), fill=(255, 0, 255), width=1)
        if column < columns:
            draw.text((position + 4, 6), str(column), fill=(255, 255, 255))
    for row in range(len(rows) + 1):
        position = margin + (origin_y - top + row * period_y) * zoom
        draw.line((margin, position, sheet.width, position), fill=(255, 0, 255), width=1)
        if row < len(rows):
            draw.text((4, position + 8), str(row), fill=(255, 255, 255))
    sheet.save(arguments.out)
    print('wrote', arguments.out, sheet.size)


if __name__ == '__main__':
    main()
