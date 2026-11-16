import argparse

from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--box', required=True)
    parser.add_argument('--scale', type=int, default=4)
    parser.add_argument('--out', required=True)
    arguments = parser.parse_args()
    left, top, right, bottom = [int(value) for value in arguments.box.split(',')]
    crop = Image.open(arguments.image).convert('RGB').crop((left, top, right, bottom))
    crop = crop.resize((crop.width * arguments.scale, crop.height * arguments.scale), Image.NEAREST)
    crop.save(arguments.out)
    print('wrote', arguments.out, crop.size)


if __name__ == '__main__':
    main()
