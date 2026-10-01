---
title: Denoiser scans, conditioning and heterodyning
date: 2026-09-23
summary: >-
  With the loss repaired, the denoiser reaches an overlap of about 0.8 with the
  true merger waveform and about 0.9 before the merger. Handing it the true
  parameters barely helps; heterodyning with the true chirp mass helps more,
  but presupposes it.
---

Two weeks of scans on the 4-second merger window and a 16-second pre-merger
window, all with the same S4D denoiser (64 wide, 4 layers) and the fixed
reference events. The figure of merit is the overlap **rho**, the normalized
inner product between the denoised output and the true whitened waveform.

<p class="note"><strong>Which population.</strong> Unless marked otherwise,
these runs train and validate on SNR drawn uniformly from 4 to 100, so rho
here is an average dominated by loud events. On the realistic power-law
population the same kind of model reaches only about 0.18; see the
<a href="{{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }}">next update</a>.</p>

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
is an oracle the real problem never gets, and it moved rho by less than 0.01.
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

Heterodyning multiplies the strain by the conjugate of the Newtonian inspiral
phase for a given chirp mass, so the network sees a slowly varying signal
instead of a sweeping chirp. On the merger window it lifted rho from about 0.77
to 0.86 at a comparable epoch. With a chirp-mass error of 0.1% it still reached
0.873.

The catch is the error budget. Our regressors' chirp-mass errors are around 3%
even where they work, more than an order of magnitude above that tolerance, and
far larger at low SNR. So this works only with an oracle. Inference without heterodyning remains the real target.
