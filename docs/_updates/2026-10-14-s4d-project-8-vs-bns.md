---
title: "Major finding: why S4D suits Project 8 and not binary neutron stars"
date: 2026-10-14
tags: [s4d, project-8]
math: true
summary: >-
  An S4D layer filters with a sum of tones at fixed frequencies. A Project 8
  electron signal is itself a nearly constant tone, so a few such tones are
  its matched filter. A binary neutron star chirp sweeps through hundreds of
  cycles at a rising frequency, and fixed tones match it only in large
  numbers, if at all; our tests agree. Ways forward: make the chirp look like
  a tone before the S4D sees it, use kernels that are chirps, or use layers
  whose frequency follows the input.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}

{% include notice-snr-powerlaw.html %}

<blockquote markdown="1">
Correction, 16 October: the signal-only S4D numbers below (54.0% and 32.6%) came from runs with dropout 0.2; with dropout 0 the same S4D reaches 99.9% within 1% without noise. The noisy comparison of one-layer networks had no dropout and stands. The tone-fit numbers below (0.25 to 0.33 for 32 tones, 0.87 to 0.90 for 256) come from Fourier and matrix-pencil fits; directly optimized decaying tones reach 0.43 to 0.56 with 32 ([What S4D computes]({{ '/projects/bns/updates/2026-10-16-what-s4d-computes/' | relative_url }})). See the [16 October status]({{ '/projects/bns/updates/2026-10-16-status-dropout-and-signal-only/' | relative_url }}).
</blockquote>

## The finding

- **What an S4D layer can hold.** Each channel of an S4D layer convolves its
  input with a kernel that is a sum of damped tones, each at one fixed
  frequency ([derivation]({{ d | relative_url }}#s4d-tones); Gu et al. 2022,
  [arXiv:2206.11893](https://arxiv.org/abs/2206.11893)).
- **Project 8 signals are tones.** A trapped electron radiates at a nearly
  constant carrier frequency with a few sidebands (Asner et al. 2015,
  [arXiv:1408.5362](https://arxiv.org/abs/1408.5362); Ashtari Esfahani et
  al. 2017, [arXiv:1703.02037](https://arxiv.org/abs/1703.02037)). A few
  long-lived tones at those frequencies are its matched filter, and S4D
  models do well on it (internal results).
- **Binary neutron star signals are chirps.** In our 4 s windows the signal
  starts at 48 to 99 Hz, depending on its chirp mass, and goes through 305 to
  636 cycles while its frequency rises toward merger
  ([derivation]({{ d | relative_url }}#cycles)). A tone at one fixed
  frequency overlaps a chirp only while the chirp passes that frequency, so a
  sum of fixed tones matches a chirp only with many tones.

## Project 8: why a few tones are enough

The matched filter for a signal is the signal itself, reversed in time
(Creighton and Anderson 2011, chapter 7). For a constant tone that is again a
constant tone, which one undamped or slowly damped S4D tone (one complex
state) generates exactly ([derivation]({{ d | relative_url }}#s4d-tones)). A
carrier with a few sidebands needs one tone per spectral line. In our measurement on 50 Project 8
records, the Fourier tones needed to reach a match of 0.9 had a median of 3 (1 to 6)
([7 October]({{ u | append: '2026-10-07-chirp-kernels/' | relative_url }})).

## Binary neutron stars: why fixed tones are not enough

The same measurement for four 4 s BNS chirps gave 476 to 744 Fourier tones
(median 593.5) for a match of 0.9 ([7 October]({{ u | append: '2026-10-07-chirp-kernels/' | relative_url }})).
Fitting tones directly to real waveforms (the best of three fitting methods; [method]({{ d | relative_url }}#early-tone-fit))
([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})):

- 32 tones per channel, the den-reg's state size, kept 0.25 to 0.33 of the
  matched-filter SNR in the fits we tried;
- 256 tones kept 0.87 to 0.90 (chirp masses 1.2 to 2.0 M☉).

Two more things work against S4D in our networks:

- **The starting values.** In S4D-Lin, one step size per channel sets both
  the spacing of its tones and how long they last. Over the den-reg's range
  of step sizes most channels start with tones below 20 Hz or above the
  highest frequency the data holds, or tones that fade within a second
  ([derivation]({{ d | relative_url }}#s4d-tones)). After 200 epochs only 7%
  of the tones of our 256-tone run were both in band and longer-lived than
  1 s ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
  Starting every tone inside the band did not help
  ([brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }})).
- **The read-out.** The den-reg's regressor averages over time. With the
  template bank's ideal filters, averaging over time instead of taking the
  maximum dropped the fraction within 1% at SNR 8 to 10 from 91% to 22%
  (power law from SNR 4;
  [12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})).

## What the experiments show

- **Without noise.** One layer of free kernels put 99.7% of validation events
  within 1% of the true chirp mass; a plain four-layer S4D with mean pooling
  put 54.0% (256 channels, state size 256) and 32.6% (64 channels, state size
  32) ([14 October]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})).
- **With real noise.** One layer of learned free kernels, with no denoiser,
  put 2.6 to 2.9 times as many events within 1% at SNR 8 to 12 as the
  den-reg's final epoch, and 3.8 to 4.3 times as many as its epoch 339
  ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
- **Against the template bank.** With no training, the template bank with a
  χ² test has 1.9 to 8.5 times the sensitive volume of the den-reg's final
  epoch ([14 October]({{ u | append: '2026-10-14-den-reg-final/' | relative_url }})).

## Ways forward

1. **Make the chirp look like a tone before the S4D sees it.** Multiplying
   the data by the conjugate of the chirp phase for the right chirp mass
   (heterodyning) leaves a slowly varying signal, the regime where S4D works.
   It needs the chirp mass: the AFRAME binary neutron star search feeds a
   grid of chirp masses (Gupta et al. 2026,
   [arXiv:2607.01372](https://arxiv.org/abs/2607.01372)), DINGO-BNS takes it
   from a search trigger (Dax et al. 2025,
   [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)), and a bootstrap
   could estimate it, heterodyne, and estimate again.
2. **Use kernels that are chirps.** One layer of learned free kernels is our
   best template-free network so far. Next for it: 2048 Hz, training from
   SNR 4 (running), more kernels, a χ² test on the kernels and a detection
   score ([free-kernel page]({{ '/projects/bns/free-kernel/' | relative_url }})).
3. **Use layers whose frequency follows the input.** Mamba-style layers make
   the step size depend on the input at every sample; with a complex state
   the oscillation rate can then rise with the chirp (Gu and Dao 2023,
   [arXiv:2312.00752](https://arxiv.org/abs/2312.00752); Lahoti et al. 2026,
   [arXiv:2603.15569](https://arxiv.org/abs/2603.15569)). A learned warp of
   the time axis would do the same from the other side: a chirp becomes a
   tone in the right time coordinate.
4. **Read out with a maximum over time.** Tests of S4D with a maximum over
   time, and with a complex last layer, are running.
