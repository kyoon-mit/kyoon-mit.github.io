---
title: "Template bank written as a network: 95 to 96% within 1% at SNR 8 to 12; denoiser plus regressor 17 to 28%"
date: 2026-10-12
tags: [matched-filter, regression]
math: true
summary: >-
  A matched filter written as a network (703 fixed waveform templates, SNR,
  maximum over time, a posterior over chirp mass, no denoiser) puts 95 to
  96% of events at SNR 8 to 12 within 1% of the true chirp mass on 50,000
  test windows per population; the den-reg run reaches 17 to 28%. It is a
  template bank, so it is our reference, not the model we want. What it
  shows: the best tone fits I found for one S4D channel of the den-reg's
  size keep only 25 to 33% of a chirp's matched-filter SNR; this bank needs
  256 basis filters to keep 94% of the SNR of all but its worst 5% of
  templates; and averaging over time instead of taking the maximum loses
  most of the accuracy.
---

{%- assign u = '/projects/bns/updates/' -%}

{% include notice-snr-powerlaw.html %}

This follows the [matched-filter benchmark]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}),
the [chirp kernels]({{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }})
and the [den-reg run with the shape and amplitude terms]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}).
"Within 1%" means the predicted chirp mass is within 1% of the true one.

## The result

Every model below was tested the same way: O3b background, half the windows
with an injection, 24,982 to 25,046 signal windows per population, the merger
between 3.5 and 4 s into each 4 s window. For the den-reg run I tested both
epoch 339 and the final epoch 799. Chirp mass within 1 / 2%:

<div markdown="1">

| | SNR 8 to 12 | SNR 12 to 16 | SNR 25 to 50 | all |
|---|---|---|---|---|
| **power law from SNR 4** | | | | |
| template bank, 703 templates | 95 / 98% | 96 / 99% | 98 / 100% | 48 / 51% |
| template bank, 235 templates | 94 / 97% | 95 / 99% | 97 / 100% | 47 / 50% |
| den-reg, epoch 339 | 18 / 31% | 40 / 67% | 78 / 99% | 11 / 19% |
| den-reg, epoch 799 | 27 / 44% | 52 / 74% | 57 / 83% | 14 / 22% |
| **power law from SNR 8** | | | | |
| template bank, 703 templates | 95 / 98% | 97 / 99% | 97 / 100% | 96 / 98% |
| den-reg, epoch 339 | 17 / 31% | 42 / 67% | 79 / 98% | 34 / 52% |
| den-reg, epoch 799 | 25 / 43% | 49 / 73% | 57 / 82% | 37 / 57% |
| **uniform SNR 4 to 50** | | | | |
| template bank, 703 templates | 96 / 98% | 98 / 100% | 98 / 100% | 93 / 95% |
| den-reg, epoch 339 | 20 / 35% | 42 / 67% | 80 / 98% | 62 / 81% |
| den-reg, epoch 799 | 28 / 46% | 49 / 73% | 56 / 81% | 49 / 72% |

</div>

The "all" column of the first population is low for every model because 75%
of its events are below SNR 8 (density ∝ SNR⁻³ from 4 to 50;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-snr-bands));
between SNR 4 and 8 the template bank gets 32 / 36% and the den-reg 4 to 5 /
8 to 10%.

{% include figure.html
   src="/assets/img/bns/2026-10-12/compare_snr4_powerlaw.png"
   alt="Fraction of events within 1, 2, 5 and 10 percent in chirp mass against SNR, for the two template-bank networks and the den-reg run at epochs 339 and 799, power law from SNR 4"
   label="Power law from SNR 4"
   caption="Within 1, 2, 5 and 10% against injected SNR, same scale in every panel. The two template-bank networks lie on top of each other." %}

<div class="plot-pair">
{% include figure.html
   src="/assets/img/bns/2026-10-12/compare_snr8_powerlaw.png"
   alt="The same comparison for the power law from SNR 8"
   label="Power law from SNR 8"
   caption="" %}
{% include figure.html
   src="/assets/img/bns/2026-10-12/compare_snr4_uniform.png"
   alt="The same comparison for uniform SNR from 4 to 50"
   label="Uniform SNR 4 to 50"
   caption="" %}
</div>

