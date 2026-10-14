---
layout: project
title: Related Work
permalink: /projects/bns/related-work/
eyebrow: Overview
summary: >-
  The two literatures this project sits between: long-sequence architectures,
  and machine learning for gravitational-wave inference.
next_page: /projects/bns/updates/
next_title: Updates, the research log
---

## Long-sequence architectures

S4, the first of the state space layers below, was introduced for long-range
dependencies in sequences of 10,000 or more steps, where recurrent, convolutional and
attention-based networks struggle (Gu, Goel and Ré 2022, abstract). Our 4 s
windows at 2048 Hz are 8,192 samples per detector.

- **S4.** Gu, Goel and Ré, *Efficiently Modeling Long Sequences with Structured
  State Spaces* (ICLR 2022, [arXiv:2111.00396](https://arxiv.org/abs/2111.00396)).
  Introduces the structured state space layer and the convolutional view of its
  kernel that makes long-sequence training tractable.
- **S4D.** Gu, Gupta, Goel and Ré, *On the Parameterization and Initialization
  of Diagonal State Space Models* (NeurIPS 2022,
  [arXiv:2206.11893](https://arxiv.org/abs/2206.11893)). The diagonal
  simplification used here: its kernel computation takes two lines of code, and it
  "performs comparably to S4 in almost all settings" (abstract).
- **Mamba.** Gu and Dao, *Mamba: Linear-Time Sequence Modeling with Selective
  State Spaces* (2023, [arXiv:2312.00752](https://arxiv.org/abs/2312.00752)).
  Makes the state space parameters functions of the input; the natural next
  architecture to compare against.
- **LinOSS.** Rusch and Rus, *Oscillatory State-Space Models* (ICLR 2025,
  [arXiv:2410.03943](https://arxiv.org/abs/2410.03943)). State space layers
  built on forced harmonic oscillators, the second architecture compared here.

## Machine learning for gravitational waves

Learned methods have been applied to detection, classification, and full
posterior inference. In the works below, networks trade offline training cost
for cheap, fixed-cost inference.

- **George and Huerta**, *Deep Neural Networks to Enable Real-time
  Multimessenger Astrophysics* (Phys. Rev. D 97, 044039, 2018,
  [arXiv:1701.00008](https://arxiv.org/abs/1701.00008)). Two convolutional
  networks that detect binary black hole signals and estimate their
  parameters; the paper reports performance similar to matched filtering at
  far lower cost.
- **Gabbard, Williams, Hayes and Messenger**, *Matching matched filtering with
  deep networks in gravitational-wave astronomy* (Phys. Rev. Lett. 120, 141103,
  2018, [arXiv:1712.06041](https://arxiv.org/abs/1712.06041)). A convolutional
  network that reproduces the sensitivity of a matched-filter search for
  binary black hole signals in simulated Gaussian noise.
- **Dax et al.**, *Real-time gravitational-wave science with neural posterior
  estimation* (Phys. Rev. Lett. 127, 241103, 2021,
  [arXiv:2106.12594](https://arxiv.org/abs/2106.12594)). DINGO: a normalizing
  flow gives full posteriors in a minute per event, against of order a day
  for standard inference codes, on eight events from the first catalogue.
- **Baltus et al.**, *Convolutional neural networks for the detection of the
  early inspiral of a gravitational-wave signal* (Phys. Rev. D 103, 102003,
  2021, [arXiv:2104.00594](https://arxiv.org/abs/2104.00594)). Targets the
  pre-merger, early-warning regime directly.
- **Dax et al.**, *Real-time gravitational-wave inference for binary neutron
  stars using machine learning* (Nature 639, 49, 2025,
  [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)). DINGO-BNS: full BNS
  inference in one second, after heterodyning with a chirp mass from a search
  trigger or a scan over the prior.
- **Marx et al.**, *A machine-learning pipeline for real-time detection of
  gravitational waves from compact binary coalescences* (Phys. Rev. D 111,
  042010, 2025, [arXiv:2403.18661](https://arxiv.org/abs/2403.18661)). Aframe,
  the search pipeline this project's code now lives in.
- **Gupta et al.**, *AI-enabled gravitational-waves searches for binary neutron
  stars at optimal sensitivity* (2026,
  [arXiv:2607.01372](https://arxiv.org/abs/2607.01372)). The heterodyned
  AFRAME BNS search, which this project contributed to.

## How this project differs

Of the works above, the detection networks are convolutional, and DINGO and
DINGO-BNS estimate a full posterior with a normalizing flow. The combination
explored here is narrower and, as far as I have found, under-explored:

- a **state space** encoder rather than a convolutional network or a
  transformer, chosen because one layer applies a convolution as long as its
  input (Gu, Gupta, Goel and Ré 2022, section 3.1), and a BNS signal stays in
  band for minutes ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#proj-time-in-band));
- **a direct estimate with its own uncertainty**, a Gaussian mean and variance
  per parameter, rather than a detection statistic or a full posterior, which
  keeps the model small enough to iterate on quickly;
- **no heterodyning**: the model sees the raw whitened chirp, so it does not
  need the chirp mass it is trying to estimate;
- explicit attention to **SNR-resolved** behavior on a power-law population
  (density proportional to SNR⁻³ between 4 and 50,
  [derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)), rather than aggregate
  performance on uniformly distributed SNR.

A Gaussian mean and variance is not a full posterior; it cannot represent the
correlated, non-Gaussian structure that DINGO-style methods capture. For the
joint model of
[29 September]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }}),
however, the errors divided by the predicted uncertainties have a standard
deviation of 0.94 on the test population, and the uncertainties separate loud
signals from noise-only inputs.

<p class="note"><strong>Note.</strong> This reading list is a working summary
rather than a survey. I add to it as the project moves.</p>
