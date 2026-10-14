---
layout: project
title: Brainstorm
permalink: /projects/bns/brainstorm/
eyebrow: Ideas and tests
summary: >-
  Every idea for reaching quiet events, whether it has been tested, when, and
  where the result is. Checked items have a dated update behind them.
---

{%- assign u = '/projects/bns/updates/' -%}

The organizing question is whether a learned model can reach low-SNR events
without being told roughly where the chirp mass is. The two published pipelines
that reach low SNR both start from a near-correct chirp mass. DINGO-BNS takes
it from a search trigger, within about 0.15%. The AFRAME BNS search uses a grid
of 100 heterodynes. See the
[5 October update]({{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }}).

## Done

<ul class="checklist">
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Direct chirp-mass regression at high SNR.</b> Works at SNR 20 to 40. <a href="{{ u | append: '2025-12-23-regression-snr-20-30/' | relative_url }}">Dec 2025</a>, <a href="{{ u | append: '2026-01-02-transfer-learning-snr-30-40/' | relative_url }}">Jan 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Gaussian uncertainty, pre-merger regression, two-detector sky ring.</b> Uniform SNR only. <a href="{{ u | append: '2026-05-07-cern-three-experiments/' | relative_url }}">May 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Realistic power-law population, sensitive volume with σ.</b> Collapses toward the prior at low SNR; volume an order of magnitude below matched filtering. <a href="{{ u | append: '2026-07-30-reality-check/' | relative_url }}">Jul 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Denoiser loss repair.</b> Shape and gain supervised separately, gradient balance measured. <a href="{{ u | append: '2026-09-08-denoiser-loss/' | relative_url }}">8 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Curriculum on the lower SNR bound.</b> Tried; a step-counting bug made one result invalid. <a href="{{ u | append: '2026-09-08-denoiser-loss/' | relative_url }}">8 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Condition the denoiser on the true parameters (FiLM).</b> An oracle, and it moved the overlap by less than 0.01. <a href="{{ u | append: '2026-09-23-denoiser-scans/' | relative_url }}">23 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Heterodyne with the true chirp mass, denoiser only.</b> Overlap 0.89 to 0.92 before merger; survives a 0.1% chirp-mass error. <a href="{{ u | append: '2026-09-23-denoiser-scans/' | relative_url }}">23 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Joint denoiser and regressor.</b> Excellent above SNR 16, near the prior below 8. <a href="{{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}">29 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Reproduce the Project 8 sharp core.</b> Spread reproduced, core not; denoiser no better than a plain regressor at 64/4. <a href="{{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}">29 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8 recipe on BNS:</b> 128/6, chirp mass and mass ratio, each signal in four backgrounds, smooth spectrum below 20 Hz. Better at SNR 8 to 25, unchanged below 8. <a href="{{ u | append: '2026-10-01-recipe-on-bns/' | relative_url }}">1 Oct</a>, <a href="{{ u | append: '2026-10-05-recipe-at-epoch-630/' | relative_url }}">5 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Information in the window (Cramér–Rao bound).</b> The 4 s window is not the limit; the bound is optimistic near threshold. <a href="{{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }}">5 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Sensitive volume with −σ, no integration, one week of background.</b> Epoch-630 checkpoint: 1 to 6% of MBTA. The denoiser adds no information and σ never learns what noise looks like. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Train on SNR ≥ 8 only, and fine-tune on it.</b> Both plateau at about 10% within 1% and 16% within 2% on the full population; the fine-tune never improved. Louder training data sharpened loud events and did not lift SNR 8 to 12. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Shape and amplitude terms in the denoiser loss.</b> With matched settings they triple the overlap (0.19 against 0.06) and reach better chirp-mass accuracy in half the epochs. My first reading, that they did not help the regression, was confounded. <a href="{{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}">9 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: model size (128/6) and fresh Gaussian noise.</b> Neither produced a core; all variants end near 20 eV RMS. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: is the core in our data?</b> Yes. Given the carrier frequency, every event lands within 1 eV; even a plain spectrum peak beats our network. Finding the carrier among its sidebands is what fails. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Matched-filter benchmark on the network's own test windows.</b> 96 to 99% within 2% at SNR 8 to 12, against 16 to 29% for the network; detection AUC 0.98 against 0.77. The information is in the window; the network is the limit. <a href="{{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Chirp kernels, tested.</b> An S4D layer with energy and maximum learned nothing; chirp kernels with a regression read-out reached 5 to 7%; picking the highest-energy kernel, untrained, reached 87% within 2% at SNR 8 to 12. The read-out was the failure. <a href="{{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }}">8 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Chirp-kernel network, 200 epochs.</b> Best at epoch 38 (77 to 80% within 1% at SNR 8 to 10); later the learned chirp masses drifted out of order and accuracy fell. <a href="{{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }}">8 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Denoiser trained on the matched-filter SNR time series.</b> Collapsed (overlap 0.001); a version scored only near the true peak also failed (overlap 0.02). Stopped.</span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>The matched filter as a network, no denoiser.</b> 703 waveform templates: 95% within 1% at SNR 8 to 12; with a χ² test, 2.6 to 8 times the den-reg's sensitive volume and 6 to 11 times below MBTA. One S4D channel of 32 tones holds at most a third of a chirp; averaging over time destroys the information; about 250 long filters are needed. <a href="{{ u | append: '2026-10-12-template-bank-network/' | relative_url }}">12 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Learned long kernels, no templates.</b> One layer of 256 free 4 s kernels learned chirp-shaped filters from random noise; 71 to 77% within 1% at SNR 8 to 12 against 17 to 28% for the den-reg. Trained on SNR ≥ 8 only. <a href="{{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}">13 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>The den-reg run with the terms, 800 epochs.</b> Validation flat from epoch 400. Final epoch 7 to 12 points better within 1% at SNR 8 to 16 than epoch 339, 21 to 24 worse above SNR 25, where it pulls loud events toward the middle of the chirp-mass range. <a href="{{ u | append: '2026-10-14-den-reg-final/' | relative_url }}">14 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Signal only, no noise.</b> Free kernels reach 99.7% within 1% on the clean signal; a plain S4D with mean pooling reaches 54% (256 × 256 × 4) and 33% (64 × 32 × 4). <a href="{{ u | append: '2026-10-14-signal-only-test/' | relative_url }}">14 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>A bigger plain S4D: not pursued.</b> On the clean signal, S4D 256 × 256 × 4 (1.06M numbers) reached 54% within 1% against 99.7% for the free kernels, at five times the cost per training step. A bigger S4D would be too large a model for the task. <a href="{{ u | append: '2026-10-14-signal-only-test/' | relative_url }}">14 Oct</a></span></li>
</ul>

