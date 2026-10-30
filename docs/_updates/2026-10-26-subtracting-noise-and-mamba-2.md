---
title: "Gaussian noise does not help our S4D denoiser and regressor: 11.9% within 1%, 12.3% in real noise; Mamba-2 worse"
date: 2026-10-26
tags: [noise, denoising, regression, s4d, detection, matched-filter]
math: true
summary: >-
  In ideal noise a perfect noise model predicts 0, so subtracting it leaves
  the data unchanged: the true template still finds 94.6% of our test
  signals at a false-alarm probability of 10⁻³, and a model that predicts by
  drawing from the right distribution finds 73.4%. In our whitened noise the
  past predicts 24.7% (H1) and 12.2% (L1) of a sample's variance, and
  subtracting that prediction before the matched filter is exactly the
  Gaussian detector of 23 October. Trained on Gaussian copies of our noise,
  the S4D den-reg is no better than in real noise (11.9% against 12.3% within
  1% at epochs 330 to 349) and is not memorizing its training signals; a
  Mamba-2 den-reg is worse at every SNR (5.9% against 14.9% overall).
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}
{%- assign gh = 'https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/' -%}

The [23 October update]({{ u | append: '2026-10-23-next-sample-noise-model/' | relative_url }})
tested a learned noise model as a detector. The idea behind it is to subtract
the noise that a model predicts from the data, so that a second network sees
mostly the signal. This page asks how far that can go. Test 3 takes ideal
noise and a perfect noise model. A second check measures how much of our
whitened noise its own past predicts. Test 4 trains the den-reg on Gaussian
copies of our noise, once with S4D layers and once with Mamba-2 layers, to
see whether a network learns the signal better when the noise is exactly
Gaussian. The code is in our aframe fork
([checks](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/dev/analysis/claude_tests/next_sample_checks),
[Gaussian-noise checks](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/dev/analysis/claude_tests/gaussian_noise_checks),
[Gaussian copies](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/projects/train/train/experimental/gaussian_noise),
[Mamba-2](https://github.com/kyoon-mit/aframe/tree/reg-dev-latest/projects/train/train/experimental/mamba)),
and every number below is printed by the script named with it.

## Test 3: a perfect noise model in ideal noise

The windows are 20,000 draws of the test loader, as in Test 2 (O3b
background, BNS signals from the test waveform file, SNR from a power law
with index −3 between 4 and 100). From each I kept only the whitened signal
$h$ and replaced the noise by independent unit Gaussian samples in both
detectors, so the SNR in the window is exactly $|h|$. Aframe scales each
waveform to its SNR label over the waveform's full length and then cuts the
4 s window
([supervised.py]({{ gh }}projects/train/train/data/supervised/supervised.py),
`inject`); the SNR in the window is 0.908 to 0.976 times the label (median
0.951), and the tables use the SNR in the window
([test3_white_noise.py]({{ gh }}dev/analysis/claude_tests/next_sample_checks/test3_white_noise.py),
[test3_summary.py]({{ gh }}dev/analysis/claude_tests/next_sample_checks/test3_summary.py),
[output]({{ gh }}dev/analysis/claude_tests/next_sample_checks/test3.txt)).

Noise whose samples are independent cannot be predicted from its past: a
perfect model of it predicts 0 for every sample, so the data minus the
predicted noise is the data itself
([derivation]({{ d | relative_url }}#oct26-ideal-noise)). The first table is
therefore what any method that subtracts predicted noise can leave in ideal
noise.

<div markdown="1">

| SNR in window | Windows | Signal share of power | Found at 10⁻³ | Amplitude error | Energy recovered without the template |
|---|---|---|---|---|---|
| 3.6 to 4 | 1,964 | 9.24 × 10⁻⁴ | 0.7805 (0.7879) | 0.2601 (0.2571) | 9.31 × 10⁻⁴ |
| 4 to 4.5 | 3,745 | 1.09 × 10⁻³ | 0.8561 (0.8711) | 0.2382 (0.2365) | 1.08 × 10⁻³ |
| 4.5 to 5 | 2,706 | 1.37 × 10⁻³ | 0.9464 (0.9488) | 0.2076 (0.2111) | 1.37 × 10⁻³ |
| 5 to 6 | 3,561 | 1.80 × 10⁻³ | 0.9899 (0.9886) | 0.1835 (0.1839) | 1.79 × 10⁻³ |
| 6 to 8 | 3,528 | 2.81 × 10⁻³ | 0.9991 (0.9997) | 0.1475 (0.1468) | 2.83 × 10⁻³ |
| 8 to 12 | 2,539 | 5.43 × 10⁻³ | 1.0000 (1.0000) | 0.1045 (0.1053) | 5.47 × 10⁻³ |
| 12 to 100 | 1,957 | 1.70 × 10⁻² | 1.0000 (1.0000) | 0.0614 (0.0558) | 1.75 × 10⁻² |

</div>

- **Signal share of power:** $|h|^2/|d|^2$, the median over the band.
- **Found at 10⁻³:** the share of windows in which the matched filter with
  the true template exceeds the threshold for a false-alarm probability of
  $10^{-3}$, set on the noise draws. In brackets, the formula evaluated
  window by window.
- **Amplitude error:** the spread of the fitted amplitude
  $\langle d, h\rangle/|h|^2$ about 1; in brackets, $1/\mathrm{SNR}$.
- **Energy recovered without the template:** the median share of the
  signal's energy recovered by the best scaled copy of the data, given the
  signal's energy but not its shape.

A model that predicts each sample by drawing from the right distribution,
$\mathcal N(0, 1)$, instead of giving its mean, leaves noise of variance 2:

<div markdown="1">

| SNR in window | Signal share of power | Found at 10⁻³ | Amplitude error |
|---|---|---|---|
| 3.6 to 4 | 4.63 × 10⁻⁴ | 0.3651 (0.3675) | 0.3649 (0.3636) |
| 4 to 4.5 | 5.45 × 10⁻⁴ | 0.4350 (0.4617) | 0.3299 (0.3344) |
| 4.5 to 5 | 6.86 × 10⁻⁴ | 0.5909 (0.6028) | 0.2986 (0.2986) |
| 5 to 6 | 9.00 × 10⁻⁴ | 0.7591 (0.7735) | 0.2618 (0.2601) |
| 6 to 8 | 1.40 × 10⁻³ | 0.9433 (0.9493) | 0.2094 (0.2077) |
| 8 to 12 | 2.72 × 10⁻³ | 0.9992 (0.9991) | 0.1529 (0.1489) |
| 12 to 100 | 8.60 × 10⁻³ | 1.0000 (1.0000) | 0.0838 (0.0790) |

</div>

Here the amplitude formula is $\sqrt2/\mathrm{SNR}$. Over all windows, 94.23%
of signals are found (formula 94.60%) with the perfect model and 72.35%
(formula 73.40%) with the drawn prediction. The measured shares sit up to 1.5
points below the formula because the thresholds measured on the noise draws
came out 0.021 and 0.045 above the exact ones, within their spreads of 0.066
and 0.094
([derivation]({{ d | relative_url }}#oct26-threshold-spread)).

- **In ideal noise there is nothing to subtract.** The best possible noise
  model leaves the data as they are. The signal stays 0.09% to 1.7% of the
  power, and finding it still takes the template. Without the template, a
  scaled copy of the data recovers 0.1% of the signal's energy at SNR 4.
- **A drawn prediction makes it worse.** Subtracting a draw from the right
  distribution doubles the noise: 73.4% are found instead of 94.6%.
- **Parameters, in the best case.** With the true template and only its
  amplitude unknown, the amplitude error is $1/\mathrm{SNR}$: 25% at SNR 4.

**On real noise.** For Test 2's 19,581 clean windows of real O3b noise, at
$10^{-3}$, the ideal-noise formula gives 94.57%, the Gaussian of Test 2
found 94.65% and the plain matched filter 91.93%; at label SNR 4 to 5, 86.14%,
87.78% and 79.94% (same script and output). The Gaussian's 1.6-point lead over
ideal noise at SNR 4 to 5 is 1.1 times the spread of a threshold set from
19,581 noise draws, 1.45 points
([derivation]({{ d | relative_url }}#oct26-threshold-spread)). Over all
windows the plain matched filter is 2.6 points below ideal noise.

## How much of our noise its own past predicts

Raw strain and whitened 4 s windows of the 21 O3a training files, per
detector. The whitened windows are those of Test 1, and only clean ones are
kept: 24,679 in H1 and 24,660 in L1
([correlations.py]({{ gh }}dev/analysis/claude_tests/next_sample_checks/correlations.py),
[output]({{ gh }}dev/analysis/claude_tests/next_sample_checks/correlations.txt)).

<div markdown="1">

| | H1 | L1 |
|---|---|---|
| Raw strain: correlation with the previous sample | 0.99953 | 0.99967 |
| Raw strain: correlation with the sample 100 back | −0.765 | −0.803 |
| Whitened: correlation with the previous sample | −0.078 | −0.020 |
| Whitened: variance | 1.269 | 1.093 |
| Whitened: share predictable from the previous sample | 0.61% | 0.04% |
| from the earlier samples of the 4 s window | 24.70% | 12.24% |
| from the infinite past | 24.73% | 12.28% |
| from the infinite past, 20 Hz and above only | 17.19% | 4.03% |

</div>

The shares come from the correlation with the previous sample, the
Levinson-Durbin recursion and Kolmogorov's formula
([derivation]({{ d | relative_url }}#oct26-predictable-share)).

- **Raw strain is almost the same from one sample to the next:** 99.9% of a
  sample's variance is predictable from the one before. Whitening divides
  each frequency by the noise amplitude there, and leaves a correlation of
  −0.078 (H1) and −0.020 (L1) with the previous sample.
- **It does not remove all of it.** H1's whitened noise is still 24.7%
  predictable from its 4 s past, L1's 12.2%. Over the band from 20 Hz up
  alone, the shares are 17.2% and 4.0%. The band below 20 Hz holds 0.01%
  (H1) and 0.03% (L1) of the variance, and a nearly empty band raises the
  predictable share.
- **What a perfect subtraction would leave.** Subtracting a perfect
  prediction from whitened noise leaves at least 75.3% (H1) and 87.7% (L1)
  of its variance. In data the prediction is made from signal and noise
  together, so it acts on the signal too.
- **Subtract, then matched filter, is the Gaussian detector.** Subtracting
  the predicted noise, passing the template through the same subtraction, and
  matched filtering the two is exactly the likelihood ratio of the Gaussian
  in Test 2 ([derivation]({{ d | relative_url }}#oct26-subtract-then-filter)).
  For Gaussian noise this is as far as subtracting the noise can go: 94.65%
  found at $10^{-3}$ in clean windows, against 91.93% for the plain matched
  filter.

## Test 4: the den-reg in Gaussian noise, with S4D and with Mamba-2

### Setup

The den-reg of the
[14 October update]({{ u | append: '2026-10-14-den-reg-final/' | relative_url }})
(joint denoiser and regressor, 128 channels, 6 layers each, chirp mass and
mass ratio, the shape and amplitude terms, dropout 0.2, each signal in 4
backgrounds), with every background stretch replaced by its Gaussian copy,
in training and in validation
([data.py]({{ gh }}projects/train/train/experimental/gaussian_noise/data.py)).
Training SNR comes from a power law with index −3 from 8, validation from 4,
as on 14 October. Each run used one GPU capped at 250 W; both started on 24
October
([S4D configuration]({{ gh }}dev/local/train/claude_tests/gaussian_noise/den_reg_s4d_gaussian_c_rho_5_lambda_amp_3_train_snr8_prob0.96.yaml),
[Mamba-2 configuration]({{ gh }}dev/local/train/claude_tests/gaussian_noise/den_reg_mamba2_gaussian_c_rho_5_lambda_amp_3_train_snr8_prob0.96.yaml)).

**The copies.** On the test loader (128 stretches for the spectra, 20
batches for the whitened values)
([check_copy.py]({{ gh }}dev/analysis/claude_tests/gaussian_noise_checks/check_copy.py),
[output]({{ gh }}dev/analysis/claude_tests/gaussian_noise_checks/check_copy.txt)),
the spectrum of the copy over that of the real stretch has median 0.9997 at
20 Hz and above. After whitening, the copy's variance has median 1.097
against 1.760 for real noise, and its largest whitened value has median 4.12
and maximum 5.89, against 4.99 and 6,207. A whitened Gaussian copy comes out
above unit variance because the whitening uses an estimated spectrum
([derivation]({{ d | relative_url }}#oct19-copy-level)).

**Mamba-2.** The second run replaces each S4D layer, in the denoiser and in
the regressor, by a Mamba-2 layer (Dao and Gu 2024,
[arXiv:2405.21060](https://arxiv.org/abs/2405.21060)), with the same blocks
around it. For each Mamba-2 head $j$ the layer runs

$$
s_t = e^{\Delta_t A_j}\, s_{t-1} + \Delta_t B_t\, x_t ,
\qquad
y_t = C_t \cdot s_t + D_j\, x_t ,
$$

where the step $\Delta_t$ and the vectors $B_t$ and $C_t$ are computed from
the input at every sample, and $A_j < 0$ is one real number per head. I
wrote the layer in PyTorch, with the fast GPU scan of the mamba-ssm package
(version 2.3.2.post1), and tested it against the recurrence evaluated step
by step
([ssd.py]({{ gh }}projects/train/train/experimental/mamba/ssd.py),
[test]({{ gh }}projects/train/tests/test_mamba_ssd.py)). The settings are
the reference ones (head size 64, a 4-sample convolution before the scan,
starting steps from 0.001 to 0.1) except two: state size 64, as in our S4D,
instead of 128, and expansion 1 instead of 2. With expansion 1 the inner
width is 128 and each layer has 2 heads. A training epoch took 7 min 16 s,
against 6 min 17 s for S4D. Each half of the Mamba-2 den-reg has 405,414 and
405,672 numbers, against 300,162 and 300,420 for S4D.

I stopped both runs on 26 October to start the runs at the end of this page:
S4D after 476 epochs, Mamba-2 after 413.

### Accuracy by SNR

On 7,858 validation windows (Gaussian copies of the validation background,
the validation waveforms, SNR from 4), the same for both networks, in
evaluation mode
([eval_by_snr.py]({{ gh }}dev/analysis/claude_tests/gaussian_noise_checks/eval_by_snr.py);
all numbers of this section from
[test4_summary.py]({{ gh }}dev/analysis/claude_tests/gaussian_noise_checks/test4_summary.py),
[output]({{ gh }}dev/analysis/claude_tests/gaussian_noise_checks/test4.txt)).
Share within 1%, 2% and 5% of the true chirp mass:

<div markdown="1">

| SNR | Windows | S4D | Mamba-2 |
|---|---|---|---|
| 4 to 5 | 2,835 | 3.1 / 6.2 / 14.4% | 2.8 / 5.0 / 11.9% |
| 5 to 6 | 1,551 | 4.6 / 8.9 / 19.7% | 2.3 / 5.8 / 14.6% |
| 6 to 8 | 1,576 | 7.9 / 14.1 / 30.6% | 3.3 / 7.4 / 19.3% |
| 8 to 12 | 1,033 | 25.5 / 41.1 / 63.2% | 9.4 / 19.0 / 40.0% |
| 12 to 100 | 863 | 71.8 / 87.4 / 96.9% | 23.1 / 46.8 / 87.0% |
| all | 7,858 | 14.9 / 21.8 / 34.2% | 5.9 / 12.1 / 25.9% |

</div>

Validation during training, from the runs' Weights and Biases records (16
batches of 128 windows drawn anew each epoch, so single epochs scatter):

<div markdown="1">

| Epoch | 9 | 49 | 99 | 199 | 299 | 399 | 411 |
|---|---|---|---|---|---|---|---|
| S4D, within 1% | 2.3% | 3.8% | 5.7% | 9.9% | 11.2% | 11.7% | 12.5% |
| Mamba-2, within 1% | 1.4% | 2.8% | 4.5% | 5.8% | 5.7% | 6.3% | 5.4% |
| S4D, overlap | 0.102 | 0.158 | 0.172 | 0.193 | 0.192 | 0.196 | 0.196 |
| Mamba-2, overlap | 0.092 | 0.138 | 0.139 | 0.152 | 0.156 | 0.162 | 0.154 |

</div>

### What this shows

**Gaussian noise did not help the S4D den-reg.** Its mean validation share
within 1% over epochs 330 to 349 is 11.9%; the same den-reg in real noise had
12.3% over the same epochs on 14 October, on a validation population drawn
the same way. Over its last 20 epochs (456 to 475) it is 13.2%. Real noise
has glitches and lines that Gaussian copies lack, so what limits the den-reg
is not what real noise has beyond Gaussian noise.

**The S4D is not memorizing its training signals.** The training numbers are
measured with dropout on, on SNR 8 to 100. Run the same way on the
validation windows of SNR 8 to 100, whose SNR distribution is that of
training, S4D puts 29.7% within 1%; its training value over epochs 456 to
475 is 29.2%. The validation waveforms come from a separate file. By the end,
each training waveform had been drawn 28.9 times on average, in 115.7 noisy
copies ([derivation]({{ d | relative_url }}#oct26-repeat-count)). The network
does as well on waveforms it never saw, so more copies of each signal would
not be fixing an overfit. Whether they help it learn the signal faster is
what the new runs below test. Mamba-2 likewise: 19.8% on validation against
19.0% in training.

**Evaluation mode, with dropout off, is better for S4D:** 46.6% within 1% at
SNR 8 to 100, against 29.7% with dropout on. For Mamba-2 it is worse above
SNR 12 (23.1% against 33.4%), a gap between training and evaluation of the
kind the
[16 October update]({{ u | append: '2026-10-16-why-dropout-broke-our-s4d/' | relative_url }})
found in our S4D regressors.

**Mamba-2 is worse than S4D at every SNR,** and most where the data hold the
most: 23.1% against 71.8% within 1% at SNR 12 and above. It was behind from
the first epochs, so this is not a matter of training time, and it has 35%
more numbers. Three differences between the layers, none tested on its own
here:

- **Far fewer filters.** An S4D layer here has 4,096 modes, 32 damped tones
  in each of 128 channels, each with its own decay and frequency; in the
  trained denoiser 95.7 to 96.8% of them (by layer) oscillate above 1 Hz,
  and 10.8 to 24.9% ring longer than 1 s. A Mamba-2 layer with these settings has 2
  heads, so 2 decay rates, and one $B$ and one $C$ shared by all 128
  channels. The number of heads follows from my choice of expansion 1.
- **No oscillation in the state.** $A_j$ is real, so each head's state only
  decays (Dao and Gu 2024, [arXiv:2405.21060](https://arxiv.org/abs/2405.21060)).
  Our chirps oscillate at 20 Hz and up. An S4D mode oscillates by
  construction; Mamba-2 has to build any oscillation from $B_t$ and $C_t$,
  which come from the input through a 4-sample convolution.
- **Filters that follow the input.** $\Delta_t$, $B_t$ and $C_t$ change with
  the input at every sample, and our input is mostly noise. On long audio
  waveforms the Mamba authors found that the selection mechanism
  "significantly hampers performance" and that "the real-valued SSM still
  underperforms the complex-valued one" (Gu and Dao 2023,
  [arXiv:2312.00752](https://arxiv.org/abs/2312.00752), appendix E.4.1; also
  its section 5, "No Free Lunch: Continuous-Discrete Spectrum").

Memory length is not the difference. On the first validation batch, the
median over samples of each denoiser head's memory, $1/(\Delta_t |A_j|)$,
ranges from 1.2 ms to 10.5 s, and 4 of the 12 heads have medians of 0.61,
0.92, 5.4 and 10.5 s.

**Most of the validation set is below what any method can pick out of the
noise.** 55.6% of the validation events have SNR below 6
([formula]({{ d | relative_url }}#snr-population)), and on empty Gaussian
noise the best of 613 templates already reaches a median network SNR of 5.97
([7 October]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }})).
Between SNR 4 and 8, S4D puts 3.1 to 7.9% within 1%. At SNR 8 to 12 it puts
25.5%, where the template-bank network put 95% within 1% in real noise
([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})):
there the network, not the data, is the limit.

## New runs: ten copies of each signal, training from SNR 6

Started 26 October, one GPU each at 250 W: the same S4D and Mamba-2
den-regs in Gaussian noise, with three changes
([S4D configuration]({{ gh }}dev/local/train/claude_tests/gaussian_noise/den_reg_rep_10_s4d_gaussian_c_rho_5_lambda_amp_3_train_snr6_prob0.96.yaml),
[Mamba-2 configuration]({{ gh }}dev/local/train/claude_tests/gaussian_noise/den_reg_rep_10_mamba2_gaussian_c_rho_5_lambda_amp_3_train_snr6_prob0.96.yaml)):

- each signal in 10 noise draws instead of 4, with 978 batches per epoch
  instead of 391, so that an epoch holds 12,575 distinct signals against
  12,158 before ([derivation]({{ d | relative_url }}#oct26-repeat-count));
- training SNR from 6 instead of 8, still with index −3;
- validation SNR with density ∝ SNR⁻⁴ from 4 to 100, as for sources spread
  uniformly in space. 70.4% of these events are below SNR 6 and 87.5% below
  8, against 55.6% and 75.1% for the validation above, so overall numbers
  are not comparable between the two; numbers by SNR band are.

In their first epoch both trained at 0.92 to 0.93 batches per second, 17.6
min per epoch; at that rate 800 epochs take 9.8 days.

## Not yet done

- The template bank and the free kernels on these Gaussian windows, for the
  best accuracy by SNR band in the same noise.
- Test 4 on raw, unwhitened data.
- A Mamba-2 with more heads (expansion 2 or a smaller head size), and S4D
  layers next to the input with Mamba-2 layers inside.
- The Gaussian den-reg with dropout 0.
