import argparse

import numpy as np
from PIL import Image

from ref_extract import edge_profile
from ref_quantize import load_cells


def score_period(profile, period):
    best = (-1.0, 0.0)
    for phase in np.arange(0, period, 0.125):
        positions = np.arange(phase, len(profile) - 1, period)
        low = np.floor(positions).astype(int)
        fraction = positions - low
        values = profile[low] * (1 - fraction) + profile[np.minimum(low + 1, len(profile) - 1)] * fraction
        score = float(values.mean())
        if score > best[0]:
            best = (score, float(phase))
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cells', required=True)
    parser.add_argument('--low', type=float, default=5.0)
    parser.add_argument('--high', type=float, default=5.5)
    parser.add_argument('--step', type=float, default=0.01)
    arguments = parser.parse_args()
    payload = load_cells(arguments.cells)
    array = np.array(Image.open(payload['image']).convert('RGB'))
    for sprite in payload['sprites']:
        x0, y0, x1, y1 = sprite['box']
        region = array[max(0, y0 - 4):y1 + 4, max(0, x0 - 4):x1 + 4]
        for axis, label in ((1, 'x'), (0, 'y')):
            profile = edge_profile(region, axis)
            mean = profile.mean()
            ranked = []
            for period in np.arange(arguments.low, arguments.high + arguments.step / 2, arguments.step):
                score, phase = score_period(profile, period)
                ranked.append((score / mean, round(float(period), 3), round(phase, 2)))
            ranked.sort(reverse=True)
            print(sprite['index'], label, 'length', len(profile), ' '.join(f'{period}:{score:.2f}@{phase}' for score, period, phase in ranked[:6]))


if __name__ == '__main__':
    main()
