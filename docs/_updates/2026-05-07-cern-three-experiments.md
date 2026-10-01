---
title: Three experiments, presented at CERN
date: 2026-05-07
summary: >-
  Merger chirp mass with uncertainty from a 70K-parameter S4D, pre-merger
  regression 7 seconds before coalescence, and a first two-detector sky ring.
  Uniform-SNR results from the standalone codebase.
talk:
  title: "From Inspiral to Inference: Binary Neutron Star Parameter Estimation with State Space Models"
  venue: "AI for Gravitational Waves workshop, CERN"
  about: >-
    The first public account of the project, argued from simplicity: one small sequence model, strain in, physical parameters and their uncertainties out. It showed three experiments, all from the standalone codebase on uniformly distributed SNR.
---

<p class="note"><strong>Read with care.</strong> These runs predate the move
into aframe. Training and test SNR were drawn uniformly on 8 to 50, and the
SNR calculation in this codebase was later found to be incorrect. The numbers
show what the models do on an artificial population, not on real events. See
the <a href="{{ '/projects/bns/updates/2026-07-30-reality-check/' | relative_url }}">July update</a>
for what changed.</p>

## Shared setup

<dl class="specs">
  <div><dt>Noise</dt><dd>GWOSC O3b<small>train and validation, 8:2</small></dd></div>
  <div><dt>Test noise</dt><dd>GWOSC O3a<small>100K events</small></dd></div>
  <div><dt>Sample rate</dt><dd>4096 Hz<small>downsampled per experiment</small></dd></div>
  <div><dt>Waveforms</dt><dd>IMRPhenomPv2<small>64 s window, merger at 63 s</small></dd></div>
  <div><dt>Mass prior</dt><dd>Uniform chirp mass<small>1 ≤ m₁, m₂ ≤ 2.5</small></dd></div>
  <div><dt>SNR</dt><dd>Uniform 8 to 50<small>power law −3 for one test</small></dd></div>
</dl>

## 1. Chirp mass and uncertainty from the merger

A 70K-parameter S4D read 4 seconds of strain ending at coalescence,
downsampled to 256 Hz, and output a mean and a variance trained with a Gaussian
negative log-likelihood (about a day on an A100).

- **Accuracy.** At SNR 10 half the events were within 10% of the true chirp
  mass; at SNR 13, half were within 5%.
- **Uncertainty as a detector.** On noise-only copies of the test events the
  model returned the prior mean with a wide band. Used as a detection
  statistic, the predicted uncertainty reached an AUC of 0.942, against 0.920
  for a 20M-parameter CNN on the same task.

## 2. Chirp mass from the pre-merger

A 2.2 M-parameter model read a window ending 7 seconds before merger, trained
on SNR 20 to 30 with a mean-square loss and tested on 20 to 40 (2 to 3 days on
an A100). The estimate tracked the truth across the chirp-mass range, which was
the first sign that pre-merger regression is possible at all.

## 3. Sky localization from the merger

With two detectors, the arrival-time difference fixes only the angle θ
between the source direction and the detector baseline, so the sky position
is a ring. A 70K-parameter model regressed a unit vector with a
cosine-similarity loss from 1 second of high-rate strain around the merger.
Predicted cos θ followed the truth with a wide band, and collapsed to a flat
guess on noise-only inputs. Three detectors and a pre-merger version were left
as future work.

## Takeaways at the time

1. Only about 70K parameters were needed to report chirp mass and uncertainty.
2. A Gaussian likelihood gives a usable uncertainty, and that uncertainty
   already separates signal from noise.
3. Pre-merger regression and a two-detector sky ring both looked feasible.

What was missing was a realistic population. That is where the next chapter
starts.
