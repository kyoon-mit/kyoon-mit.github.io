---
title: Why denoising does not detect, and where Project 8 loses its core
date: 2026-10-07
tags: [denoising, detection, project-8]
summary: >-
  The joint model's sensitive volume, using its own uncertainty as the
  detection statistic, is 1 to 6% of the matched-filter searches. The denoiser
  cannot add information and is barely trained on noise. Training only on
  louder events did not help. On Project 8, the information for a sharp energy
  core is in our data; finding the carrier frequency under noise is what fails.
---

{%- assign u = '/projects/bns/updates/' -%}

{% include notice-snr-powerlaw.html %}

## Sensitive volume with the model's own uncertainty

The epoch-630 checkpoint from the
[5 October update]({{ u | append: '2026-10-05-recipe-at-epoch-630/' | relative_url }})
was run over one week of O3b background (579,108 s, with 72 time-shifted
copies of the two detectors' data) and an injection set, with the negative
predicted chirp-mass uncertainty, −σ, as the ranking statistic and no time
integration. The volume is computed with aframe's tools (Marx et al. 2025,
[arXiv:2403.18661](https://arxiv.org/abs/2403.18661)), which weight the
injections as in Tiwari 2018
([arXiv:1712.00482](https://arxiv.org/abs/1712.00482)). The volumes of the
GWTC-3 search pipelines (GWTC-3,
[arXiv:2111.03606](https://arxiv.org/abs/2111.03606)) come from the
LIGO–Virgo–KAGRA O3 search-sensitivity release,
[Zenodo 7890437](https://zenodo.org/records/7890437). The pipelines are
GstLAL (Messick et al. 2017, [arXiv:1604.04324](https://arxiv.org/abs/1604.04324)),
MBTA (Aubin et al. 2021, [arXiv:2012.11512](https://arxiv.org/abs/2012.11512))
and PyCBC (Usman et al. 2016, [arXiv:1508.02357](https://arxiv.org/abs/1508.02357)).

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

At a false alarm rate of 109 per year (two false alarms in the 579,108 s of
background), this is 1.3 to 6.2% of MBTA. That is no better than the July
model, which the
[30 July update]({{ u | append: '2026-07-30-reality-check/' | relative_url }})
put roughly an order of magnitude below the searches. The better chirp-mass
accuracy at SNR 8 to 25 did not carry over to detection.

## Why the denoiser does not help detection

- **A denoiser cannot add information.** Its output is a function of the same
  strain the regressor already sees, and a function of the data cannot carry
  more information about the source than the data itself (the data-processing
  inequality; Cover and Thomas, *Elements of Information Theory*, 2nd ed.,
  Wiley 2006, section 2.8). Trained jointly, denoiser and regressor are one
  larger regressor with an extra target. Project 8 showed the same: regressor
  alone and joint model end at the same energy error (figure below).
- **At low SNR the denoiser recovers little.** Its overlap with the true
  waveform on validation events is 0.06 to 0.14. Their SNR is drawn with
  density ∝ SNR⁻³ from 4 to 100, so 75.1% of them are below SNR 8
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).
  Where detection is decided, there is little cleaned signal to pass on.
- **σ was never taught what noise looks like.** The regressor is masked out
  on noise-only windows, so nothing trains σ to be wide there. On the
  uniform-SNR test windows (SNR 4 to 50) its median is 0.46 M☉ at SNR 8 to
  10, close to the 0.54 M☉ it gives on pure noise; it falls to 0.22 M☉ at
  SNR 10 to 12 and 0.07 M☉ at SNR 12 to 14. A matched filter on the same
  windows already separates SNR 8 to 12 signals from empty windows with an
  AUC of 0.98 ([next entry]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }})).
- **The denoiser learns signal shape, not noise.** Only 4% of training
  windows are noise-only, so a chirp-shaped output on pure noise is penalized
  on only 4% of windows. My guess, not tested, is that a classifier placed
  after it would inherit that blindness.

## Training on louder events did not help

Two runs trained only on SNR 8 and above (density ∝ SNR⁻³ from 8 to 100).
Detection near SNR 8 decides most of a search's sensitive volume: for sources
spread uniformly in volume, 70% of the events above SNR 8 are below SNR 12,
and a search that needs SNR 12 covers 30% of the volume of one that works
from SNR 8
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).
Both runs were validated on SNR drawn with density ∝ SNR⁻³ from 4 to 100,
which falls more slowly than the SNR⁻⁴ of sources spread uniformly in volume
(Schutz 2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421)). Both
level off at the same place, read from the curves below: 9 to 10% of events
within 1% in chirp mass, 16% within 2%, 29% within 5% and 43% within 10%.

{% include figure.html
   src="/assets/img/bns/2026-10-07/bns_den_reg_val.png"
   alt="Validation fraction of events within 1, 2, 5 and 10 percent in chirp mass against epoch for two SNR-8 runs and a fine-tune, on a shared scale"
   label="SNR-8 training, validated on the full population"
   caption="Fraction of validation events within 1, 2, 5 and 10% of the true chirp mass, same scale in every panel. The two SNR-8 runs plateau together. A fine-tune of the 630-epoch model on SNR 8+ never improved on its start." %}

{% include figure.html
   src="/assets/img/bns/2026-10-07/bns_den_reg_rho.png"
   alt="Denoiser overlap with the true waveform against epoch for the same three runs"
   label="Denoiser overlap"
   caption="The shape and amplitude terms double the overlap. (Correction, 9 October: the run with them used half background windows by mistake, so its chirp-mass curve above is not a fair comparison. See the 9 October update.)" %}

- The shape and amplitude terms in the denoiser loss double the overlap (0.11
  against 0.06). **Correction (9 October):** I first wrote that they change
  nothing in the regression. That comparison was confounded: the run with
  them saw half background windows by mistake. With matched settings they
  help the chirp mass; see the
  [9 October update]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}).
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
  that held 56% of its training signals
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#snr-population)).
  The comparison is not clean (different epoch, and that run had a signal in
  50% of its training windows, against 96%), so a matched rerun is in
  progress.
- A fine-tune of the 630-epoch model on SNR 8 and above stopped improving
  within 20 epochs.

## Project 8: the information is there

Our Project 8 models reproduce the spread of the internal Project 8 results
but not their sharp core: 4 to 5% of events within 1 eV for us, against tens
of percent there. Neither a larger model (128/6) nor fresh Gaussian noise
every step produced a core.

{% include figure.html
   src="/assets/img/bns/2026-10-07/p8_val.png"
   alt="Project 8 validation energy RMSE and within-2-eV fraction against epoch for four runs"
   label="Project 8 energy, validation"
   caption="All variants converge to about 20 eV RMS and about 10% within 2 eV. The regressor alone does as well as the joint model." %}

To see whether our data even contains a core, I built a best-case estimate.
The electron's energy follows from its cyclotron frequency,
f = eB/(2πγm<sub>e</sub>) with γ = 1 + E/(m<sub>e</sub>c²), and the field it
sees depends on where it moves in the trap, which its pitch angle sets
(Asner et al. 2015, PRL 114, 162501,
[arXiv:1408.5362](https://arxiv.org/abs/1408.5362)). In our data, a cubic
fit of the energy on the true carrier frequency, pitch angle, radius and
axial frequency gives 0.08 eV RMS. So I gave the estimator the true pitch,
radius, axial frequency and slope, and asked it only for the carrier
frequency, taken from the spectrum peak. Cavity noise, the full 61 µs window,
5,600 test events.

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
- The loss is in finding the carrier. The axial motion adds sidebands to the
  carrier (Asner et al. 2015); in our traces those at ±2 f_axial are nearly
  as strong as the carrier at low pitch angle, and the peak often lands on
  one. Noise makes this worse.
- Even a plain spectrum peak beats our network, so the network is not
  extracting what the data holds. I had guessed the core came from the
  dataset; for our data that is wrong.

The internal results come from longer recordings. For a stationary tone of
fixed amplitude in white noise, the SNR grows as the square root of the
duration and the best possible frequency precision as the duration to the
−3/2 (Rife and Boorstyn 1974, IEEE Trans. Inf. Theory 20, 591;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#oct7-tone-precision)),
so longer recordings alone could explain much of the gap.

## Next: a loss built on the matched filter

The searches score data by filtering it with a template and reading the SNR
time series, which spikes when the template matches (Allen et al. 2012,
FINDCHIRP, [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)). A
new denoiser loss asks the network's output to reproduce that series: filter
the data with the network's output and with the true waveform, in each
detector, over every time shift, and match the two. On noise-only windows the
target is zero at every shift, so a hallucinated chirp is penalized directly.

{% include figure.html
   src="/assets/img/bns/2026-10-07/snr_series_peaks.png"
   alt="Peak matched-filter SNR of the denoiser output on signal and noise-only windows over the first 15 epochs"
   label="SNR-series denoiser, first epochs"
   caption="Peak SNR of the output on signal windows and on noise-only windows. After 15 epochs they are not yet separated." %}

A matched filter run on the same test windows the network sees is in the
[next entry]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}):
the information the network misses is there.
