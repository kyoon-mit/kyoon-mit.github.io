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
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Shape and amplitude terms in the denoiser loss.</b> Double the overlap (0.11 against 0.06), leave the chirp mass unchanged. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: model size (128/6) and fresh Gaussian noise.</b> Neither produced a core; all variants end near 20 eV RMS. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: is the core in our data?</b> Yes. Given the carrier frequency, every event lands within 1 eV; even a plain spectrum peak beats our network. Finding the carrier among its sidebands is what fails. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Matched-filter benchmark on the network's own test windows.</b> 96 to 99% within 2% at SNR 8 to 12, against 16 to 29% for the network; detection AUC 0.98 against 0.77. The information is in the window; the network is the limit. <a href="{{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}">7 Oct</a></span></li>
</ul>

## Running

<ul class="checklist">
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>Denoiser trained on the matched-filter SNR time series,</b> target zero on noise-only windows. Started 7 Oct.</span></li>
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>SNR-8 training, matched pair:</b> with and without the shape and amplitude terms, both with 96% signal windows. Started 6 and 7 Oct.</span></li>
</ul>

## To try

<ul class="checklist">
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Heterodyne near the true chirp mass, then the joint denoiser and regressor,</b> small model, 256 Hz anti-aliased, pre-merger window. Scan the chirp-mass error ε = 0, 0.1%, 1%, 3%. This is DINGO's refinement setting in our architecture.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Chirp-kernel layer:</b> kernels that are physical chirps with a learned chirp mass, two phases, energy and maximum over time. <a href="{{ u | append: '2026-10-07-chirp-kernels/' | relative_url }}">7 Oct</a></span></li>
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
