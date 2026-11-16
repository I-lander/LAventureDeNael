import argparse
import json

from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', default='art-references/v4/skeleton/cells.json')
    parser.add_argument('--image', default='')
    parser.add_argument('--index', type=int, required=True)
    parser.add_argument('--zoom', type=int, default=2)
    parser.add_argument('--out', required=True)
    arguments = parser.parse_args()

    with open(arguments.cells, encoding='utf-8') as handle:
        payload = json.load(handle)
    sprite = payload['sprites'][arguments.index]
    image = Image.open(arguments.image or payload['image']).convert('RGB')
    period_x, period_y = sprite['period']
    origin_x, origin_y = sprite['origin']
    columns = len(sprite['rows'][0])
    rows = len(sprite['rows'])
    margin = 28
    left = int(origin_x)
    top = int(origin_y)
    right = int(origin_x + columns * period_x) + 1
    bottom = int(origin_y + rows * period_y) + 1
    crop = image.crop((left, top, right, bottom))
    crop = crop.resize((crop.width * arguments.zoom, crop.height * arguments.zoom), Image.NEAREST)
    sheet = Image.new('RGB', (crop.width + margin, crop.height + margin), (30, 30, 30))
    sheet.paste(crop, (margin, margin))
    draw = ImageDraw.Draw(sheet)
    for column in range(columns + 1):
        x = margin + round((origin_x + column * period_x - left) * arguments.zoom)
        draw.line((x, margin, x, sheet.height), fill=(255, 0, 255), width=1)
        if column < columns:
            draw.text((x + 4, 8), str(column), fill=(255, 255, 255))
    for row in range(rows + 1):
        y = margin + round((origin_y + row * period_y - top) * arguments.zoom)
        draw.line((margin, y, sheet.width, y), fill=(255, 0, 255), width=1)
        if row < rows:
            draw.text((4, y + 6), str(row), fill=(255, 255, 255))
    sheet.save(arguments.out)
    print('wrote', arguments.out, sheet.size)


if __name__ == '__main__':
    main()
