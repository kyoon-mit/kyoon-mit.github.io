---
title: "How Gaussian is the noise our networks see?"
date: 2026-10-19
tags: [noise, classification]
math: true
summary: >-
  Every 4 s window of our O3 background, 69.5 hours per detector, compared with
  a Gaussian copy that has the same spectrum at that moment. After whitening,
  most frequencies are flat to within 10%, but narrow lines near 500 and 1000
  Hz survive at up to 2,081 times the white level, and 6.5 to 11.9 windows
  per hour hold a value beyond 8 (Gaussian noise: one in 10⁸ hours). The lines
  give the typical window a spread of 1.04 to 1.34 instead of 1, and make a
  quarter to a third of O3b windows lighter-tailed than Gaussian. A small
  classifier tells real windows from their Gaussian copies 99.66% of the
  time.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

I am starting a generator of detector noise: a network that makes new
two-detector windows that no classifier can tell from real ones. Before
judging a generator, I need to know what real noise has that Gaussian noise
with the same spectrum does not. This page measures that on the data our
networks train and test on.

## The data and the comparison

- **Data.** The O3 background files of aframe's training set, H1 and L1 at
  2048 Hz: 23 O3a files (GPS 1238166018 to 1238426681, 141,852 s) and 10 O3b
  files (GPS 1256663958 to 1256798948, 108,950 s).
- **Windows.** Every back-to-back 4 s window of every file, 35,334 in O3a
  (39.3 h) and 27,182 in O3b (30.2 h), whitened as aframe whitens its
  training data: spectrum from the 20 s before the window (median of 2 s
  FFTs), whitening filter cut to 1 s, highpass at 20 Hz.
- **The comparison.** For each window, a Gaussian copy: Gaussian noise drawn
  with the spectrum measured from the same 20 s, then whitened the same way.
  It keeps the spectrum of that moment and nothing else. Whatever differs
  between a window and its copy is something real noise has beyond its
  spectrum.
