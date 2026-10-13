---
title: "Without templates: one layer of learned long kernels learns the chirps"
date: 2026-10-13
math: true
summary: >-
  The project's goal is a network that does not need a template bank. One
  convolution layer of 256 learned 4 s kernels, started from random noise,
  with energy, maximum over time and a softmax over chirp mass, taught itself
  chirp-shaped filters. On 50,000 test windows per population it puts 71 to
  77% of events at SNR 8 to 12 within 1% of the true chirp mass, against 17
  to 28% for the den-reg, and equals the template bank above SNR 16. What
  the S4D runs showed, what is still running, and the limits.
---

{%- assign u = '/projects/bns/updates/' -%}

The [previous update]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})
built the matched filter as a network. It needs a template bank, which is
what this project wants to avoid, but it showed what a network needs: about
250 long, chirp-shaped filters, both quadratures, and a maximum over time
instead of an average. The question here is whether a network can learn
those filters from data.

## The runs

All runs have no templates and no denoiser and share everything except the
first layer: whitened strain, 4 s windows, training SNR from a power law with
index −3 from SNR 8, validation from SNR 4, 96% of training windows with a
signal, the den-reg's learning-rate schedule, 800 epochs. Each layer's output
goes through the same read-out: energy, maximum over time, a linear map to
235 chirp-mass bins.

<div markdown="1">

| run | first layer | learned numbers | started |
|---|---|---|---|
| S4D, d_state 64 | 256 S4D channels of 32 tones (the den-reg's size) | 93k | 12 Oct |
| S4D, d_state 512 | 256 S4D channels of 256 tones | 323k | 12 Oct |
| free kernels | 256 free 4 s kernels | 1.0M | 12 Oct, stopped 13 Oct at epoch 253 |
| S4D width | 1024 channels of 32 tones, linearly mixed into 256 | 717k | 12 Oct |
| S4D depth | the den-reg regressor alone (6 S4D layers) | 347k | 12 Oct |
| aframe ResNet | aframe's time-domain ResNet [3, 4, 6, 3] | 7.3M | 13 Oct |
| S4D, d_state 512, band initialization | as the 512 run, tones started inside the signal band | 323k | 13 Oct |

</div>

A free kernel is a convolution kernel whose 4,096 values (4 s at 1024 Hz) are
all learned, with no formula behind them. For kernel $c$ and strain $x$,

$$
y_c(t) = \sum_{\ell=0}^{4095} k_c(\ell)\, x(t-\ell),
\qquad
k_c(\ell) = \frac{1}{4096}\sum_{f} w_c(f)\, e^{2\pi i f \ell/4096},
$$

where the learned coefficients $w_c(f)$ are nonzero only at positive
frequencies from 20 to 512 Hz. That makes each kernel complex (a cosine and
a sine filter), so $|y_c(t)|^2$ does not depend on the signal's phase. In
CNN terms it is one Conv1d with 256 output channels and kernel size 4096. An
S4D layer computes the same convolution, but its kernel is generated as a sum
of damped tones, $k(\ell) = \sum_n C_n z_n^{\ell}$.

## The learned kernels are chirps

{% include figure.html
   src="/assets/img/bns/2026-10-13/free_kernels_spectrograms.png"
   alt="Spectrograms of four learned kernels, each a rising frequency track from about 50 Hz to about 150 Hz over 4 seconds"
   label="Four of the 256 learned kernels"
   caption="Spectrograms of kernels learned from random noise, read forward in time. Each sweeps up in frequency toward the end like an inspiral, and each matches a real template at 0.75 to 0.77." %}

At initialization the best match of any kernel to any real template was
0.10. After training, 125 of the 256 kernels match a template at 0.5 to 0.80,
and their chirp masses spread evenly from 0.85 to 2.74 M☉: the network tiled
the prior by itself. The other 131 carry no information. On their own they
give chance accuracy (4% within 1%), their read-out weights are three times
smaller, and their response does not change with chirp mass. Removing them
changes nothing.

## Chirp mass on the test

The standard test (O3b background, about 25,000 signal windows per
population). Epoch 141 had the best validation when I first tested; epoch 248
had the best validation when training stopped. Within 1 / 2%:

<div markdown="1">

| | SNR 8 to 10 | SNR 10 to 12 | SNR 12 to 16 | SNR 16 to 25 | all |
|---|---|---|---|---|---|
| **power law from SNR 4** | | | | | |
| free kernels, epoch 141 | 63 / 68% | 85 / 88% | 94 / 97% | 98 / 99% | 31 / 34% |
| free kernels, epoch 248 | 54 / 57% | 75 / 80% | 90 / 93% | 97 / 99% | 28 / 31% |
| template bank | 94 / 97% | 97 / 98% | 96 / 99% | 97 / 99% | 48 / 51% |
| den-reg, epoch 339 | 14 / 25% | 25 / 42% | 40 / 67% | 66 / 90% | 11 / 19% |
| den-reg, epoch 799 | 21 / 37% | 37 / 58% | 52 / 74% | 61 / 82% | 14 / 22% |
| **all events** | | | | | |
| free kernels, epoch 141 | power law from 8: 83 / 86% | uniform: 89 / 91% | | | |
| template bank | power law from 8: 96 / 98% | uniform: 93 / 95% | | | |
| den-reg, epoch 339 | power law from 8: 34 / 52% | uniform: 62 / 81% | | | |
| den-reg, epoch 799 | power law from 8: 37 / 57% | uniform: 49 / 72% | | | |

</div>

{% include figure.html
   src="/assets/img/bns/2026-10-13/compare_snr4_powerlaw.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the free kernels, the template bank and the den-reg run, power law from SNR 4"
   label="Power law from SNR 4"
   caption="Same scale in every panel." %}

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-13/compare_snr8_powerlaw.png"
   alt="The same comparison, power law from SNR 8"
   label="Power law from SNR 8"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-13/compare_snr4_uniform.png"
   alt="The same comparison, uniform SNR 4 to 50"
   label="Uniform SNR 4 to 50"
   caption="" %}
