---
title: The denoiser's shape and amplitude terms matter
date: 2026-10-09
summary: >-
  Two otherwise identical joint denoiser and regressor runs, with and without
  the shape (overlap) and amplitude terms in the denoiser loss. With them, the
  denoised waveform keeps its true size and shape, the overlap with the true
  waveform triples, and the regressor reaches better chirp-mass accuracy in
  half the epochs. This corrects my reading of 7 October.
---

{%- assign u = '/projects/bns/updates/' -%}

## The two runs

Both runs are the joint denoiser and regressor (128 channels, 6 layers, chirp
mass and mass ratio), trained on SNR following a power law with index −3
from SNR 8, validated on the same power law from SNR 4, with 96% of training
windows carrying a signal. They differ only in the denoiser loss:

- **With:** the time and spectral mixture, plus a **shape term** (the
  overlap between the denoised and the true waveform, which ignores size)
  at weight 5, and an **amplitude term** (which pins the denoised output's
  size to the true one) at weight 3.
- **Without:** the time and spectral mixture only.

On [7 October]({{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }})
I wrote that the two terms did not change the chirp mass. That comparison
was confounded: the run with the terms had trained with half of its windows
as pure background by mistake. This is the matched comparison.

## The denoised waveforms

{% include figure.html
   src="/assets/img/bns/2026-10-09/denoised_waveforms_ep340.png"
   alt="Denoised waveforms at SNR 50, 20 and 4 for the two runs at epoch 340: without the terms the prediction is shrunk below the true waveform; with them it matches its size and spectrum"
   label="Reference events at epoch 340"
   caption="The same three reference events (SNR 50, 20, 4; detector H1) through both networks at epoch 340. Grey: noisy input; black: the true waveform; red: the denoiser's output. Left of each pair: time; right: spectrum. Without the terms (left), the output is a shrunken copy that sits well below the true waveform in both time and spectrum. With them (right), it matches the waveform's size and spectral shape, and still holds a recognizable chirp at SNR 20." %}

Without the shape and amplitude terms, the cheapest way for the denoiser to
lower a time and spectral error at low SNR is to shrink its output: a small
output can never be far wrong. The shape term rewards matching the
waveform's form whatever its size, and the amplitude term forbids the
shrinking.

{% include figure.html
   src="/assets/img/bns/2026-10-09/rho_amp_denoiser.png"
   alt="Validation overlap and gain against epoch for the two runs"
   label="The denoiser"
   caption="Left: overlap of the denoised output with the true waveform, 0.19 with the terms against 0.06 without. Right: the ratio of output size to true size. 10-epoch running means." %}

## The chirp mass

The regressor reads the denoiser's output, so a cleaner, correctly sized
waveform helps it:

{% include figure.html
   src="/assets/img/bns/2026-10-09/rho_amp_within.png"
   alt="Validation fraction of events within 1, 2, 5 and 10 percent in chirp mass against epoch for the two runs, on a shared scale"
   label="Validation chirp mass"
   caption="Fraction of validation events within 1, 2, 5 and 10% of the true chirp mass, same scale in every panel, 10-epoch running means. The run with the terms reaches 20% within 2% by epoch 300; the run without is at 19% after 678 epochs." %}

<div markdown="1">

| epoch | within 2%, with | within 2%, without | within 1%, with | within 1%, without |
|---|---|---|---|---|
| 100 | 12% | 11% | 7% | 6% |
| 200 | 19% | 14% | 11% | 9% |
| 300 | 20% | 15% | 12% | 9% |
| latest | 19% (epoch 340) | 19% (epoch 678) | 12% | 10% |

</div>

At matched epochs the run with the terms is 4 to 5 points ahead within 2%,
and it gets to the same accuracy in about half the epochs. Validation holds
about 500 events per epoch, so single epochs are noisy; the running means
and the gap at every epoch from 150 on make the difference clear. The run
without the terms has been stopped.

## Against the earlier runs

The test plots for the run with the terms, at epoch 339, on the three
standard populations, are running; this section will compare them with the
630-epoch run trained from SNR 4.
