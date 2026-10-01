---
layout: project
title: Binary Neutron Stars with State Space Models
permalink: /projects/bns/
eyebrow: Current project
summary: >-
  Estimating binary neutron star parameters directly from detector strain with
  small state space models, and asking whether that can work at the low
  signal-to-noise ratios where most real events live.
next_page: /projects/bns/story/
next_title: The story so far, from the first chirp-mass fits to today
---

## The question

A binary neutron star (BNS) inspiral spends tens of seconds to minutes in the
LIGO band before it merges. That long, faint chirp is what makes these events
valuable for multimessenger astronomy, and what makes them expensive to search
for and to characterize.

This project trains **state space models** (S4D) to read whitened strain and
return physical parameters in a single forward pass, with no template bank and
no stochastic sampling. The model also reports its own uncertainty. Three
targets, in order:

1. **Merger regression.** Chirp mass and its uncertainty from the last seconds
   before coalescence.
2. **Pre-merger regression.** The same estimate from a window that ends before
   the merger, for early warning.
3. **Sky localization.** Planned for later; a first two-detector attempt is
   described in the [story]({{ '/projects/bns/story/' | relative_url }}).

## What works, and what does not

**Loud signals are solved.** On a population drawn the way real events are
(SNR distributed as a power law), the current joint denoiser and regressor
puts 78% of events with SNR 16 to 25 within 2% of the true chirp mass, and 97%
of events with SNR 25 to 50.

**Quiet signals are not.** Real BNS events are mostly quiet: in the same test
set the median SNR is 5.6 and 76% of events sit below SNR 8. There, only 5 to
8% of estimates land within 2%, and the estimate collapses toward the average
chirp mass.

Existing machine-learning pipelines reach that regime by **heterodyning**:
they remove the chirp's phase using a prior guess of the chirp mass, so the
network sees a nearly stationary signal. That includes the AFRAME BNS search
we contributed to ([arXiv:2607.01372](https://arxiv.org/abs/2607.01372)). It
works, but it presupposes the one number we are trying to estimate.

So the question this project is now organized around is:

> Can a learned model reach low-SNR sensitivity *without* heterodyning?

So far the answer is no. The [story]({{ '/projects/bns/story/' | relative_url }})
records every route tried, and the [live runs]({{ '/projects/bns/live/' | relative_url }})
page tracks the one being tested now.

## Where things stand

The current attempt follows a lead from a different experiment. In Project 8,
which measures electron energies from faint radio chirps, internal Project 8
results show a denoiser trained jointly with a regressor recovering a remarkably sharp
core of well-measured events. We first tried to reproduce
that on the Project 8 data, then carried the training recipe back to BNS:

<dl class="specs">
  <div><dt>Model</dt><dd>S4D denoiser + regressor<small>128 wide, 6 layers each</small></dd></div>
  <div><dt>Targets</dt><dd>Chirp mass, mass ratio<small>with uncertainties</small></dd></div>
  <div><dt>Input</dt><dd>4 s, two detectors<small>2048 Hz, real O3a noise</small></dd></div>
  <div><dt>Training SNR</dt><dd>Power law, index −2<small>4 to 100</small></dd></div>
  <div><dt>Noise</dt><dd>Each signal in 4 backgrounds<small>time-shifted O3a strain</small></dd></div>
  <div><dt>Started</dt><dd>1 October 2026<small>about a week on two GPUs</small></dd></div>
</dl>

<p class="note"><strong>Status.</strong> Everything here is research in
progress on simulated signals injected into real detector noise. Numbers move
between entries; the dated <a href="{{ '/projects/bns/updates/' | relative_url }}">updates</a>
are snapshots, not published results.</p>
