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
is $\max_t [E^{\rm H1}(t) + \max_{|\tau| \le 10\,{\rm ms}} E^{\rm L1}(t+\tau)]$.
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
