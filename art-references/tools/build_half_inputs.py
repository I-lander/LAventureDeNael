import json
import sys
from collections import Counter
from PIL import Image

PROJECT = sys.argv[1]
OUTPUT_DIRECTORY = sys.argv[2]
CANVAS = (1376, 768)
COLUMNS = 4
ROWS = 2
BACKGROUND = (0x2a, 0x20, 0x30, 255)

GROUPS = {
    'hero': ['player-south-a', 'player-south-east-a', 'player-east-a', 'player-north-east-a', 'player-north-a', 'pet-dog-front', 'pet-dog-side', 'pet-dog-back'],
    'slimes': ['slime-green-front-idle', 'slime-green-side-idle', 'slime-green-back-idle', 'king-slime', 'goblin-archer-front-idle', 'goblin-archer-side-idle', 'goblin-archer-back-idle', 'goblin-bomber-front-idle'],
    'skeleton': ['skeleton-front-idle', 'skeleton-side-idle', 'skeleton-back-idle', 'bone', 'mushroom-front-idle', 'mushroom-side-idle', 'mushroom-back-idle', 'spore'],
    'golem': ['bat-wings-up', 'bat-wings-down', 'lava-golem-front-idle', 'lava-golem-side-idle', 'lava-golem-back-idle', 'lava-ball', 'coin', 'coin-stack'],
    'villagers': ['villager-elder', 'villager-farmer', 'villager-smith', 'villager-boy', 'villager-wizard', 'villager-hunter', 'bubble-quest', 'bubble-done'],
    'nature': ['decor-tree', 'decor-pine', 'decor-rock', 'decor-cactus', 'decor-dead-tree', 'decor-willow', 'decor-mossy-log', 'decor-lily-pads'],
    'decor': ['prop-fountain', 'prop-street-lamp', 'prop-well', 'prop-bench', 'prop-market-stall', 'prop-flower-bed', 'prop-barrels', 'prop-fence'],
    'breakables': ['breakable-bush', 'breakable-snow-bush', 'breakable-clay-pot', 'breakable-lava-crystal', 'breakable-barrel-cactus', 'breakable-reeds', 'breakable-crate', 'breakable-tall-grass'],
    'items': ['heart', 'power-star', 'bomb', 'explosion', 'decor-desert-skull', 'heart-empty', 'shield-bubble', 'arrow'],
}

atlases = []
for key in ('sprites', 'world'):
    atlases.append((
        Image.open(f'{PROJECT}/public/assets/sprites/{key}.png').convert('RGBA'),
        json.load(open(f'{PROJECT}/public/assets/sprites/{key}.json'))['frames'],
    ))


def crop(name):
    for image, frames in atlases:
        if name in frames:
            frame = frames[name]['frame']
            sprite = image.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h']))
            return sprite.crop(sprite.getbbox())
    raise KeyError(name)


def halve(sprite):
    width = (sprite.width + 1) // 2
    height = (sprite.height + 1) // 2
    result = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels = sprite.load()
    for y in range(height):
        for x in range(width):
            block = []
            for dy in range(2):
                for dx in range(2):
                    sx, sy = x * 2 + dx, y * 2 + dy
                    if sx < sprite.width and sy < sprite.height:
                        block.append(pixels[sx, sy])
            opaque = [color for color in block if color[3] > 0]
            if len(opaque) >= 2:
                result.putpixel((x, y), Counter(opaque).most_common(1)[0][0])
    return result


def compose(sprites, scale):
    sheet = Image.new('RGBA', CANVAS, BACKGROUND)
    slot_width = CANVAS[0] // COLUMNS
    slot_height = CANVAS[1] // ROWS
    for index, sprite in enumerate(sprites):
        column = index % COLUMNS
        row = index // COLUMNS
        big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.NEAREST)
        left = column * slot_width + (slot_width - big.width) // 2
        top = row * slot_height + (slot_height - big.height) // 2
        sheet.alpha_composite(big, (left, top))
    return sheet.convert('RGB')


for group, names in GROUPS.items():
    originals = [crop(name) for name in names]
    halves = [halve(sprite) for sprite in originals]
    slot_width = CANVAS[0] // COLUMNS - 24
    slot_height = CANVAS[1] // ROWS - 24
    half_scale = min(min(slot_width // sprite.width, slot_height // sprite.height) for sprite in halves)
    half_scale -= half_scale % 2
    compose(originals, half_scale // 2).save(f'{OUTPUT_DIRECTORY}/{group}-design.png')
    compose(halves, half_scale).save(f'{OUTPUT_DIRECTORY}/{group}-grid.png')
    print(group, 'half pixel size', half_scale, 'sizes', [f'{sprite.width}x{sprite.height}' for sprite in halves])
