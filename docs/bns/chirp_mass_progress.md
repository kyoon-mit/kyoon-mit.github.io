---
layout: page
title: BNS Chirp Mass
permalink: /bns/chirp_mass_progress/
---

<p><em>Last updated: {{ site.time | date: "%Y-%m-%d" }}</em></p>

This page documents my current results.

## Training Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 30]\)
- **Time span:** 0 s – 56 s
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Training:** 80,000 samples
- **Validation:** 10,000 samples

## Testing Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 40]\)
- **Time span:** 0 s – 56 s
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- 20,000 samples

## S4D Model

- **Model dimension (`d_model`):** 256
- **Number of layers (`n_layers`):** 8
- **Total parameters:** ≈ 1.3 M

<h2>Chirp Mass Histograms</h2>
<iframe src="{{ '/assets/plotly/hist_pred_chirp_truth_chirp.html' | relative_url }}" width="900" height="600"></iframe>

<h2>SNR bins vs. Fraction of events below cutoff (per bin)</h2>
<iframe src="{{ '/assets/plotly/snr_vs_cut_frac_events.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Relative error vs. SNR</h2>
<iframe src="{{ '/assets/plotly/scatter_snr_vs_rel_error.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Violin plot</h2>
<iframe src="{{ '/assets/plotly/violin_snr_vs_rel_error.html' | relative_url }}" width="900" height="600"></iframe>



