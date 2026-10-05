---
title: How much the window holds, and how DINGO-BNS and AFRAME reach low SNR
date: 2026-10-05
summary: >-
  A Cramér–Rao estimate says even the 4 s merger window holds enough
  information for sub-percent chirp mass at SNR 4 to 8, so the window is not the
  limit. Both published low-SNR pipelines start from a near-correct chirp mass,
  one from a trigger, the other from a grid.
---

## The window is not the bottleneck

For 600 events from the test set, the chirp-mass Cramér–Rao bound was computed
for windows ending at merger, with a TaylorF2 waveform (3.5PN phase, no spins)
and the median O3b PSD. Each event is normalized to its catalog SNR.

| SNR | events | bound σ(Mc)/Mc, 3.5 s | 8 s | 16 s | 30 s | in-window SNR, 3.5 s to 30 s |
|---|---|---|---|---|---|---|
| 4 to 6 | 399 | 0.39% | 0.19% | 0.11% | 0.08% | 4.0 to 4.8 |
| 6 to 8 | 121 | 0.28% | 0.13% | 0.08% | 0.05% | 5.6 to 6.6 |
| 8 to 12 | 55 | 0.20% | 0.09% | 0.05% | 0.04% | 7.8 to 9.5 |
| 12 to 16 | 17 | 0.14% | 0.06% | 0.04% | 0.03% | 11.5 to 13.5 |

Our 3.5 s window already holds most of the SNR, and its bound is five times
tighter than the 2% we score against. Lengthening it to 30 s tightens the bound
about fivefold but adds only about 20% SNR.

The bound is optimistic at this SNR, though. It assumes a single smooth
likelihood peak, which holds only well above threshold. Near SNR 5 the noise
produces several competing chirp-mass solutions, and the real achievable error
is much larger. So the information is not missing for lack of window, but a
precise estimate at SNR 5 is not guaranteed either. A matched-filter benchmark
on the same windows would settle it.

## What the published pipelines do differently

Both reach low SNR by never searching the full chirp-mass range with the
network.

- **DINGO-BNS** conditions on a chirp-mass proxy: the true chirp mass blurred
  by a kernel of ±0.002 M☉ in its BNS training settings, about 0.15%. It
  removes the leading-order chirp phase with that proxy in a multibanded
  frequency domain, over 128 s and 30 to 1536 Hz. At inference the proxy comes
  from a search trigger, or from a scan over chirp masses scored by the exact
  likelihood. The released GW170817 demo also fixes the sky position.
- **The AFRAME BNS search** heterodynes the strain at a grid of chirp masses (100
  log-spaced values from 1.0 to 2.5 in the data module), so the network sees the
  data de-chirped at every candidate and only has to notice which one went
  stationary.

Our models are asked something neither does: find the chirp mass in a broad
prior from the raw chirp. The
[brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }}) page lists the
tests that follow from this.

## Also started today

- A fine-tune of the Project 8 recipe run on SNR ≥ 8 only, the range that
  decides sensitive volume, validating on the full power law from SNR 4.
- A sensitive-volume measurement from the epoch-630 checkpoint, with −σ as the
  statistic, no time integration, and about one week of O3b background.
