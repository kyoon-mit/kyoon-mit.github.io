---
title: The joint model on real-looking events, and Project 8 as a test bed
date: 2026-09-29
summary: >-
  The joint denoiser and chirp-mass regressor is excellent above SNR 16 and
  close to the prior below 8, where three quarters of events live. On Project 8
  electron chirps, the same recipe matches the overall spread of internal
  Project 8 results but not their sharp core.
talk:
  title: "Denoiser + regressor: BNS and Project 8"
  venue: "LIGO meeting"
  about: >-
    The joint model on the power-law population, what the denoiser recovers at SNR 50 and 4, Project 8 as a test bed and how far our result sits from the internal Project 8 results, the heterodyned pre-merger denoiser, and the next steps.
---

## BNS: the joint model on a power-law population

<dl class="specs">
  <div><dt>Model</dt><dd>S4D denoiser + regressor<small>128 wide, 4 layers each</small></dd></div>
  <div><dt>Training</dt><dd>Power-law SNR, index −3<small>4 to 100, 1415 epochs</small></dd></div>
  <div><dt>Checkpoint</dt><dd>Epoch 970<small>best validation denoiser loss</small></dd></div>
  <div><dt>Test set</dt><dd>25,790 signals<small>+ 25,410 noise-only</small></dd></div>
  <div><dt>Test SNR</dt><dd>Median 5.6<small>76% below 8</small></dd></div>
  <div><dt>Calibration</dt><dd>z-score std 0.94<small>uncertainties honest</small></dd></div>
</dl>

<div class="table-scroll" markdown="1">

| SNR | events | within 2% | within 5% | within 10% | median σ (M☉) |
|---|---|---|---|---|---|
| 4 to 6 | 14,476 | 5% | 12% | 24% | 0.52 |
| 6 to 8 | 5,021 | 8% | 18% | 33% | 0.51 |
| 8 to 12 | 3,589 | 17% | 36% | 54% | 0.44 |
| 12 to 16 | 1,238 | 42% | 67% | 83% | 0.12 |
| 16 to 25 | 950 | 78% | 93% | 97% | 0.03 |
| 25 to 50 | 516 | 97% | 100% | 100% | 0.02 |

</div>

The uncertainties are well calibrated: where the model does not know, it says
so, and its σ approaches the width of the chirp-mass prior. That is also why σ
alone is a weak detector on this population. Most signals are quiet enough to
look like noise to the model (AUC 0.62).

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-09-29/chirp_mass_frac_within_vs_snr.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent of the true chirp mass against SNR"
   label="Accuracy against SNR"
   caption="Fraction of test events within a relative error, per SNR bin. The model works above SNR about 15." %}
{% include figure.html
   src="/assets/img/bns/2026-09-29/chirp_mass_pred_vs_true_snr4-50.png"
   alt="Predicted against true chirp mass with a one-sigma band, for SNR 4 to 50"
   label="Predicted against true"
   caption="Median prediction and 1σ band. Dominated by quiet events, the estimate is pulled toward the mean of the prior." %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-09-29/chirp_mass_sigma_sig_vs_bkg.png"
   alt="Distribution of predicted chirp-mass uncertainty for signals and for noise-only inputs"
   label="Uncertainty, signal and noise"
   caption="Predicted σ for signals (sharp peak near zero from the loud events) and for noise-only inputs (near the prior width). Quiet signals overlap the noise." %}
{% include figure.html
   src="/assets/img/bns/2026-09-29/bns_evolution_rows.png"
   alt="Reference events at SNR 50 and SNR 4: noisy input, true waveform and denoised output, in time and frequency"
   label="What the denoiser recovers"
   caption="Top: SNR 50, the chirp is recovered. Bottom: SNR 4, almost nothing is. Grey: input; black: true signal; red: denoised." %}
</div>

## Project 8: a cleaner test bed

[Project 8](https://www.project8.org/) measures the energy of single electrons
from their cyclotron radiation (CRES), a nearly constant radio tone with
sidebands, recorded as two channels (I and Q). The task, recover the electron
energy from the noisy recording, is the same shape as ours.

<dl class="specs">
  <div><dt>Events</dt><dd>50,827 simulated<small>40K / 5K / 5.6K split</small></dd></div>
  <div><dt>Recording</dt><dd>24,576 samples<small>403 MHz, 61 µs, I and Q</small></dd></div>
  <div><dt>Target</dt><dd>Electron energy<small>18.5 to 18.6 keV</small></dd></div>
  <div><dt>SNR</dt><dd>4 to 36<small>median 21, optimal matched filter</small></dd></div>
</dl>

{% include figure.html
   src="/assets/img/bns/2026-09-29/p8_event_row.png"
   alt="A Project 8 event: noisy and clean I/Q channels in time, and their spectra"
   caption="One Project 8 event in time and frequency." %}

Internal Project 8 results show an S4D denoiser trained jointly with an
energy regressor doing something striking. Selecting the events with the
smallest predicted uncertainty leaves a core whose resolution is nearly two
orders of magnitude sharper than the overall spread, and competitive with the
standard reconstruction. A sharp core picked out by the model's own
uncertainty is exactly the behaviour BNS needs at low SNR.

We trained the same joint model in our codebase on the same data:

| model | validation RMSE (eV) | validation R² | test spread, most confident quarter |
|---|---|---|---|
| denoiser + regressor, 20.3 µs window | 20.0 | 0.52 | 9.7 eV |
| denoiser + regressor, 61 µs window | 19.7 | 0.54 | |
| regressor alone, no denoiser, 20.3 µs | 20.2 | 0.52 | |

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-09-29/ours_residual_wide.png"
   alt="Histogram of energy residuals for all events and for the lowest-uncertainty subsets"
   label="Our residuals"
   caption="Energy residuals over ±80 eV. The overall spread is comparable to the internal Project 8 results; the narrow core does not appear. The most confident quarter is only twice as sharp as the whole, and the smallest predicted σ on any event is 3.8 eV." %}
{% include figure.html
   src="/assets/img/bns/2026-09-29/p8_window_rmse.png"
   alt="Validation energy RMSE against epoch for one and three spectral bins of recording"
   label="Recording length"
   caption="Tripling the recording length barely changes the error." %}
</div>

So the spread is reproduced, the core is not: ours falls more than an order of
magnitude short of it. The denoiser also adds nothing over a plain regressor at
this size. Two differences between the setups remain:

1. **Model size.** The internal Project 8 results come from a model several
   times larger.
2. **Noise.** The internal Project 8 results were trained on fresh Gaussian
   noise every step, with each signal shown several times per epoch; ours used
   the stored noise, fixed.

Both are now running as separate Project 8 tests. The
[next update]({{ '/projects/bns/updates/2026-10-01-recipe-on-bns/' | relative_url }})
carries them to BNS at the same time.
