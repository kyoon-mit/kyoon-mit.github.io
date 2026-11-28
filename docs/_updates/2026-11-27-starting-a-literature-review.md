---
title: "Starting a literature review: machine learning in compact binary searches"
date: 2026-11-27
tags: [detection, regression, denoising]
summary: >-
  We are starting a literature review of machine learning methods for
  compact binary coalescence searches. We have not read the papers yet. This
  entry lists the labels each paper will get and the existing reviews we
  will start from.
---

We are starting a literature review of machine learning methods used to
search for gravitational waves from compact binary coalescences. We have not
read the papers yet; this entry records only how they will be sorted and
where we will start.

## Labels

Each paper gets one label per column.

| Column | Labels |
|---|---|
| Task | classification (signal or noise), regression (point estimates of source parameters), posterior (full posterior over source parameters), denoising (recover the signal from noisy data) |
| Architecture | MLP, shallow CNN, deep CNN, matched filter then CNN, recurrent network, transformer, state-space model, normalizing flow, autoencoder |
| Input | strain samples, Fourier transform, spectrogram |
| Signal | BBH, BNS, NSBH, more than one |
| Window | data include the merger, or data end before it |
| Noise | simulated, or real detector noise |
| Detectors | 1, 2 or 3 |
| Metric | AUROC, sensitive distance (the radius of the sensitive volume) at a stated false-alarm rate, accuracy, other |
| Matched filter | compared against one or not, and the result |
| Code | released or not |

Early warning is not a separate task here: it is any of the tasks above on
data that end before the merger.

## Where we start

Existing reviews, not yet read:

- Cuoco et al., "Applications of machine learning in gravitational wave
  research with current interferometric detectors", Living Rev. Relativ. 28,
  2 (2025), [arXiv:2412.15046](https://arxiv.org/abs/2412.15046).
- Zhao et al., "Dawning of a New Era in Gravitational Wave Data Analysis:
  Unveiling Cosmic Mysteries via Artificial Intelligence, A Systematic
  Review", Front. Phys. 20, 045301 (2025),
  [arXiv:2311.15585](https://arxiv.org/abs/2311.15585).
- Stergioulas, "Machine Learning Applications in Gravitational Wave
  Astronomy" (2024), [arXiv:2401.07406](https://arxiv.org/abs/2401.07406).
- Benedetto et al., "AI in Gravitational Wave Analysis, an Overview", Appl.
  Sci. 13, 9886 (2023),
  [doi:10.3390/app13179886](https://doi.org/10.3390/app13179886).
- Cuoco et al., "Enhancing Gravitational-Wave Science with Machine
  Learning", Mach. Learn.: Sci. Technol. 2, 011002 (2021),
  [arXiv:2005.03745](https://arxiv.org/abs/2005.03745).

A benchmark rather than a review, also not yet read: Schäfer et al.,
"First machine learning gravitational-wave search mock data challenge"
(MLGWSC-1), Phys. Rev. D 107, 023021 (2023),
[arXiv:2209.11146](https://arxiv.org/abs/2209.11146).
