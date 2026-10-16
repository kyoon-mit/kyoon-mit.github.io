---
title: Reproducing the single-tape baseline
date: 2026-10-01 09:00:00
summary: >-
  The analytic runaway model and the GRU margin estimator both reproduce,
  once two settings are matched.
---

The starting point is an analytic heat-balance model of one REBCO tape, which
gives the runaway current I* for any bath temperature and cooling, and a GRU
trained on simulated current ramps to estimate I* and the margin from the
sensor readings.

- **Analytic surface.** A 100 × 100 grid over bath temperature and cooling
  reproduces the shape of the reference figures. The values are very sensitive
  to n, the sharpness of the superconducting transition: changing n from 20
  to 30 moves I* by 10 to 15%.
- **GRU.** The estimate of I* and the margin curve reproduce closely, but only
  when the training loss weights every ramp step equally. With the code's
  default weighting, which favors steps near runaway, the early part of the
  margin curve is far off.

{% include figure.html src="/assets/img/magnets/2026-10-01/analytic_surface_stabilizer.png" alt="Analytic runaway current over bath temperature and cooling, tape with stabilizer" caption="Analytic I* for a tape with stabilizer. Gray: no runaway point." %}
