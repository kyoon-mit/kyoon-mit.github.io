---
layout: project
title: Binary Neutron Stars with State Space Models
permalink: /projects/bns/
eyebrow: Current project
summary: >-
  Recovering the chirp mass of binary neutron star inspirals directly from
  strain time series, using deep state space sequence models.
next_page: /projects/bns/background/
next_title: Background — why long sequences are the hard part
---

## Overview

When two neutron stars spiral toward each other, they radiate gravitational waves
for a long time before they merge. The signal is faint, buried well below the
detector noise floor, and it evolves slowly: a binary neutron star inspiral stays
in a ground-based detector's sensitive band for tens of seconds to minutes, far
longer than the sub-second binary black hole signals that dominate current
catalogs. That length is what makes these events scientifically valuable — and
what makes them computationally awkward.

This project asks whether **deep state space models** can read those long,
low-amplitude sequences directly. The specific target is the **chirp mass**, the
mass combination that controls the leading-order phase evolution of the inspiral
and therefore the parameter a model can hope to constrain earliest. Instead of
correlating the data against a bank of pre-computed templates, the model is
trained to map a raw strain segment to a chirp-mass estimate in a single forward
pass.

### Why state space models

The architecture is **S4D**, the diagonal variant of the structured state space
sequence model. S4D-style layers carry a continuous-time linear recurrence whose
kernel can be evaluated convolutionally, which gives them two properties that
matter here: they handle sequences of tens of thousands of samples without the
quadratic cost of attention, and their parameterization biases them toward
long-range structure rather than local texture. A gravitational-wave inspiral is
almost pure long-range structure — the information about chirp mass is spread
across the entire phase evolution, not concentrated in any short window.

The models are deliberately small. The configuration used throughout the results
below is 8 layers at a model dimension of 256, roughly 1.3 M parameters — small
enough to train quickly on simulated data and to make latency plausible for a
low-latency or early-warning setting.

<dl class="specs">
  <div><dt>Architecture</dt><dd>S4D<small>diagonal state space</small></dd></div>
  <div><dt>Model dimension</dt><dd>256</dd></div>
  <div><dt>Layers</dt><dd>8</dd></div>
  <div><dt>Parameters</dt><dd>≈ 1.3 M</dd></div>
  <div><dt>Target</dt><dd>Chirp mass<small>regression</small></dd></div>
  <div><dt>Input</dt><dd>Strain time series<small>216 Hz, ~55 s</small></dd></div>
</dl>

### Current questions

Three threads are open, and the [Updates]({{ '/projects/bns/updates/' | relative_url }})
log tracks them as they move:

- **How far down in signal-to-noise can this go?** Accuracy degrades as SNR
  falls, and the interesting question is the shape of that degradation rather
  than any single headline number. Recent runs characterize error as a function
  of SNR bin instead of quoting one aggregate figure.
- **Does pretraining transfer across SNR regimes?** Training on a loud
  population and fine-tuning on a quieter one is much cheaper than training each
  regime from scratch. The
  [January 2026 comparison]({{ '/projects/bns/updates/2026-01-02-transfer-learning-snr-30-40/' | relative_url }})
  puts the two side by side under matched budgets.
- **How early can a useful estimate be produced?** All results so far truncate
  the waveform 8 s before merger, which is a first step toward asking what the
  model knows before the merger happens.

<p class="note"><strong>Status.</strong> Active work on simulated data. Everything
on the Updates pages is a research snapshot, not a published result — numbers can
and do move between entries.</p>
