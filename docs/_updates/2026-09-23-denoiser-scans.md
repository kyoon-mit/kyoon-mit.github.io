---
title: Denoiser scans, conditioning and heterodyning
date: 2026-09-23
tags: [denoising]
summary: >-
  With the loss repaired, the denoiser reaches an overlap of 0.797 with the
  true merger waveform and 0.900 before the merger, on SNR drawn uniformly
  from 4 to 100. Handing it the true
  parameters barely helps; heterodyning with the true chirp mass helps more,
  but presupposes it.
---

{% include notice-snr-powerlaw.html %}

<blockquote markdown="1">
Correction, 16 October: every run on this page had dropout 0.2 inside every layer of its S4D networks. The same setting made our S4D chirp-mass regressors fail on clean signals; with dropout 0 they put 99.9% of clean validation events within 1% of the true chirp mass ([why dropout broke our S4D]({{ '/projects/bns/updates/2026-10-16-why-dropout-broke-our-s4d/' | relative_url }})). None of these runs has been repeated without dropout, so whether it lowered the overlaps below, or the chirp-mass accuracy of the joint denoiser and regressor, is not known. Since every run had it, dropout is not one of the settings in which the compared runs differ. Also, the
pre-merger window below was 4 s long and ended 15.5 to 16 s before the merger (window length 4 s,
padding 19.5 s and −16 s in the configs), not a 16-second window.
</blockquote>

Two weeks of scans on the 4-second merger window and a 16-second pre-merger
window, all with the same S4D denoiser (64 wide, 4 layers) and the fixed
reference events. The figure of merit is the overlap **rho**, the normalized
inner product between the denoised output and the true whitened waveform.

<p class="note"><strong>Which population.</strong> Unless marked otherwise,
these runs train and validate on SNR drawn uniformly from 4 to 100, so 83% of
events are above SNR 20 and rho here is an average dominated by loud events.
On a power-law population (SNR density ∝ SNR⁻³ from 4 to 100, which puts 75%
of events below SNR 8; sources spread uniformly in volume give the steeper
SNR⁻⁴, Schutz 2011,
<a href="https://arxiv.org/abs/1102.5421">arXiv:1102.5421</a>;
<a href="{{ '/projects/bns/derivations/' | relative_url }}#snr-population">derivation</a>),
the joint model of the
<a href="{{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }}">next update</a>
reaches a validation rho of only 0.18 (mean over epochs 900 to 1415; 0.20 at
the epoch tested there).</p>

## The loss

The loss that held up is the time and log-spectrum mixture from the
[previous update]({{ '/projects/bns/updates/2026-09-08-denoiser-loss/' | relative_url }}),
with two penalties added: `c_rho` on (1 − rho), and `lambda_amp` on the squared
log of the amplitude ratio. The spectral floor that worked best moved from
1e-3 to between 1e-1 and 1.

## Merger window, 4 s

| variant | rho | epochs |
|---|---|---|
| α 0.05, floor 1 | 0.456 | 1000 |
| α 0.5, floor 1e-1 | 0.737 | 1000 |
| α 0.5, floor 1 | 0.753 | 1000 |
| α 0.95, floor 1 | 0.786 | 1000 |
| α 0.5, floor 1, `c_rho` 1 | 0.797 | 1000 |
| α 0.5, floor 1e-1, `c_rho` 5, `lambda_amp` 1 | 0.794 | 566 |
| same, plus 10% noise-only samples | 0.699 | 1000 |
| same, conditioned on chirp mass and SNR (FiLM) | 0.803 | 1000 |
| same, conditioned on every injection parameter (FiLM) | 0.795 | 1000 |
| joint with a chirp-mass regressor | 0.779 | 1000 |

Conditioning the denoiser on the **true** injection parameters through FiLM
is an oracle the real problem never gets, and it moved rho by less than 0.01
(0.803 and 0.795 against 0.794).
The joint denoiser and regressor put 71% of validation events within 2% of the
true chirp mass, and 92% within 5%, on this uniform population.

## Pre-merger window, 16 s before merger

| variant | rho | epochs |
|---|---|---|
| α 0.5, floor 1 | 0.890 | 1000 |
| α 0.1, floor 1e-3, `c_rho` 5, `lambda_amp` 1 | 0.900 | 620 |
| same, SNR log-uniform on 4 to 1250 | 0.791 | 449 |
| heterodyned with the true chirp mass | 0.917 | 1000 |

{% include figure.html
   src="/assets/img/bns/2026-09-23/het_vs_plain_rho.png"
   alt="Validation overlap against epoch for the 16 s pre-merger denoiser, with and without heterodyning"
   caption="Pre-merger denoiser, 16 s before merger. Removing the leading-order chirp phase with the true chirp mass (red) gives a small, consistent gain over the plain input (black). The two runs are not matched in every other setting." %}

## Heterodyning, and how much chirp mass it needs

Heterodyning multiplies the Fourier transform of the strain by the conjugate
of the leading-order (Newtonian) inspiral phase for a given chirp mass, so the
network sees a slowly varying signal instead of a sweeping chirp. DINGO-BNS
(Dax et al. 2025, [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)) and
the AFRAME BNS search (Gupta et al. 2026,
[arXiv:2607.01372](https://arxiv.org/abs/2607.01372)) use the same operation;
relative binning (Zackay et al. 2018,
[arXiv:1806.08792](https://arxiv.org/abs/1806.08792)) rests on the related
idea that a waveform divided by a nearby reference varies slowly with
frequency. On the merger window it lifted rho from about 0.77 to 0.86 at a
comparable epoch. With a Gaussian chirp-mass error of 0.1% (standard
deviation) it still reached 0.873.

The catch is the error budget. To first order, a chirp-mass error δ leaves a
residual phase of (5/8) · 2πN · δ across the window, where N is the number of
cycles in it: for a 1.2 M☉ binary in the last 4 s, 2.0 rad at δ = 0.1% and
40 rad at δ = 2%
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-het-phase)).
Even on this uniform population the joint model misses by more than 2%, 20
times the 0.1% tested here, on 29% of validation events (71% within 2%, above),
and below SNR 8 on more than 90% of events
([next update]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }})).
So this works only with an oracle. Inference without heterodyning remains the
real target.
