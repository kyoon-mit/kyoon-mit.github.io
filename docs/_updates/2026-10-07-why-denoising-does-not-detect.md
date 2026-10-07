---
title: Why denoising does not detect, and where Project 8 loses its core
date: 2026-10-07
summary: >-
  The joint model's sensitive volume, using its own uncertainty as the
  detection statistic, is 1 to 6% of the matched-filter searches. The denoiser
  cannot add information and learns nothing about noise. Training only on
  louder events did not help. On Project 8, the information for a sharp energy
  core is in our data; finding the carrier frequency under noise is what fails.
---

{%- assign u = '/projects/bns/updates/' -%}

## Sensitive volume with the model's own uncertainty

The epoch-630 checkpoint from the
[5 October update]({{ u | append: '2026-10-05-recipe-at-epoch-630/' | relative_url }})
was run over one week of O3b background and an injection set, with the
negative predicted chirp-mass uncertainty, −σ, as the ranking statistic and no
time integration.

{% include figure.html
   src="/assets/img/bns/2026-10-07/sensitive_volume.png"
   alt="Sensitive volume against false alarm rate for four equal-mass BNS systems: our model one to two orders of magnitude below GstLAL, MBTA and PyCBC"
   label="Sensitive volume against false alarm rate"
   caption="Our model (−σ) against the GWTC-3 search pipelines, four equal-mass systems. Log scale; bands are 1σ." %}

<div markdown="1">

| masses (M☉) | our model (Gpc³) | MBTA (Gpc³) | ratio |
|---|---|---|---|
| 1.4 + 1.4 | 1.2 × 10⁻⁴ | 9.5 × 10⁻³ | 1.3% |
| 1.6 + 1.6 | 5.2 × 10⁻⁴ | 1.3 × 10⁻² | 3.9% |
| 1.8 + 1.8 | 5.8 × 10⁻⁴ | 1.6 × 10⁻² | 3.6% |
| 2.0 + 2.0 | 1.1 × 10⁻³ | 1.8 × 10⁻² | 6.2% |

</div>

At a false alarm rate of about 100 per year, this is 1 to 6% of MBTA, about
where the July model stood. The better chirp-mass accuracy at SNR 8 to 25
did not carry over to detection.

## Why the denoiser does not help detection

- **A denoiser cannot add information.** Its output is a function of the same
  strain the regressor already sees. Trained jointly, denoiser and regressor
  are one larger regressor with an extra target. Project 8 showed the same:
  regressor alone and joint model end at the same energy error (figure below).
- **At low SNR the denoiser recovers little.** Its overlap with the true
  waveform on the realistic population is 0.06 to 0.14. Where detection is
  decided, there is little cleaned signal to pass on.
- **σ was never taught what noise looks like.** The regressor is masked out
  on noise-only windows, so nothing trains σ to be wide there. It narrows
  only once the chirp mass is pinned down, around SNR 12, while the searches
  detect from about SNR 8.
- **The denoiser learns signal shape, not noise.** With 96% of training
  windows carrying a signal, a chirp-shaped output on pure noise costs almost
  nothing, so a classifier placed after it would inherit that blindness.

## Training on louder events did not help

Two runs trained only on SNR 8 and above, the band that sets sensitive volume,
and validated on the realistic power-law population from SNR 4. Both level
off at the same place: about 9 to 10% of events within 1% in chirp mass,
16% within 2%, 29% within 5% and 43% within 10%.

{% include figure.html
   src="/assets/img/bns/2026-10-07/bns_den_reg_val.png"
   alt="Validation fraction of events within 1, 2, 5 and 10 percent in chirp mass against epoch for two SNR-8 runs and a fine-tune, on a shared scale"
   label="SNR-8 training, validated on the full population"
   caption="Fraction of validation events within 1, 2, 5 and 10% of the true chirp mass, same scale in every panel. The two SNR-8 runs plateau together. A fine-tune of the 630-epoch model on SNR 8+ never improved on its start." %}

{% include figure.html
   src="/assets/img/bns/2026-10-07/bns_den_reg_rho.png"
   alt="Denoiser overlap with the true waveform against epoch for the same three runs"
   label="Denoiser overlap"
   caption="The shape and amplitude terms double the overlap, with no effect on the chirp mass above." %}