- Two catalogued events lie in these files and were not removed: GW190403
  (GWTC-2.1, [arXiv:2108.01045](https://arxiv.org/abs/2108.01045)) in O3a and
  GW191103 (GWTC-3, [arXiv:2111.03606](https://arxiv.org/abs/2111.03606)) in
  O3b. Each touches a few windows out of tens of thousands.

## The short answer

- **Raw noise is strongly colored.** Between 20 Hz and the quietest
  frequency near 170 to 200 Hz, H1's amplitude spectral density falls by a
  factor of 175 to 225, L1's by 17 to 25.
- **Whitening flattens most frequencies.** In a typical window the whitened
  power lies between 0.93 and 1.11 of white at 90% of frequencies.
- **Narrow lines survive whitening.** The lines near 500 Hz, where the
  test-mass violin modes are, reach 74 to 2,081 times white in the typical
  window; H1's line at 1000.5 Hz reaches 247 (O3a) and 325 (O3b), and L1's at
  1016.5 Hz 489 (O3b). Gaussian copies of the same spectrum reach only 8 to
  17. A synthetic test shows that aframe's 1 s whitening filter
  lets a strong steady sine through and removes Gaussian noise of the same
  spectrum ([measurement]({{ d | relative_url }}#oct19-line-whitening)).
- **Because of the lines, the typical window is not unit Gaussian.** The
  median spread (standard deviation) per window is 1.13 (H1) and 1.04 (L1)
  in O3a, 1.34 and 1.20 in O3b; the copies are at 1.04 to 1.05. In O3b, 25%
  of H1 windows and 36% of L1 windows have a kurtosis below anything their
  copies reach: lighter tails, as a sine wave has.
- **Loud windows are far more common than Gaussian noise allows.** Real
  windows hold a value beyond 8 at 6.5 to 11.9 windows per hour, beyond 50
  at 3.2 to 4.7 per hour. The copies have none beyond 8 in 69.5 hours, and unit
  Gaussian noise would have one in $1.1 \times 10^8$ hours.
- **Loud windows raise all frequencies together.** Across windows, the log
  power in bands far apart has a correlation coefficient of 0.56 to 0.67.
  Without the loud windows it is 0.03 to 0.09, and in the copies 0.00.
- **A small classifier separates real windows from their copies 99.66% ±
  0.03% of the time** on 40,000 O3b test windows. Two sets of copies give
  50.27% ± 0.25%, so the setup does not leak which side a window came from.

## Raw noise is colored

{% include figure.html src="/assets/img/bns/2026-10-19/raw_asd.png" alt="Amplitude spectral density of raw H1 and L1 strain in O3a and O3b, falling steeply from 10 to about 60 Hz, flat near 5e-24 from 100 to 800 Hz, with narrow lines near 300, 500 and 1000 Hz." caption="Raw strain: the median over files of each file's amplitude spectral density (2 s FFTs, median average). The dashed line is the 20 Hz highpass. Narrow lines stand out near 300, 500 and 1000 Hz." %}

| | ASD at 20 Hz | Lowest ASD, 20 to 1000 Hz | Ratio |
|---|---|---|---|
| H1 O3a | 1.10 × 10⁻²¹ | 4.91 × 10⁻²⁴ at 166 Hz | 225 |
| L1 O3a | 1.10 × 10⁻²² | 4.41 × 10⁻²⁴ at 172 Hz | 25 |
| H1 O3b | 9.11 × 10⁻²² | 5.21 × 10⁻²⁴ at 199 Hz | 175 |
| L1 O3b | 7.86 × 10⁻²³ | 4.70 × 10⁻²⁴ at 205.5 Hz | 17 |

The lines sit where the LIGO detector paper places the suspension violin
modes, "∼300 Hz and harmonics for beam splitter, ∼500 Hz and harmonics for
test masses" (Buikema et al., Phys. Rev. D 102, 062003 (2020),
[arXiv:2008.01301](https://arxiv.org/abs/2008.01301)). I have matched them
by frequency only.

## After whitening: flat, except for lines and loud windows

{% include figure.html src="/assets/img/bns/2026-10-19/whitened_power.png" alt="Whitened power against frequency in four panels. The median over windows sits near 1 with spikes at about 300, 500 and 1000 Hz; the mean over windows rises to 10 to 100 below 200 Hz; the Gaussian copy sits near 1 throughout." caption="Whitened power per frequency, in units where white noise of unit variance is 1 (4 s windows, Hann window). Teal: the median over windows, divided by ln 2 so that Gaussian noise would sit at 1 (<a href='/projects/bns/derivations/#oct19-gaussian-references'>why</a>). Navy: the mean over windows. Gray: the mean over the Gaussian copies." %}

Two curves describe the real windows, and they disagree:

- **The median window is flat.** Between 20 and 1000 Hz its middle
  frequency sits at 1.045 to 1.05 times white, and 90% of frequencies lie
  between 0.93 and 1.11. The highest lines in the median window are 184 times
  white (H1 O3a, 513.5 Hz), 74 (L1 O3a, 511.75 Hz), 2,081 (H1 O3b, 513.5 Hz)
  and 847 (L1 O3b, 509.5 Hz). The copies' highest point is 8 to 17.
- **The mean is not.** Below 200 Hz it reaches 10 to 100 times white in
  H1. Few windows carry this: they are the loud windows of the sections below.

The copies' level, 1.08 rather than 1, comes from whitening by a spectrum
estimated from 20 s: the estimate scatters by 33% per frequency, and
dividing by a scattered estimate raises the average. Pure white noise
through the same whitening comes out at 1.07
([derivation]({{ d | relative_url }}#oct19-copy-level)).

## Lines survive whitening, and set the typical spread

Why do lines survive in real data and not in the copies? In one O3b H1
file the raw line power near 513.5 Hz is the same in the real data and in
the copies ($2.3$ and $3.0 \times 10^{-42}$). After whitening the real line is
1,733 times white and the copy's 10. I reproduced this with a pure sine in
white noise:

| Sine variance (× noise) | 1 s filter (aframe): sine | 1 s filter: Gaussian copy | 4 s filter: sine | 4 s filter: Gaussian copy |
|---|---|---|---|---|
| 0.5 | 1.035 | 1.032 | 1.030 | 1.025 |
| 5 | 1.096 | 1.034 | 1.026 | 1.026 |
| 50 | 1.224 | 1.038 | 1.030 | 1.024 |
| 500 | 1.245 | 1.037 | 1.028 | 1.023 |

The table gives the spread of the whitened windows. With aframe's 1 s
whitening filter a strong sine survives and its Gaussian copy does not; a
4 s filter removes both
([measurement]({{ d | relative_url }}#oct19-line-whitening)). The real line
is narrower than the 0.5 Hz resolution of the 2 s spectrum; its copy spreads
the same power over that width. I have not yet derived why that matters
this much.

{% include figure.html src="/assets/img/bns/2026-10-19/window_spread.png" alt="Histograms of the spread of each window. The Gaussian copies form a narrow peak near 1.04. Real windows peak at 1.13 for H1 O3a, 1.04 for L1 O3a, 1.34 for H1 O3b, and spread from 1.03 to 1.7 for L1 O3b." caption="Spread of each window. Navy: real; gray: Gaussian copies." %}

| Median spread (5% to 95%) | Real | Gaussian copy |
|---|---|---|
| H1 O3a | 1.128 (1.090 to 1.177) | 1.049 (1.031 to 1.067) |
| L1 O3a | 1.041 (1.004 to 1.097) | 1.037 (1.020 to 1.054) |
| H1 O3b | 1.339 (1.282 to 1.412) | 1.053 (1.034 to 1.074) |
| L1 O3b | 1.200 (1.036 to 1.652) | 1.043 (1.023 to 1.065) |

The lines also change over hours. L1's spread in O3b rises from a median of
1.05 in the first 500 windows to 1.50 in the last 500, 37.5 hours later.
Each copy is drawn from its own stretch's spectrum, which holds the line at
its strength at that moment, but whitening removes the copy's version of the
line, so the copies stay near 1.04:

{% include figure.html src="/assets/img/bns/2026-10-19/spread_over_time.png" alt="Spread of each window against time. Real H1 sits near 1.13 in O3a and 1.34 in O3b; real L1 O3b rises from about 1.05 to 1.6 over 37 hours. The copies stay near 1.04. Scattered points reach 10 to 30." caption="Spread of each window against time within each run, with the time between files left out. Navy: real; gray: Gaussian copies." %}

## Tails: the shape of one window's values

{% include figure.html src="/assets/img/bns/2026-10-19/window_kurtosis.png" alt="Histograms of each window's kurtosis. The copies form a narrow peak at 3. Real O3a windows peak at 3 with a tail to high values. Real O3b windows have a second peak near 2.6 to 2.9, below the copies." caption="Kurtosis of each window: 3 for Gaussian values, below 3 for lighter tails (a sine wave has 3/2), above 3 for heavier tails (<a href='/projects/bns/derivations/#oct19-gaussian-references'>reference values</a>)." %}

As a test of each window, I use the range its Gaussian copies cover: the
0.05% to 99.95% points of the copies' kurtosis (2.83 to 3.19 or 3.20) and
the 99.9% point of their largest value (5.48 to 5.57).

| | Kurtosis outside the copies' range | above | below | Largest value above the copies' 99.9% point |
|---|---|---|---|---|
| H1 O3a | 1.10% | 0.97% | 0.13% | 1.61% |
| L1 O3a | 3.04% | 2.98% | 0.07% | 1.91% |
| H1 O3b | 27.74% | 3.03% | 24.70% | 21.36% |
| L1 O3b | 38.04% | 1.60% | 36.44% | 14.51% |

In O3a, most real windows pass both tests, and those that fail are heavy-
tailed. In O3b a quarter to a third fail by being light-tailed, which is
what a sine adds. If all of the extra variance in H1 O3b were one steady
sine, the median kurtosis would be 2.78; it is 2.88
([derivation]({{ d | relative_url }}#oct19-line-whitening)). The lines
account for the direction, not the whole size.

## Tails: loud values

{% include figure.html src="/assets/img/bns/2026-10-19/value_tails.png" alt="Share of whitened samples above a value. The copies follow the unit Gaussian curve and vanish beyond 6. Real samples follow it to about 4, then flatten into a tail that reaches values of 1000 and beyond at shares of 1e-7." caption="Share of all whitened samples whose size exceeds a value. Solid: real; dashed: Gaussian copies; dotted red: unit Gaussian." %}

{% include figure.html src="/assets/img/bns/2026-10-19/loud_window_rate.png" alt="Windows per hour whose largest value exceeds a threshold. Real windows level off at about 5 to 10 per hour from 8 to 100 and fall to about 1 per hour at 1000; the copies fall to zero by 6 to 7." caption="Windows per hour whose largest value exceeds a threshold. Solid: real; dashed: Gaussian copies; dotted red: unit Gaussian with independent samples." %}

| Windows per hour beyond | 5 | 6 | 8 | 10 | 20 | 50 |
|---|---|---|---|---|---|---|
| H1 O3a | 72.7 | 9.3 | 7.2 | 6.8 | 5.5 | 4.1 |
| L1 O3a | 39.8 | 11.1 | 7.3 | 6.4 | 4.7 | 3.2 |
| H1 O3b | 561.8 | 74.3 | 6.5 | 5.6 | 4.5 | 3.4 |
| L1 O3b | 330.1 | 37.0 | 11.9 | 9.1 | 6.0 | 4.7 |
| Gaussian copies | 10.8 to 14.4 | 0.03 to 0.13 | 0 | 0 | 0 | 0 |
| Unit Gaussian | 4.22 | 0.015 | 9.0 × 10⁻⁹ | | | |

Below 6 the real excess mostly follows from the wider spread. From 8 up,
the rate barely falls with the threshold: these are separate events, 5 to
12 an hour, and 39 to 57% of them beyond 50. The copies' rates match the unit
Gaussian formula with their own spread to within 4%
([check]({{ d | relative_url }}#oct19-gaussian-references)).

## Within the spectrum: the Rayleigh statistic and band correlations

{% include figure.html src="/assets/img/bns/2026-10-19/rayleigh.png" alt="Rayleigh statistic against frequency. The copies sit at 1.06 everywhere. Real data sit at 10 to 70, highest at low frequency, with sharp dips below 1 at the lines near 300, 500 and 1000 Hz." caption="Rayleigh statistic per frequency over all windows: 1 for Gaussian noise, below 1 for a steady line, above 1 when the level changes from window to window (<a href='/projects/bns/derivations/#oct19-gaussian-references'>reference values</a>)." %}

The real data's median Rayleigh statistic over 20 to 1000 Hz is 35 (H1 O3a),
9 (L1 O3a), 12 (H1 O3b) and 17 (L1 O3b); the copies' is 1.06. The loud
windows drive it: on every eighth window, the same statistic is 1.03 to 1.04
once the windows outside the copies' ranges (tails section above) are left out. At the lines it falls to 0.14 to 0.58: the line is
steadier than noise. A steady line with $R$ times the noise power in its bin
gives $\sqrt{1+2R}/(1+R)$, so 0.14 means a line 100 times the noise in its bin
($R = 100$ gives 0.140), where it is steadiest.

{% include figure.html src="/assets/img/bns/2026-10-19/band_correlation.png" alt="Three correlation matrices for H1 and L1 in O3a. Real data with the ordinary correlation: 0.56 to 0.67 between most band pairs. Real data with rank correlation: near zero except neighbours. Gaussian copies: zero off the diagonal." caption="Correlation across windows of the log power in 16 bands from 20 to 1024 Hz, in O3a. Left: correlation coefficient; middle: rank correlation; right: Gaussian copies." %}

| Median correlation, bands two or more apart | H1 O3a | L1 O3a | H1 O3b | L1 O3b |
|---|---|---|---|---|
| Real, correlation coefficient | 0.67 | 0.56 | 0.61 | 0.65 |
| Real, rank correlation | 0.03 | 0.08 | 0.03 | 0.04 |
| Real, without loud windows | 0.03 | 0.09 | 0.03 | 0.03 |
| Gaussian copies | 0.00 | 0.00 | 0.00 | 0.00 |

"Without loud windows" keeps the windows inside both of the copies' ranges
above: 98.4%, 96.9%, 80.0% and 89.2% of windows. So the bands rise together
in the loud windows, which are broadband, and are nearly independent
elsewhere. I measured only band powers. Whether phases at different
frequencies are tied together, as non-linear coupling would do, I have not
measured.

## What the windows look like

{% include figure.html src="/assets/img/bns/2026-10-19/example_windows.png" alt="Four rows of windows. A typical H1 window looks like its Gaussian copy. A window with strong power below 42 Hz holds bursts reaching 1800 over about one second, broadband in the spectrogram. A short loud burst reaches 130 near the end of its window. An L1 O3b window shows a steady horizontal line near 510 Hz absent from its copy." caption="Four real windows and their Gaussian copies. Left: the whitened real window. Middle and right: spectrograms (0.125 s FFTs, power relative to white, −10 to +20 dB) of the real window and of its copy." %}

The windows are a typical one, the window with the most power below 42 Hz
in H1 O3a (largest value 1,803), a short loud burst (kurtosis 1,422), and the
L1 O3b window with the lowest kurtosis (2.26), whose line near 510 Hz runs
through the whole window.

## A classifier as a test

The question a generator has to answer is whether a classifier can tell its
output from real noise: a classifier two-sample test. As a first run, I
trained a small classifier on real windows against their Gaussian copies.
It reads 70 numbers from each window, 35 per detector (the share of samples
in 14 size ranges, the log power in 16 bands, and mean, spread, skewness,
kurtosis and largest value), through a network of 8,900 weights. It trained
on the O3a validation files of aframe's split (GPS 1238384700 to 1238426682)
and was tested on 20,000 O3b windows of each kind.

| Test | Accuracy |
|---|---|
| Real windows against Gaussian copies | 99.66% ± 0.03% |
| Gaussian copies against Gaussian copies | 50.27% ± 0.25% |

The ± is the standard error for 40,000 independent windows
([binomial error]({{ d | relative_url }}#late-binomial)). Even this small
classifier, which sees only the 70 numbers, sets real windows apart from
copies of their own spectrum. I have not yet checked which numbers it uses.

## What this means for the generator

A generator that only reproduces the spectrum would fail at once. It has to
produce:

- lines that whitening leaves at up to 2,081 times white, steady within a
  window and changing over hours;
- 6.5 to 11.9 loud, broadband windows per hour beyond 8, with values up to
  the thousands;
- the other differences these measurements do not resolve.

The generator trains on O3a, where the lines are weaker, while the
classifiers test on O3b, where H1's 513.5 Hz line is 11 times stronger in
the typical window (2,081 against 184 times white). A generator that matches
O3a will differ from O3b in its lines alone. The first generator run is
training now.

Not yet done: phase coupling between frequencies, the relation between H1
and L1, the other four classifiers (time-domain, time-frequency, S4D, and a
template bank), and why a 1 s filter passes a narrow line.