</div>

What stands:

- **Without templates, the learned kernels beat the den-reg at every SNR,**
  by 2.6 to 4.2 times within 1% at SNR 8 to 12, and equal the template bank
  above SNR 16.
- **Below SNR 12 they are still well behind the bank.** A learned chirp
  matches the true waveform at about 0.8, so it loses about 20% of the SNR,
  and 125 chirps over the prior are coarser than the bank's 0.5% grid.
- **Below SNR 8 the network returns a fixed 1.67 M☉,** the middle of the
  prior. It never saw such events: training started at SNR 8. Three quarters
  of the power-law-from-4 population is below SNR 8, which is why that
  population's overall numbers are low.
- **Validation picked the worse checkpoint.** Epoch 248 had the better
  validation score (overall within 1%, O3a), but on the O3b test it is 3
  points worse overall and 9 to 10 points worse at SNR 8 to 10 than epoch
  141. I do not know yet whether this is validation noise (about 2,000
  windows per epoch) or the kernels adapting to O3a's noise; either way the
  checkpoint choice needs a larger validation set.

## The S4D arms, and why they are not yet a fair comparison

{% include figure.html
   src="/assets/img/bns/2026-10-13/arm_curves.png"
   alt="Validation within 1 and 2 percent against epoch for all runs and the den-reg"
   label="Validation during training"
   caption="Power law from SNR 4, 9-epoch running means. The width, depth and ResNet runs are still training." %}

At the den-reg's state size (32 tones per channel), one S4D layer tracks the
den-reg for the first 140 epochs and then falls behind it (6.9% against
11.2% within 1% at epochs 200 to 250); none of its 256 kernels matches a
chirp above 0.5. With 256 tones per channel it reaches 18.6%, 1.7 times the
den-reg at the same epochs, and stays well below the free kernels (39%).

That gap is partly how S4D was started, not what it can do. I used the
den-reg's timestep range, which puts most of S4D's tones outside the signal
band or makes them forget within a second. A 4 s chirp needs tones inside
20 to 512 Hz that remember for seconds. After 200 epochs only 7% of the
256-tone run's tones are both, and only 20 of its 256 kernels match a chirp
above 0.5. Fitting stable tones directly to real templates gives a match of 0.87 to
0.90 with 256 tones (chirp masses 1.2 to 2.0), above the free kernels' 0.8. The last run in the table
starts every tone inside the band with 4 s memory; until it has trained, the
comparison between S4D and free kernels is open.

## Detection

These networks were trained only to estimate chirp mass. Used as a detection
statistic, the spread of their chirp-mass posterior does no better than the
den-reg's: at SNR 8 to 12, with one noise window in 10,000 passing, 20 to 24%
of signals are found, against 19 to 26% for the den-reg and 73 to 80% for the
template bank with a χ² glitch test. Detection needs its own score and a
glitch test applied to the learned kernels.

## Next

- Train the free kernels from SNR 4, not only SNR 8.
- Use the 131 unused kernels: more kernels, or re-initialize the dead ones,
  so more chirps cover each part of the prior.
- Regularize the kernels to remove their leftover noise (Fu et al. 2023).
- A detection score with the χ² test on the learned kernels, then the
  sensitive volume.
- Read the S4D run with the band initialization against the free kernels at
  matched epochs.
