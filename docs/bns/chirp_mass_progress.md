---
layout: page
title: BNS Chirp Mass
permalink: /bns/chirp_mass_progress/
---

<p><em>Last updated: {{ site.time | date: "%Y-%m-%d" }}</em></p>
This page documents my current results.

---
<p><em>Last updated: 2026-01-02 </em></p>

# Comparing training on SNR [30, 40] vs. fine-tuning (pretrain [20, 30] -> fine-tune [30, 40])

### S4D Model

- **Model dimension (`d_model`):** 256
- **Number of layers (`n_layers`):** 8
- **Total parameters:** ≈ 1.3 M

### Model 1: From Scratch

#### Training Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([30, 40]\)
- **Time span:** 0 s – 55 s (8 sec before merger)
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Training:** 80,000 samples
- **Validation:** 10,000 samples

### Model 2: Transfer Learning

#### Pretraining:

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 30]\)
- **Time span:** 0 s – 55 s (8 sec before merger)
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Training:** 80,000 samples
- **Validation:** 10,000 samples

#### Fine-tuning:

- **Signal-to-Noise Ratio (SNR):** uniform in \([30, 40]\)
- **Time span:** 0 s – 55 s (8 sec before merger)
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Training:** 80,000 samples
- **Validation:** 10,000 samples

### Models 1 & 2 Testing Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([30, 40]\)
- **Time span:** 0 s – 55 s (8 sec before merger)
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- 10,000 samples

<h2>Chirp Mass Histograms</h2>
Model 1: From Scratch
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/hist_pred_chirp_truth_chirp.html' | relative_url }}" width="600" height="400"></iframe>

Model 2: Transfer Learning
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/hist_pred_chirp_truth_chirp.html' | relative_url }}" width="600" height="400"></iframe>

<h2>Violin plot</h2>
Model 1: From Scratch
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/violin_snr_vs_rel_error.html' | relative_url }}" width="600" height="400"></iframe>

Model 2: Transfer Learning
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/violin_snr_vs_rel_error.html' | relative_url }}" width="600" height="400"></iframe>

<h2>SNR bins vs. Fraction of events below cutoff</h2>
Model 1: From Scratch
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/snr_vs_cut_frac_events.html' | relative_url }}" width="600" height="400"></iframe>

Model 2: Transfer Learning
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/snr_vs_cut_frac_events.html' | relative_url }}" width="600" height="400"></iframe>

<h2>Validation loss during training</h2>
Model 1: From Scratch
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/val_loss.png' | relative_url }}" width="600" height="400"></iframe>

Model 2: Transfer Learning
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/val_loss.png' | relative_url }}" width="600" height="400"></iframe>

---
<p><em>Last updated: 2025-12-23 </em></p>

# Training on SNR [20, 30], testing on [20, 40]

### Training Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 30]\)
- **Time span:** 0 s – 56 s
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- **Training:** 80,000 samples
- **Validation:** 10,000 samples

### Testing Samples

- **Signal-to-Noise Ratio (SNR):** uniform in \([20, 40]\)
- **Time span:** 0 s – 56 s
- **Sampling rate:** generated at 512 Hz, downsampled to 216 Hz
- 20,000 samples

### S4D Model

- **Model dimension (`d_model`):** 256
- **Number of layers (`n_layers`):** 8
- **Total parameters:** ≈ 1.3 M

<h2>Chirp Mass Histograms</h2>
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2025-12-23/hist_pred_chirp_truth_chirp.html' | relative_url }}" width="900" height="600"></iframe>

<h2>SNR bins vs. Fraction of events below cutoff (per bin)</h2>
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2025-12-23/snr_vs_cut_frac_events.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Relative error vs. SNR</h2>
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2025-12-23/scatter_snr_vs_rel_error.html' | relative_url }}" width="900" height="600"></iframe>

<h2>Violin plot</h2>
<iframe src="{{ '/assets/plotly/chirp_mass_progress/2025-12-23/violin_snr_vs_rel_error.html' | relative_url }}" width="900" height="600"></iframe>



