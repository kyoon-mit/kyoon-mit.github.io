---
layout: page
title: PhyTS (NeurIPS)
permalink: /projects/phyts/
summary: >-
  A benchmark of real physics time series for testing whether machine learning
  can pull weak signals out of noisy detector data, from gravitational waves to
  neutrino mass.
---

## About

Physics experiments record their data as time series: detector voltages, photon
counts and field amplitudes sampled over time. The signals scientists care
about, such as a neutron-star merger, an axion dark matter candidate or the
energy of a single electron, are often faint and buried in noise. That noise is
non-Gaussian, changes over time and depends on the detector. Standard
machine-learning benchmarks for time series rarely look like this, so good
benchmark scores do not show that a method will work in a real experiment.

PhyTS is a benchmark suite built from four physics experiments, spanning about
12 orders of magnitude in sampling rate:

- **Gravitational waves (LIGO):** estimate the chirp mass of simulated
  neutron-star mergers injected into real detector noise.
- **Stars and exoplanets (TESS):** classify real stellar light curves into eight
  variability classes, and estimate near-core rotation rates.
- **Dark matter (ABRACADABRA):** denoise detector readouts that contain
  hardware-injected, axion-like signals.
- **Neutrino mass (Project 8):** estimate the energy of single electrons from
  simulated cyclotron-radiation signals.

Each dataset comes with fixed training, validation and test splits, a standard
task and metric, and baseline results.

## Main findings

- Task-specific supervised models, especially state-space models (S4D, LinOSS),
  consistently outperform six pretrained time-series foundation models evaluated
  zero-shot (MOMENT, Chronos, Time-MoE, TimesFM, MOIRAI, Granite-TTM).
- The gap is largest for weak-signal recovery, denoising and precise parameter
  estimation. On Project 8, S4D reaches an energy error of about 15.7 eV,
  against about 25 eV for the best foundation models.
- Foundation models do moderately well on broad classification. On TESS,
  fine-tuning closes most of the gap: fully fine-tuned Time-MoE reaches 0.877
  balanced accuracy, against 0.887 for S4D.
- The results suggest that foundation models underperform because they have not
  seen physics-grade data, not because of a limit of deep learning. PhyTS is
  meant to support training and evaluating such models.

## Links

- **Paper:** link to follow once it is posted.
- **Code:** [github.com/kyoon-mit/PhyTS](https://github.com/kyoon-mit/PhyTS)
- **Datasets:** [huggingface.co/datasets/PhyTS-team/PhyTS-bench](https://huggingface.co/datasets/PhyTS-team/PhyTS-bench)
- **Related:** [TIDMAD dataset paper (arXiv:2406.04378)](https://arxiv.org/abs/2406.04378),
  source of the ABRACADABRA denoising task and score

## Authors and venue

The PhyTS Collaboration: Benedict Armstrong, Jeroen Audenaert, Hannah P. Binney,
Alice Cheng, Maarten De Vos, Luis Felipe Koehler Domingues, Allison Eto, Mary
Feliz, Joseph Formaggio, Jessica T. Fry, Philip Harris, Ilay Kamai, Erik
Katsavounidis, Mykyta Kliapets, Konstantinos Kontras, Aobo Li, Paul Pu Liang,
Daniel Muthukrishna, Christina Reissel, Daniela Rus, T. Konstantin Rusch, Avi
Shporer, Penny L. Slocum, Talia E. Weiss, Lindley A. Winslow, Kyungseop Yoon

*PhyTS: A Benchmark for Weak-Signal Recovery in Physics Time Series.* 40th
Conference on Neural Information Processing Systems (NeurIPS 2026), Track on
Evaluations and Datasets.
