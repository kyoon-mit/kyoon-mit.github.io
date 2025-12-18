---
layout: page
title: BNS Parameter Regression — Progress
permalink: /bns/chirp_mass_progress/
---

<p><em>Last updated: {{ site.time | date: "%Y-%m-%d" }}</em></p>

This page documents my current results.

## Training Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 30]\)
- **Time span:** 0 s – 56 s
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Dataset split:**
  - **Training:** 80,000 samples
  - **Validation:** 10,000 samples
  - **Test:** 10,000 samples

## S4D Model

- **Model dimension (`d_model`):** 256
- **Number of layers (`n_layers`):** 8
- **Total parameters:** ≈ 1.3 M

<h2>Fraction of events vs. SNR cutoff</h2>
<iframe src="{{ '/assets/plotly/frac_events_vs_cutoff.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Relative difference vs. SNR</h2>
<iframe src="{{ '/assets/plotly/rel_diff_chirp_mass.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Absolute difference vs. SNR</h2>
<iframe src="{{ '/assets/plotly/abs_diff_chirp_mass.html' | relative_url }}" width="900" height="600"></iframe>
