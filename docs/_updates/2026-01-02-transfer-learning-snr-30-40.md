---
title: From scratch versus transfer learning at SNR 30–40
date: 2026-01-02
summary: >-
  Two matched S4D models on the same target band — one trained from scratch, one
  pretrained on SNR 20–30 and fine-tuned — compared under equal data budgets.
---

Does pretraining on a different SNR regime help? Two models with identical
architecture are trained toward the same target band, SNR 30–40. **Model 1** sees
only that band. **Model 2** is pretrained on SNR 20–30 and then fine-tuned on
30–40. Both get the same number of samples at every stage, and both are evaluated
on the same held-out test set, so the comparison isolates the effect of the
pretraining stage.

## Configuration

### Shared architecture

<dl class="specs">
  <div><dt>Architecture</dt><dd>S4D</dd></div>
  <div><dt>Model dimension</dt><dd>256</dd></div>
  <div><dt>Layers</dt><dd>8</dd></div>
  <div><dt>Parameters</dt><dd>≈ 1.3 M</dd></div>
</dl>

### Model 1 — from scratch

<dl class="specs">
  <div><dt>Training SNR</dt><dd>30 – 40<small>uniform</small></dd></div>
  <div><dt>Time span</dt><dd>0 – 55 s<small>8 s before merger</small></dd></div>
  <div><dt>Sampling rate</dt><dd>216 Hz<small>generated at 512 Hz, downsampled</small></dd></div>
  <div><dt>Train / validation</dt><dd>80,000 / 10,000</dd></div>
</dl>

### Model 2 — transfer learning

<dl class="specs">
  <div><dt>Pretraining SNR</dt><dd>20 – 30<small>uniform</small></dd></div>
  <div><dt>Fine-tuning SNR</dt><dd>30 – 40<small>uniform</small></dd></div>
  <div><dt>Time span</dt><dd>0 – 55 s<small>8 s before merger</small></dd></div>
  <div><dt>Sampling rate</dt><dd>216 Hz<small>generated at 512 Hz, downsampled</small></dd></div>
  <div><dt>Train / validation</dt><dd>80,000 / 10,000<small>at each stage</small></dd></div>
</dl>

### Evaluation — identical for both

<dl class="specs">
  <div><dt>Test SNR</dt><dd>30 – 40<small>uniform</small></dd></div>
  <div><dt>Time span</dt><dd>0 – 55 s<small>8 s before merger</small></dd></div>
  <div><dt>Sampling rate</dt><dd>216 Hz</dd></div>
  <div><dt>Test set</dt><dd>10,000 samples</dd></div>
</dl>

## Predicted versus true chirp mass

<div class="plot-pair">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/hist_pred_chirp_truth_chirp.html"
   label="Model 1 — from scratch"
   ratio="4 / 3"
   caption="Predicted and true chirp mass, trained on SNR 30–40 only." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/hist_pred_chirp_truth_chirp.html"
   label="Model 2 — transfer learning"
   ratio="4 / 3"
   caption="Predicted and true chirp mass, pretrained on 20–30 then fine-tuned on 30–40." %}
</div>

## Relative error by SNR bin

<div class="plot-pair">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/violin_snr_vs_rel_error.html"
   label="Model 1 — from scratch"
   ratio="4 / 3"
   caption="Relative-error distribution per SNR bin." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/violin_snr_vs_rel_error.html"
   label="Model 2 — transfer learning"
   ratio="4 / 3"
   caption="Relative-error distribution per SNR bin." %}
</div>

## Fraction of events below an error cutoff

<div class="plot-pair">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/snr_vs_cut_frac_events.html"
   label="Model 1 — from scratch"
   ratio="4 / 3"
   caption="Fraction of events under successive relative-error cutoffs, per SNR bin." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/snr_vs_cut_frac_events.html"
   label="Model 2 — transfer learning"
   ratio="4 / 3"
   caption="Fraction of events under successive relative-error cutoffs, per SNR bin." %}
</div>

## Validation loss during training

For Model 2 the curve covers the fine-tuning stage, so the two are read against
each other with the pretraining cost of Model 2 held off-plot.

<div class="plot-pair">
  <figure class="plot">
    <figcaption class="plot__label">Model 1 — from scratch</figcaption>
    <img src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/from_scratch/val_loss.png' | relative_url }}"
         alt="Validation loss curve for the model trained from scratch on SNR 30–40" loading="lazy">
  </figure>
  <figure class="plot">
    <figcaption class="plot__label">Model 2 — transfer learning</figcaption>
    <img src="{{ '/assets/plotly/chirp_mass_progress/2026-01-02/transfer_learning/val_loss.png' | relative_url }}"
         alt="Validation loss curve for the model pretrained on SNR 20–30 and fine-tuned on 30–40" loading="lazy">
  </figure>
</div>

## Notes

Both models are evaluated on the same test set, and the sample counts at each
stage are matched, so the comparison speaks to the value of the pretraining
stage rather than to a difference in data volume at the target band. The
remaining asymmetry is total compute: Model 2 has seen 80,000 additional
pretraining samples that Model 1 never gets, which is the fair cost to weigh any
improvement against.
