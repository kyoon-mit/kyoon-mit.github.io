---
title: The reality check, a realistic SNR population
date: 2026-07-30
summary: >-
  In aframe, with a correct SNR and a power-law test population, the merger
  regressor that is nearly perfect on uniform SNR collapses toward the prior on
  most real-looking events. Detection by uncertainty and by a classifier both
  fall short.
talk:
  title: "BNS-SSM Update"
  venue: "BNS meeting"
  about: >-
    Reported the move into aframe and what a realistic SNR population did to the merger regressor, set the sensitive volume against the production searches, framed low SNR as the unsolved problem behind heterodyning, and proposed splitting the work into two papers.
---

After CERN the models moved into [aframe](https://github.com/ML4GW/aframe).
Three changes mattered:

- **SNR computed as the search computes it**, with PSDs truncated to the
  waveform band and a verification script against stored values.
- **A power-law test population.** Uniform SNR over-represents loud events.
  Real detections follow a steep power law, so most events sit near threshold.
- **A sensitive-volume pipeline**, which turns any detection statistic into the
  volume of space the search is sensitive to, so the model can be compared
  directly with the production pipelines.

## The merger regressor

<dl class="specs">
  <div><dt>Model</dt><dd>S4D + ResNet14 + MLP<small>S4D 256 × 32 × 4, about 600K</small></dd></div>
  <div><dt>Parameters</dt><dd>1.7 M</dd></div>
  <div><dt>Input</dt><dd>4 s merger window</dd></div>
  <div><dt>Training</dt><dd>About 7.5 days<small>H200, three restarts</small></dd></div>
  <div><dt>Target</dt><dd>Chirp mass + σ<small>Gaussian likelihood</small></dd></div>
  <div><dt>Test SNR</dt><dd>4 to 50<small>uniform, and power law</small></dd></div>
</dl>

| test population | chirp mass | uncertainty as a detection statistic (AUC) |
|---|---|---|
| uniform SNR 4 to 50 | on the diagonal across the range | 0.959 |
| power-law SNR 4 to 50 | pulled toward the mean; 1σ band spans most of the prior | 0.665 |

On the uniform test set, 80% or more of events above SNR 11 were within 2%. On
the power-law set the predicted uncertainty of most signals overlapped that of
pure background, because most of those signals are at SNR 4 to 8.

## Sensitive volume

Using the negative predicted uncertainty as the score, integrated over a 0.5 s
boxcar, the sensitive volume for a one-week background came out roughly an
order of magnitude below the matched-filter searches (MBTA, PyCBC, GstLAL) at
every mass bin tested. A pure S4D classifier trained for detection did no
better. Its time-slide AUROC at a false-positive rate of 1e-3 levelled off near
0.526.

## Other observations

1. A ResNet34 regressor matched some of the S4D metrics but trained much more
   slowly.
2. LinOSS failed with the identical learning-rate schedule; it later needed its
   own learning rate for the state-space parameters.
3. Group norm trained noticeably better than layer norm at batch size 64.
4. No pre-merger configuration matched the merger runs.

## The proposal that followed

Split the work in two. A first paper with a less ambitious goal: introduce
SSMs (S4D and LinOSS) for BNS and show pre-merger regression, without claiming
power-law SNR 4. A second paper on getting the best out of SSMs: denoising,
optimization, and an architecture comparison. The second is what the rest of
this log is about.
