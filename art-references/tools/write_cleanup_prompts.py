import sys

OUTPUT_DIRECTORY = sys.argv[1]

TEMPLATE = """Image 1 is a sheet of 8 sprites of a pixel art game at very low resolution, with big square pixels. They were reduced automatically, so some faces and details are broken.
Images 2 and 3 are approved sprites of the same game at the same low resolution: they show how faces, outlines and shading must look at this pixel size.

Clean up image 1 by hand, as a professional pixel artist would. Keep exactly the pixel grid of image 1: the same big square pixels, the same size of each sprite in pixels, the same position of each sprite on the sheet, the same silhouettes and the same colors. Never draw a pixel smaller than the squares of image 1.

Fix: {details}

Style of images 2 and 3: a dark colored outline one pixel thick, 2 to 3 flat tones per material in clean clusters, light from the top-left, faces made of a few clear pixels (two dark eyes with a white glint pixel, a tiny mouth). No dithering, no noise, no stray pixels, no anti-aliasing.

Output: the 8 sprites only, at the same positions as in image 1, plain flat background #2a2030, crisp nearest-neighbor square pixels, no text, no labels, no grid lines, no shadow."""

DETAILS = {
    'skeleton': "the skull with two big black eye holes and small cyan pupils and square teeth, the purple scarf, the bone club, the ribs as 2 or 3 clean lines, the thin bony arms and legs one pixel wide; the mushroom's red cap with round white spots, its angry eyes and open mouth, its small leaf arms; the small white bone and the round purple spore.",
    'villagers': "each villager's face (two dark eyes, a small smile), the elder's white beard and wooden staff, the farmer girl's straw hat, orange braids and apple basket, the blacksmith's black beard, leather apron and hammer, the boy's messy brown hair and wooden sword, the wizard's starry blue hat and wand, the hunter's grey wolf hood, red scarf and lantern, the big red exclamation mark and blue question mark in the two bubbles.",
    'nature': "the leaf clumps of the round tree, the white snow caps on the pine tiers, the glowing lava crack on the rock, the cactus arms and ribs, the dead tree's crooked branches one pixel wide, the willow's hanging leaves, the orange mushrooms on the mossy log, the pink lily flower on the lily pads.",
    'breakables': "the leaf clusters of the green bush, the white snow cap of the snowy bush, the rim and the stripe of the clay pot, the glowing orange tips of the purple crystals, the pink flower and the spines of the round cactus, the reeds and brown cattails, the planks of the crate, the long blades of the grass tuft.",
}

for group, details in DETAILS.items():
    with open(f'{OUTPUT_DIRECTORY}/{group}.txt', 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(TEMPLATE.format(details=details) + '\n')

HOUSES = """Image 1 shows approved sprites of a pixel art game at low resolution, with big square pixels: the hero and his dog.
Image 2 shows six village houses of the same game, drawn in a three-quarter view. Use image 2 only for the design, the materials and the colors of the houses.
Image 3 shows the village shop of the game. Use it only for its design and colors.

Draw seven buildings in a strict FRONT VIEW, like the buildings of a classic 2D game seen straight from the front: the front wall is a flat rectangle facing the viewer, the roof is seen from the front (a triangle gable, a rounded thatch or a flat edge above the wall), no side wall visible, no perspective, no top view. Each building has its door at the bottom center of its front wall, the door is a little taller than the hero of image 1.

Pixel size, the most important point: use exactly the same big square pixels as image 1. Never draw a pixel smaller than the pixels of the hero. Each house is about two and a half times as tall as the hero and about three times as wide. The shop is a little bigger than the houses.

The sheet has exactly 2 rows on a regular grid, each building well separated from the others.
Row 1, from left to right:
1. the round cottage with a golden straw thatched roof and white walls, a round window and a green door
2. the tall two-storey stone house with a blue slate roof and wooden windows
3. the wooden log cabin with a thick layer of white snow on its roof, icicles and a warm yellow window
4. the desert house with sand-colored adobe walls, a flat roof with a terracotta border and an orange cloth curtain in the doorway
Row 2, from left to right:
5. the green wooden swamp hut on short wooden stilts with a reed roof, a round window and a lantern
6. the blacksmith forge with dark stone walls, a dark red tiled roof, a big chimney and a glowing forge fire in a window
7. the village shop of image 3: red tiled roof, cream walls with wooden beams, stone base, two windows with flower boxes, and a blank wooden sign board above the door (the sign is empty: no drawing and no text)

Style of image 1: a dark colored outline one pixel thick, bright saturated colors, 2 to 3 flat tones per material in clean clusters, light from the top-left, no dithering, no noise, no anti-aliasing.

Output: the 7 buildings only, plain flat background #2a2030, crisp nearest-neighbor square pixels, no character, no text, no ground, no grass, no cast shadow, no frame."""

with open(f'{OUTPUT_DIRECTORY}/houses.txt', 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(HOUSES + '\n')
print('prompts', len(DETAILS) + 1)
