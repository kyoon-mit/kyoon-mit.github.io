---
title: "An S4D noise model beats a Gaussian on likelihood but finds 0.2% of signals (matched filter: 91.9%)"
date: 2026-10-23
tags: [noise, detection, s4d, matched-filter]
math: true
summary: >-
  A causal S4D that predicts each whitened sample from the earlier ones gives
  held-out O3a noise a higher likelihood than any Gaussian with the training
  spectrum: by 0.036 to 0.060 nats per sample in clean windows, and by 10.4
  to 17.5 nats per sample in loud ones. On O3b it falls behind in L1, where a new
  509.50 Hz line appears. As a detector with the true template its likelihood
  ratio finds 0.2% of signals at a false-alarm probability of 10⁻³ in clean
  windows, against 91.9% for the matched filter, but it raises no false alarm
  in loud windows. The SLIC sampler finished four windows, with the truth
  inside 43 of 44 intervals.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

The [20 October update]({{ u | append: '2026-10-20-slic-noise-score-on-bns/' | relative_url }})
ended with a plan: stop the SLIC sampler after four windows, train a
next-sample model of the noise, and test it twice, first as a model of noise
and then as a detector. This page reports all three. All runs used one GPU
capped at 250 W. The code is in our aframe fork
([next_sample](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/projects/train/train/experimental/next_sample),
[checks](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks)),
and every number below is printed by
[summarize.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/summarize.py)
([output](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/summary.txt))
unless another script is named.

## The SLIC sampler on four windows

The sampler ran on O3b test windows 0 to 3 with the paper's settings
(32 walkers, 10,000 burn-in and 20,000 kept steps) and the epoch-147 noise
network. It took 62,430 s, 4.34 h per window. The acceptance rate was 0.462
to 0.529, no walker started stuck, and no update failed. Of the 44 true
parameter values (11 per window), 43 lie inside the central 90% interval of
the kept samples; the one outside is the second spin magnitude of window 3.

| Window | SNR | True chirp mass | 90% interval | Width |
|---|---|---|---|---|
| 0 | 22.86 | 1.3663 | 1.3644 to 1.3665 | 0.0021 |
| 1 | 8.82 | 1.3280 | 1.3271 to 1.3324 | 0.0053 |
| 2 | 4.43 | 1.7824 | 1.7757 to 1.7883 | 0.0127 |
| 3 | 4.67 | 1.0680 | 1.0664 to 1.0719 | 0.0055 |

Chirp masses are in solar masses. The walkers start
at the true values, spread by 0.001 of the start matrix's scale
([mala.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/projects/train/train/experimental/slic/mala.py)),
so this shows that the sampler stays near the truth and gives intervals of
sensible width at SNR 4.4 to 22.9. It does not show that it would find the
truth from a broad start, and four windows say nothing about whether the
intervals hold the truth 90% of the time. I stopped the sampler here, as
planned.

## The next-sample model

