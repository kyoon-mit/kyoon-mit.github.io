---
title: The Project 8 recipe at epoch 630
date: 2026-10-05
tags: [denoising, regression]
summary: >-
  Tested on the same power-law population as the baseline, the larger joint
  model is better between SNR 8 and 25 and unchanged below 8, where most
  events are. The spread of its z-scores is 0.99. Mass ratio is barely
  learned: 33% of events are within 10%, and one fixed guess for every
  event gets 34%.
---

{% include notice-snr-powerlaw.html %}

The run started on [1 October]({{ '/projects/bns/updates/2026-10-01-recipe-on-bns/' | relative_url }})
reached epoch 630 of 800. Its latest checkpoint was tested on the usual
power-law set: O3b background, SNR drawn with probability density ∝ SNR⁻³ on 4
to 50 (75.5% below SNR 8; flatter than the SNR⁻⁴ of sources spread uniformly in
volume, Schutz 2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421);
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)), and half the samples pure
background.

## Chirp mass against the baseline

| SNR | within 2%, this run | within 2%, baseline 128/4 | within 5%, this run | within 5%, baseline |
|---|---|---|---|---|
| 4 to 6 | 6% | 5% | 13% | 12% |
| 6 to 8 | 7% | 8% | 20% | 18% |
| 8 to 12 | 20% | 17% | 42% | 36% |
| 12 to 16 | 53% | 42% | 80% | 67% |
| 16 to 25 | 82% | 78% | 97% | 93% |
| 25 to 50 | 94% | 97% | 100% | 100% |

The gain sits in the middle of the SNR range (within 2% at SNR 8 to 25: 20,
53 and 82% against 17, 42 and 78%). Below SNR 8 nothing moved: the estimate is
still close to the prior there, as before. The z-score spread over all test
signals is 0.99, so on average the reported uncertainties match the actual
errors; that is a necessary check, not a full one, and above SNR 8 the spread
is 0.77 to 0.95, where σ is larger than the errors
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-zscore)). The uncertainty-based detection AUC
is 0.62, the same as the baseline.

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

Mass ratio is barely learned. 33% of events are within 10% (32% at SNR 4 to
8, 41% above SNR 16); predicting the training median, 0.793, for every event
would put 34% within 10% (36% above SNR 16)
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-prior)). It leaves a much weaker imprint on the
waveform than chirp mass: chirp mass sets the leading-order phase, while mass
ratio first enters one post-Newtonian order higher, and Cutler and Flanagan
estimated chirp mass measurable to 0.1 to 1% but the reduced mass only to 10
to 15% for neutron-star binaries (Cutler and Flanagan 1994,
[arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014)). The z-score
spread is again near 1 (0.98), and the median predicted σ, 0.159, matches the
spread of mass ratio in the test set (0.158): the model reports that it does
not know.

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
training population, a power law with index −2 on SNR 4 to 100, so its
validation numbers look better than this test (16% within 1% in validation at
epoch 630, varying from 14% to 29% over epochs 600 to 634, against 8% here).
Weighting each test event by its SNR turns the index −3 test into index −2 and
gives 16% within 1% and 28% within 2%, against 16% and 31% in validation. The
test stops at SNR 50 while validation reaches 100; the 4.2% of validation
events above SNR 50 have no counterpart in the test
(<a href="{{ '/projects/bns/derivations/' | relative_url }}#sep-reweight">derivation</a>). Future runs validate on
index −3.</p>

A sensitive-volume measurement from this checkpoint, with −σ as the statistic
and one week of background, is in progress.
