---
title: The Project 8 recipe at epoch 630
date: 2026-10-05
summary: >-
  Tested on the same power-law population as the baseline, the larger joint
  model is clearly better between SNR 8 and 25 and unchanged below 8, where
  most events are. Its uncertainties are well calibrated. Mass ratio is barely
  learned at any SNR.
---

The run started on [1 October]({{ '/projects/bns/updates/2026-10-01-recipe-on-bns/' | relative_url }})
reached epoch 630 of 800. Its latest checkpoint was tested on the usual
power-law set: O3b background, SNR following a power law with index −3 on 4 to
50, and half the samples pure background.

## Chirp mass against the baseline

| SNR | within 2%, this run | within 2%, baseline 128/4 | within 5%, this run | within 5%, baseline |
|---|---|---|---|---|
| 4 to 6 | 6% | 5% | 13% | 12% |
| 6 to 8 | 7% | 8% | 20% | 18% |
| 8 to 12 | 20% | 17% | 42% | 36% |
| 12 to 16 | 53% | 42% | 80% | 67% |
| 16 to 25 | 82% | 78% | 97% | 93% |
| 25 to 50 | 94% | 97% | 100% | 100% |

The gain is real but sits in the middle of the SNR range. Below SNR 8 nothing
moved: the estimate is still close to the prior there, as before. The z-score
spread is 0.99, so the reported uncertainties match the actual errors, and the
uncertainty-based detection AUC is 0.62, the same as the baseline.

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-05/chirp_mass_frac_within_vs_snr.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent of the true chirp mass against SNR, epoch 630"
   label="Chirp mass accuracy against SNR"
   caption="Fraction of test events within a relative error, per SNR bin." %}
{% include figure.html
   src="/assets/img/bns/2026-10-05/chirp_mass_pred_vs_true_snr4-50.png"
   alt="Predicted against true chirp mass with a one-sigma band, epoch 630"
   label="Chirp mass, predicted against true"
   caption="Median and 1σ band over the power-law test set." %}
</div>

## Mass ratio

Mass ratio is barely learned. 33% of events are within 10%, against 27%
within 10% at SNR 4 to 8, and only 41% even above SNR 16. It is a much weaker
imprint on the waveform than chirp mass. The uncertainties are again honest
(z-score spread 0.98), so the model knows it does not know.

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-05/mass_ratio_pred_vs_true_snr4-50.png"
   alt="Predicted against true mass ratio with a one-sigma band, epoch 630"
   label="Mass ratio, predicted against true"
   caption="Close to the prior across the range." %}
{% include figure.html
   src="/assets/img/bns/2026-10-05/chirp_mass_sigma_sig_vs_bkg.png"
   alt="Distribution of predicted chirp-mass uncertainty for signals and for noise-only inputs, epoch 630"
   label="Uncertainty, signal and noise"
   caption="Predicted chirp-mass σ for signals and for pure background." %}
</div>

<p class="note"><strong>A validation caveat.</strong> This run validates on the
training population, a power law with index −2, so its validation numbers
look better than this test (18% within 1% in validation, against 8% here).
Reweighting the test to index −2 reproduces the validation figures. Future runs
validate on index −3.</p>

A sensitive-volume measurement from this checkpoint, with −σ as the statistic
and one week of background, is in progress.
