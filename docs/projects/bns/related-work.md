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

## How this project differs

Most learned approaches to compact binary signals use convolutional or
attention-based encoders, and most target either detection or a full posterior.
The combination explored here is narrower and, as far as I have found,
under-explored:

- a **state space** encoder rather than a CNN or transformer, chosen for the
  specific structure of a minutes-long inspiral;
- a **point estimate of a single physical parameter** (chirp mass) rather than a
  detection statistic or a full posterior, which keeps the model small enough to
  iterate on quickly;
- explicit attention to **SNR-resolved** behavior and to **transfer between SNR
  regimes**, rather than aggregate performance on a single simulated population.

Uncertainty quantification is the obvious gap: a point estimate is not a
posterior, and any eventual comparison against DINGO-style methods would need
calibrated intervals. That is future work.

<p class="note"><strong>Note.</strong> This reading list is a working summary
rather than a survey — I add to it as the project moves.</p>
