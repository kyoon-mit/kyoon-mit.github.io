---
title: Dataset design for the LIGO benchmark
date: 2026-10-15 18:00:00
summary: >-
  A group member designed the training and test data: documented training
  data, a sealed test set with signal classes held out from training, and
  several measures against gaming. Next: define the benchmarks.
---

## The dataset

A group member has designed the dataset the agents will work on.

- **Training data**, given to the agent: O3a data with injected signals of
  three types: binary black hole mergers, white-noise bursts and
  sine-Gaussians. Everything about it is documented, including where the
  injections are, so an agent can use it to build and tune its search.
- **Test data**, sealed: O3b data with the same three types, plus signal
  classes the agent never sees in training.

### Signal classes

- **Training, 39 waveforms:**
  - 19 sine-Gaussians: a sine wave under a bell-shaped envelope;
  - 16 white-noise bursts: a short burst of random noise in a frequency band;
  - 4 binary black hole mergers on circular orbits (BBH10, BBH35, BBH50,
    BBH125).
- **Test, 70 waveforms:** all 39 training waveforms, plus held-out classes,
  including:
  - 4 Gaussian pulses;
  - 3 cosmic string signals (cusp, kink, kink-kink);
  - 12 core-collapse supernova models;
  - 9 eccentric binary black hole mergers, on orbits that are not circular;
  - a class labelled PROCA_W85.

### Measures against gaming

- The injection times of the test set, and its GPS times, are kept secret.
  The training set is fully documented.
- The data alternate in one-day blocks over the whole run: one day of noise
  only, one day with injections, and so on. Both kinds of data therefore see
  about the same mix of detector noise conditions.
- The test set has five parts injection data to three parts noise-only data.
  Noise-only data can be reused many times by time slides, while more
  injections give more signals to test on.
- Injection times are random (a Poisson process) instead of evenly spaced.
  The gaps between injections range from 20 s to about 980 s, with a median
  of about 76 s.
- The GPS times in the test set are shifted by a random amount in every
  segment. This is meant to stop a search from downloading the public LIGO
  data for the same time and subtracting it to reveal the injections.

## What to do next

- **Define the benchmarks on this dataset:**
  - sensitivity at a fixed false-alarm rate: how far away, or how faint, a
    signal of each class can be and still be detected, when only candidates
    that noise would produce rarely (for example less than once per month or
    per year) are accepted;
  - honesty of the false-alarm rates: on the noise-only data, check that the
    rates the agent reports are true;
  - the probability that a candidate is a real signal: check that, of the
    candidates given 70 %, about 70 % are real;
  - latency: how soon the search reports a candidate;
  - the standard plots: the number of candidates above each false-alarm
    rate, compared with what noise alone would give; each injection marked
    found or missed, against its distance and mass or its time; the fraction
    of injections found, against signal loudness or distance; and the
    sensitivity against the false-alarm rate.
- **Write cheating submissions** for these benchmarks, and check that each
  scores below an honest reference search. Examples: a 99 % probability of
  being real for every candidate; false-alarm rates divided by ten; copying
  the training injection times.
- **Adapt the benchmark software:** add support for answers that are lists of
  candidate events, then build a toy task on simulated noise before the real
  dataset.
