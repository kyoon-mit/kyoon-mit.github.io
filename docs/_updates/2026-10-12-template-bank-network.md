---
title: "The matched filter as a network: the ceiling, and why den-reg cannot reach it"
date: 2026-10-12
math: true
summary: >-
  A matched filter written as a network (703 fixed waveform templates, SNR,
  maximum over time, a posterior over chirp mass, no denoiser) puts 95% of
  events at SNR 8 to 12 within 1% of the true chirp mass on 50,000 test
  windows per population; the den-reg run reaches 17 to 28%. It is a
  template bank, so it is the ceiling, not the model we want. What it shows:
  one S4D channel cannot hold a chirp, a network needs about 250 long
  chirp-shaped filters, and averaging over time destroys the information.
---

{%- assign u = '/projects/bns/updates/' -%}

This follows the [matched-filter benchmark]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }}),
the [chirp kernels]({{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }})
and the [den-reg run with the shape and amplitude terms]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }}).
"Within 1%" means the predicted chirp mass is within 1% of the true one.

## The result

Every model below was tested the same way: O3b background, half the windows
with an injection, about 25,000 signal windows per population, the merger
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

The "all" column of the first population is low for every model because most
of its events are below SNR 8; between SNR 4 and 8 the template bank gets 32 /
36% and the den-reg 4 to 5 / 8 to 10%.

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
   caption="Median and 1σ band of the prediction in bins of true chirp mass. At SNR 8 to 12 (left) the template bank's band is thinner than its line. Over all SNR (right) every model's band is wide, because most events of this population are below SNR 8." %}

## Why the S4D could not do this

The information is in the data: the matched filter recovers it (the
benchmark). A matched filter is a convolution of the strain with the
time-reversed chirp. S4D layers are convolutions too, but each channel's
kernel is a sum of damped tones,

$$
K(\ell) = \sum_{n=1}^{N} c_n \, z_n^{\ell}, \qquad |z_n| \le 1,
$$

with $N$ the number of tones (half the state size; $N = 32$ in the den-reg
run), $c_n$ complex weights, $z_n$ complex poles and $\ell$ the lag in
samples. A whitened BNS chirp has 380 to 580 cycles in 4 s. I fitted tone
sums to real whitened templates and measured the match (the fraction of the
matched-filter SNR the fitted kernel keeps):

{% include figure.html
   src="/assets/img/bns/2026-10-12/tone_check.png"
   alt="Match between a fitted sum of tones and a whitened 4 second BNS chirp kernel against the number of tones, for three fitting methods and four chirp masses"
   label="How many tones one channel needs"
   caption="Three ways to choose the tones: the N largest Fourier components (top left), a fixed grid over 20 to 800 Hz (top right), and poles fitted freely by the matrix-pencil method, kept stable (bottom left). At the den-reg's 32 tones the best fit keeps 25 to 33% of the SNR. Stable damped tones never pass 0.92; Fourier tones need about 1,000 for 0.95." %}

So one channel cannot hold the matched filter. The network would have to
build it from many channels and nonlinearities, and in 800 epochs it did
not. A denoiser in front does not change this, since the regressor that
reads its output has the same kernels. Making the S4D kernel a chirp by
fitting its tones would need over 1,000 tones per channel; taking the kernel
from the waveform model needs none.

## The network

{% include figure.html
   src="/assets/img/bns/2026-10-12/template_bank_architecture.png"
   alt="Block diagram: whitened strain, FFT, multiplication by 703 template spectra, inverse FFT, SNR squared, network SNR squared, maximum over lags, posterior over chirp mass, estimate; chi-squared test for detection"
   label="Architecture"
   caption="Blue: fixed. Green: learned." %}

The templates are 703 waveforms taken from the injection file itself: one
per point of a chirp-mass grid spaced by 0.5% from 0.85 to 2.75 M☉ and per
effective spin $-0.1$, $0$, $0.1$, with mass ratio near 0.8. Each is whitened
once with the average O3a noise spectrum and scaled to unit norm. For each
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
for a detection score. For Gaussian noise the likelihood has $\beta = 1/2$.

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

So one average noise spectrum and 1024 Hz cost nothing, and the grid must be
0.5% or finer even with the parabola. Two more findings:

- **Mass ratio cannot be measured** from these windows. The benchmark matched
  filter's mass-ratio estimates have a median error of 0.12, the same as the
  spread of the prior itself. The network does not estimate it.
