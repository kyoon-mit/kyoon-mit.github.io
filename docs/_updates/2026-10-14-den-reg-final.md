---
title: "The den-reg run, finished: better at SNR 8 to 16, biased above 25"
date: 2026-10-14
summary: >-
  The joint denoiser and regressor with the shape and amplitude terms,
  trained from SNR 8, finished its 800 epochs on 11 October. Validation
  stopped improving near epoch 400. On 25,000 test signals per population,
  the final epoch is 7 to 12 points better within 1% at SNR 8 to 16 than
  epoch 339, and 21 to 24 points worse above SNR 25, where it pulls loud
  events toward the middle of the chirp-mass range.
---

{%- assign u = '/projects/bns/updates/' -%}

## The run

The run with the shape and amplitude terms from
[9 October]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}):
joint denoiser and regressor, 128 channels, 6 layers, chirp mass and mass
ratio, trained on SNR from a power law with index −3 from SNR 8, validated
on the same power law from SNR 4. It ran from 7 to 11 October, 800 epochs.

## Validation

{% include figure.html
   src="/assets/img/bns/2026-10-14/den_reg_val_curves.png"
   alt="Validation chirp-mass accuracy, denoiser overlap and gain against epoch over 800 epochs"
   label="Validation over 800 epochs"
   caption="Power law from SNR 4, 10-epoch running means. Dotted: epochs 339 and 799, the two tested checkpoints." %}

<div markdown="1">

| epochs | within 1% | within 2% | within 5% | within 10% | overlap | gain |
|---|---|---|---|---|---|---|
| 330 to 349 | 12.3% | 20.1% | 33.0% | 46.2% | 0.193 | 1.49 |
| 600 to 619 | 13.8% | 22.2% | 35.4% | 47.5% | 0.201 | 1.50 |
| 780 to 799 | 13.4% | 22.1% | 35.6% | 47.6% | 0.202 | 1.51 |

</div>

After about epoch 400 nothing moves by more than a point. The denoised
waveform's overlap with the true one ends at 0.20.

## The test

Epoch 799 against epoch 339 on the standard test (O3b background, 24,982
signal windows per population). Chirp mass within 1 / 2%:

<div markdown="1">

| SNR | power law from 4: epoch 339 | epoch 799 | power law from 8: epoch 339 | epoch 799 | uniform: epoch 339 | epoch 799 |
|---|---|---|---|---|---|---|
| 4 to 8 | 4 / 8% | 5 / 10% | | | 5 / 10% | 7 / 13% |
| 8 to 12 | 18 / 31% | 27 / 44% | 17 / 31% | 25 / 43% | 20 / 35% | 28 / 46% |
| 12 to 16 | 40 / 67% | 52 / 74% | 42 / 67% | 49 / 73% | 42 / 67% | 49 / 73% |
| 16 to 25 | 66 / 90% | 61 / 82% | 65 / 91% | 59 / 81% | 67 / 93% | 59 / 82% |
| 25 to 50 | 78 / 99% | 57 / 83% | 79 / 98% | 57 / 82% | 80 / 98% | 56 / 81% |
| all | 11 / 19% | 14 / 22% | 34 / 52% | 37 / 57% | 62 / 81% | 49 / 72% |

</div>

{% include figure.html
   src="/assets/img/bns/2026-10-14/den_reg_compare_snr4_uniform.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for epochs 339 and 799, uniform SNR 4 to 50"
   label="Uniform SNR 4 to 50"
   caption="Same scale in every panel." %}

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/den_reg_compare_snr4_powerlaw.png"
   alt="The same comparison, power law from SNR 4"
   label="Power law from SNR 4"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/den_reg_compare_snr8_powerlaw.png"
   alt="The same comparison, power law from SNR 8"
   label="Power law from SNR 8"
   caption="" %}
</div>

The same in all three populations:

- **SNR 8 to 16 improves:** 7 to 12 points within 1%, 6 to 13 within 2%.
  Most events in a power-law population are here, so the power-law totals
  go up by 3 to 5 points.
- **Above SNR 16 it gets worse:** at SNR 25 to 50, within 1% falls from 78 to
  80% to 56 to 57%, and within 2% from 98 to 99% to 81 to 83%. The uniform
  population has the most loud events, so its total falls (62 / 81% to
  49 / 72%).
- **Below SNR 8** it moves by 1 to 3 points.

## Loud events are pulled toward the middle

{% include figure.html
   src="/assets/img/bns/2026-10-14/den_reg_bias_snr25_50.png"
   alt="Relative chirp-mass error against true chirp mass at SNR 25 to 50 for epochs 339 and 799"
   label="Error against chirp mass, SNR 25 to 50"
   caption="Uniform population. Median and 1σ band of predicted over true chirp mass minus one, in bins of true chirp mass." %}

