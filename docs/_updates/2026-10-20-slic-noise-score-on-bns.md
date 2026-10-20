---
title: "A learned noise model on our windows, and why its sampler is too slow"
date: 2026-10-20
tags: [noise]
math: true
summary: >-
  I trained the noise model of SLIC (Legin et al. 2025) on our whitened O3a
  noise windows and started its parameter estimation on 400 O3b test
  windows. Against a Gaussian with the typical window's spectrum, the network
  is better in 84.5% of validation windows at the noise level the sampler
  uses, by a median of 10.5 in a loss of 7,928, and far better in the loud
  ones. The paper's sampler needs 1.92 million waveform evaluations per
  window; at the measured 0.575 s per window and step, 400 windows would take
  79.9 days on our GPU. I stop after four windows and turn to a next-sample
  noise model, tested directly against the matched filter.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

The [19 October update]({{ u | append: '2026-10-19-how-gaussian-is-our-noise/' | relative_url }})
measured what our noise has beyond a Gaussian with its spectrum. The next
question is whether a network can learn it. The closest existing method is
SLIC, score-based likelihood characterization (R. Legin, M. Isi, K. W. K.
Wong, Y. Hezaveh and L. Perreault-Levasseur, Astrophys. J. Lett. 985, L46
(2025), [arXiv:2410.19956](https://arxiv.org/abs/2410.19956); code at
[github.com/RonanLegin/slicgw](https://github.com/RonanLegin/slicgw)). I
copied it onto our binary neutron star windows.

## What SLIC does

1. A diffusion model learns the noise from noise-only data. What it learns
   is the score of the noise distribution: for any stretch of noise, the
   direction in which it becomes more probable.
2. For a guess $\theta$ of the source parameters, the waveform model gives
   the signal $h(\theta)$. If the data are $d = h + n$, then $d - h(\theta)$
   should look like noise. The gradient of the log likelihood is the noise
   score at $d - h(\theta)$ times the waveform's derivative,
   $\nabla_\theta \log p(d \mid \theta) = -\big(\partial h/\partial\theta\big)^{\!\top}\,
   \nabla_n \log p(n)\big\vert_{n = d - h(\theta)}$ (their Eq. 3). No Gaussian
   assumption enters.
3. A sampler uses that gradient to draw the posterior. The paper uses
   MALA with 32 walkers, a burn-in of 10,000 steps and 20,000 kept steps,
   with the change in log probability for the accept test integrated along
   each move by Simpson's rule with two intervals (their section VI, and
   [scripts/inference_injection.sh](https://github.com/RonanLegin/slicgw/blob/main/scripts/inference_injection.sh)).

The paper tested it on 400 simulated binary black holes, half in Hanford
and half in Livingston noise, one detector at a time, with the IMRPhenomD
waveform and 7 parameters (their sections III, V and VII, and Fig. 2). Our case differs in the source and the data:
binary neutron stars, both detectors, IMRPhenomPv2 with precessing spins, 11
parameters (chirp mass, mass ratio, two spin magnitudes, four spin angles,
phase, SNR and merger time), and our dataloader configuration unchanged. Sky
position, polarization angle and inclination are held at their true values
in each window.

## Training the noise network

- **Data.** Whitened 4 s windows of O3a noise from our usual dataloader
  configuration, with no signal added: 21 background files (0.673 days) for
  training, 2 others (0.484 days) for validation. H1 and L1 are separate
  examples, as in the paper.
- **Network and loss.** The paper's one-dimensional network (NCSNpp, 803,641
  numbers) with its settings: noise level $\sigma = 10^{-3}\,(10^{7})^{t}$
  for $t$ uniform in 0 to 1, a network that sees the window plus
  $\sigma z$ and must return $-z$, AdamW at $2\times10^{-5}$, gradients
  clipped at 1, and a running average of the weights (rate 0.999) used for
  validation, and $t = 0.3$ ($\sigma = 0.126$) for the sampler
  ([run script](https://github.com/RonanLegin/slicgw/blob/main/scripts/inference_injection.sh)).
  This is denoising score matching (Vincent 2011,
  [doi:10.1162/NECO_a_00142](https://doi.org/10.1162/NECO_a_00142)).
- **Length.** 200 epochs of 1,564 batches of 64 windows, 20,019,200 examples,
  against 500 epochs of the paper's "approximately 40,000" training
  segments (their sections III and IV), 20,000,000 for exactly 40,000. It took 15 h 20 min on one GPU capped at 250 W.

| Epoch | 0 | 9 | 49 | 99 | 147 | 199 |
|---|---|---|---|---|---|---|
| Training loss | 3,622.7 | 3,516.5 | 3,480.3 | 3,500.2 | 3,476.5 | 3,482.8 |
| Validation loss | 3,508.9 | 3,493.5 | 3,416.8 | 3,532.7 | 3,343.6 | 3,459.1 |

From epoch 10 on, the training loss stays between 3,457.2 and 3,527.3 and
the validation loss moves between 3,343.6 and 3,650.5 with no trend, because
every batch draws its own noise levels and its own added noise (values from
the run's Weights and Biases record). The lowest validation loss, 3,343.6 at
epoch 147, is the checkpoint I kept. The loss cannot reach zero, so
these numbers alone do not say whether the network learned anything about
real noise. The next section does.

## Does it beat a Gaussian?

For Gaussian noise the best answer to the network's task is known exactly.
At each frequency with noise power $P$, it is
$-\sigma\,(x+\sigma z)/(P+\sigma^2)$, and the loss per real dimension is
$P/(P+\sigma^2)$ ([derivation]({{ d | relative_url }}#oct20-gaussian-denoiser)).
So I gave the network and three Gaussian models the same 4,096 validation
windows (2,048 per detector), the same added noise, and fixed noise levels:

- **white:** $P = 1$ at every frequency, what whitening aims for;
- **mean spectrum:** $P$ the mean power of 1,024 whitened training windows
  at each frequency;
- **typical spectrum:** $P$ the median of the same powers divided by
  $\ln 2$, the typical window's spectrum
  ([why ln 2]({{ d | relative_url }}#oct19-gaussian-references)).

The loss is summed over the 8,192 samples of a window; lower is better.

| $t$ | $\sigma$ | Network | Typical spectrum | Mean spectrum | White | Network minus typical: median | Windows where the network is better |
|---|---|---|---|---|---|---|---|
| 0.0 | 0.001 | 8,163.8 | 8,192.6 | 8,192.6 | 8,192.7 | −28.6 | 99.9% |
| 0.1 | 0.0050 | 8,097.4 | 8,190.8 | 8,190.6 | 8,191.9 | −93.3 | 99.9% |
| 0.2 | 0.025 | 8,061.3 | 8,170.4 | 8,168.0 | 8,196.8 | −86.2 | 100.0% |
| **0.3** | **0.126** | **7,928.4** | **8,124.6** | **7,980.8** | **8,272.2** | **−10.5** | **84.5%** |
| 0.4 | 0.631 | 5,860.2 | 8,199.9 | 6,356.4 | 8,630.6 | +19.8 | 9.5% |
| 0.5 | 3.16 | 800.9 | 1,779.3 | 1,528.9 | 1,868.4 | +6.6 | 15.1% |
| 0.6 | 15.8 | 38.7 | 85.1 | 113.3 | 86.2 | +0.4 | 19.8% |

The model columns are means over windows. The bold row is the noise level
the sampler uses ($t = 0.3$, as in the paper).

- **Most of the network's lead over white noise is the spectrum.** At
  $t = 0.3$ the white model is 343.8 worse than the network on average; a
  Gaussian with the mean spectrum is only 52.4 worse. Whitening leaves the
  band below the 20 Hz highpass nearly empty (typical power 0.0018 to 0.0019 of white)
  and leaves the lines the 19 October update measured; any model with the
  right spectrum gets that for free.
- **In a typical window the network is close to a Gaussian with the typical
  spectrum.** At the sampler's level it is better in 84.5% of windows, by a
  median of 10.5 in 7,928 (0.13%). At $t = 0.4$ to 0.6 it is worse in most
  windows, by medians of 0.4 to 19.8.
- **In loud windows it is far better.** The mean difference at $t = 0.3$ is
  −196.2 against the median's −10.5; in H1 it is −370.1. A Gaussian with
  either spectrum has no way to expect the loud, broadband windows that the
  [19 October update]({{ u | append: '2026-10-19-how-gaussian-is-our-noise/' | relative_url }})
  counted at 6.5 to 11.9 per hour; the network does.
- **At very small noise levels** ($t \le 0.2$) the network beats every
  Gaussian in 99.9 to 100% of windows, by medians of 28.6 to 93.3 per
  window. I have not
  checked what it uses there.

So the network has learned something beyond a Gaussian, mostly the loud
windows. Whether that helps parameter estimation is what the sampler would
show.

## The cost of the sampler

Each step moves every walker once and needs the gradient at two new points
per walker, the proposal and the midpoint of the move, for Simpson's rule.
That is $32 \times 2 \times 30{,}000 = 1{,}920{,}000$ waveform evaluations
with their gradients per window
([derivation]({{ d | relative_url }}#oct20-pe-cost)).

- **Measured.** A run of 40 steps on 2 windows took 46 s: 0.575 s per window
  and step: 4.8 h per window, 79.9 days for 400 windows on one GPU. The live
  run on 4 windows has averaged 2.918 s per step, which would be 101.3 days.
- **Where the time goes.** For 64 points, building the waveforms and their
  gradients took 0.460 s and the network took 0.099 s. The GPU was busy 100%
  of the time already with 2 windows, so more windows at once do not help.
  Our waveform pipeline runs in float64 throughout; I have not yet timed it
  in float32.
- **The paper's budget.** Its run script splits the 200 injections of each
  detector into 20 jobs of 10 and requests 16.5 hours of one GPU per job
  ([inference_injection.sh](https://github.com/RonanLegin/slicgw/blob/main/scripts/inference_injection.sh)):
  40 jobs of one GPU each, at most 1.65 h per injection.

## What I am doing instead

The run on windows 0 to 3 finishes on 21 October and shows whether the
sampler works on neutron-star signals at all. Then I stop it. Parameter
estimation is not the question this project asks; detection at low SNR is.

The next test learns the noise as a next-sample model: a causal S4D that
predicts, for each sample, a probability for its value from all earlier
ones. Multiplying these predictions gives the exact probability of a window,
so the model gives the likelihood itself, not only its gradient. Then:

1. Compare its log likelihood on held-out noise with the best linear
   predictor fitted on the same training noise, which amounts to a Gaussian
   model of the measured spectrum (Makhoul 1975,
   [doi:10.1109/PROC.1975.9792](https://doi.org/10.1109/PROC.1975.9792)).
   The gap between them is the only part that can beat a matched filter.
2. On the same windows with and without a signal, and with the true
   template, compare how many signals each method finds at the same
   false-alarm rate: the matched-filter SNR against the likelihood ratio
   under the learned noise. In stationary Gaussian noise the matched filter
   is the best possible detector for a known waveform; with heavier tails it
   is not (Allen et al. 2002,
   [arXiv:gr-qc/0105100](https://arxiv.org/abs/gr-qc/0105100)).

Not yet done: what the network uses at very small noise levels, the network
on O3b noise (the test windows are O3b, the training O3a), and the posterior
of any window.
