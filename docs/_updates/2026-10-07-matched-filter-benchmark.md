---
title: A matched filter on the same windows the network sees
date: 2026-10-07
tags: [matched-filter, regression, detection]
math: true
summary: >-
  On identical 4 s test windows, a plain template bank puts 96 to 99% of
  events at SNR 8 to 12 within 2% in chirp mass, against 16 to 29% for the
  network, and separates those events from pure noise with an AUC of 0.98
  against 0.76. The information is in the window. The network does not
  extract it.
---

{%- assign u = '/projects/bns/updates/' -%}

{% include notice-snr-powerlaw.html %}

## The test

The test windows were dumped from the network's own test pipeline: whitened
4 s of H1 and L1 at 2048 Hz, O3b background, half the windows with an
injection. Three SNR populations: SNR drawn with probability density
proportional to SNR⁻³ from 4 to 50 and from 8 to 50 (power law, index −3),
and uniform from 4 to 50. The power law falls more slowly than the SNR⁻⁴ of
sources spread uniformly in volume (Schutz 2011,
[arXiv:1102.5421](https://arxiv.org/abs/1102.5421)); from SNR 4, 75.5% of
its events are below SNR 8
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).
The 630-epoch network and a matched filter then ran on exactly the same
windows.

- **Bank:** 613 waveforms drawn from the injection waveform set itself,
  chirp mass log-spaced at 0.5% from 0.85 to 2.74 M☉, mass ratios 0.5, 0.7
  and 0.9, lowest spin available.
- **Filter:** each template whitened with each window's own spectrum,
  complex SNR per detector (maximized over phase and arrival time), network
  SNR as the quadrature sum, with the L1 peak taken within ±20 samples
  (9.8 ms) of the H1 peak. The light travel time between the two sites is
  10 ms (Abbott et al. 2016, PRL 116, 061102,
  [arXiv:1602.03837](https://arxiv.org/abs/1602.03837)).
- **Estimate:** the chirp mass of the best template. **Score:** its network
  SNR.

No signal-consistency test, no glitch veto, and the merger is searched only
where the network could also find it. This is a benchmark, not a search
pipeline.

## Chirp mass

{% include figure.html
   src="/assets/img/bns/2026-10-07/mf_vs_ml_accuracy.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent in chirp mass against injected SNR, matched filter against the network, same scale in every panel"
   label="Chirp mass accuracy against SNR"
   caption="All three test sets pooled, 19,251 events. Same y scale in every panel." %}

<div markdown="1">

Power-law sets pooled, 12,834 events:

| SNR | events | matched filter, within 1 / 2 / 5 / 10% | network, within 1 / 2 / 5 / 10% |
|---|---|---|---|
| 4 to 6 | 3,617 | 19 / 22 / 27 / 35% | 3 / 5 / 14 / 24% |
| 6 to 8 | 1,250 | 64 / 68 / 71 / 75% | 4 / 8 / 19 / 34% |
| 8 to 10 | 2,899 | 93 / 96 / 97 / 97% | 8 / 16 / 33 / 52% |
| 10 to 12 | 1,658 | 95 / 99 / 99 / 99% | 15 / 29 / 55 / 72% |
| 12 to 16 | 1,616 | 95 / 99 / 100 / 100% | 34 / 55 / 80 / 90% |
| 16 to 25 | 1,168 | 95 / 99 / 99 / 99% | 54 / 84 / 97 / 99% |
| 25 to 50 | 626 | 95 / 100 / 100 / 100% | 53 / 93 / 100 / 100% |

</div>

On the uniform set, overall 95% within 2% for the matched filter against 74%
for the network; at SNR 8 to 12, 98 to 99% against 18 to 24%.

The matched filter's 1% column stops at 95% because its templates carry
almost no spin, not because of the bank's spacing: every event is within
0.35% of a template's chirp mass. Above SNR 16, events with
$|\chi_\text{eff}| < 0.1$ are 99.3% within 1%; those with larger effective
spin are 83 to 89% within 1%, their estimates shifted by 0.66%
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-bank-spin)).
The network levels off at 50 to 58% within 1% from SNR 16 up, even above
SNR 25, so it has a precision ceiling the data does not impose.

{% include figure.html
   src="/assets/img/bns/2026-10-07/mf_snr.png"
   alt="Left: matched-filter network SNR against injected SNR, median and one-sigma band, equal log axes with the 45 degree line. Right: distribution of the matched-filter score on empty data and on data with a weak signal"
   label="Recovered SNR, and the score on empty data against weak signals"
   caption="Left: all three test sets, median and 16 to 84% band of the recovered network SNR against the injected SNR, equal axes, dotted line at 45°. Above SNR 10 the median recovered SNR is 0.90 of the injected value (16 to 84%: 0.83 to 0.97). Two shortfalls, both measured: the whitened clean signal in the window holds 0.95 of the injected SNR (median), and the best template recovers 0.94 to 0.96 of that. Below an injected SNR of 6 the median sits at 6.3 to 6.5, the value empty windows reach. Right: the best network SNR over the bank on windows with no signal and on windows with a signal at SNR 8 to 12 (power law from 4), each normalized." %}

## Detection

{% include figure.html
   src="/assets/img/bns/2026-10-07/mf_vs_ml_roc.png"
   alt="ROC curves for the matched filter's network SNR and the network's negative uncertainty, on three test sets"
   label="Signal against noise"
   caption="ROC curves, matched-filter score against the network's −σ." %}

<div markdown="1">

| test set | matched filter AUC | network AUC (−σ) |
|---|---|---|
| power law from SNR 4 | 0.74 | 0.63 |
| power law from SNR 8 | 0.99 | 0.86 |
| uniform SNR 4 to 50 | 0.97 | 0.94 |
| SNR 8 to 12 only (power law from 4) | 0.98 | 0.76 |
| SNR 8 to 12 only (uniform) | 0.98 | 0.80 |

</div>

On empty data the best template reaches a network SNR of 6.27 (median over
6,383 windows; 99th percentile 7.73), simply from trying 613 templates at
every time shift; the same code on Gaussian noise gives 5.97
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-noise-floor)).
85% of signals at SNR 8 to 12 score above 7.5, against 1.2% of empty
windows. 24 of the 6,383 empty windows score 30 to 340: loud glitches in the
background that the bank matches, which is why real searches add
signal-consistency tests such as the χ² test (Allen 2005,
[arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045)).

## What this settles

The [Cramér–Rao estimate]({{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }})
said the 4 s window holds enough information for sub-percent chirp mass near
threshold, with the caveat that the bound may be optimistic there
(Vallisneri 2008, [arXiv:gr-qc/0703086](https://arxiv.org/abs/gr-qc/0703086)).
The caveat turns out to be mild: a plain template bank puts 96 to 100% of
events within 2% from SNR 8, and 68% at SNR 6 to 8. The limit is the network, the same
conclusion as for
[Project 8]({{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}).
