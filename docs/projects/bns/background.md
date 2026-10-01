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
upward in both frequency and amplitude — the characteristic *chirp*. To leading
post-Newtonian order the frequency evolution depends on the component masses
only through one combination, the **chirp mass**:

<div class="eq">
  <span class="eq__sym">&#8499;</span>
  <span class="eq__rel">=</span>
  <span class="frac">
    <span class="frac__num">(<i>m</i><sub>1</sub><i>m</i><sub>2</sub>)<sup>3/5</sup></span>
    <span class="frac__den">(<i>m</i><sub>1</sub> + <i>m</i><sub>2</sub>)<sup>1/5</sup></span>
  </span>
</div>

This is why chirp mass is the natural first target. It is the parameter most
tightly encoded in the phase, it is measurable long before merger, and for a
binary neutron star it is the quantity that most directly separates a
neutron-star binary from a black-hole binary — which is exactly the
classification an electromagnetic follow-up campaign needs quickly.

## Why length matters

Binary neutron stars are light, so they sweep through a detector's sensitive band
slowly. Where a stellar-mass binary black hole merger is a fraction of a second
of in-band signal, a BNS inspiral can persist for tens of seconds to minutes.
Two consequences follow:

- **Opportunity.** The signal accumulates over a long baseline, so in principle a
  chirp-mass estimate can be produced *before* the merger, while there is still
  time to point telescopes. This is the premise of early-warning searches.
- **Obstacle.** The input is now a very long sequence at a per-sample
  signal-to-noise ratio far below one. A model has to integrate weak evidence
  coherently across tens of thousands of samples, which is precisely where
  ordinary convolutional and attention-based architectures struggle — the former
  because their receptive field is local, the latter because cost grows
  quadratically with length.

## The conventional approach, and its cost

Production searches use **matched filtering**: correlate the data against a bank
of theoretical waveform templates and look for statistically significant peaks.
This is optimal for a signal of known shape in stationary Gaussian noise, and it
is how essentially every catalogued detection has been made.

Its cost is combinatorial. The template bank has to cover the parameter space
densely enough that no signal falls between templates, so bank size grows sharply
with the dimensionality of that space and with the duration of the waveforms —
and long BNS waveforms are the worst case on both axes. Full Bayesian parameter
estimation on top of the search adds hours of stochastic sampling per event.

## Where a learned model could help

A neural network moves the expense from inference time to training time. Once
trained, evaluating the network is a single forward pass with fixed cost that
does not grow with the size of any template bank. That reframes the research
question away from "can a network beat matched filtering in absolute accuracy" —
under its own assumptions, matched filtering is already optimal — and toward
more useful questions:

1. How much accuracy does a fixed-cost learned estimator give up, and where in
   the SNR distribution does it give it up?
2. Can the estimator be made to work early, on truncated pre-merger data, where
   the accumulated SNR is low by construction?
3. Does what the model learns in one noise or SNR regime transfer to another, so
   that adapting to a new observing run does not mean starting over?

The [Updates]({{ '/projects/bns/updates/' | relative_url }}) log works through
these empirically. Signals are simulated and injected into real detector noise
from the third observing run (O3), which keeps the ground truth exact while
exposing the model to real non-stationary noise and glitches.

## Most events are quiet

The number of sources grows with volume, so the number of events louder than a
given SNR falls steeply with that SNR, as its inverse cube. Real detections
therefore pile up just above threshold. In a test population drawn this way,
the median SNR is about 5.6, and three quarters of events sit below SNR 8.

That is the regime that matters, and it is where a model trained or evaluated
on uniformly distributed SNR is most misleading: uniform SNR over-represents
loud events, so it can make a model look nearly perfect while it fails on the
events the detectors actually record. The
[July 2026 update]({{ '/projects/bns/updates/2026-07-30-reality-check/' | relative_url }})
shows exactly that.

## Heterodyning

Machine-learning searches that do reach quiet BNS events, such as DINGO-BNS and
the AFRAME BNS search, **heterodyne** the data first. They multiply the strain
by the conjugate of the leading-order inspiral phase for an assumed chirp mass.
If the assumption is close, the chirp collapses into a slowly varying signal
that a network can integrate over a long window. If it is not, the signal
smears out.

Heterodyning is effective, but it needs the chirp mass up front, usually from a
bank of candidate values swept in parallel. A model that could estimate the
chirp mass directly at low SNR would not need it. Whether such a model can
exist is the open question this project is organized around.