A causal S4D reads a whitened 4 s window of one detector and, for each
sample, gives a probability distribution for its value from the earlier
samples only. Multiplying these 8,192 conditional probabilities gives the
exact probability of the window (the chain rule; van den Oord et al. 2016,
[arXiv:1609.03499](https://arxiv.org/abs/1609.03499)).

- **Input.** The earlier samples, shifted by one so that the output for a
  sample never sees it, and squashed by asinh, which is nearly the identity
  below 1 and grows like a logarithm beyond. A first run without the squash
  stopped within ten steps: a glitch drove a predicted spread far enough
  that its exponential overflowed. The probabilities are always of the
  samples themselves, not of their asinh.
- **Output.** A Gaussian scale mixture with three components: one shared
  mean, three spreads and three weights for each sample, so that wide
  components can take the glitches. A free mean per component let one
  component chase a single glitch in a first fit to training samples.
- **Network.** Four S4D layers of width 64 and state size 32, each after a
  layer norm, with a residual sum; 51,271 numbers in all.
- **Training.** The usual dataloader configuration on the O3a background,
  no signal added, H1 and L1 as separate examples, with aframe's random sign
  flip and time reversal (each with probability 0.5): 21 files (100,011 s)
  for training and 2 others (41,841 s) for validation. AdamW at $10^{-4}$
  with weight decay 0.01 ($10^{-3}$ and none for the S4D kernel parameters),
  warm-up and cosine restarts by epoch, and early stopping after 80 epochs
  without a better validation loss. The loss is minus the mean
  log-likelihood per sample, in nats
  ([configuration](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/local/train/claude_tests/next_sample/k3_shared_mean_asinh.yaml)).

Training stopped after epoch 368, 10.69 h; I kept epoch 288. Losses from the
run's Weights and Biases record, in nats per sample:

| Epoch | 0 | 9 | 49 | 99 | 199 | 288 | 368 |
|---|---|---|---|---|---|---|---|
| Training loss | 2.3079 | 1.4112 | 1.3702 | 1.3605 | 1.3444 | 1.3328 | 1.3366 |
| Validation loss | 2.1283 | 1.4078 | 1.3690 | 1.3593 | 1.3437 | 1.3336 | 1.3371 |
| Unit Gaussian, same windows | 5.6408 | 3.3474 | 2.4156 | 2.2088 | 1.8646 | 1.7848 | 2.0393 |

The validation windows are drawn anew each epoch, as the last row shows: it
depends only on the windows, and it moves with the number of loud windows
in the draw. Unit white Gaussian noise would give $\tfrac12\ln 2\pi +
\tfrac12 = 1.4189$ ([derivation]({{ d | relative_url }}#oct23-gaussian-chain-rule)).

## Test 1: how probable is held-out noise?

The windows are every back-to-back 4 s window of the two O3a validation
files and of all ten O3b files, whitened as in the
[19 October update]({{ u | append: '2026-10-19-how-gaussian-is-our-noise/' | relative_url }}),
in their true time order. A window is loud if its largest value exceeds 8,
the level that Gaussian copies never reached on 19 October; the rest are
clean. Each detector is counted on its own.

The references are Gaussians with the spectrum of the 24,885 training
windows per detector, either the mean spectrum or the typical one (median
divided by $\ln 2$, which loud windows do not move). For each I computed the
best linear predictor of every order with the Levinson-Durbin recursion.
Order 8,191, every earlier sample of the window, is the exact Gaussian with
that covariance ([derivation]({{ d | relative_url }}#oct23-gaussian-chain-rule)).
[test1_likelihood.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/test1_likelihood.py)
computed all the likelihoods.

Mean minus log-likelihood per sample in clean windows (lower is better).
Gaussians use their own detector's spectrum and order 8,191:

| | O3a H1 | O3a L1 | O3b H1 | O3b L1 |
|---|---|---|---|---|
| Clean windows | 10,372 | 10,389 | 26,985 | 26,824 |
| Network | 1.3185 | 1.3469 | 1.3771 | 1.8433 |
| Gaussian, typical spectrum | 1.3785 | 1.3825 | 1.3835 | 1.7114 |
| Gaussian, mean spectrum | 1.7311 | 1.5781 | 1.7344 | 1.9536 |
| Network minus typical | −0.0601 | −0.0355 | −0.0064 | +0.1318 |
| Windows where the network beats typical | 100.0% | 99.9% | 88.9% | 32.1% |

In loud windows the Gaussians fail badly and the network does not:

| | O3a H1 | O3a L1 | O3b H1 | O3b L1 |
|---|---|---|---|---|
| Loud windows | 77 | 60 | 197 | 358 |
| Network | 1.5725 | 1.4808 | 1.6081 | 1.8507 |
| Gaussian, typical spectrum | 303.79 | 97.56 | 292.57 | 71.23 |
| Gaussian, mean spectrum | 19.09 | 11.88 | 19.07 | 15.51 |

The network beats the better Gaussian in loud windows by 10.40 to 17.52
nats per sample.

**Where the lead comes from.** Network minus the typical Gaussian, by
position in the clean window:

| Samples | 0 | 1 to 15 | 16 to 127 | 128 to 1,023 | 1,024 to 4,095 | 4,096 to 8,191 |
|---|---|---|---|---|---|---|
| O3a H1 | +0.0037 | +0.0097 | +0.0063 | −0.0234 | −0.0617 | −0.0690 |
| O3a L1 | +0.0019 | +0.0032 | +0.0053 | −0.0150 | −0.0375 | −0.0398 |
| O3b H1 | +0.0316 | +0.0684 | +0.0381 | +0.0123 | −0.0103 | −0.0092 |
| O3b L1 | −0.0153 | −0.0335 | −0.0136 | +0.0225 | +0.1776 | +0.1260 |

On O3a, with few earlier samples the network is slightly worse; its lead
builds after the first 128 samples (62.5 ms) and reaches 0.040 to 0.069
per sample after 2 s. The Gaussian at order 8,191 also uses every earlier
sample, but with weights fixed by one spectrum. The network uses them in a
way that fixed weights cannot, probably to gauge the current window's level
and lines.

**The order needed.** For the typical Gaussian in clean O3a windows, the
mean value falls from 1.5480 (H1) and 1.4607 (L1) at order 0 to 1.4121 and
1.3993 at order 256, 1.3797 and 1.3835 at 2,048, and 1.3785 and 1.3825 at
8,191. In O3b L1 it is best at order 256 (1.5199) and worse with longer
orders (1.7114 at 8,191), probably because the long predictors are tuned
to the O3a lines.

**What goes wrong in O3b L1.** In the typical clean window of each file
([test1_lines.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/test1_lines.py),
first 600 windows of each file,
[output](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/lines.txt)),
L1 has a line at 509.50 Hz of 2,435 to 8,392 times white in the last
five O3b files, and 235 or less in the first five. It is not among the
three strongest lines of the typical window of any O3a file, in either
detector. Across those
last five files the network trails the typical Gaussian in L1 by 0.13 to
0.66 per sample, against −0.009 to +0.024 in the first five. Strength alone
is not the problem: H1's 513.50 Hz line is 2,717 to 3,844 times white in
O3b against at most 358 in O3a, and in H1 the network stays within −0.021
to +0.008 of the Gaussian in every O3b file.

So on noise like its training noise, the network is a better model than any
Gaussian with that spectrum, both in typical windows and in loud ones. It
does not carry over to a line at a new frequency.

## Test 2: detection with the true template

The windows are 20,000 draws of the test loader of our usual configuration
(O3b background, BNS signals from its waveform file, SNR from its power
law with index −3 between 4 and 100: median 5.65, quartiles 4.62 and 7.93),
with the random sign flip and time reversal switched off. Each draw gives the
whitened signal $h$ and the whitened noise $n$; 419 draws are loud in at
least one detector. For each draw, with $h$ known exactly, three statistics
are computed on $d = n$ (no signal) and on $d = n + h$ (signal):

- **matched filter:** $\sum d\,h / |h|$ over both detectors and all
  samples, the matched-filter SNR with the true template;
- **network:** $\log p(d - h) - \log p(d)$ under the network, summed over
  detectors: the likelihood ratio if the network were the true noise
  distribution;
- **Gaussian:** the same likelihood ratio under the typical-spectrum
  Gaussian of Test 1, for each detector.

For a false-alarm probability $\alpha$, the threshold is the value that the
statistic exceeds in a fraction $\alpha$ of the noise draws; one threshold
serves every draw, as in a search
([test2_detection.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks/test2_detection.py)).

Fraction of signals found:

| False-alarm probability | Windows | Matched filter | Network | Gaussian |
|---|---|---|---|---|
| 0.1 | all | 0.9959 | 0.1835 | 0.9971 |
| 0.01 | all | 0.9725 | 0.0178 | 0.9828 |
| 0.001 | all | 0.0326 | 0.0021 | 0.0832 |
| 0.1 | clean | 0.9986 | 0.1808 | 0.9999 |
| 0.01 | clean | 0.9807 | 0.0176 | 0.9899 |
| 0.001 | clean | 0.9193 | 0.0020 | 0.9465 |

At $10^{-3}$ in clean windows, by SNR:

| SNR | Windows | Matched filter | Network | Gaussian |
|---|---|---|---|---|
| 4 to 5 | 7,035 | 0.7994 | 0.0000 | 0.8778 |
| 5 to 6 | 3,807 | 0.9580 | 0.0000 | 0.9580 |
| 6 to 8 | 3,925 | 0.9975 | 0.0000 | 0.9931 |
| 8 to 100 | 4,814 | 1.0000 | 0.0083 | 0.9998 |

- **The network's ratio is a poor detector in clean windows.** At every
  false-alarm probability it finds far fewer signals than the matched
  filter.
- **In loud windows it raises no false alarm.** Of the 419 loud noise draws,
  57 exceed the matched filter's clean-window threshold at $10^{-3}$, 55 the
  Gaussian's, and none the network's. Over all windows, the 20 false alarms
  at $10^{-3}$ of the matched filter and of the Gaussian all come from loud
  windows. Their thresholds therefore jump to 20.54 and 79.54, and they find
  3.3% and 8.3% of signals; the network's 20 are all from clean windows.
- **The Gaussian beats the matched filter at SNR 4 to 5**, 87.78% against
  79.94% at $10^{-3}$ in clean windows. Whitening leaves the lines and the
  nearly empty band below 20 Hz that the
  [19 October update]({{ u | append: '2026-10-19-how-gaussian-is-our-noise/' | relative_url }})
  measured. A template weighted by the measured covariance can use them,
  which is probably the difference; the plain matched filter treats whitened
  noise as white.

## Why the network's ratio fails

For a Gaussian model with covariance $R$, the ratio on pure noise averages
$-q/2$ with spread $\sqrt q$, and with a signal it averages $+q/2$, where
$q = h^{\top} R^{-1} h$. The signal therefore sits $\sqrt q$ spreads above
the noise ([derivation]({{ d | relative_url }}#oct23-known-template)). Measured
on clean windows:

| SNR | Windows | Matched filter: noise, signal, separation | Network | Gaussian |
|---|---|---|---|---|
| 4 to 4.5 | 4,141 | −0.03 ± 1.04, 3.99, 3.88 | −2.45 ± 20.07, 2.53, 0.25 | −7.82 ± 4.00, 7.57, 3.85 |
| 4.5 to 5 | 2,894 | −0.02 ± 1.03, 4.48, 4.37 | −3.66 ± 22.58, 2.76, 0.28 | −9.73 ± 4.46, 9.55, 4.32 |
| 5 to 6 | 3,807 | 0.02 ± 1.07, 5.19, 4.83 | −4.75 ± 25.77, 4.21, 0.35 | −12.66 ± 5.44, 12.85, 4.69 |
| 6 to 8 | 3,925 | −0.02 ± 1.06, 6.50, 6.12 | −6.78 ± 35.82, 6.69, 0.38 | −20.47 ± 7.43, 20.23, 5.48 |
| 8 to 12 | 2,711 | −0.01 ± 1.03, 9.10, 8.87 | −14.34 ± 54.30, 13.25, 0.51 | −40.11 ± 12.95, 39.95, 6.18 |

Each cell gives the mean and spread on noise, the mean with the signal, and
their separation: the difference of the means divided by the noise spread.
The Gaussian's numbers are close to its formula: at SNR 4 to 4.5 its noise
mean −7.82 gives $q = 15.6$ and $\sqrt q = 3.96$, against a measured spread
of 4.00 (the windows of one SNR range have different $q$).

The network's ratio fails in two ways:

- **On pure noise it scatters 4.2 to 5.1 times more** than the Gaussian's:
  a spread of 20.07 against 4.00 at SNR 4 to 4.5.
- **With a signal it moves less.** For the same noise draw, adding the
  template raises the ratio by a median of 0.572 SNR² under the network and
  0.860 SNR² under the Gaussian. For the Gaussian this rise is exactly $q$.

The network's gain of 0.04 to 0.06 nats per sample is an average over the
whole window. The ratio depends only on how the model changes along the
one direction of the template, and there it is worse than the Gaussian.

## Not yet done

- Thresholds for one template at a time, each set against many noise
  windows, instead of one threshold for all draws.
- Training on data that includes O3b, or on windows with varied lines.
- Using the network only to flag loud windows, with the matched filter or
  the Gaussian elsewhere.
- The same tests for the SLIC noise network.

## Correction to the 20 October update

That page gave the O3a training files as 0.673 days. The 21 files hold
100,011 s, 1.158 days. The 0.673 came from aframe's log line, which
subtracts the validation time twice:
$141{,}852 - 2 \times 41{,}841 = 58{,}170$ s $= 0.673$ days. The page now
gives the right length.