{% include figure.html
   src="/assets/img/bns/2026-10-12/pred_vs_true_snr4_powerlaw.png"
   alt="Predicted against true chirp mass, median and 1 sigma band, at SNR 8 to 12 and at all SNR"
   label="Predicted against true chirp mass, power law from SNR 4"
   caption="Median and 1σ band of the prediction in bins of true chirp mass. At SNR 8 to 12 (left) the template bank's band is thinner than its line. Over all SNR (right) every model's band is wide, because 75% of this population's events are below SNR 8." %}

## Why the S4D could not do this

The information is in the data: the matched filter recovers it (the
benchmark). A matched filter is a convolution of the whitened strain with
the time-reversed whitened chirp (Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)). S4D layers are
convolutions too, but each channel's kernel is a sum of damped tones (Gu et
al. 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893);
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#s4d-tones)),

$$
K(\ell) = \sum_{n=1}^{N} c_n \, z_n^{\ell}, \qquad |z_n| \le 1,
$$

with $N$ the number of tones (half the state size; $N = 32$ in the den-reg
run), $c_n$ complex weights, $z_n$ complex poles and $\ell$ the lag in
samples. Over the bank's chirp masses, 0.85 to 2.74 M☉, a BNS chirp has 306
to 636 cycles in its last 4 s at leading order
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#cycles));
the four whitened templates I fitted (1.0 to 2.0 M☉) have 383 to 579. I
fitted tone sums to them and measured the match (the fraction of the
matched-filter SNR the fitted kernel keeps):

{% include figure.html
   src="/assets/img/bns/2026-10-12/tone_check.png"
   alt="Match between a fitted sum of tones and a whitened 4 second BNS chirp kernel against the number of tones, for three fitting methods and four chirp masses"
   label="How many tones one channel needs"
   caption="Three ways to choose the tones: the N largest Fourier components (top left), a fixed grid over 20 to 800 Hz (top right), and poles fitted freely by the matrix-pencil method, kept stable (bottom left). At the den-reg's 32 tones the best fit keeps 25 to 33% of the matched-filter SNR. Fitted damped tones stay below 0.92 up to 2,048 tones; the largest Fourier components need 1,024 (2,048 at 1.0 M☉) for 0.95." %}

These are the best fits I found, so they are lower bounds on what a sum of
32 tones can keep, but none came near the full matched filter. The network
would have to build it from many channels and nonlinearities, and in 800
epochs it did not. A denoiser in front does not change this, since the
regressor that reads its output has the same kernels. In these fits, a match
of 0.95 took 1,024 or more Fourier tones per channel; taking the kernel from
the waveform model needs none.

## The network

{% include figure.html
   src="/assets/img/bns/2026-10-12/template_bank_architecture.png"
   alt="Block diagram: whitened strain, FFT, multiplication by 703 template spectra, inverse FFT, SNR squared, network SNR squared, maximum over lags, posterior over chirp mass, estimate; chi-squared test for detection"
   label="Architecture"
   caption="Blue: fixed. Green: learned." %}

The templates are waveforms taken from the injection file itself. The
chirp-mass grid has 235 points spaced by 0.5% (steps of 0.005 in
$\ln\mathcal M$) from 0.85 to 2.74 M☉. For each grid point and each
effective spin $-0.1$, $0$, $0.1$, the bank takes a waveform within 0.125% of
that chirp mass, with mass ratio 0.7 to 0.9 and effective spin within 0.03
of the target, preferring small in-plane spins. That makes 235 × 3 = 705
slots; at the lowest grid point, 0.85 M☉, the edge of the prior, no waveform
in the file passes these cuts for spins $\pm 0.1$, so the bank has 703
templates. Each is whitened once with the average O3a noise spectrum and
scaled to unit norm. For each
template $h_j$ and detector, the network computes

$$
z_j(\tau) = \sum_t x(t)\, \tilde h_j^{*}(t - \tau),
$$

where $x$ is the whitened strain and $\tilde h_j$ the template plus $i$ times
its 90°-shifted copy, so $\rho_j^2(\tau) = |z_j(\tau)|^2$ is the
matched-filter SNR² whatever the phase of the signal. It is done by FFT, at
1024 Hz. The two detectors combine as
$\rho_{H}^2(\tau) + \max_{|\delta| \le 10\,\text{ms}} \rho_{L}^2(\tau+\delta)$,
and the maximum over the lags where a merger can sit gives one number per
template, $\rho^2_{g,s}$, for chirp mass $g$ and spin $s$. The read-out is a
posterior over the 235 chirp masses,

