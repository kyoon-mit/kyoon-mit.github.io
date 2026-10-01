---
layout: project
title: Related Work
permalink: /projects/bns/related-work/
eyebrow: Overview
summary: >-
  The two literatures this project sits between — long-sequence architectures,
  and machine learning for gravitational-wave inference.
next_page: /projects/bns/updates/
next_title: Updates — the research log
---

## Long-sequence architectures

State space sequence models were introduced to attack exactly the regime this
project cares about: inputs of tens of thousands of steps where the relevant
structure is global.

- **S4** — Gu, Goel and Ré, *Efficiently Modeling Long Sequences with Structured
  State Spaces* (ICLR 2022). Introduces the structured state space layer and the
  convolutional view of its kernel that makes long-sequence training tractable.
- **S4D** — Gu et al., *On the Parameterization and Initialization of Diagonal
  State Space Models* (NeurIPS 2022). The diagonal simplification used here:
  nearly all of S4's benefit with a much simpler and faster kernel.
- **Mamba** — Gu and Dao, *Mamba: Linear-Time Sequence Modeling with Selective
  State Spaces* (2023). Adds input-dependent selectivity; the natural next
  architecture to compare against.
- **LinOSS** — Rusch and Rus, *Oscillatory State-Space Models* (ICLR 2025,
  arXiv:2410.03943). State space layers built on forced harmonic oscillators,
  the second architecture compared here.

## Machine learning for gravitational waves

Learned methods have been applied to detection, classification, and full
posterior inference. The through-line is that networks trade offline training
cost for cheap, fixed-cost inference.

- **George and Huerta**, *Deep Neural Networks to Enable Real-time
  Multimessenger Astrophysics* (Phys. Rev. D 97, 2018) — early demonstration
  that CNNs can detect and roughly characterize compact binary signals in real
  strain data.
- **Gabbard, Williams, Hayes and Messenger**, *Matching Matched Filtering with
  Deep Networks for Gravitational-Wave Astronomy* (Phys. Rev. Lett. 120, 2018) —
  shows a CNN can approach matched-filter sensitivity, establishing the
  benchmark that learned methods are measured against.
- **Dax et al.**, *Real-Time Gravitational Wave Science with Neural Posterior
  Estimation* (Phys. Rev. Lett. 127, 2021) — DINGO; normalizing flows produce
  full posteriors in seconds rather than hours, the strongest existing case for
  amortized inference in this field.
- **Baltus et al.**, *Convolutional Neural Networks for the Detection of the
  Early Inspiral of a Gravitational-Wave Signal* (Phys. Rev. D 103, 2021) —
  targets the pre-merger, early-warning regime directly.
- **Dax et al.**, *Real-time inference for binary neutron star mergers using
  machine learning* (Nature 639, 2025) — DINGO-BNS; full BNS posteriors in
  about a second, reaching low SNR by heterodyning with a prior chirp mass.
- **Marx et al.**, *A machine-learning pipeline for real-time detection of
  gravitational waves from compact binary coalescences* (arXiv:2403.18661,
  2024) — Aframe, the search pipeline this project's code now lives in.
- **Gupta et al.**, *AI-enabled gravitational-waves searches for binary neutron
  stars at optimal sensitivity* (arXiv:2607.01372, 2026) — the heterodyned
  AFRAME BNS search, which this project contributed to.

## How this project differs

Most learned approaches to compact binary signals use convolutional or
attention-based encoders, and most target either detection or a full posterior.
The combination explored here is narrower and, as far as I have found,
under-explored:

- a **state space** encoder rather than a CNN or transformer, chosen for the
  specific structure of a minutes-long inspiral;
- **a direct estimate with its own uncertainty**, a Gaussian mean and variance
  per parameter, rather than a detection statistic or a full posterior, which
  keeps the model small enough to iterate on quickly;
- **no heterodyning**: the model sees the raw whitened chirp, so it does not
  need the chirp mass it is trying to estimate;
- explicit attention to **SNR-resolved** behavior on a realistic population,
  rather than aggregate performance on uniformly distributed SNR.

A Gaussian mean and variance is not a full posterior; it cannot represent the
correlated, non-Gaussian structure that DINGO-style methods capture. The
uncertainties are, however, calibrated on the test population, and they already
separate loud signals from noise.

<p class="note"><strong>Note.</strong> This reading list is a working summary
rather than a survey — I add to it as the project moves.</p>
