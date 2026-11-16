import sys

OUTPUT_DIRECTORY = sys.argv[1]

TEMPLATE = """Image 1 is a sheet of approved sprites of a pixel art game: it is the design to keep.
Image 2 shows the same sprites, at the same places, automatically reduced to half resolution: each sprite now uses half as many pixels in width and in height, so its pixels are twice as big. The automatic reduction broke the faces and the small details.

The most important rule: the output must be LOW RESOLUTION like image 2. Every pixel of the output is one big square of exactly the size of the squares of image 2. Never draw pixels smaller than the squares of image 2, never copy the small pixels of image 1. Image 1 only tells what the sprites are, image 2 tells the pixel size.

Redraw image 2 by hand, as a professional pixel artist would, on exactly the same pixel grid as image 2: same pixel size, same size of each sprite in pixels, same position of each sprite on the sheet, same silhouettes, same poses, same views and same colors as image 1.

Fix the broken parts so that they read clearly at this low resolution: {details}

Rules: at this resolution a face is made of a few clear pixels (two dark eyes of 1 or 2 pixels with a white glint pixel, a mouth of 1 to 2 pixels). A dark colored outline one pixel thick around each silhouette (a darker shade of the local color). 2 to 3 flat tones per material in clean clusters, light from the top-left. No dithering, no noise, no stray pixels, no anti-aliasing, no gradients.

Output: the 8 sprites only, at the same positions as in image 2, plain flat background #2a2030, crisp nearest-neighbor square pixels, no text, no labels, no numbers, no grid lines, no ground line, no cast shadow."""

DETAILS = {
    'hero': "the hero's face (two big dark eyes, a small smile, pink cheeks), his spiky blue hair with green tips, his green headband, his blue jacket open on a white shirt, his green shorts and white shoes, his small blue water pistol; the puppy's face (two dark eyes, a cream muzzle, floppy ears) and its curly tail.",
    'slimes': "the slime faces (two big round eyes with a white glint and a tiny smile), one glossy highlight on each dome, the king slime's angry eyebrows, its fanged open mouth and its golden crown with a red gem, the goblins' faces and pointy ears, the archer's brown hood and wooden bow, the bomber's red bandana, purple striped shirt and black bomb with a lit fuse.",
    'skeleton': "the skull with two big black eye holes and small cyan pupils, its square teeth, the purple scarf, the bone club, the ribs drawn as 2 or 3 clean lines; the mushroom's red cap with round white spots, its angry eyes and open mouth, its small leaf arms; the small white bone and the round purple spore.",
    'golem': "the bat's face (two eyes and two tiny white fangs), its pointy ears and its wing membranes in two purple tones; the golem's chunky rocks with glowing orange lava cracks and small yellow eyes; the round lava ball; the gold coins with an embossed star and one white glint.",
    'villagers': "each villager's face (two dark eyes, a small smile), the elder's white beard and wooden staff, the farmer girl's straw hat, orange braids and apple basket, the blacksmith's black beard, leather apron and hammer, the boy's messy brown hair and wooden sword, the wizard's starry blue hat and wand, the hunter's grey wolf hood, red scarf and lantern, the big red exclamation mark and blue question mark in the two bubbles.",
    'nature': "the leaf clumps of the round tree, the white snow caps on the pine tiers, the glowing lava crack on the rock, the cactus arms and ribs, the dead tree's crooked branches, the willow's hanging leaves, the orange mushrooms on the mossy log, the pink lily flower on the lily pads.",
    'decor': "the blue water and the stone ring of the fountain, the glowing lantern of the street lamp on a thin post 1 or 2 pixels wide, the wooden roof and bucket of the well, the bench planks, the red and white striped awning and the fruits of the market stall, the red, yellow, white and blue flowers of the flower bed, the iron rings and red apples of the barrels, the white fence pickets.",
    'breakables': "the leaf clusters of the green bush, the white snow cap of the snowy bush, the rim and the stripe of the clay pot, the glowing orange tips of the purple crystals, the pink flower and the spines of the round cactus, the reeds and brown cattails, the planks and nails of the crate, the long blades of the grass tuft.",
    'items': "the highlight of the red heart, the happy face of the gold star, the spark on the fuse of the bomb, the white, yellow and orange rings of the explosion, the horns and eye holes of the skull on its sand mound; the dark empty heart, the round bubble outline and the small arrow stay simple shapes.",
}

for group, details in DETAILS.items():
    with open(f'{OUTPUT_DIRECTORY}/{group}.txt', 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(TEMPLATE.format(details=details) + '\n')
print('prompts', len(DETAILS))
