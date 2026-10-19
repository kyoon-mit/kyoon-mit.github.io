---
title: The denoiser loss was measuring the wrong thing
date: 2026-09-08
tags: [denoising]
summary: >-
  A month of denoiser training whose loss curves looked healthy turned out to
  produce an impulse at the window edge. What fixed it: separating shape from
  gain, a scale-free overlap metric, and measuring the two loss terms'
  gradients, which differed by a factor of more than 2000.
talk:
  title: "Denoising"
  venue: "LIGO meeting"
  about: >-
    Introduced the denoiser as the route to low SNR. It recapped how the regressor fails on the power-law population, showed the time and log-spectrum loss and the fixed reference events (SNR 50, 20 and 4, a glitch, pure background), and a first frozen denoiser feeding a classifier.
---

{% include notice-snr-powerlaw.html %}

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

Some runs produced a smooth predicted spectrum that was about ten times too
small on the reference-event plots (read by eye), which looked like a partial
success. Measured directly it was not:

| variant | overlap rho with target | power in first 5% of window |
|---|---|---|
| density on, floor 1e-3 | 0.056 | 1.1% |
| density off, floor 1e-3 | 0.007 | 98.2% |
| the target itself | 1 | 3.6% |

The model was emitting a short transient at the window edge. An impulse has a
flat, broad magnitude spectrum, and a magnitude spectrum discards phase: the
frequency term gives the same score to every signal with the target's
magnitude spectrum, a short pulse at the window edge among them, so it could
not tell such a pulse from the chirp
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-magnitude-phase)).

## Shape and gain, separately

A replacement loss supervises the shape through the normalized overlap rho
(scale-free, phase-sensitive) and the amplitude through the least-squares
gain, with a separate term driving noise-only samples to zero. Overlap rose
from 0.007 to 0.34, and the edge-power fraction fell from 0.98 to 0.016.

Two further findings from that phase:

- **The amplitude deficit is the optimum, not a bug.** The realized gain
  tracked rho (for example 0.176 against 0.189), as the least-squares fit
  requires: a model that recovers a fifth of the shape should emit a fifth of
  the amplitude
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-ls-gain)).
- **Capacity was not the limit.** Models of 67K, 200K and 400K parameters all
  peaked between rho 0.210 and 0.215 in validation.

## The gradient imbalance

The time term's gradient scales with the signal amplitude, the log-spectral
term's as its inverse, so their ratio scales as the amplitude squared and the
spectral term takes over as the amplitude falls
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-grad-ratio)).
Measured on real batches (the norm of each term's gradient with respect to the
denoiser output, averaged over an epoch):

| epoch | time-term gradient | spectral-term gradient | ratio |
|---|---|---|---|
| 0 | 1.0e-3 | 2.2e-2 | 21 |
| 39 | 1.9e-4 | 4.2e-1 | 2255 |
| 325 | 1.7e-4 | 4.1e-1 | 2406 |

So an "even" α = 0.5 gave the time term 1 part in 2407, 0.042%, of the summed
gradient at epoch 325. The log floor ε matters for the same reason, since the
per-bin spectral gradient carries a factor 1/(|FFT pred| + ε), which is at most
1/ε
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-grad-ratio)):

| log floor | gradient ratio | rho |
|---|---|---|
| 1e0 | 45 | 0.096 |
| 1e-3 | 2440 | 0.044 |
| 1e-9 | 4789 | 0.029 |

## A bug worth recording

The SNR curriculum's length was counted in optimizer steps: 31,280, which is
40 epochs of 782 batches. When an epoch was shortened to 16 batches for a quick
diagnostic, the curriculum silently stretched to 1,955 epochs, past the end of
the run, and one run reporting rho 0.46 at epoch 303 was in fact training with
its minimum SNR at 17.5, not 4
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-curriculum)).
At SNR 4 the same configuration reached rho 0.089 at the same epoch. Any
setting counted in steps has to be restated whenever the epoch length changes.

## Instruments built along the way

- **Loss-independent metrics** on every run: rho, the realized gain, and the
  edge-power fraction. A falling loss had accompanied a worsening
  reconstruction, so loss values alone are not trusted.
- **Per-term gradient norms**, logged each epoch.
- **A fixed set of reference events** (SNR 50, 20 and 4, the loudest glitch
  found, and pure background) plotted identically for every run, so runs can be
  compared by eye.

A frozen denoiser at rho 0.15 feeding a classifier reached a time-slide AUROC
of 0.518, barely above the 0.5 of a random ranking (Fawcett 2006, Pattern
Recognition Letters 27, 861). The better denoisers came next.
