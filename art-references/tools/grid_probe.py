import sys
import numpy as np
from PIL import Image


def edge_profile(array, axis):
    diff = np.abs(np.diff(array.astype(np.int32), axis=axis)).sum(axis=2)
    return diff.sum(axis=0 if axis == 1 else 1).astype(np.float64)


def best_period(profile):
    profile = profile - profile.mean()
    scores = {}
    for period_times_ten in range(40, 260):
        period = period_times_ten / 10
        best = 0
        for phase_step in range(int(period * 2)):
            phase = phase_step / 2
            positions = np.arange(phase, len(profile) - 1, period)
            indices = np.round(positions).astype(int)
            indices = indices[indices < len(profile)]
            score = profile[indices].mean()
            if score > best:
                best = score
                best_phase = phase
        scores[period] = (best, best_phase)
    ranked = sorted(scores.items(), key=lambda item: -item[1][0])[:6]
    return ranked


for path in sys.argv[1:]:
    array = np.array(Image.open(path).convert('RGB'))
    print(path, array.shape)
    print('  x', [(period, round(score), phase) for period, (score, phase) in best_period(edge_profile(array, 1))])
    print('  y', [(period, round(score), phase) for period, (score, phase) in best_period(edge_profile(array, 0))])