## Running

<ul class="checklist">
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>Sensitive volume of the den-reg's final epoch (799)</b> on one week of O3b background, to compare with epoch 365 and the template bank. Started 14 Oct.</span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>Free kernels stored as time samples</b> instead of a spectrum, on the clean signal and on noisy data: does the spectrum storage matter for training? Started 14 Oct. <a href="{{ '/projects/bns/free-kernel/' | relative_url }}">Free-kernel page</a></span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>S4D read-out tests</b> on the clean signal (64 × 32 × 4): a maximum over time instead of the mean; a complex last layer averaged over time; a complex last layer with energy and a maximum, as in the free kernels. Separates the read-out from the kernel. Started 14 Oct.</span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>Learned long kernels trained from SNR 4.</b> Started 13 Oct; stopped at epoch 69 when the machine ran out of memory on 14 Oct; resumes from its checkpoint after the sensitive-volume run.</span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>S4D started inside the signal band ("band init").</b> Worse than the default start so far (below). Stopped at epoch 76 by the same memory failure; resumes after the sensitive-volume run.</span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>S4D width, S4D depth, S4D with 32 and 256 tones, and aframe's ResNet,</b> with the free kernels' read-out. Paused 14 Oct to free memory; resume from their checkpoints after the runs above. <a href="{{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}">13 Oct</a></span></li>
</ul>

### S4D band init: why, and what it showed

