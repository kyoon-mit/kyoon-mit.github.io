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

The run with the terms (trained from SNR 8, epoch 339) against our previous
best, the 630-epoch run trained from SNR 4, on the standard test: O3b
background, half the windows with an injection. Epoch 339 was tested on
24,982 signal windows per population, epoch 630 on 12,795. Chirp mass within
1 / 2%:

<div markdown="1">

| SNR | power law from 4: epoch 339 | epoch 630 | power law from 8: epoch 339 | epoch 630 | uniform: epoch 339 | epoch 630 |
|---|---|---|---|---|---|---|
| 4 to 8 | 4 / 8% | 3 / 6% | | | 5 / 10% | 4 / 6% |
| 8 to 12 | 18 / 31% | 10 / 20% | 17 / 31% | 11 / 20% | 20 / 35% | 11 / 23% |
| 12 to 16 | 40 / 67% | 32 / 53% | 42 / 67% | 31 / 55% | 42 / 67% | 33 / 56% |
| 16 to 25 | 66 / 90% | 48 / 82% | 65 / 91% | 53 / 82% | 67 / 93% | 52 / 83% |
| 25 to 50 | 78 / 99% | 54 / 94% | 79 / 98% | 51 / 92% | 80 / 98% | 51 / 93% |
| all | 11 / 19% | 8 / 15% | 34 / 52% | 24 / 42% | 62 / 81% | 42 / 75% |

</div>

The same pattern in all three populations:

- **Within 2% at SNR 8 to 16** improves by 11 to 14 points, the band that
  sets how far a search can see.
- **Within 1% above SNR 16** improves by 13 to 29 points. The 630-epoch run
  topped out near 50% within 1% even on loud events; this run reaches
  about 80%.
- **Below SNR 8** almost nothing moves (1 to 4 points).

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep339_snr8_powerlaw_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the SNR-8 run with the terms, power law from SNR 8"
   label="Epoch 339, trained from SNR 8, with the terms"
   caption="Power law from SNR 8." %}
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep630_snr8_powerlaw_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the 630-epoch run, power law from SNR 8"
   label="Epoch 630, trained from SNR 4"
   caption="Power law from SNR 8." %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep339_snr4_powerlaw_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the SNR-8 run with the terms, power law from SNR 4"
   label="Epoch 339, trained from SNR 8, with the terms"
   caption="Power law from SNR 4." %}
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep630_snr4_powerlaw_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the 630-epoch run, power law from SNR 4"
   label="Epoch 630, trained from SNR 4"
   caption="Power law from SNR 4." %}
</div>

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep339_snr4_uniform_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the SNR-8 run with the terms, uniform SNR"
   label="Epoch 339, trained from SNR 8, with the terms"
   caption="Uniform SNR 4 to 50." %}
{% include figure.html
   src="/assets/img/bns/2026-10-09/ep630_snr4_uniform_frac_within.png"
   alt="Fraction within 1, 2, 5 and 10 percent against SNR for the 630-epoch run, uniform SNR"
   label="Epoch 630, trained from SNR 4"
   caption="Uniform SNR 4 to 50." %}
</div>

Two things changed between these runs, not one: the training population
(SNR 8 and up instead of 4 and up, power law index −3 instead of −2) and
the denoiser loss settings. Section 3 isolates the loss terms; this section
shows the combination is our best regressor so far.