- The shape and amplitude terms in the denoiser loss double the overlap (0.11
  against 0.06) and change nothing in the regression. Cleaner waveforms are
  not what limits the chirp mass.
- On the power-law test set, the SNR-8 model at epoch 336 against the
  630-epoch model trained from SNR 4, fraction within 1 / 2 / 5 / 10%:

<div markdown="1">

| SNR | trained from SNR 4, epoch 630 | trained from SNR 8, epoch 336 |
|---|---|---|
| 4 to 8 | 3 / 6 / 14 / 27% | 2 / 4 / 10 / 20% |
| 8 to 12 | 10 / 20 / 42 / 60% | 8 / 16 / 31 / 48% |
| 12 to 16 | 32 / 53 / 80 / 91% | 29 / 46 / 70 / 84% |
| 16 to 25 | 48 / 82 / 97 / 99% | 56 / 79 / 95 / 98% |
| 25 to 50 | 54 / 94 / 100 / 100% | 75 / 95 / 100 / 100% |

</div>

  Training from SNR 8 sharpened the loud events at 1% (75% against 54% above
  SNR 25) and lost ground everywhere below SNR 16, including the 8 to 12 band
  it saw most of. The comparison is not clean (different epoch, and that run
  saw half as many signals), so a matched rerun is in progress.
- A fine-tune of the 630-epoch model on SNR 8 and above stopped improving
  within 20 epochs.

## Project 8: the information is there

Our Project 8 models reproduce the spread of the internal Project 8 results
but not their sharp core: 4 to 5% of events within 1 eV for us, against a few
tens of percent there. Neither a larger model (128/6) nor fresh Gaussian noise
every step produced a core.

{% include figure.html
   src="/assets/img/bns/2026-10-07/p8_val.png"
   alt="Project 8 validation energy RMSE and within-2-eV fraction against epoch for four runs"
   label="Project 8 energy, validation"
   caption="All variants converge to about 20 eV RMS and about 10% within 2 eV. The regressor alone does as well as the joint model." %}

To see whether our data even contains a core, I built a best-case estimate.
Energy is fully determined by the carrier frequency, pitch angle, radius and
axial frequency: a cubic fit of the true values gives 0.08 eV RMS. So I gave
the estimator the true pitch, radius, axial frequency and slope, and asked it
only for the carrier frequency, taken from the spectrum peak. Cavity noise, the
full 61 µs window, 5,600 test events.

<div markdown="1">

| carrier frequency from | within 1 eV | within 2 eV | median error |
|---|---|---|---|
| truth | 100% | 100% | 0.04 eV |
| spectrum peak, noise-free trace | 26% | 42% | 2.6 eV |
| spectrum peak, noisy trace | 7% | 14% | 9.7 eV |
| our network | 4–5% | about 10% | |

</div>

- A core is reachable in our data: with the carrier frequency known, every
  event lands within 1 eV, and even a noise-free spectrum peak gives a
  core-sized fraction.
- The loss is in finding the carrier. The axial sidebands, at ±2 f_axial, are
  nearly as strong as the carrier at low pitch, and the peak often lands on
  one. Noise makes this worse.
- Even a plain spectrum peak beats our network, so the network is not
  extracting what the data holds. I had guessed the core came from the
  dataset; for our data that is wrong.

The internal results come from longer recordings. For a stationary tone SNR
grows as the square root of duration and frequency precision roughly as
duration to the −3/2, so longer recordings alone could explain much of the gap.

## Next: a loss built on the matched filter

The searches score data by filtering it with a template and reading the SNR
time series, which spikes when the template matches. A new denoiser loss asks
the network's output to reproduce that series: filter the data with the
network's output and with the true waveform, in each detector, over every time
shift, and match the two. On noise-only windows the target is zero at every
shift, so a hallucinated chirp is penalized directly.

{% include figure.html
   src="/assets/img/bns/2026-10-07/snr_series_peaks.png"
   alt="Peak matched-filter SNR of the denoiser output on signal and noise-only windows over the first 15 epochs"
   label="SNR-series denoiser, first epochs"
   caption="Peak SNR of the output on signal windows and on noise-only windows. After 15 epochs they are not yet separated." %}

Also running: a matched-filter benchmark on the same test windows the network
sees, to measure what a template bank achieves on chirp mass and detection at
SNR 8 to 12. See the
[brainstorm]({{ '/projects/bns/brainstorm/' | relative_url }}).
