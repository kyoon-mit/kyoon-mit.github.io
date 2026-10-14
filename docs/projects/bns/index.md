---
layout: project
title: Binary Neutron Stars with State Space Models
permalink: /projects/bns/
eyebrow: Current project
summary: >-
  Estimating binary neutron star parameters directly from detector strain with
  small state space models, and asking whether that can work at the low
  signal-to-noise ratios near the detection threshold, where most detected
  events lie.
next_page: /projects/bns/story/
next_title: The story so far, from the first chirp-mass fits to today
---

## The question

A binary neutron star (BNS) inspiral stays in the LIGO band for minutes before
it merges: a 1.4 + 1.4 M☉ binary takes 158 s to go from 20 Hz to merger,
against 0.96 s for a 30 + 30 M☉ binary black hole (leading order;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-time-in-band)). That long, faint chirp is
what makes these events valuable for multimessenger astronomy, and what makes
them expensive to search for and to characterize.

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

**Loud signals work.** Our test population draws SNR with density
proportional to SNR⁻³ between 4 and 50. On it, the joint denoiser and
regressor of
[29 September]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }})
puts 78% of events with SNR 16 to 25 within 2% of the true chirp mass, and 97%
of events with SNR 25 to 50.

**Quiet signals do not.** Detected BNS events are expected to be mostly quiet.
For sources spread uniformly in volume the SNR density falls as SNR⁻⁴
(Schutz 2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421)), so from
SNR 4, 87.5% of events lie below SNR 8. Our test population is flatter than
that: its median is 5.64 and 75.5% of it lies below SNR 8
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)); the 25,790 test signals
had median 5.6 and 76% below 8. There, only 5 to 8% of estimates land within
2%, and the estimate collapses toward the average chirp mass.

Existing machine-learning pipelines reach that regime by **heterodyning**:
they remove the chirp's leading-order phase for an assumed chirp mass, so the
network sees a nearly stationary signal
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-heterodyne)). DINGO-BNS takes that chirp
mass from a search trigger or from a scan over its prior (Dax et al. 2025,
[arXiv:2407.09602](https://arxiv.org/abs/2407.09602)). The AFRAME BNS search
we contributed to needs no single value: it heterodynes the data at 100 chirp
masses from 1 to 2.5 M☉ and keeps the 10 channels that respond most (Gupta et
al. 2026, [arXiv:2607.01372](https://arxiv.org/abs/2607.01372); see the
[5 October update]({{ '/projects/bns/updates/2026-10-05-window-bound-and-prior-conditioning/' | relative_url }})).
Both work. Both start from a chirp mass close to the true one, given or found
on a grid, and that is the number we want to estimate.

So the question this project is now organized around is:

> Can a learned model reach low-SNR sensitivity *without* heterodyning?

So far the answer is no. The [story]({{ '/projects/bns/story/' | relative_url }})
records every route tried, and the [live runs]({{ '/projects/bns/live/' | relative_url }})
page tracks the one being tested now.

## Where things stand

The run started on 1 October follows a lead from a different experiment.
Project 8 measures the energies of single electrons from their cyclotron
radiation (Asner et al. 2015, [arXiv:1408.5362](https://arxiv.org/abs/1408.5362)).
Internal Project 8 results show a denoiser trained jointly with a regressor
recovering a core of well-measured events, selected by the model's own
uncertainty, nearly two orders of magnitude sharper than the overall spread.
We first tried to reproduce that on the Project 8 data, then carried the
training recipe back to BNS:

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
