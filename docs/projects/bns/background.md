---
layout: project
title: Background
permalink: /projects/bns/background/
eyebrow: Overview
summary: >-
  The physics the model is trying to invert, and why the length of a binary
  neutron star signal is both the opportunity and the obstacle.
next_page: /projects/bns/related-work/
next_title: Related Work
---

## The signal

A compact binary loses orbital energy to gravitational radiation, so its orbit
shrinks and its orbital frequency rises. The emitted strain therefore sweeps
upward in both frequency and amplitude: the characteristic *chirp*. To leading
post-Newtonian order the frequency evolution depends on the component masses
only through one combination, the **chirp mass** (Sathyaprakash and Schutz
2009, [arXiv:0903.0338](https://arxiv.org/abs/0903.0338), eqs. 31 and 32):

<div class="eq">
  <span class="eq__sym">&#8499;</span>
  <span class="eq__rel">=</span>
  <span class="frac">
    <span class="frac__num">(<i>m</i><sub>1</sub><i>m</i><sub>2</sub>)<sup>3/5</sup></span>
    <span class="frac__den">(<i>m</i><sub>1</sub> + <i>m</i><sub>2</sub>)<sup>1/5</sup></span>
  </span>
</div>

This is why chirp mass is the natural first target. It is the mass parameter
the signal measures best: 0.1 to 1% with advanced detectors, against 10 to 15%
for the reduced mass of a neutron-star binary, whose measurement is strongly
correlated with the spins (Cutler and Flanagan 1994,
[arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014)). And most of the
phase that sets it builds up before the last seconds: a binary of chirp mass
1.2 M☉ completes 90.1% of its cycles above 20 Hz before its last 4 s
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-time-in-band)). Chirp mass alone does not
tell a neutron-star binary from one with a black hole; that needs the
component masses, so also the mass ratio (GWTC-3 classifies its candidates by
their component masses; [arXiv:2111.03606](https://arxiv.org/abs/2111.03606)).

## Why length matters

Binary neutron stars are light, so they sweep through a detector's sensitive
band slowly: the time left before merger scales as the chirp mass to the −5/3
power. From 20 Hz, a 30 + 30 M☉ binary black hole has 0.96 s left and a
1.4 + 1.4 M☉ binary neutron star 158 s (leading order;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-time-in-band)). Two consequences follow:

- **Opportunity.** The signal accumulates over a long baseline, so in principle a
  chirp-mass estimate can be produced *before* the merger, while there is still
  time to point telescopes. This is the premise of early-warning searches
  (Cannon et al. 2012, ApJ 748, 136,
  [arXiv:1107.2665](https://arxiv.org/abs/1107.2665)).
- **Obstacle.** The input is a long sequence in which the signal is far below
  the noise in every sample. Our 4 s window at 2048 Hz is 8,192 samples per
  detector; at SNR 8 the signal's root-mean-square per sample is 0.088 of the
  noise's standard deviation, and its largest sample 0.29
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-per-sample)). A model has to integrate
  weak evidence coherently across all of them. Recurrent, convolutional and
  attention-based networks struggle with sequences of 10,000 or more steps
  (Gu, Goel and Ré 2022, [arXiv:2111.00396](https://arxiv.org/abs/2111.00396)):
  a convolutional network's effective receptive field is only a fraction of
  its theoretical one, and attention's cost grows as the square of the length
  (both as summarized for BNS by Gupta et al. 2026,
  [arXiv:2607.01372](https://arxiv.org/abs/2607.01372), section II B).

## The conventional approach, and its cost

Production searches use **matched filtering**: correlate the data against a bank
of theoretical waveform templates and look for statistically significant peaks.
This is the optimal filter for a signal of known shape in stationary Gaussian
noise (Creighton and Anderson 2011, *Gravitational-Wave Physics and
Astronomy*, chapter 7; Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)). Of the four
searches behind the GWTC-3 catalogue, three are matched filters (GstLAL, MBTA,
PyCBC); the fourth, cWB, assumes no waveform, and every O3b candidate it found
with a probability of astrophysical origin above 0.5 was also found above 0.5
by a matched-filter search, except one of instrumental origin (GWTC-3,
[arXiv:2111.03606](https://arxiv.org/abs/2111.03606), section IV).

Its cost grows with the size of the bank. The templates must be spaced closely
enough that every signal is near one, or signals are lost (Owen 1996,
[arXiv:gr-qc/9511032](https://arxiv.org/abs/gr-qc/9511032)), and the cost
grows steeply as detectors become sensitive at lower frequencies (Gabbard et
al. 2018, [arXiv:1712.06041](https://arxiv.org/abs/1712.06041)), where BNS
signals spend most of their time: 84.3% of the time from 20 Hz to merger is
spent below 40 Hz ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-time-in-band)). Searching for BNS
signals in real time means matching the data against "∼ million reference
waveforms", which "requires up to a thousand CPU cores" (Gupta et al. 2026,
abstract). Full Bayesian parameter estimation comes on top: for BNS, the state
of the art cited by Dax et al. 2025
([arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) gives full inference in
two hours.

## Where a learned model could help

A neural network moves the expense from inference time to training time. Once
trained, evaluating the network is a single forward pass with fixed cost that
does not grow with the size of any template bank. That reframes the research
question away from "can a network beat matched filtering in absolute accuracy"
(under its own assumptions, matched filtering is already optimal) and toward
more useful questions:

1. How much accuracy does a fixed-cost learned estimator give up, and where in
   the SNR distribution does it give it up?
2. Can the estimator be made to work early, on truncated pre-merger data, where
   the accumulated SNR is low by construction?
3. Does what the model learns in one noise or SNR regime transfer to another, so
   that adapting to a new observing run does not mean starting over?

The [Updates]({{ '/projects/bns/updates/' | relative_url }}) log works through
these empirically. Signals are simulated and injected into real detector noise
from the third observing run, O3 (LIGO, Virgo and KAGRA 2023, open data,
[arXiv:2302.03676](https://arxiv.org/abs/2302.03676)), which keeps the ground
truth exact while exposing the model to real non-stationary noise and
glitches.

## Most events are quiet

For sources spread uniformly in volume, the number of events louder than a
given SNR falls as the inverse cube of that SNR, so the SNR density falls as
SNR⁻⁴ (Schutz 2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421)).
Detections therefore pile up just above threshold: half lie below 1.26 times
the threshold, and from SNR 4, 87.5% lie below SNR 8
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).

Our test population is flatter than that. It draws SNR with density
proportional to SNR⁻³ between 4 and 50, so loud events are more common in it
than in the uniform-volume law. Its median SNR is 5.64, and 75.5% of events lie
below SNR 8 ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).

That is the regime that matters, and it is where a model trained or evaluated
on uniformly distributed SNR is most misleading. Uniform SNR on 4 to 50 puts
73.9% of events above SNR 16, against 5.65% in our population and 1.56% for
sources uniform in volume
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)), so it can make a model
look nearly perfect while it fails on the quiet events. The
[July 2026 update]({{ '/projects/bns/updates/2026-07-30-reality-check/' | relative_url }})
shows exactly that.

## Heterodyning

Machine-learning methods that do reach quiet BNS events, the parameter
estimation of DINGO-BNS (Dax et al. 2025,
[arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) and the AFRAME BNS
search (Gupta et al. 2026, [arXiv:2607.01372](https://arxiv.org/abs/2607.01372)),
**heterodyne** the data first. They multiply its Fourier transform by a phase
factor that cancels the leading-order inspiral phase for an assumed chirp
mass. If the assumption is close, little of that phase is left: a 1% error in
chirp mass leaves 1.64 to 1.69% of it, and the network sees a slowly varying
signal it can integrate over a long window
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-heterodyne)). If the assumption is far off,
the chirp is not removed.

Heterodyning therefore needs a chirp mass close to the true one. DINGO-BNS
takes it from a search trigger, or from a scan over its prior with the
network itself (Dax et al. 2025, supplementary material); the AFRAME BNS
search heterodynes at a grid of 100 chirp masses from 1 to 2.5 M☉ (Gupta et
al. 2026, section II C), so that every chirp mass in that range is within
0.464% of one of them ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-heterodyne)). A model that could estimate the chirp mass directly at
low SNR would need neither. Whether such a model can exist is the open
question this project is organized around.
