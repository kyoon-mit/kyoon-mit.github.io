---
layout: project
title: Derivations
permalink: /projects/bns/derivations/
eyebrow: Derivations and sources
math: true
summary: >-
  The derivations behind statements on the BNS pages, each with its sources
  and, where a number was computed, how it was checked. Pages link here at
  the statement they rely on.
---

{%- assign u = '/projects/bns/updates/' -%}

Throughout, $x(t)$ is whitened strain sampled at rate $f_s$, so that
detector noise $n(t)$ is white with unit variance per sample, and
$\langle a, b\rangle = \sum_t a(t)\,b(t)$.

**Contents**

* TOC
{:toc}

## Peak energy of a kernel: SNR² times match² {#peak-energy}

**Claim** (free-kernel page): the peak energy of a unit-norm complex kernel
on a signal of SNR $\rho$ is $\rho^2 m^2$, where $m$ is the kernel's match to
the signal.

**Setup.** For whitened data the optimal (matched-filter) SNR of a signal
$s$ is $\rho^2 = \langle s, s\rangle$ (Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116); Creighton and
Anderson 2011, *Gravitational-Wave Physics and Astronomy*, chapter 7). Write $\hat s = s/\rho$.

A free kernel $k$ is complex with only positive frequencies (an analytic
signal) and unit norm, $\sum_\ell |k(\ell)|^2 = 1$. Write $k = u + i v$ with
$u, v$ real. For an analytic signal the real and imaginary parts are a
Hilbert-transform pair: orthogonal and of equal energy (Oppenheim and
Schafer, *Discrete-Time Signal Processing*, chapter on discrete Hilbert
transforms), so $\langle u, v\rangle = 0$ and $\lVert u\rVert^2 = \lVert
v\rVert^2 = 1/2$. Define the unit vectors $\hat u = \sqrt2\,u$ and $\hat v =
\sqrt2\,v$, and $\hat u_t$, $\hat v_t$ the same shifted to end at time $t$.

**Derivation.** With no noise, the output is
$y(t) = \sum_\ell k(\ell)\,s(t-\ell) = \langle u_t, s\rangle + i\langle v_t, s\rangle$, so

$$
2|y(t)|^2 = \langle \hat u_t, s\rangle^2 + \langle \hat v_t, s\rangle^2
= \rho^2 \left(\langle \hat u_t, \hat s\rangle^2 + \langle \hat v_t, \hat s\rangle^2\right)
= \rho^2 \max_\phi \langle \cos\phi\,\hat u_t + \sin\phi\,\hat v_t,\ \hat s\rangle^2 ,
$$

