---
title: Carrying the Project 8 recipe to BNS
date: 2026-10-01
summary: >-
  A larger joint model, mass ratio alongside chirp mass, each waveform in four
  different noise backgrounds, a little pure noise, and a smooth spectrum below
  the 20 Hz highpass. 800 epochs on two GPUs, 6.2 days at 11.2 minutes an
  epoch.
---

{% include notice-snr-powerlaw.html %}

The Project 8 comparison left two suspects for the missing sharp core: model
size and how the noise is drawn. This run carries both, and two smaller
changes, to the BNS merger window at once. A clean attribution would need one
change at a time; this run asks first whether the combination moves the
low-SNR end at all.

<dl class="specs">
  <div><dt>Model</dt><dd>S4D denoiser + regressor<small>128 wide, 6 layers each</small></dd></div>
  <div><dt>Targets</dt><dd>Chirp mass, mass ratio<small>each with σ</small></dd></div>
  <div><dt>Training SNR</dt><dd>Power law, index −2<small>4 to 100</small></dd></div>
  <div><dt>Batch</dt><dd>128 per update<small>32 per GPU × 2 GPUs × 2 accumulated steps</small></dd></div>
  <div><dt>Regressor</dt><dd>Ramped in<small>epochs 30 to 60</small></dd></div>
  <div><dt>Length</dt><dd>800 epochs<small>11.2 min each over the first 75 epochs</small></dd></div>
</dl>

## What changed, and why

**Each waveform in four backgrounds.** The Project 8 recipe shows each signal
several times per epoch, each time with fresh noise. For BNS, fresh noise is
free: the background loader already crops every sample at its own random time,
with the two detectors shifted independently. So each batch now draws a quarter
as many waveforms and injects each into four samples. All four share the
waveform, sky position and SNR, and each has its own background. Each signal
is projected onto the detectors once and rescaled against each background's
own PSD. Drawing only the needed waveforms cut the per-batch waveform gather
(select, slice and copy to the GPU) from 3.7 ms to 0.3 ms, measured as the
median of 20 repeats for 32 and 8 waveforms.

**A little pure noise.** 4% of samples carry no signal. The denoiser learns to
output nothing for them. The regressor ignores them for now, so its
uncertainty is not yet trained to flag false triggers.

**A smooth spectrum below 20 Hz.** The data is highpassed at 20 Hz, so below
that the target spectrum is smooth and low (median magnitude 0.39, against
18.5 in 30 to 300 Hz), in 79 of 4097 frequency bins, 1.9% of them
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-lowband)). The loss barely weighs them, and
the denoiser filled them with jagged structure 10 to 100 times above the target
(read off the reference event below). Now the output's log magnitude in those
bins is replaced by a 4-coefficient polynomial fit in log frequency, keeping
the phase, before the output reaches the loss or the regressor. On 400 real
target spectra (200 waveforms, two detectors), 4 coefficients fit the true
curve with a root-mean-square error of 0.8% in magnitude and 6% at worst.
Only those 79 bins are transformed, by a direct DFT: in a timing test on one of
our GPUs (forward and backward pass, batch of 32) it took 2.7 ms against
4.7 ms for a full FFT round trip.

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-01/baseline_lowband_jagged.png"
   alt="Reference event at SNR 50 from the previous run; the denoised spectrum below 20 Hz is jagged"
   label="Before, previous run"
   caption="SNR 50 reference event, epoch 1320 of the previous run. Below 20 Hz the denoised spectrum (red) is jagged and far above the target (black)." %}
{% include figure.html
   src="/assets/img/bns/2026-10-01/smoothed_lowband.png"
   alt="Reference event at SNR 50 from the new run; the denoised spectrum below 20 Hz is a smooth curve"
   label="After, this run"
   caption="Same event, epoch 70 of this run. The low band is now one smooth curve by construction; its level has not yet come down to the target." %}
</div>

## What would count as success

A change at the low-SNR end of the
[previous test]({{ '/projects/bns/updates/2026-09-29-den-reg-and-project-8/' | relative_url }}):
more than 5 to 8% of SNR 4 to 8 events within 2%, or a subset that the model's
own σ picks out as well measured. Progress is on the
[live runs]({{ '/projects/bns/live/' | relative_url }}) page.