$$
\log p(g \mid x) = \log \sum_{s} e^{\beta \rho^2_{g,s}} + b_g + \text{const},
$$

and the estimate is its peak, refined by a parabola through the peak and its
two neighbours. The learned numbers are $\beta$, the 235 biases $b_g$ and two
for a detection score. For stationary Gaussian noise, the log-likelihood
ratio of a template, maximized (not marginalized) over amplitude and phase,
is $\rho^2/2$, so a posterior built from it has $\beta = 1/2$
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-beta-half)).

```python
spectrum = torch.fft.rfft(X, n=self.n_full)[..., : self.f]             # (B, 2, F)
z = torch.fft.ifft(spectrum[:, :, None] * self.filters[None], n=self.n)
rho2 = z[..., self.lags].abs() ** 2                                  # (B, 2, J, lags)
L1 = max_pool1d(rho2[:, 1].reshape(-1, 1, T), 2 * c + 1, stride=1, padding=c)
peak = (rho2[:, 0] + L1.reshape(B, J, T)).amax(-1)                   # (B, J)
logits = torch.logsumexp(self.log_beta.exp() * peak[:, self.table], -1) + self.bias
```

## How each choice was tested

Before training anything, I ran the bank on the benchmark's 12,800 windows
per population (one minute on a GPU), changing one thing at a time. Within
1 / 2% for the power law from SNR 4:

<div markdown="1">

| bank | SNR 8 to 10 | SNR 10 to 12 | all |
|---|---|---|---|
| benchmark matched filter: mass ratios 0.5, 0.7, 0.9, grid 0.5%, each window's own noise spectrum | 92 / 95% | 97 / 100% | 46 / 49% |
| same, one average O3a noise spectrum | 93 / 96% | 97 / 100% | 47 / 50% |
| same, at 1024 Hz | 92 / 96% | 97 / 100% | 47 / 51% |
| average spectrum, mass ratio 0.8, grid 0.25%, parabola | 92 / 96% | 98 / 100% | 47 / 50% |
| average spectrum, mass ratio 0.8, grid 1%, parabola | 87 / 91% | 96 / 100% | 42 / 46% |
| average spectrum, mass ratio 0.8, grid 2%, parabola | 69 / 78% | 86 / 94% | 34 / 39% |

</div>

So one average noise spectrum and 1024 Hz change the result by at most a
point, and a 1% grid puts 5 points fewer events within 1% at SNR 8 to 10
than a 0.25% grid, even with the parabola, so I kept 0.5%. Two more
findings:

- **Mass ratio cannot be measured** from these windows. The benchmark matched
  filter's mass-ratio estimates have a median error of 0.12, the same as
  always guessing the prior's median mass ratio, 0.79, which gives a median
  error of 0.121 over the injection file
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-chance)).
  The network does not estimate it.
