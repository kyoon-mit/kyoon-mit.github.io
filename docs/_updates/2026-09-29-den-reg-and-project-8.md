---
title: "Denoiser plus regressor trained together: 78 to 97% within 2% of chirp mass above SNR 16, 5 to 8% below SNR 8"
date: 2026-09-29
tags: [denoising, regression, project-8]
summary: >-
  The joint denoiser and chirp-mass regressor puts 78 to 97% of events within
  2% above SNR 16 and stays close to the prior below SNR 8, where three
  quarters of our test events are. On Project 8
  electron chirps, the same recipe matches the overall spread of internal
  Project 8 results but not their sharp core.
talk:
  title: "Denoiser + regressor: BNS and Project 8"
  venue: "LIGO meeting"
  about: >-
    The joint model on the power-law population, what the denoiser recovers at SNR 50 and 4, Project 8 as a test bed and how far our result sits from the internal Project 8 results, the heterodyned pre-merger denoiser, and the next steps.
---

{% include notice-snr-powerlaw.html %}

## BNS: the joint model on a power-law population

<dl class="specs">
  <div><dt>Model</dt><dd>S4D denoiser + regressor<small>128 wide, 4 layers each</small></dd></div>
  <div><dt>Training</dt><dd>Power-law SNR, index −3<small>4 to 100, checkpoint at epoch 1415</small></dd></div>
  <div><dt>Checkpoint</dt><dd>Epoch 970<small>best validation denoiser loss</small></dd></div>
  <div><dt>Test set</dt><dd>25,790 signals<small>+ 25,410 noise-only</small></dd></div>
  <div><dt>Test SNR</dt><dd>Median 5.6<small>76% below 8</small></dd></div>
  <div><dt>Calibration</dt><dd>z-score std 0.94<small>over all test signals</small></dd></div>
</dl>

The SNR is drawn with probability density ∝ SNR⁻³, from 4 to 100 in training
and 4 to 50 in the test. That puts 75.5% of test events below SNR 8 (median
5.64); sources spread uniformly in volume give a steeper density, ∝ SNR⁻⁴
(Schutz 2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421)), with
87.5% below SNR 8 ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).

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

The predicted σ follows the actual errors on average: the z-score (error
divided by σ) has standard deviation 0.94 over all test signals. That is a
necessary check, not a full one; by SNR bin the spread is 1.02 at SNR 4 to 6
and 0.69 to 0.78 above SNR 8, where σ is larger than the errors
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-zscore)). Where the model does not know, it says
so: at SNR 4 to 6 its median σ is 0.52 M☉, against 0.548 M☉ for the standard
deviation of the chirp-mass prior, uniform on 0.85 to 2.75 M☉
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-prior)). That is also why σ alone is a weak
detector on this population. Most signals are quiet enough to look like noise
to the model (AUC 0.62).

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-09-29/chirp_mass_frac_within_vs_snr.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent of the true chirp mass against SNR"
   label="Accuracy against SNR"
   caption="Fraction of test events within a relative error, per SNR bin. Above SNR 16, 78% or more of events are within 2%." %}
{% include figure.html
   src="/assets/img/bns/2026-09-29/chirp_mass_pred_vs_true_snr4-50.png"
   alt="Predicted against true chirp mass with a one-sigma band, for SNR 4 to 50"
   label="Predicted against true"
   caption="Median prediction and 1σ band. Dominated by quiet events, the estimate is pulled toward the mean of the prior, 1.80 M☉: the regressor's mean output is trained toward the mean of the target given the input (Goodfellow et al. 2016, Deep Learning, section 6.2.1.2), which for an uninformative input is the prior mean." %}
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
from their cyclotron radiation (CRES): the cyclotron frequency shifts with the
electron's relativistic energy, which allows a precise energy measurement
(Asner et al. 2015, [arXiv:1408.5362](https://arxiv.org/abs/1408.5362)). In
the simulated events we use, the signal is a nearly constant radio tone with
sidebands, recorded as two channels (I and Q). The task, recover the electron
energy from the noisy recording, is the same shape as ours.

<dl class="specs">
  <div><dt>Events</dt><dd>50,600 simulated<small>40,000 / 5,000 / 5,600 split</small></dd></div>
  <div><dt>Recording</dt><dd>24,576 samples<small>403 MHz, 61 µs, I and Q</small></dd></div>
  <div><dt>Target</dt><dd>Electron energy<small>18.5 to 18.6 keV</small></dd></div>
  <div><dt>SNR</dt><dd>4.3 to 36.1<small>median 20.8, optimal matched filter (<a href="{{ '/projects/bns/derivations/' | relative_url }}#sep-p8-snr">how computed</a>)</small></dd></div>
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

| model | validation RMSE (eV) | validation R² | test residual std, most confident quarter |
|---|---|---|---|
| denoiser + regressor, 20.3 µs window | 20.0 | 0.52 | 9.7 eV |
| denoiser + regressor, 61 µs window | 19.7 | 0.54 | |
| regressor alone, no denoiser, 20.3 µs | 20.2 | 0.52 | |

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-09-29/ours_residual_wide.png"
   alt="Histogram of energy residuals for all events and for the lowest-uncertainty subsets"
   label="Our residuals"
   caption="Energy residuals over ±80 eV. The overall spread is comparable to the internal Project 8 results; the narrow core does not appear. The quarter of test events with the smallest predicted σ has a residual standard deviation of 9.7 eV, against a test RMSE of 20.0 eV for all events, and the smallest predicted σ on any event is 3.8 eV." %}
{% include figure.html
   src="/assets/img/bns/2026-09-29/p8_window_rmse.png"
   alt="Validation energy RMSE against epoch for one and three spectral bins of recording"
   label="Recording length"
   caption="Tripling the recording length, 20.3 to 61 µs, changes the validation RMSE from 20.0 to 19.7 eV." %}
</div>

So the spread is reproduced, the core is not: ours falls more than an order of
magnitude short of it. The denoiser also adds nothing over a plain regressor at
this size (20.0 against 20.2 eV). Two differences between the setups remain:

1. **Model size.** The internal Project 8 results come from a model several
   times larger.
2. **Noise.** The internal Project 8 results were trained on fresh Gaussian
   noise every step, with each signal shown several times per epoch; ours used
   the stored noise, fixed.

Both are now running as separate Project 8 tests. The
[next update]({{ '/projects/bns/updates/2026-10-01-recipe-on-bns/' | relative_url }})
carries them to BNS at the same time.
