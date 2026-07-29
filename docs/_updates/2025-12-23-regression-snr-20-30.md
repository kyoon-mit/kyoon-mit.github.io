---
title: Chirp-mass regression trained on SNR 20–30, tested on 20–40
date: 2025-12-23
summary: >-
  First end-to-end result: an S4D model trained on a narrow SNR band and
  evaluated on a wider one, to see how the estimate degrades outside its
  training distribution.
---

The model is trained on a narrow signal-to-noise band and then tested on a wider
one, so the test set deliberately includes signals louder than anything seen in
training. The question is whether accuracy holds up outside the training
distribution, and how the error behaves as a function of SNR.

## Configuration

### Model

<dl class="specs">
  <div><dt>Architecture</dt><dd>S4D</dd></div>
  <div><dt>Model dimension</dt><dd>256</dd></div>
  <div><dt>Layers</dt><dd>8</dd></div>
  <div><dt>Parameters</dt><dd>≈ 1.3 M</dd></div>
</dl>

### Data

<dl class="specs">
  <div><dt>Training SNR</dt><dd>20 – 30<small>uniform</small></dd></div>
  <div><dt>Test SNR</dt><dd>20 – 40<small>uniform</small></dd></div>
  <div><dt>Time span</dt><dd>0 – 56 s</dd></div>
  <div><dt>Sampling rate</dt><dd>216 Hz<small>generated at 512 Hz, downsampled</small></dd></div>
  <div><dt>Train / validation</dt><dd>80,000 / 10,000</dd></div>
  <div><dt>Test</dt><dd>20,000 samples</dd></div>
</dl>

## Predicted versus true chirp mass

The paired distributions show how closely the predicted chirp-mass population
tracks the injected one across the full test set.

<div class="plot-full">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/hist_pred_chirp_truth_chirp.html"
   ratio="3 / 2"
   caption="Predicted and true chirp mass distributions over the 20,000-event test set." %}
</div>

## Fraction of events below an error cutoff, by SNR bin

Binning by SNR separates two effects that an aggregate error figure conflates:
intrinsic model bias, and the loss of accuracy at low SNR. Each bin reports the
fraction of events whose relative error falls below a given cutoff.

<div class="plot-full">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/snr_vs_cut_frac_events.html"
   ratio="3 / 2"
   caption="Fraction of events under successive relative-error cutoffs, per SNR bin." %}
</div>

## Relative error against SNR

The scatter shows the per-event picture; the violin summarizes the same data as
distributions per bin, which makes the tails easier to read.

<div class="plot-pair">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/scatter_snr_vs_rel_error.html"
   label="Per event"
   ratio="4 / 3"
   caption="Relative error versus SNR, one point per test event." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/violin_snr_vs_rel_error.html"
   label="Distribution per bin"
   ratio="4 / 3"
   caption="Relative-error distribution within each SNR bin." %}
</div>

## Additional figures

Supporting views of the same test set, collapsed by default.

<details class="extra">
  <summary>Absolute and relative error distributions, and the cutoff sweep</summary>
  <div class="extra__body">
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/abs_diff_chirp_mass.html"
   label="Absolute error"
   ratio="3 / 2"
   caption="Absolute difference between predicted and true chirp mass." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/rel_diff_chirp_mass.html"
   label="Relative error"
   ratio="3 / 2"
   caption="Relative difference between predicted and true chirp mass." %}
{% include plot.html
   src="/assets/plotly/chirp_mass_progress/2025-12-23/frac_events_vs_cutoff.html"
   label="Cutoff sweep"
   ratio="3 / 2"
   caption="Fraction of all events below a given relative-error cutoff, integrated over SNR." %}
  </div>
</details>

## Takeaway

Testing on SNR 20–40 after training on 20–30 puts half the test range outside the
training distribution. The SNR-resolved views are the useful ones here — they show
where the estimator holds and where it starts to break, which is what motivated
the next experiment: training directly on the louder band, and comparing that
against fine-tuning into it.
