---
title: "Clean signal kept only near one random frequency: S4D falls from 99.7% to guess level within 1%"
date: 2026-10-29
tags: [s4d, regression]
summary: >-
  Does the S4D estimate chirp mass from the whole chirp, or from short pieces
  near single frequencies? For each clean 4 s window we draw f uniformly
  between 100 and 1000 Hz, keep only the part of the signal whose frequency is
  within f ± Δf, and set everything else to 0, for Δf = 3, 5, 10 and 20 Hz.
  Three S4D regressors trained on whole windows (99.7, 99.7 and 93.8% within
  1% on them) fall to 1.5 to 2.7% within 1%, the level of always guessing
  1.70 M☉ (1.7%). Training on these windows has started.
---

{%- assign u = '/projects/bns/updates/' -%}

{% include notice-snr-powerlaw.html %}

The [16 October table]({{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }})
shows small S4D regressors putting 90.6 to 100% of clean validation events
within 1% of the true chirp mass. It does not say how. A network could use the
whole chirp, or only short pieces of it near single frequencies. This test
removes everything except one such piece.

## The test

For each 4 s window we draw f uniformly between 100 and 1000 Hz and keep only
the part of the clean, whitened signal whose frequency lies within f ± Δf.
Every other sample is set to 0. We use Δf = 3, 5, 10 and 20 Hz. Only the part
before the merger counts; the merger time is the signal's largest amplitude in
each detector, as in the time warp.

The signal's frequency over time is read from the times where it crosses
zero, interpolated linearly between samples: between two consecutive
crossings, the frequency is the sample rate (2048 Hz) divided by twice their
spacing. No Fourier transform touches the kept samples, so the kept part is
the signal itself, cut where it crosses zero.

Check, on a leading-order chirp with chirp mass 1.22 M☉: the measured
frequency is 100.0, 200.0, 298.5 and 503.0 Hz where the true one is 100, 200,
300 and 500 Hz. The kept duration matches the time the chirp spends within
f ± Δf: 350.6 ms against 345.7 ms at f = 100 Hz and Δf = 3 Hz, and 187.0 ms
against 186.5 ms at f = 200 Hz and Δf = 20 Hz. Near 1000 Hz there are about two
samples per cycle and the reading is rough: a steady 900 Hz oscillation reads
between 674 and 988 Hz. This chirp spends 0.49 ms within 900 ± 20 Hz, one
sample, so at most a sample or two is kept there either way.

## Networks and data

Three cells of the table, with the checkpoints we have: the real ending with
the mean over time and the real ending with the maximum over time on the
merger window (checkpoints from epochs 151 and 198), and the real ending with
the mean over time on the warped merger window (epoch 108). For the warped
window the mask is applied on the real time axis, and the result is then
warped as in training. The final checkpoints of the other cells are not
available on this machine.

Each test uses 4,096 validation windows, built the same way as in training
(held-out background for whitening, validation signals, SNR from the power law
above), with the same random seed for every network.

## Results

Fraction of events within 1 / 2 / 5 / 10% of the true chirp mass:

<div markdown="1">

| network | whole window | Δf = 3 Hz | Δf = 5 Hz | Δf = 10 Hz | Δf = 20 Hz |
|---|---|---|---|---|---|
| real, mean over time, merger window | 99.7 / 100 / 100 / 100 | 1.5 / 3.1 / 8.0 / 17.4 | 1.9 / 3.4 / 8.0 / 17.2 | 1.9 / 3.3 / 8.4 / 17.8 | 1.8 / 3.5 / 9.0 / 18.2 |
| real, maximum over time, merger window | 99.7 / 100 / 100 / 100 | 2.7 / 4.8 / 11.9 / 23.2 | 2.5 / 4.8 / 12.0 / 23.0 | 2.3 / 4.3 / 12.0 / 23.2 | 2.3 / 4.7 / 12.0 / 24.3 |
| real, mean over time, warped merger window | 93.8 / 99.1 / 100 / 100 | 2.3 / 4.5 / 11.7 / 22.2 | 2.4 / 4.9 / 11.9 / 22.9 | 2.1 / 4.3 / 11.8 / 23.6 | 2.7 / 5.2 / 12.3 / 24.3 |

</div>

- **Reference.** Always answering 1.70 M☉ puts 1.7 / 2.9 / 8.2 / 16.8% of the
  same events within 1 / 2 / 5 / 10%. When nothing is kept, the first network
  answers 1.698 M☉ on average (spread 0.054 M☉). For every Δf, all three
  networks are at the level of this constant answer.
- **The most signal kept.** With f between 100 and 150 Hz and Δf = 20 Hz,
  the median kept duration is 715 ms. There the networks put 3.9, 4.7 and 5.6%
  of events within 1%, and 32.6, 30.5 and 45.1% within 10%.
- **Windows with nothing kept** in at least one detector: 68, 60, 49 and 41%
  for Δf = 3, 5, 10 and 20 Hz. They are at high f and heavy systems. With
  Δf = 3 Hz and f between 300 and 500 Hz, 25% of windows with chirp mass 0.85
  to 1.2 M☉ are empty and 78% of those with 2.1 to 2.75 M☉; above 700 Hz, 98
  to 100%. With Δf = 20 Hz, no window below 300 Hz is empty.

## What it shows, and what it does not

Networks trained on whole clean windows cannot estimate the chirp mass from
the piece of the signal near one frequency. They never saw such windows in
training, so this alone does not say whether they use the whole chirp or
pieces of it.

## Next

The same networks are now being trained and validated on these windows: four
endings (real or complex, mean or maximum over time) on the merger and warped
merger windows, for each Δf, 32 runs.