- **Spin limits chirp mass.** With a single spin, within 1% stops at 95% even
  at SNR 25 to 50. At SNR above 16, events with $|\chi_\text{eff}| < 0.1$
  are 99.3 to 99.5% within 1%, but those with $\chi_\text{eff} < -0.1$ are
  78% (biased by +0.7%) and those with $\chi_\text{eff} > 0.1$ are 91%
  (biased by −0.6%): chirp mass and spin trade off in the phase. Templates at
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

The template banks also hold their fixed templates: 26 and 9 MB.

## Detection

The same test windows also give the separation of signal from noise-only
windows. Plain SNR² fails at low false-positive rates: real O3b noise has
glitches with SNR above 100, so a threshold that passes one noise window in
10,000 passes almost no signal. The standard fix is the χ² test (Allen
2005): split each template into 16 frequency bands of equal power; a real
chirp puts one sixteenth of its SNR in each, a glitch does not; the SNR is
then down-weighted by the excess χ² (Babak et al. 2013). Fraction of signals
at SNR 8 to 12 found when one noise window in 10,000 passes (each population
has about 25,000 noise windows, so this threshold rests on the two or three
loudest):

<div markdown="1">

| statistic | power law from 4 | power law from 8 | uniform |
|---|---|---|---|
| template bank, χ²-reweighted SNR² | 74% | 73% | 80% |
| template bank, plain SNR² | 0% | 0% | 0% |
| den-reg epoch 799, −σ | 19% | 20% | 26% |
| den-reg epoch 339, −σ | 14% | 16% | 20% |

</div>

Over a week of O3b background with time shifts, the same pipeline that gave
the den-reg's
[sensitive volume]({{ u | append: '2026-10-09-shape-and-amplitude-terms/' | relative_url }})
gives, at a false-alarm rate of 109 per year:

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

That is 2.6 to 8 times the den-reg's volume, from a statistic with nothing
learned. It is still 6 to 11 times below MBTA. Part of that is the window: the
last 4 s hold 74 to 93% of the SNR of the injection file's 30 s waveforms
(chirp mass 1.0 to 2.5 M☉), which alone costs a factor 1.3 to 2.5 in volume.
The rest I have not measured; MBTA's ranking uses more than a χ² test. After
the χ² test the loudest background is not single-detector glitches: both
detectors carry ρ² of 15 to 54 with χ² near 1, so a per-detector threshold
would not help. I also trained a small network (two
hidden layers of 32) on per-window features (each detector's SNR² and χ²,
the time and phase offsets between detectors, the template's chirp mass) on
O3a noise with half the windows signal-free. It is not clearly better: below
the χ² statistic at 54 per year, slightly above at 109 per year and higher,
within the errors.

## How many filters a network needs

The bank's 703 whitened templates span a space that a smaller set of
filters can reproduce. From a singular-value decomposition (H1), keeping K
basis filters keeps this fraction of each template's SNR:

<div markdown="1">

| K basis filters | median template | worst 5% of templates |
|---|---|---|
| 32 | 0.45 | 0.02 |
| 64 | 0.65 | 0.25 |
| 128 | 0.83 | 0.61 |
| 256 | 0.99 | 0.94 |
| 384 | 1.00 | 1.00 |

</div>

So the signal space of 4 s BNS windows is about 250-dimensional. Any network,
template-based or not, needs about 250 long, chirp-shaped filters in its
first stage to be coherent. The den-reg has 128 channels whose kernels each
hold at most a third of a chirp.

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

The two quadratures help a little (2 to 6 points). The maximum and the
log-sum-exp are equivalent. Averaging over time, as the den-reg's regressor
does, takes even perfect matched filters down to the den-reg's level.

## What this is

This is a matched filter with a learned read-out of 238 numbers, built as a
network: the filters are a long convolution layer, the SNR is an energy,
the time maximum is a pooling layer, and the read-out is a softmax over
chirp mass. It needs a template bank, which is what the project wants to
avoid; it is the reference ceiling. What it explains is why the den-reg
could not get there: its kernels cannot hold a chirp, and it averages over
time. Whether a network can learn the filters itself is the
[next update]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}).

Caveats:

- The templates and the test injections come from the same waveform file. In
  each population 144 test events share a template's chirp mass; removing
  them changes within 1% by at most 0.04 points. The den-reg was trained on
  every waveform in that file.
- A 4 s window holds only the end of the inspiral: 74 to 93% of the SNR of
  the 30 s waveforms. Longer windows would help detection more than
  anything I tried in the read-out.
