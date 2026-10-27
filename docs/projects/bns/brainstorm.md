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
without being told roughly where the chirp mass is. The two published
machine-learning pipelines that reach low SNR both start from a near-correct
chirp mass. DINGO-BNS takes an estimate from a search pipeline, or from a scan
with its own network, and then works within ±0.005 M☉ of it: 0.23 to 0.5% over
chirp masses 1.0 to 2.2 M☉, the widest range its networks cover (Dax et al. 2025,
[arXiv:2407.09602](https://arxiv.org/abs/2407.09602)). The AFRAME BNS search
heterodynes the data at 100 chirp masses, evenly spaced in log chirp mass from
1 to 2.5 M☉ (Gupta et al. 2026,
[arXiv:2607.01372](https://arxiv.org/abs/2607.01372)). See the
[5 October update]({{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }}).

## Done

<ul class="checklist">
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Direct chirp-mass regression at high SNR.</b> Works at SNR 20 to 40. <a href="{{ u | append: '2025-12-23-regression-snr-20-30/' | relative_url }}">Dec 2025</a>, <a href="{{ u | append: '2026-01-02-transfer-learning-snr-30-40/' | relative_url }}">Jan 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Gaussian uncertainty, pre-merger regression, two-detector sky ring.</b> Uniform SNR only. <a href="{{ u | append: '2026-05-07-cern-three-experiments/' | relative_url }}">May 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Power-law SNR population, sensitive volume with σ.</b> Test SNR drawn with density ∝ SNR⁻³ from 4 to 50, flatter than the SNR⁻⁴ of sources uniform in volume (<a href="{{ '/projects/bns/derivations/' | relative_url }}#snr-population">derivation</a>). Collapses toward the prior at low SNR; volume roughly an order of magnitude below the O3 volumes of the matched-filter searches (<a href="https://zenodo.org/records/7890437">GWTC-3 sensitivity release, Zenodo 7890437</a>). <a href="{{ u | append: '2026-07-30-reality-check/' | relative_url }}">Jul 2026</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Denoiser loss repair.</b> Shape and gain supervised separately, gradient balance measured. <a href="{{ u | append: '2026-09-08-denoiser-loss/' | relative_url }}">8 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Curriculum on the lower SNR bound.</b> Tried; a step-counting bug made one result invalid. <a href="{{ u | append: '2026-09-08-denoiser-loss/' | relative_url }}">8 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Condition the denoiser on the true parameters (FiLM).</b> An oracle, and it moved the overlap by less than 0.01. <a href="{{ u | append: '2026-09-23-denoiser-scans/' | relative_url }}">23 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Heterodyne with the true chirp mass, denoiser only.</b> Overlap 0.89 to 0.92 before merger; survives a 0.1% chirp-mass error. <a href="{{ u | append: '2026-09-23-denoiser-scans/' | relative_url }}">23 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Joint denoiser and regressor.</b> Excellent above SNR 16, near the prior below 8. <a href="{{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}">29 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Reproduce the Project 8 sharp core.</b> Spread reproduced, core not; denoiser no better than a plain regressor at 64/4. <a href="{{ u | append: '2026-09-29-den-reg-and-project-8/' | relative_url }}">29 Sep</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8 recipe on BNS:</b> 128/6, chirp mass and mass ratio, each signal in four backgrounds, smooth spectrum below 20 Hz. Better at SNR 8 to 25, unchanged below 8. <a href="{{ u | append: '2026-10-01-recipe-on-bns/' | relative_url }}">1 Oct</a>, <a href="{{ u | append: '2026-10-05-recipe-at-epoch-630/' | relative_url }}">5 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Information in the window (Cramér–Rao bound).</b> The 4 s window is not the limit; the bound is optimistic near threshold. <a href="{{ u | append: '2026-10-05-window-bound-and-prior-conditioning/' | relative_url }}">5 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Sensitive volume with −σ, no integration, one week of background.</b> Epoch-630 checkpoint: 1 to 6% of the O3 volume of MBTA (Aubin et al. 2021, <a href="https://arxiv.org/abs/2012.11512">arXiv:2012.11512</a>; volumes from the <a href="https://zenodo.org/records/7890437">GWTC-3 sensitivity release, Zenodo 7890437</a>). The denoiser adds no information and σ never learns what noise looks like. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Train on SNR ≥ 8 only, and fine-tune on it.</b> Both plateau at 9 to 10% within 1% and 16% within 2% on the full population; the fine-tune never improved. Louder training data sharpened loud events and did not lift SNR 8 to 12. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Shape and amplitude terms in the denoiser loss.</b> With matched settings they triple the overlap (0.19 against 0.06) and reach better chirp-mass accuracy in half the epochs. My first reading, that they did not help the regression, was confounded. <a href="{{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}">9 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: model size (128/6) and fresh Gaussian noise.</b> Neither produced a core; all variants end near 20 eV RMS. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Project 8: is the core in our data?</b> Yes. Given the carrier frequency, every event lands within 1 eV; even a plain spectrum peak beats our network. Finding the carrier among its sidebands is what fails. <a href="{{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Matched-filter benchmark on the network's own test windows.</b> 96 to 99% within 2% at SNR 8 to 12, against 16 to 29% for the network; detection AUC 0.98 against 0.77. The information is in the window; the network is the limit. <a href="{{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}">7 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Chirp kernels, tested.</b> An S4D layer with energy and maximum learned nothing; chirp kernels with a regression read-out reached 5 to 7%; picking the highest-energy kernel, untrained, reached 87% within 2% at SNR 8 to 12. The read-out was the failure. <a href="{{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }}">8 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Chirp-kernel network, 200 epochs.</b> Best at epoch 38 (77 to 80% within 1% at SNR 8 to 10); later the learned chirp masses drifted out of order and accuracy fell. <a href="{{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }}">8 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Denoiser trained on the matched-filter SNR time series.</b> Collapsed (overlap 0.001); a version scored only near the true peak also failed (overlap 0.02). Stopped.</span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>The matched filter as a network, no denoiser.</b> 703 waveform templates: 95% within 1% at SNR 8 to 12; with a χ² test, 2.6 to 8 times the den-reg's sensitive volume and 6 to 11 times below the O3 volume of MBTA (Aubin et al. 2021, <a href="https://arxiv.org/abs/2012.11512">arXiv:2012.11512</a>; <a href="https://zenodo.org/records/7890437">Zenodo 7890437</a>). One S4D channel of 32 tones holds at most a third of a chirp; averaging over time destroys the information; 256 long filters keep 0.99 of the median template's SNR. <a href="{{ u | append: '2026-10-12-template-bank-network/' | relative_url }}">12 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Learned long kernels, no templates.</b> One layer of 256 free 4 s kernels learned chirp-shaped filters from random noise; 71 to 77% within 1% at SNR 8 to 12 against 17 to 28% for the den-reg. Trained on SNR ≥ 8 only. <a href="{{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}">13 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>The den-reg run with the terms, 800 epochs.</b> Validation flat from epoch 400. Final epoch 7 to 12 points better within 1% at SNR 8 to 16 than epoch 339, 21 to 24 worse above SNR 25, where it pulls loud events toward the middle of the chirp-mass range. <a href="{{ u | append: '2026-10-14-den-reg-final/' | relative_url }}">14 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Signal only, no noise.</b> Free kernels reach 99.7% within 1% on the clean signal; a plain S4D with mean pooling reaches 54% (256 × 256 × 4) and 33% (64 × 32 × 4). <a href="{{ u | append: '2026-10-14-signal-only-test/' | relative_url }}">14 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>A bigger plain S4D: not pursued.</b> On the clean signal, S4D 256 × 256 × 4 (1,056,002 numbers, <a href="{{ '/projects/bns/derivations/' | relative_url }}#early-s4d-count">counted here</a>) reached 54% within 1% against 99.7% for the free kernels, at 5.3 times the time per training step (208 ms against 39 ms). I judged a bigger S4D too large a model for this task. <a href="{{ u | append: '2026-10-14-signal-only-test/' | relative_url }}">14 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Signal-only comparison of architectures, same settings.</b> Without noise, with dropout off, S4D, aframe's ResNet, a dilated CNN and free kernels all put 99.7 to 100% of events within 1%; the clean test does not separate them. <a href="{{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }}">16 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Dropout in the S4D regressors.</b> Dropout 0.2 was why our S4D failed on clean signals (maximum over time 16%, mean 37% within 1%); at dropout 0 both reach 99.9%. <a href="{{ u | append: '2026-10-16-why-dropout-broke-our-s4d/' | relative_url }}">16 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>What S4D computes; why it reads clean chirps.</b> A pre-registered test of our first explanation was inconclusive; in noise the filters, not the read-out, limit S4D; a chirp's matched filter needs about 3/8 of its cycles in resonators. <a href="{{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }}">16 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>SLIC's sampler on four test windows,</b> with the paper's settings: 4.34 h per window, acceptance 0.462 to 0.529, the truth inside 43 of 44 central 90% intervals. The walkers start at the truth, so this is not a coverage test. Stopped as planned. <a href="{{ u | append: '2026-10-23-next-sample-noise-model/' | relative_url }}">23 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>A next-sample noise model, tested against Gaussians and the matched filter.</b> A causal S4D with a three-component Gaussian scale mixture. On held-out O3a noise it beats every Gaussian with the training spectrum, by 0.036 to 0.060 nats per sample in clean windows and by 10.4 to 17.5 in loud ones; in O3b L1 it falls behind where a new 509.50 Hz line appears. With the true template its likelihood ratio finds 0.2% of signals at a false-alarm probability of 10⁻³ in clean windows (matched filter 91.9%), because it scatters 4.2 to 5.1 times more than a Gaussian's on pure noise; it raises no false alarm in loud windows. <a href="{{ u | append: '2026-10-23-next-sample-noise-model/' | relative_url }}">23 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>Subtracting the noise, in ideal noise and in ours.</b> In independent Gaussian noise a perfect noise model predicts 0, so subtracting it changes nothing: the true template finds 94.6% of test signals at a false-alarm probability of 10⁻³, and a prediction drawn from the right distribution 73.4%. Our whitened noise is 24.7% (H1) and 12.2% (L1) predictable from its past; subtracting that prediction and then matched filtering is exactly the Gaussian likelihood ratio (<a href="{{ '/projects/bns/derivations/' | relative_url }}#oct26-subtract-then-filter">derivation</a>). <a href="{{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }}">26 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>The den-reg in Gaussian noise, S4D and Mamba-2.</b> Trained on Gaussian copies of our noise, the S4D den-reg is no better than in real noise (11.9% against 12.3% within 1% at epochs 330 to 349) and does as well on validation waveforms as on its training ones, so it is not memorizing them. A Mamba-2 den-reg with 2 heads per layer is worse at every SNR (23.1% against 71.8% within 1% above SNR 12). <a href="{{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }}">26 Oct</a></span></li>
  <li class="is-done"><span class="checklist__box" aria-label="done"></span><span class="checklist__text"><b>SLIC's learned noise model on our windows</b> (Legin et al. 2025, <a href="https://arxiv.org/abs/2410.19956">arXiv:2410.19956</a>). Trained as in the paper (20.0 million examples). At the sampler's noise level it beats a Gaussian with the typical spectrum in 84.5% of validation windows, by a median of 0.13% of the loss, and by far in loud windows. Its sampler needs 1.92 million waveform evaluations per window: 79.9 days for 400 windows on our GPU (<a href="{{ '/projects/bns/derivations/' | relative_url }}#oct20-pe-cost">derivation</a>). <a href="{{ u | append: '2026-10-20-slic-noise-score-on-bns/' | relative_url }}">20 Oct</a></span></li>
</ul>

## Running

<ul class="checklist">
  <li class="is-running"><span class="checklist__box" aria-label="running"></span><span class="checklist__text"><b>S4D and Mamba-2 den-regs in Gaussian noise, each signal in 10 noise draws, training from SNR 6,</b> validated on SNR density ∝ SNR⁻⁴. Started 26 Oct. <a href="{{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }}">26 Oct</a></span></li>
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
for seconds. Fitting 256 decaying tones to whitened waveforms from our
injection file by the matrix-pencil method gave a match of 0.87 to 0.90 at
chirp masses 1.2 to 2.0 M☉, and 0.67 at 1.0 M☉ (how:
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#early-tone-fit),
[12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }}),
[13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
So a 256-tone S4D kernel can hold most of a chirp, except at the lowest chirp
masses. The question was whether a better start lets training find such
kernels.

**What band init does.** It starts every channel's tones evenly spread over
20 to 512 Hz ((512 − 20)/256 = 1.92 Hz apart for 256 tones, with a random
offset per channel) and
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
combinations of tones. Tones of fixed frequency can hold a chirp, but only
with many of them: the 1,024 largest Fourier components of a whitened chirp
keep a match of 0.96 to 0.97 at chirp masses 1.2 to 2.0 M☉, while decaying
tones fitted by the matrix-pencil method stayed between 0.86 and 0.92 from
512 to 2,048 tones
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#early-tone-fit)).
That is the reason for the next item: a layer whose frequency can change with
time might follow a chirp with far fewer oscillators.

## To try

<ul class="checklist">
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Switch validation and test to sources uniform in space</b> (SNR density ∝ SNR⁻⁴) once the architecture and its fine-tuning are chosen. Until then all test runs keep the current population (density ∝ SNR⁻³) so that results stay comparable. <a href="{{ '/projects/bns/derivations/' | relative_url }}#snr-population">Derivation</a></span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A layer whose frequency changes with time: Mamba.</b> S4D (Gu et al. 2022, <a href="https://arxiv.org/abs/2206.11893">arXiv:2206.11893</a>), S5 (Smith et al. 2023, <a href="https://arxiv.org/abs/2208.04933">arXiv:2208.04933</a>), LRU (Orvieto et al. 2023, <a href="https://arxiv.org/abs/2303.06349">arXiv:2303.06349</a>) and LinOSS (Rusch and Rus 2025, <a href="https://arxiv.org/abs/2410.03943">arXiv:2410.03943</a>) learn their frequencies but use the same ones at every time step; Mamba makes the step size depend on the input at every sample (Gu and Dao 2023, <a href="https://arxiv.org/abs/2312.00752">arXiv:2312.00752</a>). With a complex state, the step sets how fast each oscillator turns, so it can speed up along a rising chirp (<a href="{{ '/projects/bns/derivations/' | relative_url }}#early-mamba-step">derivation</a>). Mamba uses a real state by default, with a complex option (its section 3.6), and it needs a CUDA build on our machine; Mamba-2 is easier to install but its state matrix is a real number times the identity (Dao and Gu 2024, <a href="https://arxiv.org/abs/2405.21060">arXiv:2405.21060</a>), so its state only decays, with no oscillation; Mamba-3 (Lahoti et al. 2026, <a href="https://arxiv.org/abs/2603.15569">arXiv:2603.15569</a>) has a complex, input-dependent state. Simpler alternatives that warp time instead: a deformable convolution, or a learned time warp. Mamba-2 with 2 heads per layer, tried on Gaussian noise, was worse than S4D at every SNR (<a href="{{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }}">26 Oct</a>). <a href="{{ '/projects/bns/readings/' | relative_url }}#mamba">Readings</a></span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Chirplet kernels: each free kernel a chain of short chirps.</b> Build each of the free-kernel network's 256 kernels from 12 chirplets, short Gaussian wave packets whose frequency changes at a constant rate (Mann and Haykin 1995, IEEE Trans. Signal Process. 43, 2745, <a href="https://doi.org/10.1109/78.482123">doi:10.1109/78.482123</a>), each with a learned centre time, width, frequency, rate and complex amplitude: 72 numbers per kernel instead of 8,032 for a free kernel at 2048 Hz. At leading order, 10 to 12 pieces of linear chirp per 4 s window follow our chirps to within an eighth of a cycle up to 1024 Hz, where one S4D channel needs at least 114 to 234 resonators. Fitted to three whitened templates, 12 chirplets keep 0.98 to 0.99 of the matched filter's SNR; laid along a leading-order chirp with no fit, they match the same three at 0.79 to 0.82 (<a href="{{ '/projects/bns/derivations/' | relative_url }}#oct16-chirplet-count">derivation</a>), where the free kernels started at 0.10 and reached at most 0.81 after training (<a href="{{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}">13 Oct</a>). Chirplet chains are templates for gravitational-wave chirps of unknown shape (Chassande-Mottin and Pai 2006, <a href="https://arxiv.org/abs/gr-qc/0512137">arXiv:gr-qc/0512137</a>), and chirplet kernels with a learned frequency and rate have been trained as a network's first layer on machine vibration data (Chen et al. 2024, <a href="https://arxiv.org/abs/2209.01992">arXiv:2209.01992</a>). Test: one more network in the proposed noisy comparison at 2048 Hz (<a href="{{ u | append: '2026-10-16-status-dropout-and-signal-only/' | relative_url }}">16 Oct</a>), started along the leading-order chirps of 256 chirp masses spaced evenly in log from 0.85 to 2.75 M☉, all else as for the free kernels. Success: on the same test windows with fresh read-outs, more events within 1% than the free kernels and at least as many as the 256-template bank through the same ending (at 1024 Hz, 39.7% and 43.6%; <a href="{{ u | append: '2026-10-16-what-s4d-computes/' | relative_url }}">16 Oct</a>), and a smaller drop than the free kernels' on test noise from the second half of O3 (<a href="{{ u | append: '2026-10-15-oscillators-and-chirps/' | relative_url }}">15 Oct</a>, section 7). Risk: the kernel depends on each chirplet's time and frequency nonlinearly, as an S4D kernel depends on its resonators' frequencies, which training hardly moved (<a href="{{ '/projects/bns/derivations/' | relative_url }}#oct16-s4d-channel-analysis">measured</a>); without noise, fits of 8 chirplets from random starts end at 0.60 to 0.92, against 0.955 and 0.962 from a start along the chirp.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Heterodyne near the true chirp mass, then the joint denoiser and regressor,</b> small model, 256 Hz anti-aliased, pre-merger window. Scan the chirp-mass error ε = 0, 0.1%, 1%, 3%. This is DINGO's refinement setting in our architecture.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Use the unused kernels:</b> more kernels or re-initialize the dead ones; regularize the kernels (Fu et al. 2023, <a href="https://arxiv.org/abs/2302.06646">arXiv:2302.06646</a>).</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A χ² test on the learned kernels,</b> a detection score, and the sensitive volume without templates.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Heterodyne grid as input channels,</b> the AFRAME mechanism, in the joint model. Needs no chirp mass.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Bootstrap:</b> estimate the chirp mass, heterodyne with it, denoise, re-estimate.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A dedicated detection output</b> (classification loss, balanced signal and noise) alongside σ.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Time integration of −σ</b> in the sensitive volume (boxcar 0.25 to 1 s).</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A longer, two-rate input:</b> low rate for the early inspiral, 2048 Hz for the merger.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Project 8: a carrier estimate that uses the sideband structure,</b> or longer recordings, to close the gap the spectrum-peak test exposed.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>A generative prior over clean waveforms</b> (diffusion). The most expensive.</span></li>
  <li><span class="checklist__box" aria-label="to do"></span><span class="checklist__text"><b>Sky localization</b> with three detectors, and before merger.</span></li>
</ul>