**What an S4D kernel is.** An S4D layer convolves each channel with a
kernel that is a sum of damped tones: sine waves, each with its own
frequency, that fade at their own rate. A channel with state size 256 has
128 tones. Two numbers matter for each tone: its frequency, and how long it
lasts (its memory).

**The problem with the default start.** In the den-reg, every tone in a
channel gets its frequency and its memory from one random step size per
channel, drawn between 10⁻⁴ and 10. A small step puts all of a channel's
tones below 20 Hz, where the whitened data has no signal; a large step puts
them above the highest frequency the data can hold, and makes them fade
within a few samples. Only channels in a narrow middle range start with
tones inside the band that last. After 200 epochs of the run with 256 tones
per channel, 26% of the tones were inside 20 to 512 Hz, 15% lasted longer
than 1 s, and 7% were both. The formulas are on the
[derivations page]({{ '/projects/bns/derivations/' | relative_url }}#s4d-tones).

**The motivation.** A 4 s chirp filter needs tones inside the band that last
for seconds. Fitting 256 tones directly to real waveforms reaches a match of
0.87 to 0.90, so an S4D kernel can hold most of a chirp. The question was
whether a better start lets training find such kernels.

**What band init does.** It starts every channel's tones evenly spread over
20 to 512 Hz (about 1.9 Hz apart, with a random offset per channel) and
gives every tone a memory of 4 s, the window length. It is the same layer
with the same number of parameters; only the starting values change.

**What it showed.** It did not help. Fraction of validation events within 1%
of the true chirp mass, same read-out, power law from SNR 4:

<div markdown="1">

| epochs | band init | default start | free kernels |
|---|---|---|---|
| 20 to 39 | 4.0% | 12.4% | 35.3% |
| 40 to 59 | 5.6% | 15.2% | 36.8% |
| 60 to 76 | 6.5% | 16.5% | 37.3% |

</div>

Starting inside the band did not help training find chirp-shaped
combinations of tones. And even a perfect fit of fixed-frequency tones stops
near a match of 0.9, because each tone keeps one frequency while a chirp's
frequency rises. That is the reason for the next item: layers whose
frequency can change with time.

## To try

<ul class="checklist">
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A layer whose frequency changes with time: Mamba.</b> S4D, S5, LRU and LinOSS have fixed frequencies; Mamba makes the step size depend on the input at every sample. With a complex state, the step sets how fast each oscillator turns, so it can speed up along a rising chirp. Mamba-1's kernel supports a complex state but its released layer uses a real one, and it needs a CUDA build on our machine; Mamba-2 is easier to install but its state only decays, with no oscillation; Mamba-3 (2026) has a complex, input-dependent state. Simpler alternatives that warp time instead: a deformable convolution, or a learned time warp. <a href="{{ '/projects/bns/readings/' | relative_url }}#mamba">Readings</a></span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Heterodyne near the true chirp mass, then the joint denoiser and regressor,</b> small model, 256 Hz anti-aliased, pre-merger window. Scan the chirp-mass error ε = 0, 0.1%, 1%, 3%. This is DINGO's refinement setting in our architecture.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Use the unused kernels:</b> more kernels or re-initialize the dead ones; regularize the kernels (Fu et al. 2023).</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A χ² test on the learned kernels,</b> a detection score, and the sensitive volume without templates.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Heterodyne grid as input channels,</b> the AFRAME mechanism, in the joint model. Needs no chirp mass.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Bootstrap:</b> estimate the chirp mass, heterodyne with it, denoise, re-estimate.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A dedicated detection output</b> (classification loss, balanced signal and noise) alongside σ.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Time integration of −σ</b> in the sensitive volume (boxcar 0.25 to 1 s).</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A longer, two-rate input:</b> low rate for the early inspiral, 2048 Hz for the merger.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Project 8: a carrier estimate that uses the sideband structure,</b> or longer recordings, to close the gap the spectrum-peak test exposed.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Training SNR floor of 6,</b> between the 4 and 8 tried so far.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A generative prior over clean waveforms</b> (diffusion). The most expensive.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Sky localization</b> with three detectors, and before merger.</span></li>
</ul>
