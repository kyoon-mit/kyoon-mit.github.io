---
title: The denoiser loss was measuring the wrong thing
date: 2026-09-08
summary: >-
  A month of denoiser training whose loss curves looked healthy turned out to
  produce an impulse at the window edge. What fixed it: separating shape from
  gain, a scale-free overlap metric, and measuring the two loss terms'
  gradients, which differed by a factor of about 2400.
talk:
  title: "Denoising"
  venue: "LIGO meeting"
  about: >-
    Introduced the denoiser as the route to low SNR. It recapped how the regressor fails on the power-law population, showed the time and log-spectrum loss and the fixed reference events (SNR 50, 20 and 4, a glitch, pure background), and a first frozen denoiser feeding a classifier.
---

The plan was to put an S4D **denoiser** in front of the regressor: whitened
noisy strain `(batch, 2 detectors, 8192 samples)` in, the clean injected
waveform out. The loss was a mixture of a time-domain error and an error on the
log magnitude spectrum:

```
L_time = mean over samples of (pred − target)²
L_spec = mean over bins of (log(|FFT pred| + ε) − log(|FFT target| + ε))²
L      = α · L_time + (1 − α) · L_spec
```

## What the first scan hid

Some runs produced a strikingly smooth predicted spectrum that was about ten
times too small, which looked like a partial success. Measured directly it was
not:

| variant | overlap rho with target | power in first 5% of window |
|---|---|---|
| density on, floor 1e-3 | 0.056 | 1.1% |
| density off, floor 1e-3 | 0.007 | 98.2% |
| the target itself | 1 | 3.6% |

The model was emitting a short transient at the window edge. An impulse has a
smooth broad spectrum, and a magnitude spectrum discards phase, so the
frequency term could not tell an impulse from a chirp.

## Shape and gain, separately

A replacement loss supervises the shape through the normalized overlap rho
(scale-free, phase-sensitive) and the amplitude through the least-squares
gain, with a separate term driving noise-only samples to zero. Overlap rose
from 0.007 to 0.34, and the edge-power fraction fell from 0.98 to 0.016.

Two further findings from that phase:

- **The amplitude deficit is the optimum, not a bug.** The realized gain
  tracked rho, as the minimum-variance estimate requires. A model that recovers
  a fifth of the shape should emit a fifth of the amplitude.
- **Capacity was not the limit.** Models of 67K, 200K and 400K parameters all
  plateaued near rho 0.21.

## The gradient imbalance

The time term's gradient scales with the signal amplitude, the log-spectral
term's as its inverse, so their ratio moves as amplitude squared. Measured on
real batches:

| epoch | time-term gradient | spectral-term gradient | ratio |
|---|---|---|---|
| 0 | 1.0e-3 | 2.2e-2 | 21 |
| 39 | 1.9e-4 | 4.2e-1 | 2255 |
| 325 | 1.7e-4 | 4.1e-1 | 2406 |

So an "even" α = 0.5 gave the time term about 0.04% of each update. The log
floor ε matters for the same reason, since it caps the per-bin spectral
gradient:

| log floor | gradient ratio | rho |
|---|---|---|
| 1e0 | 45 | 0.096 |
| 1e-3 | 2440 | 0.044 |
| 1e-9 | 4789 | 0.029 |

## A bug worth recording

The SNR curriculum's length was counted in optimizer steps. When an epoch was
shortened for a quick diagnostic, the curriculum silently stretched past the
end of the run, and one run reporting rho 0.46 was in fact training at SNR 17.5,
not 4. At SNR 4 the same configuration reached rho 0.089. Any setting counted
in steps has to be restated whenever the epoch length changes.

## Instruments built along the way

- **Loss-independent metrics** on every run: rho, the realized gain, and the
  edge-power fraction. A falling loss had accompanied a worsening
  reconstruction, so loss values alone are not trusted.
- **Per-term gradient norms**, logged each epoch.
- **A fixed set of reference events** (SNR 50, 20 and 4, the loudest glitch
  found, and pure background) plotted identically for every run, so runs can be
  compared by eye.

A frozen denoiser at rho 0.15 feeding a classifier reached a time-slide AUROC
of 0.518, below target. The better denoisers came next.