At SNR 25 to 50 the final epoch overestimates light systems (+3% at
1.0 M☉) and underestimates heavy ones (−0.7% at 2.6 M☉). Epoch 339 stays
between −0.5% and +0.9% everywhere. The scatter is about the same at both epochs (1σ
of 0.5 to 0.8%), so the loss at high SNR is this bias, not noise. Below
1.3 M☉ only 1% of loud events at epoch 799 are within 1%, against 81% at
epoch 339. I do not yet know why longer training does this.

## What it means

- Neither checkpoint is better everywhere; the choice depends on which SNR
  range matters. For a search, SNR 8 to 16 matters most, which favors
  epoch 799.
- The comparisons of
  [13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})
  already list both epochs. The learned long kernels stay 2.3 to 3 times
  ahead of the final den-reg within 1% at SNR 8 to 12.

## Standard test plots, epoch 799

The standard output of the test for the final checkpoint, per population:
chirp-mass accuracy against SNR, predicted against true chirp mass and mass
ratio, the chirp-mass z-score, and the predicted chirp-mass σ for signals and
noise with its ROC.

### Power law from SNR 4

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_chirp_mass_frac_within_vs_snr.png"
   alt="Chirp mass within 1, 2, 5 and 10%% against SNR, epoch 799, power law from SNR 4"
   label="Accuracy against SNR"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_chirp_mass_pred_vs_true.png"
   alt="Predicted against true chirp mass, median and 1σ band, epoch 799, power law from SNR 4"
   label="Chirp mass, predicted against true"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_mass_ratio_pred_vs_true.png"
   alt="Predicted against true mass ratio, median and 1σ band, epoch 799, power law from SNR 4"
   label="Mass ratio, predicted against true"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_chirp_mass_zscore.png"
   alt="Histogram of chirp-mass z-scores with a Gaussian fit, epoch 799, power law from SNR 4"
   label="Chirp-mass z-score"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_chirp_mass_sigma_sig_vs_bkg.png"
   alt="Predicted chirp-mass σ for signals and for noise, epoch 799, power law from SNR 4"
   label="σ, signal and noise"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_powerlaw_chirp_mass_roc_loglog_sigma.png"
   alt="ROC of the predicted chirp-mass σ as a detection score, log axes, epoch 799, power law from SNR 4"
   label="ROC of σ"
   caption="" %}
</div>

### Power law from SNR 8

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_chirp_mass_frac_within_vs_snr.png"
   alt="Chirp mass within 1, 2, 5 and 10%% against SNR, epoch 799, power law from SNR 8"
   label="Accuracy against SNR"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_chirp_mass_pred_vs_true.png"
   alt="Predicted against true chirp mass, median and 1σ band, epoch 799, power law from SNR 8"
   label="Chirp mass, predicted against true"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_mass_ratio_pred_vs_true.png"
   alt="Predicted against true mass ratio, median and 1σ band, epoch 799, power law from SNR 8"
   label="Mass ratio, predicted against true"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_chirp_mass_zscore.png"
   alt="Histogram of chirp-mass z-scores with a Gaussian fit, epoch 799, power law from SNR 8"
   label="Chirp-mass z-score"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_chirp_mass_sigma_sig_vs_bkg.png"
   alt="Predicted chirp-mass σ for signals and for noise, epoch 799, power law from SNR 8"
   label="σ, signal and noise"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr8_powerlaw_chirp_mass_roc_loglog_sigma.png"
   alt="ROC of the predicted chirp-mass σ as a detection score, log axes, epoch 799, power law from SNR 8"
   label="ROC of σ"
   caption="" %}
</div>

### Uniform SNR 4 to 50

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_chirp_mass_frac_within_vs_snr.png"
   alt="Chirp mass within 1, 2, 5 and 10%% against SNR, epoch 799, uniform SNR 4 to 50"
   label="Accuracy against SNR"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_chirp_mass_pred_vs_true.png"
   alt="Predicted against true chirp mass, median and 1σ band, epoch 799, uniform SNR 4 to 50"
   label="Chirp mass, predicted against true"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_mass_ratio_pred_vs_true.png"
   alt="Predicted against true mass ratio, median and 1σ band, epoch 799, uniform SNR 4 to 50"
   label="Mass ratio, predicted against true"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_chirp_mass_zscore.png"
   alt="Histogram of chirp-mass z-scores with a Gaussian fit, epoch 799, uniform SNR 4 to 50"
   label="Chirp-mass z-score"
   caption="" %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_chirp_mass_sigma_sig_vs_bkg.png"
   alt="Predicted chirp-mass σ for signals and for noise, epoch 799, uniform SNR 4 to 50"
   label="σ, signal and noise"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-14/ep799_snr4_uniform_chirp_mass_roc_loglog_sigma.png"
   alt="ROC of the predicted chirp-mass σ as a detection score, log axes, epoch 799, uniform SNR 4 to 50"
   label="ROC of σ"
   caption="" %}
</div>