the last step because $\max_\phi (A\cos\phi + B\sin\phi)^2 = A^2 + B^2$.
The match of a template family to a signal is the normalized overlap
maximized over arrival time and phase (Owen 1996,
[arXiv:gr-qc/9511032](https://arxiv.org/abs/gr-qc/9511032)). Here the
family is $\cos\phi\,\hat u_t + \sin\phi\,\hat v_t$, so

$$
\max_t 2|y(t)|^2 = \rho^2 m^2 .
$$

This is exact for a noise-free signal; it is the definition of the match
applied to this kernel. It does not depend on the signal's phase.

**Check.** With the network's code: a chirp at SNR 8, 20 and 50 through three
kernels (the matched one, a partial one, a random one). The peak energies
were 64.0, 400.0, 2499.8 (matched), 0.2, 1.3, 8.1 (partial) and 0.1, 0.4, 2.5
(random); $\rho^2 m^2$ computed separately from the overlaps gave the same
numbers to 0.1.

## Pure noise through a kernel {#noise}

**Noise at one time.** With noise only,
$y(t) = \langle u_t, n\rangle + i\langle v_t, n\rangle$. When the kernel
overlaps the data completely, the two terms are independent Gaussians of
variance $\lVert u\rVert^2 = \lVert v\rVert^2 = 1/2$, so $2|y(t)|^2$ is a
χ² variable with two degrees of freedom, mean 2 (the same statistic as the
matched-filter SNR² in Gaussian noise; FINDCHIRP, cited above). The free kernels are as long as the
4 s window, so they overlap the data completely only at the window's last
sample; earlier, part of the kernel falls before the window and the noise
energy is smaller. Averaged over the window it was 1.17 with the trained
kernels (white noise, 64 windows).

### The largest noise value in a window {#noise-peak}

The network statistic
is $\max_t [E^{\rm H1}(t) + \max_{|\tau| \le 10\,{\rm ms}} E^{\rm L1}(t+\tau)]$ (in the code, ±20 samples: 9.77 ms at 2048 Hz).
For $N$ independent exponential variables of mean 2 (χ² with two degrees of
freedom), the expected maximum is $2 H_N = 2\sum_{k=1}^N 1/k \approx 2(\ln N
+ 0.577)$, which is 17.8 for $N = 4096$. Neighbouring outputs of a kernel are
correlated and the overlap is partial, so this is only a guide. Measured on
white noise with the trained kernels of the 13 October run (64 windows, 256
kernels): one detector's maximum averaged 13.9; the two-detector statistic
averaged 22.1, with 10% and 90% points at 18.6 and 26.1.

## Why the log and the standardization {#log-standardize}

From the two sections above, a kernel's peak is $\rho^2 m_c^2$ plus a noise
contribution of order 20. When the signal term dominates,

$$
\log \max_t E_c = \log \rho^2 + \log m_c^2 .
$$

Standardizing over the 256 kernels subtracts the mean over $c$ and divides by
the spread over $c$. The mean contains $\log\rho^2$, the same for every
kernel, so it cancels exactly; the spread is unchanged by a common additive
term. What remains depends only on the matches $m_c$, that is on the
waveform, and not on the SNR. Where the noise contribution is comparable to
$\rho^2 m_c^2$ the cancellation is incomplete. The network uses
$\log(1 + E)$, which differs from $\log E$ by $\log(1 + 1/E) < 1/E$: at most
0.054 for the noise-level values above (18.6 and up). At SNR 50 the largest possible peak is
$\rho^2 = 2500$.

## SNR populations: ours, and sources uniform in space {#snr-population}

**Claims** (many pages): for sources spread uniformly in space, the density
of SNR is ∝ SNR⁻⁴ and the fraction louder than a given SNR falls as SNR⁻³;
our "power law, index −3" populations have density ∝ SNR⁻³ instead; the
medians and fractions quoted for them.

**Sources uniform in space.** The number of sources between distances $d$
and $d + {\rm d}d$ is ${\rm d}N \propto d^2\,{\rm d}d$. For a given source and
orientation the SNR falls as $\rho \propto 1/d$, so $d \propto 1/\rho$ and
$|{\rm d}d| \propto {\rm d}\rho/\rho^2$. Together,

$$
{\rm d}N \propto \frac{1}{\rho^2}\,\frac{ {\rm d}\rho}{\rho^2} = \rho^{-4}\,{\rm d}\rho,
\qquad
N(>\rho) = \int_\rho^\infty \rho'^{-4}\,{\rm d}\rho' \propto \rho^{-3}.
$$

The density is the derivative of the cumulative count, so it is one power
steeper. Above a threshold $\rho_t$, $p(\rho) = 3\rho_t^3/\rho^4$ (Schutz 2011,
Class. Quantum Grav. 28, 125023,
[arXiv:1102.5421](https://arxiv.org/abs/1102.5421), section 2.4). Two
consequences: $1 - 1.5^{-3} = 70.4\%$ of the events above SNR 8 lie below
SNR 12, and a search that needs SNR 12 instead of 8 covers $(8/12)^3 = 29.6\%$
of the volume. Detection at SNR 8 to 12 decides most of the sensitive volume.

**Our populations.** Our validation and test sets draw SNR with ml4gw's
power law, whose documentation defines the index as the exponent of the
density, $p(x) \propto x^{\alpha}$; with index −3 the density is ∝ SNR⁻³ and
the cumulative count ∝ SNR⁻², flatter than for sources uniform in space, so
loud events are more common. For a density ∝ $x^{\alpha}$ on $[a, b]$ the
fraction below $x$ is $F(x) = (x^{\alpha+1} - a^{\alpha+1})/(b^{\alpha+1} -
a^{\alpha+1})$ and the median solves $F = 1/2$.

<div markdown="1">

| population | median SNR | below SNR 8 | SNR 8 to 12 | above SNR 16 |
|---|---|---|---|---|
| ours, density ∝ SNR⁻³, 4 to 50 (test sets) | 5.64 | 75.5% | 14.0% | 5.65% |
| ours, 4 to 100 (validation) | 5.65 | 75.1% | 13.9% | 6.10% |
| ours, 8 to 50 (test set from SNR 8) | 11.17 | 0 | 57.0% | 23.0% |
| ours, 8 to 100 (training of the SNR-8 runs) | 11.28 | 0 | 55.9% | 24.5% |
| sources uniform in space, density ∝ SNR⁻⁴, from 4 | 5.04 | 87.5% | 8.8% | 1.56% |
| uniform SNR, 4 to 50 | 27.0 | 8.7% | 8.7% | 73.9% |

</div>

**Check.** Monte Carlo with $2\times10^6$ draws per population by inverse
transform: median 5.640 and 75.46% below SNR 8 for 4 to 50. The 25,790 signals
of the 29 September test set had 75.6% below SNR 8, and in each of the ranges
4–6, 6–8, 8–12, 12–16, 16–25 and 25–50 their fraction is within 0.3
percentage points of the formula. Separately, 4 million points drawn uniformly
in a ball with SNR = 1/distance gave a fitted density slope of −4.01 and a
cumulative slope of −3.02, and $P(\rho < 12 \mid \rho \ge 8) = 0.7032$.

## Cycles of a BNS signal in the last 4 s {#cycles}

To leading (Newtonian) order, the time before merger at which a binary of
chirp mass $\mathcal M$ radiates at gravitational-wave frequency $f$, and the
number of cycles from $f_1$ to merger, are

$$
\tau(f) = \frac{5}{256}\left(\frac{G\mathcal M}{c^3}\right)^{-5/3} (\pi f)^{-8/3},
\qquad
N = \frac{1}{32\pi^{8/3}} \left(\frac{G\mathcal M}{c^3}\right)^{-5/3} f_1^{-5/3}
$$

(Sathyaprakash and Schutz 2009, Living Reviews in Relativity 12, 2,
[arXiv:0903.0338](https://arxiv.org/abs/0903.0338); Maggiore,
*Gravitational Waves*, Vol. 1, chapter 4). Setting $\tau = 4$ s gives the
frequency 4 s before merger and the cycles after it:

<div markdown="1">

| chirp mass | frequency 4 s before merger | cycles in the last 4 s |
|---|---|---|
| 0.85 M☉ | 99 Hz | 636 |
| 1.2 M☉ | 80 Hz | 513 |
| 1.8 M☉ | 62 Hz | 398 |
| 2.75 M☉ | 48 Hz | 305 |

</div>

These are leading-order values; post-Newtonian corrections are not included.

## S4D tones: frequency and memory {#s4d-tones}

An S4D layer's kernel for one channel is a sum of terms
$C_n z_n^{\ell}$, $z_n = e^{\Delta t\,A_n}$, $A_n = -a_n + i\omega_n$ (Gu et
al. 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893), section 3;
the implementation we use, in ml4gw, takes twice the real part and
discretizes with a zero-order hold). Each term is a **tone**: per sample its
phase advances by $\Delta t\,\omega_n$ and its amplitude is multiplied by
$e^{-\Delta t\,a_n}$. So its frequency and its memory (the time for the
amplitude to fall by $e$) are

$$
f_n = \frac{\Delta t\,\omega_n}{2\pi}\, f_s ,
\qquad
T_n = \frac{1}{\Delta t\, a_n\, f_s}\ \text{seconds},
$$

as long as $\Delta t\,\omega_n < \pi$; above that the tone aliases. A
channel with state size $N$ has $N/2$ tones.

**The default start (S4D-Lin).** S4D-Lin sets $A_n = -\tfrac12 + i\pi n$ and
draws one $\Delta t$ per channel, log-uniformly between $\Delta t_{\min}$ and
$\Delta t_{\max}$. Gu et al. 2022, section 4 and Listing 1, which reads
`A = -0.5 + 1j * np.pi * np.arange(N//2) # S4D-Lin initialization` with a
default range `dt_min=1e-3, dt_max=1e-1`; the ml4gw code comment reads
"Re(A) = -0.5, Im(A) = pi * n". The den-reg uses $10^{-4}$ to 10: five decades,
against the paper's default of two.
Then

$$
f_n = \frac{n\,\Delta t\, f_s}{2}, \qquad T_n = \frac{2}{\Delta t\, f_s},
$$

so one number sets both the spacing of a channel's tones and how long they
last. At $f_s = 1024$ Hz with 256 tones: $\Delta t = 0.004$ spaces the tones
2.05 Hz apart up to 522 Hz with a memory of 0.49 s; a 4 s memory needs
$\Delta t = 0.00049$, and then all 256 tones lie below 64 Hz.

**Band init** sets the two separately, with $\Delta t = 0.01$: $\omega_n =
2\pi f_n/(f_s\,\Delta t)$ with the $f_n$ evenly over 20 to 512 Hz (a random
offset per channel), and $a_n = 1/(T f_s \Delta t)$ with $T = 4$ s.

**Cost of building the kernels.** Each layer evaluates $N/2$ tones at every
lag $\ell = 0, \dots, L-1$ for every channel: $H \times N/2 \times L$ terms,
which for 256 channels, 128 tones and 8,192 samples is
$2.7 \times 10^8$ per layer.

## Operation counts: free kernels against S4D {#cost}

Counts per 4 s window at 2048 Hz ($L = 8192$), forward pass. A complex FFT of
length $M$ is counted as $5M\log_2 M$ floating-point operations, the
convention of the FFTW benchmarks ([FFTW benchmark methodology](https://www.fftw.org/speed/method.html)),
which notes it is a scaling convention rather than an exact count. Both
networks convolve by zero-padded FFTs of length $M = 2L = 16{,}384$.

- **Free kernels.** Two forward FFTs (one per detector) and 512 inverse FFTs
  (2 detectors × 256 kernels): $514 \times 5 \times 16384 \times 14 = 5.9
  \times 10^8$. The products in frequency: $2 \times 256 \times 16384$
  complex multiplications at 6 operations each, $5.0 \times 10^7$. Total
  $6.4 \times 10^8$. The kernels are built once per batch, not per window.
- **S4D, 256 channels, state size 256, 4 layers.** Per layer, the
  channel-mixing map from 256 to 512 channels at each of the 8,192 time
  steps: $2 \times 256 \times 512 \times 8192 = 2.1 \times 10^9$; the FFT
  convolution of 256 real channels (forward and inverse, each about half a
  complex FFT): $512 \times 2.5 \times 16384 \times 14 = 2.9 \times 10^8$.
  Per layer $2.4 \times 10^9$, for 4 layers $9.8 \times 10^9$, plus the
  kernel building above, once per batch.

The ratio is 15. Measured per training step (forward and backward, batch of
32 windows): 39 ms for the free kernels, 208 ms for the S4D; peak GPU memory
5 GB and 24 GB. The memory difference comes from the S4D keeping all four
layers' full-length activations for the backward pass.

## Parameter counts of the free kernels {#parameters}

The kernel is stored as an $L$-point spectrum per kernel, 2 real numbers per
complex value. The frequency bins are spaced $f_s/L = 0.25$ Hz, both at 2048 Hz
($L = 8192$) and at 1024 Hz ($L = 4096$). Bins kept: positive frequencies
from 20 Hz up to, not including, $f_s/2$: bins 80 to $L/2 - 1$, which is
4,016 bins at 2048 Hz and 1,968 at 1024 Hz. So the numbers used are
$256 \times 4016 \times 2 = 2{,}056{,}192$ at 2048 Hz and
$256 \times 1968 \times 2 = 1{,}007{,}616$ at 1024 Hz, of
$256 \times L \times 2$ stored. The output layer has $256 \times 2 + 2 = 514$
numbers (mean and variance) or $256 \times 235 + 235 = 60{,}395$ (235
chirp-mass bins).

## Calibration of the predicted σ {#calibration}

If an error $e$ is Gaussian with standard deviation $\sigma$, then
$E|e| = \sigma\sqrt{2/\pi} = 0.798\,\sigma$ (the mean of a half-normal
distribution) and $E[e^2] = \sigma^2$. If each event's $\sigma_i$ is correct,
the average $|e_i|$ is $0.798$ times the average $\sigma_i$, whatever the
spread of the $\sigma_i$. The root-mean-square error divided by the average
$\sigma$ is $\sqrt{\overline{\sigma^2}}/\overline{\sigma}$, which is above 1
whenever the $\sigma_i$ differ between events, even when each is correct. So
mean $|e|$ / mean $\sigma$ is the cleaner test of calibration.

## Why the reduce-on-plateau schedule failed {#beta-nll}

The regressors are trained with the β-weighted Gaussian likelihood (Seitzer
et al. 2022, [arXiv:2203.09168](https://arxiv.org/abs/2203.09168)),

$$
\mathcal L_\beta = \operatorname{sg}(\sigma^2)^{\beta}\ \tfrac12\left(\log\sigma^2 + \frac{(y-\mu)^2}{\sigma^2}\right),
$$

with sg meaning no gradient flows through that factor, and $\beta = 0.3$.
For a well-fitted event, $(y-\mu)^2 \approx \sigma^2$ and the loss is about
$\tfrac12\sigma^{0.6}(\log\sigma^2 + 1)$. As the model improves and $\sigma$
shrinks toward 0, this rises toward 0 from below ($\sigma^{0.6}\log\sigma^2
\to 0$). The validation loss therefore rises while the errors shrink, and a
schedule that lowers the learning rate when that loss stops falling lowers
it while the model is still improving.

## Time in band and cycles from 20 Hz {#proj-time-in-band}

**Claims** (overview and background pages): a 1.4 + 1.4 M☉ binary neutron
star takes 158 s to go from 20 Hz to merger, a 30 + 30 M☉ binary black hole
0.96 s; most of that time is spent at low frequency; most of a BNS signal's
cycles come before its last 4 s.

**Derivation.** To leading (Newtonian) order the time left before merger at
gravitational-wave frequency $f$, and the number of cycles from $f$ to
merger, depend on the masses only through the chirp mass $\mathcal M$:

$$
\tau(f) = \frac{5}{256}\left(\frac{G\mathcal M}{c^3}\right)^{-5/3} (\pi f)^{-8/3},
\qquad
N(f) = \frac{1}{32\pi^{8/3}} \left(\frac{G\mathcal M}{c^3}\right)^{-5/3} f^{-5/3}
$$

(Sathyaprakash and Schutz 2009, Living Rev. Relativ. 12, 2,
[arXiv:0903.0338](https://arxiv.org/abs/0903.0338), eqs. 31 to 33 and the
Newtonian chirp time $\tau_0$ of eq. 84, which is $\tau(f_L)$ written with
the total mass and symmetric mass ratio; the same formulas as the
[cycles section](#cycles)). The time grows as $\mathcal M^{-5/3}$, so light
binaries stay in band longest. We take $f = 20$ Hz, the lower edge of the
band our data keeps (the strain is highpassed at 20 Hz).

<div markdown="1">

| system | chirp mass | time from 20 Hz to merger | cycles from 20 Hz |
|---|---|---|---|
| 1.0 + 1.0 M☉ | 0.871 M☉ | 277 s | 8,851 |
| 1.4 + 1.4 M☉ | 1.219 M☉ | 158 s | 5,052 |
| 2.5 + 2.5 M☉ | 2.176 M☉ | 60.1 s | 1,922 |
| 10 + 10 M☉ | 8.71 M☉ | 5.96 s | 191 |
| 30 + 30 M☉ | 26.1 M☉ | 0.955 s | 31 |

</div>

These are leading-order values, with no post-Newtonian corrections, and the
formula runs to infinite frequency rather than stopping at merger, which
matters most for the heavy systems. They agree with Dax et al. 2025
(Nature 639, 49, [arXiv:2407.09602](https://arxiv.org/abs/2407.09602)):
"A BNS lasts for hundreds of seconds for the LVK".

**Time at low frequency.** Since $\tau \propto f^{-8/3}$, the fraction of
the time from 20 Hz to merger that is spent below 40 Hz is
$1 - 2^{-8/3} = 84.3\%$, for any chirp mass.

**Cycles before the last 4 s.** From the [cycles section](#cycles), a
binary of chirp mass 1.2 M☉ has 513 cycles in its last 4 s and, from the
formula above, 5,184 from 20 Hz: 90.1% of its cycles above 20 Hz come
before the last 4 s (93.1% at 0.85 M☉, 76.5% at 2.75 M☉).

**Check.** Computed in Python with $G M_\odot/c^3 = 4.925490947 \times
10^{-6}$ s. The same code reproduces the frequencies and cycle counts of the
[cycles table](#cycles) (99.4, 80.1, 62.2, 47.7 Hz; 636, 513, 398, 305
cycles).

## Signal per sample in a 4 s window {#proj-per-sample}

**Claim** (background page): in our input the signal is far below the noise
in every single sample.

**Derivation.** Our input is 4 s at 2048 Hz, $N = 8{,}192$ samples per
detector. In whitened data the noise has unit variance per sample and the
optimal SNR of a signal $s$ is $\rho^2 = \sum_t s(t)^2$ (see the
[setup above](#peak-energy)). The root-mean-square signal per sample, in
units of the noise's standard deviation, is therefore

$$
\sqrt{\frac{1}{N}\sum_t s(t)^2} = \frac{\rho}{\sqrt N},
$$

which is $4/\sqrt{8192} = 0.044$ at SNR 4 and $8/\sqrt{8192} = 0.088$ at
SNR 8, for any waveform. A chirp is louder near merger than on average, so
the largest sample is above this. For a 1.4 + 1.4 M☉ IMRPhenomD waveform,
whitened with the noise spectrum of LIGO Hanford O3b data and scaled to SNR
8 in a 4 s window ending 0.5 s after its peak, the largest sample is 0.29 of
the noise's standard deviation (0.15 at SNR 4).

**Check.** Python: waveform from LALSimulation at 2048 Hz from 20 Hz; noise
spectrum by Welch's method (Welch 1967), 4 s segments, over 1,024 s of H1
strain from our O3b background (GPS 1256688786); the window's root-mean-square
came out 0.0442 and 0.0884, equal to $\rho/\sqrt N$. Real noise whitened the
same way had variance 0.957 per sample against 0.980 expected for the 20 to
1024 Hz band.

## Two detectors give a ring {#proj-ring}

**Claim** (story page): two detectors constrain the source only to a ring
on the sky, through the angle to the line joining them.

**Derivation.** A plane wave from direction $\hat n$ reaches two detectors
separated by the vector $\vec d$ at times that differ by
$\Delta t = \vec d\cdot\hat n / c = (d/c)\cos\theta$, where $\theta$ is the
angle between $\hat n$ and $\vec d$. A measured $\Delta t$ with
$|\Delta t| \le d/c$ fixes $\cos\theta = c\,\Delta t/d$ and nothing else:
every direction on a cone of half-angle $\theta$ about the baseline fits,
and that cone meets the sky in a circle. For LIGO Hanford and Livingston,
$d = 3001.8$ km and $d/c = 10.01$ ms, so arrival-time differences lie
within ±10.01 ms. This uses timing only.

**Check.** Python: the distance between the two detectors' vertex positions
stored in LALSuite (`lal.CachedDetectors`), 3,001.8 km, divided by
$c = 299{,}792{,}458$ m/s gives 10.013 ms; the vertex positions in ml4gw
give the same.

## How much phase heterodyning leaves {#proj-heterodyne}

**Claim** (background and story pages): heterodyning with a chirp mass
close to the true one leaves a slowly varying signal; a wrong one does not.

**Derivation.** The leading-order phase of the inspiral in the frequency
domain is

$$
\varphi(f; \mathcal M) = \frac{3}{128}\left(\frac{\pi G\mathcal M f}{c^3}\right)^{-5/3}
$$

(Dax et al. 2025, Nature 639, 49,
[arXiv:2407.09602](https://arxiv.org/abs/2407.09602), eq. 1; the same
expression is in the ml4gw `Heterodyne` transform used by the AFRAME BNS
search). Heterodyning multiplies the data's Fourier transform by
$e^{i\varphi(f;\tilde{\mathcal M})}$ for an assumed chirp mass
$\tilde{\mathcal M}$. Since $\varphi \propto \mathcal M^{-5/3}$ at every
frequency, what remains of the leading-order phase is the fraction

$$
\left|1 - (\tilde{\mathcal M}/\mathcal M)^{-5/3}\right| \approx \tfrac53\,|\epsilon|,
\qquad \tilde{\mathcal M} = \mathcal M(1+\epsilon).
$$

With the right chirp mass it is zero; a 1% error leaves 1.64% (too high) or
1.69% (too low); a 0.1% error leaves 0.17%. Dax et al. 2025 describe the
effect as "reducing the number of oscillations in the signal by several
orders of magnitude". Phase terms beyond leading order are not removed.

The AFRAME BNS search uses 100 chirp masses from 1 to 2.5 M☉, evenly spaced
in log chirp mass (Gupta et al. 2026,
[arXiv:2607.01372](https://arxiv.org/abs/2607.01372), section II C; in the
code, `num_chirp_masses: 100`, `chirp_mass_low: 1`, `chirp_mass_high: 2.5`,
`chirp_mass_spacing: "log"`). Neighbouring values differ by 0.930%, so every
chirp mass in that range is within 0.464% of a grid value, which leaves at
most 0.78% of the leading-order phase.

**Check.** Python: the grid built with `torch.logspace` as in the code has
a ratio of 1.009298 between neighbours; the fractions above are
$1 - (1+\epsilon)^{-5/3}$ evaluated directly.

## Light travel time between the two LIGO detectors {#early-light-travel}

**Claim** (free-kernel page): the L1 response is searched within ±10 ms of
the H1 time because that is the light travel time between the detectors.

A signal arrives at the two detectors at most one light travel time apart.
The detector vertices in ml4gw (`ml4gw.utils.interferometer`, Earth-centred
coordinates in metres) are

$$
\mathbf r_{\rm H1} = (-2161414.926,\ -3834695.179,\ 4600350.227),\qquad
\mathbf r_{\rm L1} = (-74276.045,\ -5496283.720,\ 3224257.017),
$$

so the baseline is $d = |\mathbf r_{\rm H1} - \mathbf r_{\rm L1}| =
3{,}001.8$ km and the light travel time is $d/c = 10.01$ ms. The GW150914
paper uses the same figure: "within the 10-ms intersite propagation time"
(Abbott et al. 2016, Phys. Rev. Lett. 116, 061102,
[arXiv:1602.03837](https://arxiv.org/abs/1602.03837)).

In the code (`LongConvEnergyNet`, `coincidence = 0.01` s) the window is
`int(0.01 * rate)` samples each way: 20 samples at 2048 Hz and 10 at
1024 Hz, both 9.77 ms, slightly less than 10.01 ms.

**Check.** $d$ and $d/c$ computed in float64 from the ml4gw vertex
coordinates ($c = 299{,}792{,}458$ m/s); `get_ifo_geometry("H1", "L1")`
gives the same distance. The quotation was checked in the arXiv text of
the GW150914 paper.

## Parameter counts of the S4D networks {#early-s4d-count}

**Claim** (free-kernel page, brainstorm, 14 October update): S4D with 256
channels, state size 256 and 4 layers has 1,056,002 parameters; (July 2026
update) the S4D part of S4D 256 × 32 × 4 has 593,920.

One ml4gw `S4D` layer with $H$ channels and state size $N$ ($N/2$ complex
tones per channel) stores:

| part | numbers |
|---|---|
| `log_dt`, one step size per channel | $H$ |
| `C`, complex output weights | $H \times N/2 \times 2$ |
| `log_A_real` and `A_imag`, the tones' decay and frequency | $2 \times H \times N/2$ |
| `D`, the skip term | $H$ |
| output map, a 1 × 1 convolution from $H$ to $2H$ channels | $2H \times H$ weights + $2H$ biases |

In total $2HN + 2H^2 + 4H$ per layer.

- $H = N = 256$: $131{,}072 + 131{,}072 + 1{,}024 = 263{,}168$ per layer,
  1,052,672 for 4 layers. The signal-only regressor adds the input map from
  2 detectors to 256 channels ($2 \times 256 + 256 = 768$), four group norms
  ($4 \times 2 \times 256 = 2{,}048$) and the output map to a mean and a
  variance ($256 \times 2 + 2 = 514$): **1,056,002**.
- $H = 256$, $N = 32$: $16{,}384 + 131{,}072 + 1{,}024 = 148{,}480$ per
  layer, **593,920** for 4 layers (the S4D layers only).

The channel-mixing map of one layer is the $512 \times 256$ weight matrix
plus 512 biases, 131,584 numbers, applied at every time step.

**Check.** `S4Regressor(num_ifos=2, num_params=1, d_model=256, d_state=256,
n_layers=4, num_groups=32)` from our code, summing `p.numel()` over its
parameters, gives 1,056,002, with the per-tensor sizes listed above. The
other counts are the same formula, evaluated in Python.

## Fitting tones to a whitened chirp {#early-tone-fit}

**Claim** (brainstorm, 12 and 13 October updates): fitting 256 stable tones
to whitened BNS waveforms gives a match of 0.87 to 0.90 at chirp masses 1.2
to 2.0 M☉; fixed-frequency tones can hold a chirp, but only with many of
them.

**The kernels.** Four waveforms from our injection file, at chirp masses
1.0, 1.2, 1.5 and 2.0 M☉ (detector frame; mass ratio 0.85 to 0.95, lowest
spins), each whitened with the average noise spectrum of 2,000 training
windows of both detectors, with frequencies below 20 Hz removed. The kernel
is the complex waveform ($h_+ - i h_\times$) over the 8,064 samples
(3.94 s at 2048 Hz) ending at the merger, time-reversed and conjugated (the
matched filter), with a half-Hann taper over its first 512 samples, scaled
to unit norm.

**The match** of a fitted kernel $\hat K$ to the kernel $K$ is
$|\langle \hat K, K\rangle| / (\lVert \hat K\rVert \lVert K\rVert)$, the
fraction of the matched-filter SNR that $\hat K$ keeps.

**Three fits** with $N$ tones $\hat K(\ell) = \sum_{n=1}^N c_n z_n^\ell$:

- **Fourier:** the $N$ largest of the kernel's 8,064 discrete Fourier
  components (undamped tones, $|z_n| = 1$, at multiples of 2048/8064 Hz).
  By Parseval's theorem the match is the square root of the fraction of the
  kernel's energy in those components (Oppenheim and Schafer,
  *Discrete-Time Signal Processing*). With all 8,064 components the fit is
  exact, so a sum of fixed-frequency tones can represent any kernel of this
  length.
- **Fixed grid:** $N$ tones evenly spaced over 20 to 800 Hz, each decaying
  by $e$ over the kernel length, weights $c_n$ by least squares.
- **Matrix pencil** (Hua and Sarkar 1990, IEEE Trans. ASSP 38, 814): the
  poles $z_n$ from the top $N$ singular vectors of the $4032 \times 4033$
  Hankel matrix $Y_{ij} = K(i + j)$; poles outside the unit circle are
  reflected inside ($z \to 1/\bar z$) so that every tone decays, as in an
  S4D layer; weights by least squares.

Match by number of tones (chirp masses 1.0 / 1.2 / 1.5 / 2.0 M☉):

| tones | Fourier | fixed grid | matrix pencil |
|---|---|---|---|
| 32 | 0.25 / 0.33 / 0.33 / 0.33 | 0.09 / 0.12 / 0.12 / 0.12 | 0.20 / 0.27 / 0.29 / 0.29 |
| 256 | 0.59 / 0.74 / 0.75 / 0.76 | 0.26 / 0.34 / 0.34 / 0.35 | 0.67 / 0.87 / 0.88 / 0.90 |
| 1,024 | 0.88 / 0.96 / 0.96 / 0.97 | 0.51 / 0.66 / 0.66 / 0.67 | 0.87 / 0.89 / 0.89 / 0.91 |
| 2,048 | 0.96 / 0.99 / 0.99 / 0.99 | 0.68 / 0.87 / 0.86 / 0.88 | 0.88 / 0.88 / 0.89 / 0.92 |

So the 0.87 to 0.92 ceiling is a property of the matrix-pencil fit with
decaying tones, not of fixed frequencies: the Fourier tones pass it at
1,024 tones (except at 1.0 M☉, at 2,048) and reach 0.99 at 2,048. The
matrix-pencil fit reaches 0.99 at 256 tones only when its poles may grow
slightly ($|z|$ up to 1.009), which an S4D layer does not allow. Either
way, holding a chirp with fixed-frequency tones takes far more tones than
the 16 to 256 per channel of our S4D runs.

**Check.** Our tone-fit script and its saved results,
CPU only; every value in the table is read from its saved output and
rounded to two decimals. The growing-pole result (|z| up to 1.009) is from
the same test's notes in our experiment log.

## An input-dependent step changes a tone's frequency {#early-mamba-step}

**Claim** (brainstorm): with a complex state, the step size sets how fast
each oscillator turns, so a step that depends on the input lets the
frequency follow a rising chirp.

Take one complex state of a diagonal state-space layer, $A = -a + i\omega$
with $a > 0$. With the zero-order hold, the discrete update over a step
$\Delta$ multiplies the state by $\bar A = \exp(\Delta A)$ (Gu and Dao 2023,
[arXiv:2312.00752](https://arxiv.org/abs/2312.00752), equation 4; Gu et al.
2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893), section 3):

$$
h_t = e^{\Delta_t A}\, h_{t-1} + \bar B_t x_t ,
\qquad
e^{\Delta_t A} = e^{-\Delta_t a}\, e^{i \Delta_t \omega}.
$$

Each sample, the state's phase advances by $\Delta_t\,\omega$ radians and its
size is multiplied by $e^{-\Delta_t a}$. At sample rate $f_s$ its frequency at
step $t$ is

$$
f(t) = \frac{\Delta_t\,\omega\, f_s}{2\pi} .
$$

In S4D, $\Delta_t = \Delta$ is the same at every step, which gives the fixed
tone frequency $f_n$ of the [S4D tones](#s4d-tones) section. In Mamba,
$\Delta_t$ is computed from the input at every step, one value per channel
and step (Gu and Dao 2023, Algorithm 2: Δ has shape (B, L, D)), so $f(t)$
changes with the input and all of a channel's states change frequency by the
same factor. A state follows a chirp of frequency $f_{\rm GW}(t)$ if
$\Delta_t = 2\pi f_{\rm GW}(t)/(\omega f_s)$. With a real state ($\omega =
0$) the same step only sets how fast the state decays, with no rotation.

## A magnitude spectrum cannot tell where a signal sits in time {#sep-magnitude-phase}

**Claim** (update of 8 September): an impulse has a broad, smooth spectrum
and a magnitude spectrum discards phase, so the log-spectrum term of the
denoiser loss could not tell a short transient at the window edge from the
chirp.

**Derivation.** For a window of $N$ samples, the discrete Fourier transform
of a unit impulse at sample $n_0$ is $X_k = e^{-2\pi i k n_0/N}$, so
$|X_k| = 1$ at every frequency, wherever the impulse sits. Changing the phases
of a signal, $X_k \to X_k e^{i\phi_k}$ (a time shift is one case), leaves every
$|X_k|$ unchanged. The spectral term

$$
L_{\rm spec} = \operatorname*{mean}_k \left(\log(|P_k| + \epsilon) - \log(|T_k| + \epsilon)\right)^2
$$

depends on the prediction $P$ only through $|P_k|$, so it scores every signal
with the target's magnitude spectrum the same, at zero. One such signal is the
zero-phase one, $p_n = \frac1N \sum_k |T_k|\, e^{2\pi i k n/N}$: it is real
and symmetric about $n = 0$, and for a broad $|T_k|$ it is a short pulse
centred on the first sample of the window (wrapping round to the last). Only
the time term can tell that pulse from the chirp.

**Check.** With numpy: the magnitude spectrum of an impulse at sample 0 and at
sample 1000 of 8192 is 1 at every bin to $2 \times 10^{-16}$. For the clean
whitened targets of our reference events (SNR 50, 20 and 4, two detectors),
the zero-phase signal built from each target's magnitude spectrum has the same
magnitude spectrum to $4 \times 10^{-16}$ and has 99.8% of its energy in the
first and last 5% of the window; the targets themselves have 1.0 to 1.5% of
their energy in the first 5%.

## The least-squares gain equals the overlap {#sep-ls-gain}

**Claim** (8 September): the realized gain tracks the overlap $\rho$, and a
model that recovers a fifth of the shape should emit a fifth of the
amplitude.

**Derivation.** Let $t$ be the target and $s$ the shape the model puts out,
scaled by a gain $g$. The squared error $\lVert g s - t\rVert^2$ has
derivative $2g\lVert s\rVert^2 - 2\langle s, t\rangle$ in $g$, so it is
smallest at

$$
g^* = \frac{\langle s, t\rangle}{\lVert s\rVert^2} ,
\qquad
\frac{\lVert g^* s\rVert}{\lVert t\rVert}
= \frac{\langle s, t\rangle}{\lVert s\rVert\,\lVert t\rVert} = \rho .
$$

So under a squared-error loss the best output is $\rho$ times the size of the
target: with $\rho = 0.2$, a fifth of the amplitude. Our runs log the realized
gain as $\lVert p\rVert / \lVert t\rVert$ for the output $p$, averaged over
events, and $\rho = \langle p, t\rangle / (\lVert p\rVert\,\lVert t\rVert)$,
averaged the same way; at the optimum the two are equal event by event.

**Check.** With numpy, on random vectors, $\lVert g^* s\rVert/\lVert t\rVert$
equals $\rho$ to $10^{-15}$. In two of the shape-and-gain runs the last
validation epoch gave a gain of 0.176 against $\rho = 0.189$, and 0.177
against 0.185.

## Gradients of the time and log-spectrum terms {#sep-grad-ratio}

**Claim** (8 September): the time term's gradient scales with the signal
amplitude and the log-spectrum term's with its inverse, so their ratio scales
as the amplitude squared; the log floor $\epsilon$ caps the per-bin spectral
gradient; with $\alpha = 0.5$ the time term got 0.042% of the update.

**Derivation.** Scale both the prediction $p$ and the target $t$ by an
amplitude $A$. The time term $L_{\rm time} = \frac1N\sum_n (p_n - t_n)^2$ has
gradient $\partial L_{\rm time}/\partial p_n = \frac2N (p_n - t_n)$, which is
proportional to $A$. For the spectral term (above), per bin,

$$
\frac{\partial L_{\rm spec}}{\partial |P_k|}
= \frac{2}{K}\,\frac{\log(|P_k| + \epsilon) - \log(|T_k| + \epsilon)}{|P_k| + \epsilon},
$$

with $K$ the number of bins, and $\partial |P_k| / \partial p_n =
\operatorname{Re}\!\left(\bar P_k e^{-2\pi i k n/N}\right)/|P_k|$, which has
modulus at most 1 and does not depend on $A$. When $|P_k|, |T_k| \gg
\epsilon$, the difference of logs is $\log(|P_k|/|T_k|)$, which does not
depend on $A$ either, and the factor $1/(|P_k| + \epsilon)$ is proportional to
$1/A$. So the spectral gradient is proportional to $1/A$ and the ratio of the
two to $1/A^2$: the spectral term takes over as the amplitude falls. (With a
base-10 log, as in our code, every spectral gradient is divided by $\ln 10$,
which does not change the scaling.)

The floor bounds the factor that grows at small amplitude:
$1/(|P_k| + \epsilon) \le 1/\epsilon$. A larger floor therefore caps the
per-bin gradient lower and keeps the ratio smaller, as the measured ratios
(45 at $\epsilon = 1$, 2440 at $10^{-3}$, 4789 at $10^{-9}$) show.

With $L = \alpha L_{\rm time} + (1 - \alpha) L_{\rm spec}$ and $\alpha = 0.5$,
both gradients are halved and their ratio $R$ is unchanged. The time term's
share of the summed gradient norm is $1/(1 + R)$: $1/2407 = 0.042\%$ at epoch
325 ($R = 2406$) and $1/2256 = 0.044\%$ at epoch 39 ($R = 2255$).

**What was measured.** The gradient norms in the tables are the norm of each
unweighted term's gradient with respect to the denoiser output, averaged over
the batches of an epoch (`term_gradient_norms` in our training code).

## The SNR curriculum counted in steps {#sep-curriculum}

**Claim** (8 September): one run reporting $\rho = 0.46$ was in fact training
at SNR 17.5, not 4.

**Setup.** The curriculum draws SNR with density $\propto {\rm SNR}^{-3}$ from
a minimum up to 100, and moves the minimum linearly from 20 to 4 over a fixed
number of sampler steps, one per training batch. It was set to 31,280 steps,
which is 40 epochs of 782 batches.

**Arithmetic.** The diagnostic run used 16 batches per epoch, so the 31,280
steps would have taken $31{,}280/16 = 1{,}955$ epochs. The run stopped at epoch
303 after 4,864 steps, when the minimum SNR was

$$
20 - (20 - 4)\,\frac{4864}{31{,}280} = 17.51 .
$$

**Check.** Step count, epoch and $\rho$ (4,864; 303; 0.460) are from the run's
log. The same configuration with the curriculum shortened to 640 steps (40
epochs of 16 batches), so that the minimum reached 4, had a validation
$\rho$ of 0.089 at epoch 303.

## Residual phase after heterodyning with a wrong chirp mass {#sep-het-phase}

**Claim** (23 September): a chirp-mass error of 0.1% still works, while errors
of a few percent are far outside what heterodyning tolerates.

**Setup.** Our heterodyne multiplies the Fourier transform of the whitened
strain by $e^{-i\Psi(f)}$ with the leading-order (0PN) phase

$$
\Psi(f) = 2\pi f t_c + \frac{3}{128}\left(\frac{\pi G \mathcal M f}{c^3}\right)^{-5/3},
$$

as in Gupta et al. 2026 (AFRAME BNS search,
[arXiv:2607.01372](https://arxiv.org/abs/2607.01372), eqs. 2 and 3) and Dax et
al. 2025 (DINGO-BNS, [arXiv:2407.09602](https://arxiv.org/abs/2407.09602),
eq. 1).

**Derivation.** With a chirp-mass error $\mathcal M \to \mathcal M(1 + \delta)$,
the chirp term changes by

$$
\Delta\Psi(f) = \Psi_0(f)\left[(1 + \delta)^{-5/3} - 1\right] \approx -\tfrac53\,\delta\,\Psi_0(f),
\qquad \Psi_0(f) = \frac{3}{128}\left(\frac{\pi G \mathcal M f}{c^3}\right)^{-5/3}.
$$

$\Psi_0$ falls as $f^{-5/3}$, so the residual is largest at the lowest frequency
in the window, $f_T$, the frequency a time $T$ before merger. The number of
cycles from $f_T$ to merger is $N = \frac{1}{32\pi^{8/3}}(G\mathcal M/c^3)^{-5/3}
f_T^{-5/3}$ ([cycles](#cycles)), so $2\pi N = \frac{1}{16}(\pi G\mathcal M
f_T/c^3)^{-5/3}$ and $\Psi_0(f_T) = \frac38 \cdot 2\pi N$. The residual phase
across the window is therefore

$$
|\Delta\Psi(f_T)| \approx \tfrac58 \cdot 2\pi N\,\delta ,
$$

the same as the time-domain result: the phase to merger,
$\Phi(\tau) \propto \mathcal M^{-5/8}\tau^{5/8}$ (Maggiore, *Gravitational
Waves*, Vol. 1, chapter 4), changes by $\delta\Phi = \frac58\Phi\,\delta$ at
fixed time before merger. A part of $\Delta\Psi$ that is linear in $f$ only
shifts the heterodyned signal in time; the rest bends its phase.

For a 1.2 M☉ binary in the last 4 s ($N = 513$): 2.0 rad at $\delta = 0.1\%$,
40 rad at $\delta = 2\%$. Over 0.85 to 2.75 M☉ and 3.5 to 4 s before merger,
$\delta = 0.1\%$ gives 1.1 to 2.5 rad and $\delta = 2\%$ gives 22 to 50 rad.

**Check.** numpy, with the leading-order relations above; the identity
$\Psi_0(f_T)/(2\pi N) = 3/8$ was checked numerically to $10^{-15}$.

## What the z-score spread checks {#sep-zscore}

**Claim** (29 September, 5 October): a z-score spread near 1 means the
predicted σ matches the actual errors.

**Derivation.** The z-score of an event is $z = (\hat y - y)/\sigma$, the
error divided by the model's own σ. If each event's error is Gaussian with
standard deviation equal to its predicted σ, every $z$ is a standard normal
variable, so the standard deviation of $z$ over the test set is 1 and 68.3% of
events have $|z| < 1$. The converse does not hold: σ too large on some events
and too small on others can still average to a spread of 1. A spread near 1 is
necessary for calibrated uncertainties, not sufficient; the spread within
groups of similar events (for example SNR bins) is a stricter check.

**Measured.** Over all signals of the 29 September test (25,790): spread
0.937, 69.2% within $|z| < 1$, mean $|$error$|$ / mean σ 0.792 (0.798 for a
calibrated Gaussian; [calibration](#calibration)). By SNR bin (4 to 6, 6 to 8,
8 to 12, 12 to 16, 16 to 25, 25 to 50) the spread is 1.02, 0.90, 0.70, 0.69,
0.78, 0.70: below SNR 8 σ matches the errors, above SNR 8 it is larger than
them. For the epoch-630 model of 5 October (12,795 signals): chirp mass 0.988
overall and 1.02, 0.95, 0.77, 0.91, 0.95, 0.86 by bin; mass ratio 0.982
overall and 0.96 to 0.99 in every bin.

**Check.** Recomputed with numpy from the per-event test outputs (true value,
prediction, σ, SNR).

## The chirp-mass prior, and estimates pulled toward its mean {#sep-prior}

**Claim** (29 September): at low SNR the predicted σ approaches the width of
the chirp-mass prior and the estimate is pulled toward the prior mean; (5
October) mass ratio is barely learned.

**The prior.** Training waveforms have chirp mass uniform on 0.85 to 2.75 M☉
(200,000 waveforms; measured mean 1.800, standard deviation 0.549). A uniform
distribution on $[a, b]$ has standard deviation $(b - a)/\sqrt{12} = 1.9/\sqrt{12}
= 0.548$ M☉. The test sets draw from the same waveforms.

**Why the estimate is pulled toward the prior mean.** The function that
minimizes the expected squared error $E\lVert y - f(x)\rVert^2$ is the mean of
$y$ given $x$, $f^*(x) = E[y \mid x]$ (Goodfellow, Bengio and Courville,
*Deep Learning*, MIT Press 2016, section 6.2.1.2, eqs. 6.14 and 6.15). The mean
output of our regressor is trained with the β-weighted Gaussian likelihood
(Seitzer et al. 2022, [arXiv:2203.09168](https://arxiv.org/abs/2203.09168));
for fixed $x$ its gradient in the mean, $\sigma^{2\beta}(\mu - y)/\sigma^2$,
averages to zero at the same $\mu = E[y \mid x]$. When the input says little
about $y$, $E[y \mid x]$ is close to the prior mean, 1.80 M☉.

**Measured.** 29 September test: median σ 0.523 M☉ at SNR 4 to 6 (95% of the
prior's standard deviation) and 0.530 M☉ on noise-only inputs (97%).
Predicting the prior mean for every event would put 3.7% of events within 2%,
9.3% within 5% and 19.0% within 10%; the model reaches 4.9%, 12.0% and 24.0% at
SNR 4 to 6. For mass ratio (5 October, epoch 630), predicting the training
median, 0.793, for every event puts 33.7% within 10% (34.2% below SNR 8, 36.2%
above SNR 16); the model puts 33.2% (32.4% and 41.4%). The test's mass ratios
have standard deviation 0.158, and the model's median σ is 0.159.

**Check.** numpy on the training waveform parameters and on the per-event test
outputs.

## Project 8 SNR {#sep-p8-snr}

**Claim** (29 September): the Project 8 events have SNR 4.3 to 36.1, median
20.8.

**Definition.** The optimal (matched-filter) SNR of the clean complex signal
$z = I + iQ$ against the two-sided spectral density $S_z$ of the complex
cavity noise,

$$
\rho^2 = 2\,\Delta f \sum_f \frac{|Z(f)|^2}{S_z(f)},
$$

the complex-data form of $\rho^2 = 4\int |\tilde h|^2/S\,df$ (Allen et al.
2012, FINDCHIRP, [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)).
$S_z$ is averaged over all 40,000 training noise traces and used for every
split.

**Measured.** Training 4.34 to 36.06, median 20.80; validation median 20.63;
test median 20.63. The splits hold 40,000, 5,000 and 5,600 events.

## The low-band smoothing {#sep-lowband}

**Claim** (1 October): the band below the 20 Hz highpass is 79 of 4097
frequency bins; a 4-coefficient fit matches the true curve to 0.8% typically
and 6% at worst; transforming only those bins is cheaper than a full FFT
round trip.

**Bins.** A 4 s window at 2048 Hz has $N = 8192$ samples; its real FFT has
$N/2 + 1 = 4097$ bins spaced $2048/8192 = 0.25$ Hz. The bins with
$0 < f < 20$ Hz are $k = 1$ to 79 (0.25 to 19.75 Hz). The DC bin ($k = 0$) is
left unchanged, since $\log f$ is undefined there. 79 bins are 1.9% of 4097.

**Fit error.** 200 training waveforms, projected onto H1 and L1 with random
sky positions (400 target spectra), scaled to SNR 20 against O3a background
PSDs (median Welch estimate, 2 s segments), whitened with the 20 Hz highpass,
merger 3.5 to 4 s into the window. In the 79 bins, $\log_{10}|T|$ was fitted
by least squares with a polynomial in standardized $\log f$. With 4
coefficients the root-mean-square residual over all bins and targets is
0.0036 in $\log_{10}$, a factor $10^{0.0036} = 1.008$ (0.8%); the largest
residual is 0.025, a factor 1.059 (6%). For comparison, 3 coefficients give
0.0106 and 0.106 (2.5% and 28%), 5 give 0.0013 and 0.017. The median target
magnitude in these bins is 0.39, against 18.5 in 30 to 300 Hz.

**Timing (measured).** Forward and backward pass, batch of 32 windows of 2
detectors, median of 200 repeats on an NVIDIA RTX PRO 6000 Blackwell GPU that
was also running other jobs: the 79-bin direct DFT took 2.7 ms against 4.7 ms
for a full FFT and inverse FFT; the two outputs agreed to $5 \times 10^{-6}$.
Absolute times varied with the load (an earlier repeat timed the full FFT at
2.6 ms). By operation count the direct DFT is not cheaper: $2 \times 79 \times
8192 = 1.3 \times 10^6$ complex multiply-adds, against $2 \times 2.5 \times
8192 \times 13 = 5.3 \times 10^5$ operations for a real FFT and its inverse in
the FFTW counting convention ([FFTW benchmark
methodology](https://www.fftw.org/speed/method.html)). It is faster here
because it runs as one matrix product.

## Reweighting a test to another power law {#sep-reweight}

**Claim** (5 October): reweighting the index −3 test to index −2 reproduces
the validation figures of a run validated on index −2.

**Derivation.** A test event drawn from $p_{-3}(x) \propto x^{-3}$ is
reweighted to $p_{-2}(x) \propto x^{-2}$ with weight
$w \propto p_{-2}(x)/p_{-3}(x) \propto x$, normalized to sum to 1. The test
covers SNR 4 to 50; the validation population (index −2, 4 to 100) has
$(1/50 - 1/100)/(1/4 - 1/100) = 4.17\%$ of its events above 50, which no
reweighting of the test can include.

**Measured.** Epoch 630, chirp mass: the test gives 8.1% within 1% and 14.9%
within 2%; reweighted, 15.9% and 28.4%. Validation at epoch 630 gave 15.6% and
31.2%; over epochs 600 to 634 it varied from 14% to 29% within 1% (mean
21.0%) and 27% to 41% within 2% (mean 33.2%).

**Check.** numpy on the per-event test output and the run's validation log.

## Cramér–Rao bound on chirp mass for a window ending at merger {#sep-fisher}

**Claim** (5 October): for SNR 4 to 16, the chirp-mass Cramér–Rao bound for
the 3.5 s before merger is 0.14 to 0.39%, 5.1 to 14.7 times tighter than 2%;
lengthening the window to 30 s tightens it 4.9 to 5.2 times and raises the SNR
by 17 to 22%.

**Formula.** For a waveform $\tilde h(f; \theta)$ in Gaussian noise of
one-sided spectral density $S_n$, the Fisher matrix is

$$
\Gamma_{ij} = 4\,\operatorname{Re}\int \frac{\partial_i \tilde h^*(f)\,\partial_j \tilde h(f)}{S_n(f)}\,df ,
$$

and an unbiased estimate of $\theta_i$ has variance at least
$(\Gamma^{-1})_{ii}$ (Cutler and Flanagan 1994,
[arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014); Vallisneri 2008,
[arXiv:gr-qc/0703086](https://arxiv.org/abs/gr-qc/0703086)). For
$\tilde h = A f^{-7/6} e^{i\Psi(f;\theta)}$ the amplitude separates from the
phase parameters, and for those
$\Gamma_{ij} = 4\int |\tilde h|^2\,\partial_i\Psi\,\partial_j\Psi / S_n\,df$.

**Setup.**

- Parameters $\ln\mathcal M$, symmetric mass ratio $\eta$, $t_c$, $\phi_c$;
  $\partial_{t_c}\Psi = 2\pi f$, $\partial_{\phi_c}\Psi = -1$, the mass
  derivatives by central differences.
- Phase: TaylorF2 to 3.5PN, no spins (coefficients as in Buonanno et al. 2009,
  Phys. Rev. D 80, 084043, [arXiv:0907.0700](https://arxiv.org/abs/0907.0700));
  amplitude $\propto f^{-7/6}$.
- A window of $T$ seconds ending at merger keeps frequencies from the
  leading-order frequency $T$ before merger,
  $f_T = (256T/5)^{-3/8}(G\mathcal M/c^3)^{-5/8}/\pi$, up to
  $\min(f_{\rm ISCO}, 1000\ {\rm Hz})$ with
  $f_{\rm ISCO} = c^3/(6^{3/2}\pi G M)$.
- Noise: one PSD for the network, the median of Welch estimates (4 s
  segments, median averaging) over the first 1024 s of H1 and L1 in four O3b
  background files.
- Events: 600 drawn at random from our test injection set, with detector-frame
  masses. Their stored waveforms start 30 s before merger, and the catalog SNR
  is that of the stored waveform, so each event's amplitude is set so that the
  band from $\max(20\ {\rm Hz}, f_{30\,{\rm s}})$ up has the catalog SNR. The
  in-window SNR for 30 s is therefore the catalog SNR, and the in-window SNR
  of shorter windows is relative to the 30 s band, not to the full signal from
  20 Hz.
- Our 4 s window has the merger 3.5 to 4 s from its start, so 3.5 s is the
  stretch before merger it always contains.

**Results** (medians per SNR bin; table on the page):

<div markdown="1">

| SNR | events | bound, 3.5 s | 2% ÷ bound | bound 3.5 s ÷ bound 30 s | SNR 30 s ÷ SNR 3.5 s |
|---|---|---|---|---|---|
| 4 to 6 | 399 | 0.391% | 5.1 | 5.11 | 1.20 |
| 6 to 8 | 121 | 0.277% | 7.2 | 5.24 | 1.19 |
| 8 to 12 | 55 | 0.198% | 10.1 | 5.14 | 1.22 |
| 12 to 16 | 17 | 0.136% | 14.7 | 4.90 | 1.17 |

</div>

The ratio columns are ratios of the bin medians. Per event, for all 592
events with SNR 4 to 16, the 3.5 s window holds a median 84.7% of the 30 s SNR
(71.8% of its SNR²); the bound ratio has median 4.91 (range 3.93 to 7.70) and
the SNR ratio median 1.18 (range 1.11 to 1.40). The largest 3.5 s bound among
all 600 events is 0.53%.

**Limits.** The bound comes from a linear expansion of the waveform around
the true parameters and is reliable only at high SNR; at low SNR the actual
error can be much larger (Vallisneri 2008, cited above). It also ignores
spins and treats the two detectors as one with the median PSD.

**Check.** The per-event output of the computation was re-read with numpy and
the medians and ratios above recomputed from it; the in-window SNR for 30 s
equals the catalog SNR to $4 \times 10^{-15}$ for every event.

## S4D in samples: the recurrence, the step factor, frequency and memory {#ck-s4d-step}

**Claims** (chirp-kernel proposal, sections 1 and 7): the factor
$(e^{\Delta t\,a_n}-1)/a_n$ turns the continuous state equation into a
per-sample one; state $n$ is a tone at $\Delta t\,\omega_n f_s/2\pi$ hertz
that shrinks by a factor $e$ after exactly $1/(\Delta t\,\alpha_n)$ samples;
one state number generates its tone step by step; S4D's real kernel is twice
the real part of a sum over half the states.

**Setup.** One diagonal state, $x'(t) = a\,x(t) + B\,u(t)$, $y = C\,x$, with
$a = -\alpha + i\omega$. One sample is a step $\Delta t$ of the model's own
time.

**Derivation.** Hold the input constant at $u_\ell$ over the step that ends
at sample $\ell$ (the zero-order hold). Solving the equation across that step,

$$
x_\ell = e^{\Delta t\,a}\,x_{\ell-1} + \int_0^{\Delta t} e^{s a}\,ds\; B\,u_\ell
= \bar A\,x_{\ell-1} + \bar B\,u_\ell ,
\qquad \bar A = e^{\Delta t\,a}, \quad \bar B = \frac{e^{\Delta t\,a}-1}{a}\,B .
$$

This is the recurrence: one complex multiplication and one addition per
sample. Starting from $x = 0$ and unrolling, $x_\ell = \sum_{j=0}^{\ell}
\bar A^{\,j}\,\bar B\,u_{\ell-j}$, so $y_\ell = \sum_j K_j\,u_{\ell-j}$ with

$$
K_j = C\,\bar A^{\,j}\,\bar B = C B\,\frac{e^{\Delta t\,a}-1}{a}\,e^{\Delta t\,a\,j} .
$$

With $B$ absorbed into $C$ (as ml4gw does) and $N/2$ states, this is the
page's $K_\ell$ before the real part. Per sample, each term is multiplied by
$e^{\Delta t\,a} = e^{-\Delta t\,\alpha}\,e^{i\Delta t\,\omega}$. Its size
falls by $e^{-\Delta t\,\alpha}$ per sample, so after $m$ samples by
$e^{-m\Delta t\,\alpha}$, which is $e^{-1}$ at exactly $m = 1/(\Delta
t\,\alpha)$. Its angle advances by $\Delta t\,\omega$ radians per sample,
$\Delta t\,\omega f_s$ radians per second: a frequency of $\Delta t\,\omega
f_s/2\pi$ hertz, as long as $\Delta t\,\omega < \pi$. Above that the sampled
tone is the same as one at a lower frequency (aliasing).

**Real kernels.** To build a real model of state size $N$, S4D keeps $N/2$
complex states and "implicitly add[s] back the conjugate pairs", so the sum
"resolve[s] to twice the real part of the original sum" (Gu et al. 2022,
section 3, "Conjugate Symmetry"). Since $\beta e^{zs} + \bar\beta e^{\bar z
s} = 2\,\mathrm{Re}(\beta e^{zs})$, each kept state and its implied partner
make one real damped cosine.

**Sources.** Gu, Gupta, Goel and Ré 2022,
[arXiv:2206.11893](https://arxiv.org/abs/2206.11893): section 3.1 (zero-order
hold, $\bar A = \exp(\Delta A)$, $\bar B = (\Delta A)^{-1}(\exp(\Delta A) -
I)\,\Delta B$, kernel $K = (C\bar B, C\bar A\bar B, \dots)$); section 3
(conjugate symmetry); section 4 and Listing 1 (S4D-Lin, `A = -0.5 + 1j *
np.pi * np.arange(N//2)`). ml4gw `S4DKernel.forward`: `C = C *
(torch.exp(dtA) - 1.0) / A` and `K = 2 * torch.einsum("hn, hnl -> hl", C,
torch.exp(K)).real`. The [S4D tones section](#s4d-tones) gives the same
frequency and memory in its own notation.

**Check.** The memory numbers on the page. From the epoch-630 checkpoint of
the den-reg run used in the [matched-filter benchmark]({{ '/projects/bns/updates/2026-10-07-matched-filter-benchmark/' | relative_url }})
(6 denoiser and 6 regressor S4D layers, 128 channels × 32 tones each), I read
`log_dt` and `log_A_real` and computed $1/(\Delta t\,\alpha)$ for every tone.
Median per layer, in samples: denoiser 26.8, 22.5, 39.8, 16.5, 18.6, 28.6;
regressor 43.5, 29.4, 134.2, 49.0, 35.7, 34.3. So 16.5 to 134.2 samples,
8.06 to 65.50 ms at 2048 Hz; over all layers 31.3 samples, 15.28 ms. Per
layer, 4.6 to 11.9% of the tones have $1/(\Delta t\,\alpha) > 8192$. The
epoch-799 checkpoint of the later den-reg run gives 15.7 to 126.7 samples
per layer.

## The Newtonian chirp: constants, sweep, and a 1% change {#ck-chirp}

**Claims** (proposal, section 2): $G\mathcal M/c^3 = 5.911\ \mu$s for $1.2\,
M_\odot$; the Newtonian $f(\tau)$, $\Phi(\tau)$ and amplitude $\propto
\tau^{-1/4}$; heavier systems sweep faster; a 1% change in $\mathcal M$
changes the phase accumulated in the last 4 s by 12 to 25 radians; the
inspiral ends at a frequency set by the total mass.

**Constants.** The IAU 2015 nominal solar mass parameter is
$(GM)^{\rm N}_\odot = 1.3271244 \times 10^{20}$ m³ s⁻², exact by definition
(Prša et al. 2016, [arXiv:1605.09788](https://arxiv.org/abs/1605.09788)),
and $c = 299\,792\,458$ m/s exactly. So $GM_\odot/c^3 = 4.925491\ \mu$s, and
$5.911\ \mu$s for $1.2\,M_\odot$.

**The chirp.** The chirp mass is $\mathcal M = \mu^{3/5} M^{2/5} =
(m_1 m_2)^{3/5}/(m_1+m_2)^{1/5}$, with $M = m_1 + m_2$ and $\mu = m_1 m_2/M$
(Sathyaprakash and Schutz 2009,
[arXiv:0903.0338](https://arxiv.org/abs/0903.0338), eq. 31). To leading
order, with $T = G\mathcal M/c^3$ and $\tau$ the time to merger,

$$
f(\tau) = \frac{1}{8\pi}\left(\frac{5}{\tau}\right)^{3/8} T^{-5/8}, \qquad
\Phi(\tau) = -2\left(\frac{\tau}{5T}\right)^{5/8}, \qquad
\mathcal A(\tau) \propto \tau^{-1/4}
$$

(Maggiore 2008, *Gravitational Waves*, Vol. 1, chapter 4; Sathyaprakash and
Schutz 2009). Differentiating, $d\Phi/dt = -d\Phi/d\tau = \tfrac54
(5T)^{-5/8}\tau^{-3/8} = 2\pi f(\tau)$: the phase is $2\pi$ times the
integral of the frequency, zero at the merger.

**Sweep rate.** From $f \propto T^{-5/8}\tau^{-3/8}$, $df/dt = \tfrac38\,
f/\tau$. With $\tau = \tfrac{5}{256}\,T^{-5/3}(\pi f)^{-8/3}$ ([cycles
section](#cycles)), $df/dt = \tfrac{96}{5}\,\pi^{8/3}\,T^{5/3} f^{11/3}$. At
a given frequency, a larger chirp mass sweeps faster.

**A 1% change.** At fixed $\tau$, $\Phi \propto \mathcal M^{-5/8}$, so
$\partial\Phi/\partial\ln\mathcal M = -\tfrac58\,\Phi$. The phase
accumulated from $\tau = 4$ s to the merger is $\lvert\Phi(4\,{\rm s})\rvert$,
$2\pi$ times the number of cycles in the [cycles table](#cycles). A 1%
larger $\mathcal M$ multiplies it by $1.01^{-5/8} = 0.99380$, a change of
0.620%:

<div markdown="1">

| chirp mass | phase in the last 4 s | change for +1% (exact) | linear, $\tfrac58 \times 0.01 \times \lvert\Phi\rvert$ |
|---|---|---|---|
| 0.85 M☉ | 3997.5 rad | 24.78 rad | 24.98 rad |
| 1.2 M☉ | 3222.5 rad | 19.98 rad | 20.14 rad |
| 1.8 M☉ | 2501.1 rad | 15.51 rad | 15.63 rad |
| 2.75 M☉ | 1919.1 rad | 11.90 rad | 11.99 rad |

</div>

This compares two chirps aligned at the merger. A search also fits the
merger time and phase, which absorbs part of the difference; the tuning
curves ([below](#ck-tuning)) show what remains.

**Where the inspiral ends.** The Newtonian $f(\tau)$ grows without bound as
$\tau \to 0$. The inspiral ends when the stars begin to interact and merge
or, for very compact bodies, near the last stable orbit, at separation $R =
6GM/c^2$ (Sathyaprakash and Schutz 2009, section 3.4.1, eq. 29, which gives
$f_{\rm LSO} \sim 220\,(20\,M_\odot/M)$ Hz). Kepler's law $\Omega^2 =
GM/R^3$ at that separation gives a wave frequency $f = \Omega/\pi =
c^3/(6^{3/2}\pi G M) = 4397\ {\rm Hz} \times (M_\odot/M)$. It depends on
the total mass $M$, not on $\mathcal M$: for equal masses, 1595 Hz at
$\mathcal M = 1.2\,M_\odot$ ($M = 2.757\,M_\odot$) and 1063 Hz at $\mathcal
M = 1.8\,M_\odot$ ($M = 4.135\,M_\odot$). This is an estimate; neutron
stars can touch before that orbit.

**Check.** Computed with numpy: $GM_\odot/c^3 = 4.925490948 \times 10^{-6}$
s. $d\Phi/dt$ by finite differences agrees with $2\pi f$ to $1.0 \times
10^{-6}$ (relative) for $\tau$ from 0.5 to 4 s. $f(4\,{\rm s})$ = 99.41,
80.14, 62.20, 47.72 Hz and 636.2, 512.9, 398.1, 305.4 cycles for 0.85, 1.2,
1.8, 2.75 $M_\odot$, as in the [cycles table](#cycles).

## The two quadratures, and where the energy peaks {#ck-quadratures}

**Claims** (proposal, section 3): the quadratures $h_c = \mathcal A\cos\Phi$
and $h_s = \mathcal A\sin\Phi$ are orthogonal and of equal size; without
noise, the energy $e(t)$ is largest at the true merger time.

**Orthogonality.** When $h_s$ is the Hilbert transform of $h_c$ (the
analytic construction), the two are exactly orthogonal and of equal size
(Oppenheim and Schafer 2010, *Discrete-Time Signal Processing*, chapter on
discrete Hilbert transforms; see [the peak-energy section](#peak-energy)).
For $\mathcal A\cos\Phi$ and $\mathcal A\sin\Phi$,

$$
\langle h_c, h_s\rangle = \tfrac12\sum_t \mathcal A^2 \sin 2\Phi, \qquad
\lVert h_c\rVert^2 - \lVert h_s\rVert^2 = \sum_t \mathcal A^2 \cos 2\Phi .
$$

Both are sums of a turning term weighted by $\mathcal A^2$. When $\mathcal
A$ changes little over a cycle, neighbouring cycles cancel and both sums are
small next to $\lVert h_c\rVert^2 = \tfrac12\sum_t \mathcal A^2 (1 + \cos
2\Phi)$. So the property is approximate.

**Where the energy peaks.** Take the quadratures scaled to unit size,
$\hat h_{c,t}$ and $\hat h_{s,t}$ ending at time $t$, and orthogonal. For a
noise-free signal $s$, as in [the peak-energy section](#peak-energy),

$$
e(t) = \langle \hat h_{c,t}, s\rangle^2 + \langle \hat h_{s,t}, s\rangle^2
= \max_\varphi \langle \cos\varphi\,\hat h_{c,t} + \sin\varphi\,\hat h_{s,t},\ s\rangle^2 .
$$

The vector in the bracket has size 1 (at most 1 where it is cut off by the
window's edge), so by Cauchy–Schwarz $e(t) \le \lVert s\rVert^2$, with
equality only if it is parallel to $s$. For a signal from the template
family that happens at the true merger time and phase; a shifted chirp has a
different frequency at every sample and is not parallel to $s$. With noise,
the peak moves; the largest energy over time is the matched-filter
statistic for an unknown arrival time (Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)).

**Check.** The toy chirps of the page (4 s at 2048 Hz, 20 to 900 Hz):
normalized overlap $\langle h_c, h_s\rangle/(\lVert h_c\rVert\lVert
h_s\rVert)$ = $-6.3\times10^{-4}$, $-1.23\times10^{-3}$,
$-9.8\times10^{-5}$, $-1.25\times10^{-3}$, and $\lVert h_s\rVert^2/\lVert
h_c\rVert^2 - 1$ = $-2.75\times10^{-3}$, $-3.10\times10^{-3}$,
$+4.65\times10^{-3}$, $-4.10\times10^{-3}$, for 0.85, 1.2, 1.8, 2.75
$M_\odot$.

## Averaging after a GELU {#ck-gelu-mean}

**Claim** (proposal, section 3): averaging over time cancels the part of an
oscillating output that is linear in the signal, but a GELU before the
average leaves a nonzero mean.

**Derivation.** ${\rm GELU}(x) = x\,\Phi_{\mathcal N}(x)$, with
$\Phi_{\mathcal N}$ the standard normal cumulative distribution (Hendrycks
and Gimpel 2016, [arXiv:1606.08415](https://arxiv.org/abs/1606.08415)).
Write

$$
x\,\Phi_{\mathcal N}(x) = \frac{x}{2} + x\left(\Phi_{\mathcal N}(x) - \tfrac12\right).
$$

For an input $a\cos\theta$, the first term is odd and averages to zero over
a cycle. The second is even and never negative ($x$ and $\Phi_{\mathcal
N}(x) - \tfrac12$ have the same sign), so its average is positive. For
small $a$, $\Phi_{\mathcal N}(x) - \tfrac12 \approx x/\sqrt{2\pi}$, and the
mean is $a^2\langle\cos^2\theta\rangle/\sqrt{2\pi} = a^2/(2\sqrt{2\pi}) =
0.1995\,a^2$.

**Check.** Averaging ${\rm GELU}(a\cos\theta)$ over 200,000 points of a
cycle: 0.00199 at $a = 0.1$ (small-$a$ value 0.00199), 0.177 at $a = 1$,
0.895 at $a = 3$.

## Coherent addition {#ck-coherent}

**Claim** (proposal, section 3): after dechirping, the signal part of a sum
of $m$ samples grows like $m$ for a constant amplitude, and the noise part
like $\sqrt m$.

**Derivation.** Let $u_\ell = \mathcal A_\ell\cos\Phi_\ell + \eta_\ell$ with
$\eta_\ell$ independent, mean 0, variance 1. Multiplying by $e^{-i\Phi_\ell}$,

$$
\mathcal A_\ell\cos\Phi_\ell\, e^{-i\Phi_\ell} = \tfrac12\mathcal A_\ell + \tfrac12\mathcal A_\ell\, e^{-2i\Phi_\ell} .
$$

Summed over $m$ samples, the first term gives $\tfrac12\sum_\ell \mathcal
A_\ell$, which is $\tfrac12\mathcal A m$ for a constant amplitude and grows
faster than $m$ when the amplitude rises toward the merger. The second term
keeps turning and stays small next to it. The noise part $\sum_\ell
\eta_\ell e^{-i\Phi_\ell}$ has $E\lvert\cdot\rvert^2 = \sum_\ell
E\eta_\ell^2 = m$, a typical size $\sqrt m$. For a constant amplitude the
ratio grows like $\sqrt m$.

The figure on the page weights each sample by the template's amplitude as
well: it sums $u_\ell(\hat h_{c,\ell} - i\hat h_{s,\ell})$ with unit-size
quadratures. Over the whole window the signal part is then $\rho(1 -
i\langle\hat h_c, \hat h_s\rangle)$, size $\rho$ to within $1.3 \times
10^{-3}$ ([quadratures](#ck-quadratures)), and the noise part has
$E\lvert\cdot\rvert^2 = \lVert\hat h_c\rVert^2 + \lVert\hat h_s\rVert^2 = 2$.

## Keeping the strongest Fourier tones {#ck-fourier-tones}

**Claims** (proposal, section 4): the best approximation of a signal by $k$
Fourier tones keeps the $k$ strongest, with match $\sqrt{\sum_{\rm strongest\
k}\lvert\hat h_q\rvert^2/\sum_q\lvert\hat h_q\rvert^2}$; the tone counts in
the two figures; why a chirp needs hundreds.

**Derivation.** For a length-$L$ signal, the vectors $e_q(\ell) =
e^{2\pi i q\ell/L}/\sqrt L$ are orthonormal and $h = \sum_q (\hat
h_q/\sqrt L)\,e_q$, with $\hat h_q$ the discrete Fourier coefficients. So
$\sum_\ell\lvert h_\ell\rvert^2 = \tfrac1L\sum_q\lvert\hat h_q\rvert^2$
(Parseval). Keeping a set $S$ of coefficients gives $h_S = \sum_{q\in
S}(\hat h_q/\sqrt L)\,e_q$, the orthogonal projection of $h$ onto those
tones and the closest signal built from them. Its error $\lVert h -
h_S\rVert^2 = \tfrac1L\sum_{q\notin S}\lvert\hat h_q\rvert^2$ is smallest
when $S$ holds the $k$ largest $\lvert\hat h_q\rvert$. Its match, the
normalized overlap (Owen 1996,
[arXiv:gr-qc/9511032](https://arxiv.org/abs/gr-qc/9511032); here without
maximizing over time and phase), is $\langle h_S, h\rangle/(\lVert
h_S\rVert\lVert h\rVert) = \lVert h_S\rVert/\lVert h\rVert$, the formula
above.

**Counting tones.** For a complex signal (a Project 8 record as $I + iQ$;
the toy chirp written as $\mathcal A e^{i\Phi}$) each coefficient is one
complex tone at one signed frequency. For a real signal, $\hat h_{-q} =
\overline{\hat h_q}$: the coefficients at $\pm q$ have equal power and
together make one real cosine, so counting only non-negative frequencies
(numpy `rfft`) counts real tones, the way S4D's tones are counted. (The
coefficients at 0 and at half the sampling rate have no partner; the toy
chirp has no power there, and weighting them correctly leaves the counts
unchanged.)

**Numbers.** First figure: the first 50 noise-free records ($I + iQ$) of
our Project 8 test set need 1 to 6 tones for a match of 0.9, median 3, and
are above 0.98 with 32. Four toy chirps $\mathcal A e^{i\Phi}$ (4 s at 2048
Hz, 20 to 900 Hz) need 744, 630, 557 and 476 tones for 0.9 at chirp mass
1.0, 1.4, 1.8 and 2.4 $M_\odot$ (median 593.5). Second figure: the real
toy chirp $\mathcal A\cos\Phi$ at $1.2\,M_\odot$ needs 689 real tones for
0.9 and 2,470 for 0.99, and has 0.356 with 32.

**Why so many.** Tones that last the 4 s window are $1/(4\,{\rm s}) = 0.25$
Hz apart. By stationary phase, the chirp's Fourier amplitude falls as
$f^{-7/6}$ (Sathyaprakash and Schutz 2009, eq. 127), so its power per unit
frequency falls as $f^{-7/3}$. Between $f_0 = f(4\,{\rm s}) = 80.14$ Hz and
the 900 Hz cut, the fraction of the power below $f$ is $(f_0^{-4/3} -
f^{-4/3})/(f_0^{-4/3} - 900^{-4/3})$. A match of 0.9 needs 81% of the power:
below 247.6 Hz, a band 670 tones wide. A match of 0.99 needs 98.01%: below
670.5 Hz, 2,362 tones. The measured counts, 689 and 2,470, are a little
higher, because the abrupt start of the window and the 900 Hz cut spread
some power outside this band. The whole band the chirp sweeps, 80.14 to 900
Hz, is 3,279 tones wide.

**Damped tones at any frequency** (12 October, [template-bank
entry]({{ '/projects/bns/updates/2026-10-12-template-bank-network/' | relative_url }})).
Four whitened BNS templates (chirp mass 1.0, 1.2, 1.5 and 2.0 $M_\odot$)
were fitted as $\sum_n c_n z_n^\ell$ in three ways: the $N$ strongest
Fourier tones; a fixed grid over 20 to 800 Hz with one $e$-fold over the
window; and poles from the matrix-pencil method (Hua and Sarkar 1990, IEEE
Trans. ASSP 38, 814), moved inside the unit circle where needed, with the
weights $c_n$ by least squares. At $N = 32$ the matches were 0.25 to 0.33,
0.09 to 0.12 and 0.20 to 0.29; the best of the three, 0.25 to 0.33. The
matrix-pencil fits stayed below 0.92 up to $N = 2048$. These are the best
fits these methods found, not proven upper limits.

**Check.** All numbers above were computed with numpy (FFT, sort,
cumulative sum) with the same code that made the figures; the 12 October
numbers come from that run's saved results.

## Noise through one chirp kernel {#ck-noise}

**Claims** (proposal, sections 5 and 9): on noise, one kernel's energy in
one detector has mean 2 and exceeds 10 with probability $e^{-5}$; the
expected largest of $N$ independent values is $2(\ln N + \gamma)$; more
kernels raise the noise floor.

**One time.** Assume the whitened noise samples are independent with mean
0 and variance 1 (FINDCHIRP, cited above; Abbott et al. 2020,
[arXiv:1908.11170](https://arxiv.org/abs/1908.11170)). With unit-size,
orthogonal quadratures, $z_c = \langle\hat h_c, \eta\rangle$ and $z_s =
\langle\hat h_s, \eta\rangle$ are Gaussian with variance 1 each and
covariance $\langle\hat h_c, \hat h_s\rangle = 0$, so independent. The
energy $e = z_c^2 + z_s^2$ is then χ² with two degrees of freedom: density
$\tfrac12 e^{-x/2}$, mean 2, and $P(e > x) = e^{-x/2}$, which is 0.674% for
$x = 10$ and 0.0553% for $x = 15$. This is one detector; summed over two,
the mean is 4. Where the kernel overlaps the window only partly, the mean
is the overlapping part of its squared size: for the page's kernel, 1.72 at
3.0 s and 2.00 at 4.0 s.

**The largest of $N$.** For $N$ independent values with $P(e \le x) = 1 -
e^{-x/2}$,

$$
E\big[\max\big] = \int_0^\infty \left[1 - (1 - e^{-x/2})^N\right] dx
= 2\int_0^1 \frac{1 - v^N}{1 - v}\,dv = 2\sum_{k=1}^{N}\frac1k = 2H_N ,
$$

substituting $v = 1 - e^{-x/2}$. Since $H_N = \ln N + \gamma + O(1/N)$,
with $\gamma = 0.5772$, $E[\max] \approx 2(\ln N + \gamma)$: 16.40 for $N =
2048$. Neighbouring outputs of a kernel are correlated, so the effective
$N$ is smaller and this is an upper guide. With $J$ kernels and $N_t$ times,
$N = J N_t$ when all are independent, and doubling $J$ raises
$E[\max]$ by $2(H_{2N} - H_N) < 2\ln 2 = 1.39$. The general effect of
searching many places is the look-elsewhere effect (Gross and Vitells 2010,
[arXiv:1005.1891](https://arxiv.org/abs/1005.1891)).

**Check.** 400 windows of white noise through the page's kernel at $1.2\,
M_\odot$: the energy in the last second averaged 1.873; its largest value
in the last second (2,048 samples) had median 13.93, with 10% and 90%
points 11.39 and 17.26; it passed 10 in 99.0% of windows and 15 in 31.5%.
The template bank of the [benchmark]({{ '/projects/bns/updates/2026-10-07-matched-filter-benchmark/' | relative_url }})
(613 templates, all times, two detectors) gave the 6,383 empty windows a
best network SNR with median 6.27, mean 6.67 and 99th percentile 7.73.

## Tuning curves of a fixed chirp kernel {#ck-tuning}

**Claims** (proposal, sections 6 and 9): a kernel's response falls below
half at 0.6% below and 0.19% above its own chirp mass; a kernel 1% off peaks
lower and earlier.

**Setup.** Noise-free toy chirps of unit size at event chirp mass $m$,
through kernels at 1.15, 1.20 and 1.25 $M_\odot$; the response is
$\sqrt{\max_t e(t)}$, the match maximized over time and phase.

**Check.** On a grid of 4,001 event chirp masses from −2.96% to +1.01% of
each kernel's (evenly spaced in log): the response falls below 0.5 at
−0.576%, −0.589%, −0.604% and at +0.184%, +0.189%, +0.193% for the three
kernels. At −2.96% it is 0.234 to 0.238 (the slow side); beyond +0.5% it
stays below 0.23. A kernel 1%
heavier than a $1.2\,M_\odot$ signal reaches a peak energy 0.1575 of the
matched one (match 0.397), 68 samples (33.2 ms) before the merger. As a
function of the kernel's offset (the match-against-chirp-mass figure):
0.396 at +1%, 0.290 at +2%, 0.240 at +3%; below −0.25% under 0.25, and
below −1% under 0.11.

## How many states a recurrence needs {#ck-states}

**Claim** (proposal, section 7): a small state cannot generate a chirp
kernel step by step.

**Derivation.** A recurrence with $n$ states, $x_\ell = \bar A x_{\ell-1} +
\bar B u_\ell$, $y_\ell = C x_\ell$, has kernel $K_j = C\bar A^{\,j}\bar B$
([above](#ck-s4d-step); this holds for any $n \times n$ matrix $\bar A$).
Arrange the kernel in the matrix $H_{ij} = K_{i+j}$ (a Hankel matrix). Then

$$
H_{ij} = \big(C\bar A^{\,i}\big)\big(\bar A^{\,j}\bar B\big), \qquad H = O\,R ,
$$

with $O$ the matrix whose rows are $C\bar A^{\,i}$ ($n$ columns) and $R$
the matrix whose columns are $\bar A^{\,j}\bar B$ ($n$ rows). So $H$ has
rank at most $n$: generating a kernel exactly takes at least as many states
as the rank of its $H$.

**For chirps.** The 12 October tone check built $H$ (4,032 × 4,033) from
whitened 4 s chirp kernels and computed its singular values. Holding 90% of
their summed squares took 73, 87, 96 and 206 of them (chirp mass 2.0, 1.5,
1.2, 1.0 $M_\odot$), and 99% took 98 to 280. So $H$ is far from rank 32.
This shows the size of the problem; it is not itself a bound on the match a
32-state fit can reach. The direct test is the fits in
[the Fourier-tones section](#ck-fourier-tones).

## The largest matched-filter value on empty data {#oct7-noise-floor}

**Claim** (matched-filter benchmark, 7 October): on windows with no signal,
the best of the 613 templates still reaches a network SNR of 6.27 (median),
because the benchmark tries every template at every time shift.

**One trial.** For one template at one time, the matched-filter SNR² of one
detector in Gaussian noise is a χ² variable with two degrees of freedom, mean 2
(Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116)). The H1 and L1
noise are independent, so the network SNR², $\rho_H^2 + \rho_L^2$, is χ² with
four degrees of freedom:

$$
P(\rho^2 > x) = \left(1 + \frac{x}{2}\right) e^{-x/2} .
$$

**Many trials.** The benchmark keeps the largest network SNR over
613 templates, 1,201 H1 time shifts (±600 samples) and, for each, the
best of 41 L1 shifts (±20 samples). If these $N$ trials were independent, the
median $x_N$ of the largest $\rho^2$ would solve
$\left(1 - P(x_N)\right)^N = \tfrac12$, that is $N\,P(x_N) \approx \ln 2$, or

$$
x_N \approx 2\ln N + 2\ln\!\left(1 + \frac{x_N}{2}\right) - 2\ln\ln 2 .
$$

The floor therefore grows only as $\sqrt{2\ln N}$. With all
$N = 613 \times 1201 \times 41 = 3.0 \times 10^7$ trials independent, the
median of the largest network SNR is 6.43; for a single trial it is 1.83.
Neighbouring templates and time shifts are correlated, so the effective number
of independent trials $N_{\rm eff}$ is smaller than $N$ and the floor lies
below 6.43. Ten times more independent trials would raise it only from 5.97
to 6.36.

**Check.** The benchmark code was run on 300 windows of unit-variance Gaussian
white noise, with the templates whitened by the noise spectra of 300 empty
O3b windows: median 5.97 (16 to 84%: 5.75 to 6.23; 99th percentile 6.70;
largest 6.90). The formula above gives this median for
$N_{\rm eff} = 2.0 \times 10^6$. On the same 300 real empty windows the code
reproduces the stored benchmark values (largest difference $4 \times 10^{-6}$),
median 6.27; over all 6,383 empty windows the median is 6.27 and the 99th
percentile 7.73. The real data sit 5% above Gaussian noise: whitened O3b data
are not exactly unit-variance Gaussian noise (in the average spectrum of 400
empty windows the band medians between 100 and 1,000 Hz are 1.058 to 1.075
instead of 1, and narrow lines and glitches remain). The χ² tail and its
median were computed with scipy and checked against the closed form above.

## Validation events per epoch at SNR 8 to 12 {#oct7-val-count}

**Claim** (chirp-kernel page, 8 October): each validation epoch holds 68
events at SNR 8 to 12 on average (standard deviation 7.7), so a fraction near
90% measured on them has a binomial standard deviation of 3.6 points.

**Derivation.** Each epoch validates on 16 batches of 32 windows, 512 windows,
injected the same way as training windows: each window carries a signal with
probability 0.96, at an SNR drawn with density $\propto \rho^{-3}$ from 4 to
100, which lies in 8 to 12 with probability 0.1391 (section above). Each
window is independently an SNR 8 to 12 event with probability
$p = 0.96 \times 0.1391 = 0.1336$, so the count is binomial with mean
$512\,p = 68.4$ and standard deviation $\sqrt{512\,p(1-p)} = 7.7$. A fraction
$q$ measured on 68 events has a binomial standard deviation
$\sqrt{q(1-q)/68}$: 3.6 points at $q = 0.9$ and 4.9 points at $q = 0.8$.

**Check.** $2 \times 10^5$ binomial draws: mean 68.38, standard deviation
7.67, 5 to 95%: 56 to 81 events.

## Frequency precision of a tone against duration {#oct7-tone-precision}

**Claim** (7 October, Project 8): for a stationary tone of fixed amplitude in
white noise, the SNR grows as the square root of the duration and the best
possible frequency precision as the duration to the −3/2.

**Derivation.** Take $N$ samples at rate $f_s$ of
$s_n = A\cos(2\pi f n/f_s + \varphi)$ in white Gaussian noise of variance
$\sigma^2$ per sample, a duration $T = N/f_s$. The matched-filter SNR is
$\rho^2 = \sum_n s_n^2/\sigma^2 = A^2 N/(2\sigma^2)$ (up to terms that oscillate
with $N$), which grows as $T$, so $\rho \propto T^{1/2}$. The Fisher
information for frequency and phase, with $c = A^2/(2\sigma^2)$ and
$k = 2\pi/f_s$ and the same oscillating terms dropped, is

$$
I_{ff} = c\,k^2 \sum_n n^2, \qquad I_{f\varphi} = c\,k \sum_n n, \qquad I_{\varphi\varphi} = c\,N ,
$$

(the amplitude decouples). With $\sum n = N(N-1)/2$ and
$\sum n^2 = N(N-1)(2N-1)/6$, the Cramér–Rao bound on the frequency is

$$
\operatorname{var}\hat f \ \ge\ \frac{I_{\varphi\varphi}}{I_{ff} I_{\varphi\varphi} - I_{f\varphi}^2}
= \frac{6\,\sigma^2 f_s^2}{\pi^2 A^2\, N (N^2 - 1)}
\ \approx\ \frac{3}{\pi^2 \rho^2 T^2},
$$

so $\sigma_f \ge \sqrt3/(\pi\rho T)$. With $\rho \propto T^{1/2}$ this is
$\sigma_f \propto T^{-3/2}$. This is the single-tone frequency bound of Rife
and Boorstyn (D. C. Rife and R. R. Boorstyn, "Single tone parameter estimation
from discrete-time observations", IEEE Trans. Inf. Theory 20, 591 (1974)),
written here for a real tone. It bounds any unbiased estimate; it does not say
that a given estimator reaches it.

**Check.** The full three-parameter Fisher matrix (amplitude, frequency,
phase), computed numerically for $N$ = 1,000 to 8,000 samples at $f_s$ = 1 kHz,
gives a frequency bound within 0.2% of the closed form, and the slope of
$\log\sigma_f$ against $\log T$ is −1.499.

## The chirp kernels: Newtonian phase, frequency and amplitude {#oct7-chirp-kernels}

**Claims** (chirp-kernel page, 8 October): the kernel phase and amplitude; at
the same time before merger a lighter system is at a higher frequency; the
kernel spacing; the value of `TSUN`.

**Derivation.** To leading (Newtonian) order, a binary of chirp mass
$\mathcal M$ at time $\tau$ before merger radiates at

$$
f(\tau) = \frac1\pi \left(\frac{5}{256\,\tau}\right)^{3/8} \left(\frac{G\mathcal M}{c^3}\right)^{-5/8},
\qquad
\Phi(\tau) = -2\left(\frac{5G\mathcal M}{c^3}\right)^{-5/8} \tau^{5/8} + \Phi_0 ,
$$

with amplitude proportional to $f^{2/3} \propto \tau^{-1/4}$, and its frequency
rises at

$$
\frac{df}{dt} = \frac{96}{5}\,\pi^{8/3} \left(\frac{G\mathcal M}{c^3}\right)^{5/3} f^{11/3}
$$

(Maggiore, *Gravitational Waves*, Vol. 1, Oxford University Press 2008,
chapter 4; Sathyaprakash and Schutz 2009,
[arXiv:0903.0338](https://arxiv.org/abs/0903.0338)). With
$T_\mathcal{M} = G\mathcal M/c^3$, $(1/\pi)(5/256)^{3/8} = 5^{3/8}/(8\pi)$, so
$f = (8\pi)^{-1}(5/\tau)^{3/8}T_\mathcal{M}^{-5/8}$ and
$\Phi = -2\,(\tau/5T_\mathcal{M})^{5/8}$, the two lines of the code.

- At the same time before merger, $f \propto \mathcal M^{-5/8}$: the lighter
  system is at the higher frequency.
- At the same frequency, $df/dt \propto \mathcal M^{5/3}$: the lighter system
  sweeps through it more slowly.

**Spacing.** 512 chirp masses evenly spaced in $\log\mathcal M$ from 0.85 to
2.75 M☉ are a factor $\exp\!\big(\ln(2.75/0.85)/511\big) = 1.00230$ apart:
0.230%.

**`TSUN`.** $GM_\odot/c^3$ with the IAU 2015 nominal solar mass parameter
$(GM)^{\rm N}_\odot = 1.3271244 \times 10^{20}$ m³ s⁻² (Prša et al. 2016,
"Nominal values for selected solar and planetary quantities: IAU 2015
Resolution B3", AJ 152, 41, [arXiv:1605.09788](https://arxiv.org/abs/1605.09788))
and the exact $c = 299{,}792{,}458$ m/s: $4.9254909 \times 10^{-6}$ s.

**Check.** At $\tau$ = 1 s, $f$ = 151.04 Hz for 1.0 M☉ and 97.94 Hz for
2.0 M☉, ratio 0.6484 $= 2^{-5/8}$. At 100 Hz the ratio of $df/dt$ is
3.1748 $= 2^{5/3}$. A numerical derivative of $f(\tau)$ equals the $df/dt$
formula (50.540 Hz/s at $\tau$ = 1 s, 1.2 M☉), and $-d\Phi/d\tau = 2\pi f$
(846.81 rad/s there). These are leading-order values; post-Newtonian
corrections are not included.

## Averaging an oscillating output over the window {#oct7-time-average}

**Claim** (chirp-kernel page, 8 October): averaging an oscillating output over
time cancels it.

**Derivation.** The mean of $a\cos(2\pi f t + \varphi)$ over a window of length
$T$ is

$$
\frac{a}{2\pi f T}\left[\sin(2\pi f T + \varphi) - \sin\varphi\right],
\qquad \text{at most } \frac{a}{\pi f T} \text{ in size.}
$$

The kernels pass only 20 to 800 Hz, so every component of the filter output
oscillates at 20 Hz or faster, and over the 4 s window its mean is at most
$1/(\pi \times 20 \times 4) = 0.4\%$ of that component's amplitude. The energy
$z^{(c)2} + z^{(s)2}$ is positive and does not cancel; the network takes its
maximum over time.

**Check.** The largest numerical mean of $\cos(2\pi f t + \varphi)$ over 8,192
samples at 2048 Hz, for $f$ from 20 to 30 Hz and 13 phases, is 0.0038, below
the bound 0.0040. Measured on 12 October with real templates as kernels (the
703-template bank on the benchmark windows): replacing the maximum over time
by the mean dropped the fraction within 1% at SNR 8 to 10 from 96% to 26%
(uniform SNR set) and from 91% to 22% (power law from 4).

## Why the matched filter's 1% column stops at 95% {#oct7-bank-spin}

**Claim** (matched-filter benchmark, 7 October): the benchmark bank's spacing
does not cause the 95% ceiling within 1%; templates without spin do.

**Spacing.** The bank has 613 distinct chirp masses; the largest gap between
neighbours is 0.70% (median 0.12%). Every event's chirp mass is therefore
within 0.35% of some template's, well inside 1%.

**Spin.** The templates were chosen with the lowest spin available: their
effective spin satisfies $|\chi_{\rm eff}| \le 0.19$, median 0.008. Measured
on the benchmark's own estimates, all three test sets pooled, SNR 16 to 50
(6,555 events, 95.5% within 1%):

<div markdown="1">

| injected effective spin | share of events | within 1% | median error of the estimate |
|---|---|---|---|
| $\lvert\chi_{\rm eff}\rvert < 0.1$ | 71.5% | 99.3% | −0.03% |
| $\chi_{\rm eff} < -0.1$ | 13.7% | 82.8% | +0.66% |
| $\chi_{\rm eff} > 0.1$ | 14.8% | 88.7% | −0.66% |

</div>

Spinning signals are matched best by a template of shifted chirp mass. On the
same windows ([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})),
halving the grid step to 0.25% changed the fraction within 1% at SNR 8 to 12 by
at most 1 point, and adding templates with $\chi_{\rm eff} = \pm 0.1$ raised
within 1% at SNR 16 to 50 to 97 to 98%.

**Check.** $\chi_{\rm eff} = (m_1 a_1\cos\theta_1 + m_2 a_2\cos\theta_2)/(m_1 + m_2)$
from the injected masses, spin magnitudes and tilts stored with each window;
the template values from the same parameters in the injection file. The
template chirp masses and gaps were recomputed with the benchmark's own
bank-building code.

## SNR bands of our test populations {#late-snr-bands}

**Claims** (9, 12, 13 and 14 October updates): 75% of the power law from
SNR 4 lies below SNR 8; SNR 8 to 16 holds 19% of the power law from 4 and
77% of the power law from 8; the uniform population has 54% of its events
above SNR 25; and if sources are spread uniformly in volume, 87.5% of the
events above SNR 8 are below SNR 16.

**Our populations.** Validation and test draw SNR with ml4gw's power law,
density $p(\rho) \propto \rho^{-3}$ on $[\rho_{\min}, \rho_{\max}]$ (see
[the SNR of sources spread uniformly in space](#snr-population)). The test
uses $\rho_{\max} = 50$; validation during training uses
$\rho_{\max} = 100$. For a density $\propto \rho^{-k}$ on $[a, b]$ the
fraction between $x$ and $y$ is

$$
F(x, y) = \frac{x^{1-k} - y^{1-k}}{a^{1-k} - b^{1-k}} .
$$

With $k = 3$:

<div markdown="1">

| population | below 8 | 8 to 16 | 25 to 50 |
|---|---|---|---|
| power law from 4, maximum 50 (test) | 75.5% | 18.9% | 1.9% |
| power law from 4, maximum 100 (validation) | 75.1% | | |
| power law from 8, maximum 50 (test) | 0% | 77.0% | 7.9% |
| uniform, 4 to 50 (test) | 8.7% | 17.4% | 54.3% |

</div>

These populations are flatter than the uniform-in-volume law below, so
they hold relatively more loud events than real detections would.

**Sources spread uniformly in volume.** The SNR density above a detection
threshold $\rho_{\rm th}$ is $p(\rho) = 3\rho_{\rm th}^3/\rho^4$ (Schutz 2011,
Class. Quantum Grav. 28, 125023,
[arXiv:1102.5421](https://arxiv.org/abs/1102.5421); derived in
[the SNR of sources spread uniformly in space](#snr-population)). The
fraction of detected events below $2\rho_{\rm th}$ is

$$
\int_{\rho_{\rm th}}^{2\rho_{\rm th}} \frac{3\rho_{\rm th}^3}{\rho^4}\,{\rm d}\rho
= 1 - 2^{-3} = 0.875 ,
$$

whatever the threshold. With $\rho_{\rm th} = 8$, 87.5% of detected events
have SNR 8 to 16, which is why that band matters most for a search with a
threshold near SNR 8.

**Check.** $F$ computed in Python, and by 2 million draws with the inverse
cumulative distribution (power law from 4: 75.46% below 8, 18.92% in 8 to
16). The test sets themselves: below SNR 8, 18,870 of 25,046 signals
(75.3%) for the free-kernel and bank tests and 18,926 of 24,982 (75.8%)
for the den-reg tests; SNR 8 to 16, 4,646 of 24,982 (18.6%) for the power
law from 4 and 19,290 of 24,982 (77.2%) for the power law from 8; SNR 25
to 50 in the uniform population, 13,474 of 24,982 (53.9%).

## Why a squared-error loss shrinks the output {#late-shrinkage}

**Claim** (9 October update): without the shape and amplitude terms, the
time-domain part of the denoiser loss, a mean squared error, favours an
output smaller than the true waveform.

**Derivation.** Let $s$ be the true waveform and let the denoiser output
have a fixed shape, a unit vector $\hat u$, with overlap
$\rho = \langle \hat u, s\rangle / \lVert s\rVert$ (the "overlap" on the
page), scaled by a size $g$. The squared error is

$$
\lVert g\hat u - s\rVert^2 = g^2 - 2g\rho\lVert s\rVert + \lVert s\rVert^2 ,
$$

smallest at $g = \rho\lVert s\rVert$. So whatever shape the network
produces, the squared error is lowest when the output's size is $\rho$
times the true size, less than the true size whenever $\rho < 1$.

The same result in the usual form: if the output before scaling is
$\hat s = s + e$, with an error $e$ uncorrelated with $s$, of expected
energies $S = E\lVert s\rVert^2$ and $N = E\lVert e\rVert^2$, the scale
$g$ that minimizes $E\lVert g\hat s - s\rVert^2$ is

$$
g = \frac{E\langle \hat s, s\rangle}{E\lVert \hat s\rVert^2} = \frac{S}{S + N} < 1 ,
$$

The shape term
$1 - \rho$ does not depend on the size, and the amplitude term
$(\log\lVert \text{output}\rVert - \log\lVert s\rVert)^2$ (per detector) is
zero only at the true size, so with them shrinking is no longer the
cheapest way to lower the loss. These are statements about the time-domain
term; the spectral term of our loss compares logarithms of spectral
magnitudes and is not covered by this argument.

**Check.** Monte Carlo with 4,096-sample vectors: for $S/N$ = 4, 1 and
0.25 the best scale averaged over 2,000 draws was 0.8000, 0.5000 and
0.2001, against $S/(S+N)$ = 0.8, 0.5, 0.2; for a fixed shape with
$\rho = 0.19$, a scan over sizes gave the minimum at 0.1900 of the true
size. The loss terms are as written in our code
(`ScheduledMixtureLoss`: time term MSE, spectral term on
$\log_{10}(|{\rm FFT}| + 0.01)$, `lambda_amp`, `c_rho`).

## How noisy is one validation epoch? {#late-binomial}

**Claims** (9 and 13 October updates): the epoch-to-epoch spread of the
validation accuracy, and whether two values differ by more than it.

**Derivation.** A fraction measured on $n$ independent events with true
value $p$ is binomial, with standard deviation $\sqrt{p(1-p)/n}$; the
difference of two independent such fractions has the two variances added.

- **9 October runs.** Each validation epoch draws 16 batches of 128
  windows, each window carrying a signal with probability 0.96, so
  $n \approx 1{,}966$ signals (fresh draws every epoch). At $p = 0.20$:
  0.90 points; at $p = 0.16$: 0.83 points; the difference of the two runs:
  1.22 points.
- **13 October free kernels.** 64 batches of 32 windows, again
  $n \approx 1{,}966$; at $p = 0.416$: 1.11 points.

**Check.** The observed standard deviation of the 9 October runs' single-
epoch within-2% values over epochs 300 to 340, where they change little,
is 0.89 and 0.92 points, as predicted. Numbers computed in Python from the
wandb histories (DENOISER-SCAN `keej8hie` and the run without the terms;
CLAUDE-TESTS free-kernel run). The difference between the two 9 October
runs within 2% is positive at all 191 epochs from 150 to 340 (smallest
+0.96, mean +3.5 points).

## Why the read-out's β is 1/2 for Gaussian noise {#late-beta-half}

**Claim** (12 October update): for stationary Gaussian noise, a posterior
over templates built from the maximized likelihood has
$\log p \propto \tfrac12 \rho^2$, that is $\beta = 1/2$.

**Derivation.** For whitened data $x$ (white noise of unit variance per
sample) and a signal $A\,h_\phi$ with $h_\phi = \cos\phi\,\hat h_c +
\sin\phi\,\hat h_s$, where $\hat h_c$ and $\hat h_s$ are the template's two
quadratures, orthogonal and of unit norm, the log-likelihood ratio of
signal against noise is

$$
\ln\Lambda(A, \phi) = A\langle x, h_\phi\rangle - \tfrac12 A^2 .
$$

Maximizing over the amplitude gives $A = \langle x, h_\phi\rangle$ and
$\ln\Lambda = \tfrac12\langle x, h_\phi\rangle^2$; maximizing over the phase,
since $\max_\phi(a\cos\phi + b\sin\phi)^2 = a^2 + b^2$,

$$
\ln\Lambda_{\max} = \tfrac12\left(\langle x, \hat h_c\rangle^2 + \langle x, \hat h_s\rangle^2\right) = \tfrac12 \rho^2 ,
$$

with $\rho^2 = |z|^2$ the matched-filter SNR² of the page (Allen et al.
2012, FINDCHIRP, [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116);
Creighton and Anderson 2011, *Gravitational-Wave Physics and Astronomy*,
chapter 7). With independent noise in two detectors the log-likelihoods
add, giving $\tfrac12(\rho_H^2 + \rho_L^2)$. Using
$\ln\Lambda_{\max}$ in Bayes' theorem in place of the likelihood gives
$\log p(g \mid x) = \tfrac12\rho_g^2 + \log(\text{prior}) + \text{const}$,
so $\beta = 1/2$. This holds for the likelihood maximized over amplitude,
phase and arrival time (the network takes the maximum over lags). The
likelihood marginalized over phase or amplitude with a prior is a
different function of $\rho$, and real detector noise is neither
stationary nor Gaussian.

**Check.** A 4 s test chirp (two quadratures from its analytic signal),
injected with random amplitude 5 to 15 and random phase into white Gaussian
noise, three trials: a grid search over 2,001 phases with the best
amplitude at each gave $\max\ln\Lambda$ = 37.8545, 59.8758, 80.7040, equal
to $\rho^2/2$ to the digits shown.

## SNR held by the last 4 s, and its cost in volume {#late-window-volume}

**Claim** (12 October update): the last 4 s hold 74 to 93% of the SNR of
the injection file's 30 s waveforms, which alone costs a factor 1.25 to
2.49 in sensitive volume.

**The fraction.** For one waveform from the injection file at each of the
chirp masses 1.0, 1.2, 1.5, 2.0 and 2.5 M☉ (the nearest among the first
2,000 rows), $h_+$ only, the optimal SNR² in the frequency domain,
$4\sum_f |\tilde h(f)|^2/S(f)\,\Delta f$, over 20 to 1000 Hz with the average
O3a noise spectrum of the template bank, for (a) the whole waveform, which
starts 30.0 s before the merger, and (b) the last 4 s, ending 0.25 s after
the merger. Each segment has a 0.1 s half-Hann taper at its start. The
ratio of SNRs (the square root of the ratio of SNR²) is 0.738, 0.773,
0.828, 0.894 and 0.929; the ratio of SNR² is 0.545 to 0.863.

**The volume.** For sources spread uniformly in volume, the number with SNR
above $\rho$ scales as $\rho^{-3}$ ([derivation](#snr-population); Schutz
2011, [arXiv:1102.5421](https://arxiv.org/abs/1102.5421)). If every
source's SNR is multiplied by $r < 1$, the number above a fixed threshold
$\rho_{\rm th}$ is the number that would have been above $\rho_{\rm th}/r$,
smaller by $r^3$; so the sensitive volume falls by $r^3$. With $r$ = 0.929
to 0.738 the factor $r^{-3}$ is 1.25 to 2.49. This assumes the same SNR
threshold with and without the early inspiral; our volumes are measured at
a fixed false-alarm rate, so it is an estimate of the window's share, not a
measurement.

**Check.** The SNR integrals in Python (numpy FFT, the bank's stored noise
spectrum interpolated to the FFT frequencies); $r^{-3}$ = 2.488, 2.165,
1.762, 1.400, 1.247.

## Guessing from the prior {#late-chance}

**Claims** (12 and 13 October updates): a mass-ratio estimator with a
median error of 0.12 does no better than guessing the prior's median; the
131 free kernels that did not become chirps put 4.2% of events within 1% in
chirp mass, not far above chance.

**Mass ratio.** The injection file's 200,000 mass ratios run from 0.40 to
1.00 with median 0.793. Always guessing 0.793 gives a median absolute error
of 0.121; a guess drawn at random from the same distribution gives 0.153.

**Chirp mass.** The injection file's chirp masses are uniform on
$[a, b] = [0.85, 2.75]$ M☉. A fixed guess $c$ is within 1% of the truth
$t$ when $c/1.01 < t < c/0.99$, which has probability
$c\,(1/0.99 - 1/1.01)/(b - a) = 0.010527\,c$ per M☉ while the interval lies
inside the prior; the best fixed guess, $c = 0.99\,b = 2.72$ M☉, gives
2.87%. A guess drawn at random from the prior is within 1% with
probability $\approx 0.02\,E[t]/(b - a) = 1.89\%$. On the 3,217 signal
windows of the benchmark with uniform SNR 4 to 50, random guesses give
2.0% (standard deviation 0.25 points over 200 shuffles), and the best fixed
guess chosen after the fact gives 3.6%.

**The 131 kernels.** The 13 October network at epoch 141, with its
read-out restricted to the 131 kernels whose best match to any bank
template is below 0.5 (standardization and weights as trained, over those
kernels only), on the same 3,217 windows: 4.2% within 1%. Shuffling these
estimates across events, which keeps their distribution and removes any
link to the event, gives 1.68% (standard deviation 0.21 over 200
shuffles). The binomial spread of 4.2% on 3,217 events is 0.35 points, so
these kernels carry a little chirp-mass information, much less than the
125 chirp-like ones (89.3% within 1% on their own).

**Check.** All in Python on the injection file and the benchmark windows'
parameters; Monte Carlo random guesses on the injection file give 1.90%.
The kernel ablation was re-run on CPU on 14 October from the epoch-141
checkpoint (all 256 kernels: 89.5 / 91.9% within 1 / 2%; the 125
chirp-like ones alone: 89.3 / 91.4%; the 131 others alone: 4.2 / 7.8%).

## The bank's singular-value decomposition {#late-svd}

**Claim** (12 and 13 October updates): 256 basis filters keep at least 94%
of the SNR of 95% of this bank's templates.

**Method.** The 703 whitened, unit-norm complex templates of the bank (H1,
1024 Hz, 2,305 frequency bins) form the rows of a matrix $A$. Its singular-value
decomposition $A = U\Sigma V^\dagger$ gives orthonormal basis filters, the
rows of $V^\dagger$, ordered by how much of the bank they carry (Cannon et
al. 2010, Phys. Rev. D 82, 044025,
[arXiv:1005.0012](https://arxiv.org/abs/1005.0012), who use this to filter
with fewer filters than templates). Keeping the first $K$ rows $P_K$, the
fraction of a template's SNR that the $K$ filters keep is the norm of its
projection, $\lVert P_K a_j\rVert$, for unit-norm $a_j$: a fraction of SNR,
not of SNR².

| $K$ | median template | 5th percentile |
|---|---|---|
| 32 | 0.45 | 0.02 |
| 64 | 0.65 | 0.25 |
| 128 | 0.83 | 0.61 |
| 256 | 0.99 | 0.94 |
| 384 | 1.00 | 1.00 |

**Scope.** This is the linear span of these 703 templates: 4 s windows,
chirp mass 0.85 to 2.74 M☉, mass ratio 0.7 to 0.9, three effective spins.
It says how many linear filters reproduce this bank, not how many a
network with other operations needs.

**Check.** `torch.linalg.svd` in double precision on the bank's
frequency-domain filters (`bank_mc0.5pct_spin3_q0.8.npz`; by Parseval's
theorem the projections are the same as for the time-domain templates), run
on 12 October and re-run on 14 October with the same result: H1 median /
5th percentile 0.447 / 0.021 at $K = 32$, 0.651 / 0.252 at 64, 0.827 /
0.610 at 128, 0.991 / 0.942 at 256, 1.000 / 1.000 at 384; the single worst
template keeps 0.799 at $K = 256$. L1 gives 0.990 / 0.941 at 256.

## Chirp mass from the frequency and its rate of change {#late-chirp-rate}

**Claim** (14 October signal-only update): without noise, chirp mass can be
read from the waveform locally, from its frequency and how fast the
frequency rises.

**Derivation.** To leading (Newtonian) order the gravitational-wave
frequency rises as

$$
\dot f = \frac{96}{5}\,\pi^{8/3} \left(\frac{G\mathcal M}{c^3}\right)^{5/3} f^{11/3}
$$

(Maggiore, *Gravitational Waves*, Vol. 1, Oxford University Press 2008,
chapter 4; Sathyaprakash and Schutz 2009,
[arXiv:0903.0338](https://arxiv.org/abs/0903.0338)). It follows from the
time to merger in [cycles](#cycles) by $\dot f = 3f/(8\tau)$. Solving for
the chirp mass,

$$
\mathcal M = \frac{c^3}{G}\left(\frac{5}{96}\,\pi^{-8/3} f^{-11/3} \dot f\right)^{3/5} ,
$$

so the frequency and its rate of change at any one time fix $\mathcal M$.
Post-Newtonian corrections add a dependence on mass ratio and spin.

**Check.** For 0.85, 1.2 and 2.74 M☉ at 50, 80 and 150 Hz, $\dot f$ from
the formula equals the numerical derivative of $f(\tau)$ (e.g. 7.4663 Hz/s
at 80 Hz for 1.2 M☉), and the inversion returns the input chirp mass to
four decimals.