- **Spin limits chirp mass.** With a single spin, within 1% stops at 95% even
  at SNR 25 to 50. At SNR above 16, events with $|\chi_\text{eff}| < 0.1$
  are 99.3 to 99.5% within 1%, but those with $\chi_\text{eff} < -0.1$ are
  78% (biased by +0.7%) and those with $\chi_\text{eff} > 0.1$ are 91%
  (biased by −0.6%). The inspiral phase depends on chirp mass, mass ratio
  and spin together, so a template with the wrong spin matches best at a
  slightly wrong chirp mass (Cutler and Flanagan 1994,
  [arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014); Baird et al.
  2013, [arXiv:1211.0546](https://arxiv.org/abs/1211.0546), who find that
  at low masses the strongest trade-off is between mass ratio and spin, and
  our templates also fix the mass ratio). Templates at
  three spins, summed in the posterior, raise within 1% at SNR 16 to 50 to
  97 to 98%. The benchmark matched filter has the same limit, so here the
  network is better than the benchmark.

## Training made it worse

After one epoch $\beta$ was 0.46. Training longer, $\beta$ fell to 0.04 in
six epochs and validation within 1% fell from 49 to 45% (703 templates) and
from 47 to 39% (235 templates). The cross-entropy target is a narrow peak at
the true chirp mass; events whose best template is off by the spin bias are
penalized heavily, so training flattens the posterior until the learned
biases decide the peak. The results above use the network after one epoch.
The physics sets the answer, and the learned read-out can only calibrate it.

## Cost

Per 4 s window, on one GPU with batches of 32:

<div markdown="1">

| model | learned numbers | GFLOP per window | windows per second |
|---|---|---|---|
| den-reg | 600,582 | 9.9 | 473 |
| chirp kernels (512) | 263,169 | 1.8 | 1,176 |
| template bank, 703 templates | 238 | 0.39 | 3,718 |
| template bank, 235 templates | 238 | 0.13 | 11,481 |

</div>

Learned numbers are the trainable parameters. GFLOP per window counts one
forward pass on one window: matrix multiplications and convolutions with
PyTorch's FLOP counter, plus each FFT of length $n$ at $5n\log_2 n$
operations (complex) or $2.5n\log_2 n$ (real), the convention of the
[FFTW benchmarks](https://www.fftw.org/speed/method.html). Windows per
second is measured at batch 32. The template banks also hold their fixed
template spectra: 2 detectors × 703 (or 235) templates × 2,305 frequency
bins of single-precision complex numbers (8 bytes each), 25.9 and 8.7 MB.

## Detection

The same test windows also give the separation of signal from noise-only
windows. Plain SNR² fails at low false-positive rates: in the 24,970 O3b
noise-only test windows, 49 have a plain network SNR above 100 (the largest
716), from glitches, so a threshold that passes one noise window in 10,000
passes almost no signal. The standard fix is the χ² test (Allen 2005,
[arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045)): split each
template into 16 frequency bands of equal power; a real chirp puts one
sixteenth of its complex SNR in each, a glitch does not; the SNR is then
down-weighted by the excess χ² (Babak et al. 2013,
[arXiv:1208.3491](https://arxiv.org/abs/1208.3491)). Fraction of signals
at SNR 8 to 12 found when one noise window in 10,000 passes (the three
populations share the same 24,970 noise windows, so this threshold rests on
the two or three loudest):

<div markdown="1">

| statistic | power law from 4 | power law from 8 | uniform |
|---|---|---|---|
| template bank, χ²-reweighted SNR² | 74% | 73% | 80% |
| template bank, plain SNR² | 0% | 0% | 0% |
| den-reg epoch 799, −σ | 19% | 20% | 26% |
| den-reg epoch 339, −σ | 14% | 16% | 20% |

</div>

Over 579,108 s (6.7 days) of time-shifted O3b background, the same pipeline
that gave the den-reg's
[sensitive volume]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }})
gives, at a false-alarm rate of 109 per year (MBTA values from the
LIGO–Virgo–KAGRA O3 search-sensitivity injection release that accompanies
GWTC-3, [Zenodo 7890437](https://zenodo.org/records/7890437); MBTA: Aubin
et al. 2021, [arXiv:2012.11512](https://arxiv.org/abs/2012.11512)):

<div markdown="1">

| masses (M☉) | template bank, χ²-reweighted SNR | den-reg epoch 365, −σ | MBTA in O3 |
|---|---|---|---|
| 1.4 + 1.4 | 8.6 × 10⁻⁴ Gpc³ (9% of MBTA) | 1.1 × 10⁻⁴ (1%) | 9.5 × 10⁻³ |
| 1.6 + 1.6 | 1.5 × 10⁻³ (11%) | 4.7 × 10⁻⁴ (4%) | 1.3 × 10⁻² |
| 1.8 + 1.8 | 1.8 × 10⁻³ (11%) | 5.9 × 10⁻⁴ (4%) | 1.6 × 10⁻² |
| 2.0 + 2.0 | 2.9 × 10⁻³ (16%) | 1.1 × 10⁻³ (6%) | 1.8 × 10⁻² |

</div>

{% include figure.html
   src="/assets/img/bns/2026-10-12/sensitive_volume.png"
   alt="Sensitive volume against false-alarm rate for four equal-mass pairs: the template bank with the chi-squared statistic and with the detection MLP, the den-reg run, and the MBTA and PyCBC O3 values"
   label="Sensitive volume"
   caption="Log scale, shared across panels. The bank with plain SNR² finds nothing at these false-alarm rates: glitches set the threshold." %}

That is 2.6 to 8.2 times the den-reg's volume, from a statistic with nothing
learned. It is still 6.1 to 11 times below MBTA. Part of that is the window:
for one waveform each at chirp mass 1.0, 1.2, 1.5, 2.0 and 2.5 M☉, the last
4 s hold 74 to 93% of the SNR (a ratio of SNRs, not of SNR²) of the
injection file's 30 s waveforms. At a fixed SNR threshold the volume scales
as SNR³, so this alone costs a factor 1.25 to 2.49 in volume
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-window-volume)).
The rest I have not measured; MBTA's ranking uses more than a χ² test
(Aubin et al. 2021). After the χ² test the loudest background is not
single-detector glitches: both detectors carry ρ² of 15 to 54 with reduced
χ² of 0.5 to 1.7, so a per-detector threshold would not help. I also
trained a small network (two hidden layers of 32) on per-window features (each detector's SNR² and χ²,
the time and phase offsets between detectors, the template's chirp mass) on
O3a noise with half the windows signal-free. It is not clearly better: below
the χ² statistic at 54 per year, slightly above at 109 per year and higher,
within the errors.

## How many filters reproduce the bank

The bank's 703 whitened templates span a space that a smaller set of
filters can reproduce (the idea of Cannon et al. 2010,
[arXiv:1005.0012](https://arxiv.org/abs/1005.0012)). From a
singular-value decomposition (H1), keeping K basis filters keeps this
fraction of each template's SNR
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-svd)):

<div markdown="1">

| K basis filters | median template | worst 5% of templates |
|---|---|---|
| 32 | 0.45 | 0.02 |
| 64 | 0.65 | 0.25 |
| 128 | 0.83 | 0.61 |
| 256 | 0.99 | 0.94 |
| 384 | 1.00 | 1.00 |

</div>

So 256 basis filters keep at least 94% of the SNR of 95% of this bank's
templates, and 384 keep all of it. This is the linear span of these 703
templates (4 s windows, mass ratio 0.7 to 0.9, three spins); it says how
many linear filters reproduce this bank, not how many a network built
differently needs. The den-reg has 128 channels, and the best tone fits I
found for a kernel of its size keep 25 to 33% of a chirp's matched-filter
SNR.

## What the read-out must do

With the bank's ideal kernels fixed, I changed only the read-out. Within 1 / 2%
at SNR 8 to 10 on the benchmark windows:

<div markdown="1">

| read-out | uniform SNR | power law from SNR 4 |
|---|---|---|
| complex kernels, energy, maximum over time | 96 / 99% | 91 / 96% |
| real kernels only, (Re z)², maximum over time | 94 / 96% | 89 / 95% |
| energy, log-sum-exp over time | 96 / 99% | 91 / 96% |
| energy, **mean** over time | 26 / 31% | 22 / 28% |

</div>

The two quadratures help a little (1 to 3 points). The maximum and the
log-sum-exp give the same result. Averaging over time, as the den-reg's
regressor does, takes the bank's own templates down to 22 to 26% within 1%,
near the den-reg's level.

## What this is

This is a matched filter with a learned read-out of 238 numbers, built as a
network: the filters are a long convolution layer, the SNR is an energy,
the time maximum is a pooling layer, and the read-out is a softmax over
chirp mass. It needs a template bank, which is what the project wants to
avoid; it is our reference. It is not a strict ceiling: a matched filter is
optimal for stationary Gaussian noise and exact templates (Allen et al.
2012), while here the noise has glitches and the templates fix the mass ratio (0.7 to 0.9) and
three spins. What it explains is why the den-reg could not get there: the
best tone fits I found for its kernels keep only a quarter to a third of a
chirp's SNR, and it averages over time. Whether a network can learn the
filters itself is the [next update]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}).

Caveats:

- The templates and the test injections come from the same waveform file. In
  each population 144 test events share a template's chirp mass; removing
  them changes within 1% by at most 0.04 points. The den-reg was trained on
  every waveform in that file.
- A 4 s window holds only the end of the inspiral: 74 to 93% of the SNR of
  the 30 s waveforms. I expect longer windows to help detection more than
  anything I tried in the read-out.
