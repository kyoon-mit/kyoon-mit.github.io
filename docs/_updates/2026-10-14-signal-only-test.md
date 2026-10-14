---
title: "Without noise: free kernels learn chirp mass, plain S4D does not"
date: 2026-10-14
summary: >-
  Three networks regress chirp mass from the clean whitened signal, with no
  detector noise at all. One layer of learned 4 s kernels reaches 99.7% of
  validation events within 1%; a plain four-layer S4D with mean pooling
  reaches 54% at about a million parameters and 33% at 51 thousand. On the
  easiest version of the task, the plain S4D is the weaker learner.
---

{%- assign u = '/projects/bns/updates/' -%}

## Why this test

Without noise, chirp mass can be read from the waveform locally: from its
frequency and how fast the frequency rises. This test asks whether an
architecture can learn the map from waveform to chirp mass at all,
separately from whether it can pull a weak signal out of noise.

## The three runs

Common to all three: the input is the whitened injected waveform alone,
scaled to an SNR drawn from a power law with index −3 from SNR 4 (the same
for validation), two detectors at 2048 Hz with no downsampling, 4 s windows,
50,000 windows per epoch. Each network outputs a mean and a variance for
chirp mass, trained with a β-weighted Gaussian likelihood (β = 0.3).

<div markdown="1">

| run | network | parameters | learning rate |
|---|---|---|---|
| free kernels | one layer of 256 learned complex 4 s kernels, energy, maximum over time, linear head: the network of [13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}) at the full 2048 Hz, with a mean and variance head | 4.2M stored, 2.1M in band | 10⁻³ |
| S4D 256 × 256 × 4 | the den-reg regressor alone: 4 S4D layers, 256 channels, state size 256, mean over time, linear head; default S4D initialization | 1.06M | 10⁻⁴ (S4D parameters 10⁻³) |
| S4D 64 × 32 × 4 | the same with 64 channels and state size 32 | 51k | 10⁻⁴ (S4D parameters 10⁻³) |

</div>

{% include figure.html
   src="/assets/img/bns/2026-10-14/free_kernel_diagram.png"
   alt="Block diagram of the free-kernel network: input strain, long convolution with 256 learned 4 s kernels, energy, detector sum, maximum over time, log and standardize, linear head, mean and variance of chirp mass"
   label="The free-kernel network"
   caption="Signal-only version at 2048 Hz. Only the kernels and the linear head are learned. The kernels are stored as their spectrum in 20 to 1024 Hz and scaled to unit norm. On noisy data (13 October) the same network runs at 1024 Hz (4,096 time samples per kernel) and its head has 235 outputs, one per chirp-mass bin, with a softmax." %}

The network, its outputs and its parameters are described on the
[free-kernel page]({{ '/projects/bns/free-kernel/' | relative_url }}).

The free kernels, with four times the stored parameters of the large S4D,
train 5.3 times faster per step: 39 ms against 208 ms for a batch of 32
(S4D 64 × 32 × 4: 28 ms); the operation counts are on the
[derivations page]({{ '/projects/bns/derivations/' | relative_url }}#cost). In the same 9.5 hours on a shared GPU the free
kernels ran 48 epochs and the large S4D 25.

The learning rate first followed a reduce-on-plateau schedule on the
validation loss. That loss rises as the predicted variance shrinks, so the
schedule cut the rate while accuracy was still improving
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#beta-nll)). The runs were
resumed from their checkpoints on the warm-restart cosine schedule (S4D
256 × 256 × 4 from epoch 22, the other two from epoch 42).

## Validation

{% include figure.html
   src="/assets/img/bns/2026-10-14/signal_only_val_within.png"
   alt="Fraction of validation events within 1, 2, 5 and 10 percent of the true chirp mass against epoch for the three networks"
   label="Validation during training"
   caption="Every epoch, no smoothing. Same scale in every panel." %}

Mean of the last five validation epochs:

<div markdown="1">

| run | epochs | within 1% | within 2% | within 5% | within 10% |
|---|---|---|---|---|---|
| free kernels | 44 to 48 | 99.7% | 100.0% | 100.0% | 100.0% |
| S4D 256 × 256 × 4 | 21 to 25 | 54.0% | 91.8% | 100.0% | 100.0% |
| S4D 64 × 32 × 4 | 44 to 48 | 32.6% | 57.3% | 99.9% | 100.0% |

</div>

The free kernels pass 99% within 1% by epoch 27 and stay there. The large
S4D peaked at 77.8% within 1% at epoch 11 and then fell. The small S4D
levelled off near 32%.

## Uncertainty

Each network also predicts σ, its own uncertainty on chirp mass. For a
Gaussian error with the predicted σ, the mean absolute error is 0.80 σ and
the root-mean-square error is σ ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#calibration)). Mean of the last five validation epochs:

<div markdown="1">

| run | mean σ | mean \|error\| | RMS error | \|error\| / σ | RMS error / σ |
|---|---|---|---|---|---|
| free kernels | 0.0029 M☉ | 0.0023 M☉ | 0.0033 M☉ | 0.80 | 1.16 |
| S4D 256 × 256 × 4 | 0.0155 M☉ | 0.0166 M☉ | 0.0195 M☉ | 1.07 | 1.26 |
| S4D 64 × 32 × 4 | 0.0229 M☉ | 0.0363 M☉ | 0.0478 M☉ | 1.59 | 2.09 |

</div>

{% include figure.html
   src="/assets/img/bns/2026-10-14/signal_only_val_sigma.png"
   alt="Predicted sigma and actual mean absolute error against epoch for the three networks, and their ratio"
   label="Predicted against actual error"
   caption="Left: predicted σ (solid) and actual mean |error| (dashed), log scale. Right: their ratio; the dotted line is 0.80, a calibrated Gaussian." %}

The free kernels' σ matches their errors (0.80). The RMS ratio, 1.16, is
above 1 also when every σ is right but σ varies between events, so the mean
\|error\| ratio is the cleaner test ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#calibration)). Their σ
is 5.3 and 7.9 times smaller than the two S4D networks'. The large S4D's σ is about a quarter too small; the small S4D's is
about half its actual error, and the gap widened during training. These are
averages over all validation events; a per-event check of σ needs the test
set.

## Conclusion

A plain S4D (default initialization, mean over time) learns chirp mass from
the clean signal worse than one layer of free kernels. 256 × 256 × 4 is
already a large S4D; a bigger one would be too large a model for this task.

Running now, to separate the readout from the kernel: the small S4D with a
maximum over time instead of the mean, the same with a complex last layer
(averaged, or energy and maximum as in the free kernels), and the free
kernels stored as time samples instead of a spectrum.
