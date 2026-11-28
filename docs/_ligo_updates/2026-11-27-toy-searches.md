---
title: Three toy searches, and the full run
date: 2026-11-27 23:00:00
summary: >-
  Two scoring choices fixed for testing, three deliberately crude searches
  frozen and run end to end on one day of training data, and the full run
  over the whole dataset started.
---

- Fixed two scoring choices for testing: a 0.1 s matching tolerance, and a main false-alarm-rate threshold of 1/week.
- Built three toy searches and froze them: an excess-power search, a small 1D convolutional classifier on whitened 1 s windows, and a noise-only autoencoder. They are deliberately crude; the aim is to test the pipeline.
- Ran the whole chain on one day of training data: detector coincidence, a background from about a year of time slides, and scoring. All three searches ran end to end, and their false-alarm rates were honest on held-out noise. Their sensitivity is near zero, as expected for toys.
- The full run over the whole dataset started on a single GPU and should take about a day.
