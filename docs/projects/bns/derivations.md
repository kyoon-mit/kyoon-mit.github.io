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
freedom), the expected maximum is
$2 H_N = 2\sum_{k=1}^N 1/k \approx 2(\ln N + 0.577)$, which is 17.8 for $N = 4096$. Neighbouring outputs of a kernel are
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
frequency 4 s before merger and the cycles after it, and $\tau = 3.5$ s the
same for the last 3.5 s:

<div markdown="1">

| chirp mass | frequency 4 s before merger | cycles in the last 4 s | frequency 3.5 s before merger | cycles in the last 3.5 s |
|---|---|---|---|---|
| 0.85 M☉ | 99 Hz | 636 | 105 Hz | 585 |
| 1.2 M☉ | 80 Hz | 513 | 84 Hz | 472 |
| 1.8 M☉ | 62 Hz | 398 | 65 Hz | 366 |
| 2.75 M☉ | 48 Hz | 305 | 50 Hz | 281 |

</div>

In our 4 s windows the merger falls 3.5 to 4 s after the first sample
([where the merger falls](#oct16-merger-position)), so a window holds the
last 3.5 to 4 s of the chirp. Over 0.85 to 2.75 M☉ the chirp in a window
therefore starts at 48 to 105 Hz and makes 281 to 636 cycles (280 to 636 in
one detector, where the merger can move by a further 21.0 ms). Since
$f \propto \tau^{-3/8}$ and $N \propto \tau^{5/8}$, each 3.5 s frequency is
$(4/3.5)^{3/8} = 1.0513$ times the 4 s one, and each 3.5 s count
$(3.5/4)^{5/8} = 0.9199$ times.

These are leading-order values; post-Newtonian corrections are not included.

**Check.** Python (numpy and scipy), with
$GM_\odot/c^3 = 4.925490947\times10^{-6}$ s ([constants](#ck-chirp)): the
closed form for $N$ and a numerical integral of $f$ over the time before
merger agree to better than $10^{-14}$ (relative). At 4 s, 99.41, 80.14,
62.20 and 47.72 Hz and 636.23, 512.88, 398.07 and 305.43 cycles; at 3.5 s,
104.52, 84.25, 65.39 and 50.17 Hz and 585.29, 471.81, 366.19 and 280.98
cycles. For one detector the count starts at the window's first sample,
3.4795 to 4.0210 s before the merger, and stops at the merger or at the
window's end, whichever comes first: 279.95 cycles at the fewest (2.75 M☉)
and 636.23 at the most (0.85 M☉).

## Where the merger falls in our 4 s windows {#oct16-merger-position}

**Claim** (15 and 16 October updates): in the training, validation and test
windows of our 4 s runs, signal-only and noisy, the merger falls 3.5 to 4 s
after the window's first sample, at one of 1,024 positions, each equally
likely. A window therefore holds the last 3.5 to 4 s of the chirp and up to
0.5 s after the merger. In each detector the merger moves by at most a
further 21.0 ms either way. The merger runs with a time warp use the same
windows, warped up to each detector's amplitude peak; the early runs with a
time warp use windows that end 25.0 to 25.5 s before the merger.

**Setup.** Our training code (built on aframe and ml4gw) cuts every window
the same way.

- The stored waveforms (IMRPhenomPv2, generated with PyCBC) are 32 s long at
  2048 Hz, 65,536 samples, with the coalescence placed 2 s before the end, at
  sample 61,440. That sample is the merger here.
- A window is 4 s of whitened data, 8,192 samples, numbered here from 0; it
  ends 4 s after its first sample, one sample after its last. The whitening
  filter is 1 s long, so the code whitens a 5 s segment (10,240 samples) and
  drops 0.5 s (1,024 samples) at each end.
- The run settings ask for the merger at least 3.5 s after the window's start
  and no later than its end.

**Derivation.** From each stored waveform the code first cuts the 11,264
samples from 9,216 before the merger to 2,048 after it, so that the merger is
sample 9,216 of the cut: $9{,}216 = 10{,}240 - 1{,}024$, the segment less half
the filter (no time is required after the merger), and
$2{,}048 = 10{,}240 - 8{,}192$, the segment less the 3.5 s (7,168 samples)
required before the merger and half the filter. It then takes the 5 s
segment that starts at sample $k$ of this cut, with $k$ drawn with equal
probability from the 1,024 whole numbers 0 to 1,023
($11{,}264 - 10{,}240 = 1{,}024$ choices). The merger is at sample
$9{,}216 - k$ of the segment and, once the first 1,024 samples are dropped,
at sample $8{,}192 - k$ of the window: from sample 7,169, 3.5005 s after the
first, to sample 8,192, one past the last, at the window's end. So the window
ends 0 to 0.4995 s after the merger.

Projecting onto each detector also moves the waveform, by the difference
between the wave's arrival at the detector and at the Earth's centre for the
source's direction, cut to whole samples toward zero. That difference is at
most the detector's distance from the Earth's centre over $c$, 21.24 ms for
H1 and 21.26 ms for L1, so the shift is at most 43 samples (21.0 ms): in
each detector the merger falls 3.4795 to 4.0210 s after the first sample.
When it falls after the window's end, the window misses at most the last
21.0 ms of that detector's chirp.

The signal-only runs read the whitened signal alone, the noisy runs the same
signal added to real noise before whitening, and their validation and test
windows are made by the same code. The merger runs with a time warp take the
same window and resample it, from its first sample up to $t_c$, on a grid
uniform in $(t_c - t)^{5/8}$ ([time warp](#time-warp)), with $t_c$ the peak
of each detector's whitened amplitude (the size of the analytic signal), so
their input ends at that peak. In each of the first batches logged by three
of these runs, the peak lay a median of 10.7 to 12.2 ms from the merger
placed as above, and at most 35 to 63 ms. The early runs with a time warp
move the cut 25.5 s (52,224 samples) earlier: the window then starts
29.0005 to 29.5 s and ends 25.0005 to 25.5 s before the merger. The stored
waveforms start 30 s before the merger, so this is the earliest window they
allow.

**Check.** Python, with the training code's own functions (its cut of the
stored waveforms, and ml4gw's choice of segment, detector shift and
whitening): each stored waveform was replaced by the numbers 0, 1, 2, …, so
that every window sample shows which stored sample it came from. The segment
choice drew all 1,024 values of $k$ in 20,000 draws, and over these values
the merger falls at window samples 7,169 to 8,192 (3.500488 to 4.000000 s,
mean 3.750244 s). The detector shift equals the arrival-time difference cut
toward zero (tested on 4,096 directions) and reached 43 samples either way;
over 4,000,000 directions drawn as in training, the merger fell 3.479492 to
4.020996 s after the first sample in a detector, and after the window's end
in 1.04% of detector windows, the share computed exactly for directions
spread evenly over the sky. With the early runs' cut it fell 29.000488 to
29.500000 s after the first sample. A single nonzero sample, whitened with
the 1 s filter and the 20 Hz highpass, peaks at its own position less 1,024,
with a flat noise spectrum and with a steeply varying one. In 192 stored
waveforms (three blocks of 64, chirp masses 0.87 to 2.75 M☉), the amplitude
$\sqrt{h_+^2 + h_\times^2}$ peaks 4 to 23 samples (2.0 to 11.2 ms) before
the merger sample, and around the merger sample the median of eight
successive phase steps gives a frequency of 963 to 1024 Hz, close to the
1024 Hz Nyquist frequency of the stored data.

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

**Tone $n$ lasts $n$ cycles.** Multiplying the two, $f_n T_n = n$: in S4D-Lin,
tone $n$ completes exactly $n$ cycles while its amplitude falls by $e$. A tone
above 20 Hz that lasts 1 s needs $n \ge 20$, and one that lasts 4 s needs
$n \ge 80$; a channel of 32 tones ($N = 64$) that lasts 1 s reaches 31 Hz at
most. Covering 20 Hz to $f_{\max}$ with tones that last $T$ needs a spacing of
at most $1/T$, so about $f_{\max} T$ tones per channel: 512 for 512 Hz and
1 s, 2,048 for 4 s.

**How many tones start usable.** With $\Delta t$ log-uniform between
$10^{-4}$ and 10 (the den-reg's range), the fraction of tones that start in
band (20 Hz to $f_s/2$, not aliased) and last over 1 s is 0.76% for 32 tones
per channel at 2048 Hz (the den-reg) and 14% for 256 tones per channel at
1024 Hz (4.2% for over 4 s). After 200 epochs the 256-tone network had 7%
([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).

**Check.** Python: the frequency and memory above applied to the ml4gw
initialization (`log_A_real = ln 0.5`, `A_imag = pi * n`, `log_dt` uniform in
$[\ln 10^{-4}, \ln 10]$); an exact integral over $\Delta t$ on a
200,001-point grid gave 0.76% and 14.1%, and a Monte Carlo over 4,000 channels
gave 0.7% to 0.9% and 13.8%.

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

(Corrected 16 October: the matrix-pencil column below is limited by how this
fit reflects growing poles inside the unit circle, not by decaying tones as
such. Directly optimized decaying tones reach far higher matches, with a
minimum count of about 3/8 of the chirp's cycles; see
[fitting resonators to chirp kernels](#oct16-s4d-fits).)

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
$y$ given $x$, $f^\*(x) = E[y \mid x]$ (Goodfellow, Bengio and Courville,
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
$(\Gamma^{-1})\_{ii}$ (Cutler and Flanagan 1994,
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

**Setup.** One diagonal state, $x^\prime(t) = a\,x(t) + B\,u(t)$, $y = C\,x$, with
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
$(GM)^{\rm N}\_\odot = 1.3271244 \times 10^{20}$ m³ s⁻², exact by definition
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
Fourier tones keeps the $k$ strongest, with match
$\sqrt{\sum_{\rm strongest\ k}\lvert\hat h_q\rvert^2/\sum_q\lvert\hat h_q\rvert^2}$; the tone counts in
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

## Adding power instead of amplitude: the $N^{1/4}$ loss {#semi-coherent}

**Claim** (slides, 14 October): at SNR 8, spread over about 600 cycles, each
cycle carries an SNR of about 0.3; adding the cycles in step gives back 8,
while adding their powers grows only like $N^{1/4}$.

**Derivation.** Split the matched filter's sum into $N$ pieces that do not
overlap, with SNRs $\rho_k$ and $\sum_k \rho_k^2 = \rho^2$. If the signal is
spread evenly, $\rho_k = \rho/\sqrt N$, which is $8/\sqrt{600} = 0.33$. Each
piece's output is $z_k = \rho_k + n_k$ with independent unit-variance noise
$n_k$. Added in step ([coherent addition](#ck-coherent)) and divided by
$\sqrt N$, the signal parts give $\sum_k \rho_k/\sqrt N = \rho$ against unit
noise. Added
as powers, $P = \sum_k z_k^2$ has mean $N + \rho^2$ and, in noise alone,
standard deviation $\sqrt{2N}$, so the signal stands out by $\rho^2/\sqrt{2N}$. To stand out
by a fixed amount the SNR must grow like $N^{1/4}$: with 600 pieces, about
$(2 \cdot 600)^{1/4} \approx 6$ times the SNR is needed for the same
significance as one standard deviation in the coherent sum. An even nonlinearity
applied to the pieces before they are added (a square, an absolute value)
turns the sum into this kind. (Corrected 16 October: an earlier version also
listed a threshold and a GELU. A GELU and a threshold at zero are not even:
they keep a part linear in a weak signal, the GELU with gain 1/2
([GELU section](#oct16-s4d-gelu-linear)), and pieces added in step after
them keep, to first order, the fraction 0.838 to 0.910 of the SNR (GELU,
noise spreads 0.5 to 2) or 0.798 (threshold at zero). For the 600 pieces
above at SNR 8 the exact SNR of the sum is 7.737 after a GELU and 6.271
after a threshold at zero, against 8 without them and 1.848 after a square
([section on nonlinear functions](#oct16-nonlinearity-linear-part)). A
threshold on the size $\lvert z_k\rvert$ is even and does turn the sum into
this kind.)

**Source.** The same scaling is the standard result for searches that stack
power from $N$ segments, for example Brady and Creighton 2000, Phys. Rev. D
61, 082001, [arXiv:gr-qc/9812014](https://arxiv.org/abs/gr-qc/9812014). The
signal per sample is about 0.09 of the noise at SNR 8 ([signal per
sample](#proj-per-sample)).

## A time warp that turns a chirp into a tone {#time-warp}

**Claim** (slides, 14 October): in the warped time $\tau = (t_c - t)^{5/8}$ the
leading-order chirp is a tone whose frequency scales as $\mathcal
M^{-5/8}$; the warp needs the merger time $t_c$ but not the chirp mass.

**Derivation.** At leading order the gravitational-wave phase is
([Newtonian chirp](#oct7-chirp-kernels))

$$
\Phi(t) = \Phi_c - 2\left(\frac{c^3\,(t_c - t)}{5\,G\mathcal M}\right)^{5/8} .
$$

With $\tau = (t_c - t)^{5/8}$ this is $\Phi = \Phi_c - 2\,(5G\mathcal
M/c^3)^{-5/8}\,\tau$: linear in $\tau$, so the frequency in $\tau$ is constant
and proportional to $\mathcal M^{-5/8}$. The amplitude, proportional to
$(t_c - t)^{-1/4}$, becomes $\tau^{-2/5}$. The chirp mass appears only in the
tone's frequency, so one warp serves every chirp mass.

**Measurement** (offline, no noise). Fourier tones needed for a match of 0.9
([definition](#ck-fourier-tones)), counted on a uniform grid in $\tau$:

| signals | before the warp | after the warp |
|---|---|---|
| Newtonian chirps of the 7 October set | 476 to 744 | 3 to 6 |
| four whitened training templates, $t_c$ fitted, up to 300 Hz | 533 to 1,184 | 2 to 7 |
| the same, $t_c$ at the amplitude peak, up to 900 Hz | 533 to 1,184 | 34 to 63 |

The templates are rows of our training file with detector-frame chirp masses
1.00, 1.20, 1.50 and 2.00 M☉, whitened with the average noise spectrum of our
training windows.

**Check.** Python: band-limited interpolation (FFT upsampling by 32, then a
cubic spline; relative error $10^{-8}$ against the exact trigonometric sum),
8,192 points in $\tau$ with at least 7 points per cycle; the Newtonian counts
before the warp reproduce the 7 October values exactly.

**Caveats.** After the warp the noise is no longer the same at every point:
its density grows with the frequency the signal had there (3.75 times higher
at 300 Hz than at 80 Hz), so a filter in $\tau$ needs weighting. $t_c$ must be
known to a few milliseconds (an error of 5 ms doubles to quadruples the count).
Higher post-Newtonian terms leave a drift: the fitted effective $t_c$ sits
about 19 ms after the peak, and the frequency in $\tau$ still drifts by 0.5% to
1% up to 300 Hz and 5% to 6% up to 900 Hz. Not yet tried in training.

## Adding in step, and what a steady phase drift leaves {#oct15-phase-drift}

**Claim** (15 October update): if the parts of a sum that should add in step
drift steadily out of step, by $k$ cycles from the first part to the last,
the sum keeps the fraction $|\sin(\pi k)/(\pi k)|$ of its full size: 0.90 for
a quarter cycle, 0.64 for half a cycle, 0 for a whole cycle. A frequency
error $\delta f$ held for a time $T$ is such a drift, with $k = \delta f\,T$;
over 4 s, an error of 0.0625 Hz costs 10% of the sum and 0.25 Hz costs all of
it. As a function of $\delta f$ the kept fraction has one central peak, of
half-width $1/T$, and side peaks no higher than 0.217. For comparison, at SNR
8 spread over 600 pieces, adding the pieces' powers instead of the pieces
leaves the signal 1.85 standard deviations above the noise, against 8.

**Setup.** Take $M$ parts of equal size whose phases should agree. Let the
$j$-th part have the phase error $2\pi k\,x_j$, with $x_j = (j + \tfrac12)/M$,
$j = 0, \dots, M-1$, so the error grows evenly from 0 to $k$ cycles. In step
($k = 0$) the parts add to $M$ times one part.

**Derivation.** Relative to its in-step value, the sum is
$\frac1M\sum_j e^{2\pi i k x_j}$. For many parts this is the integral

$$
\int_0^1 e^{2\pi i k x}\,dx = \frac{e^{2\pi i k} - 1}{2\pi i k}
= e^{i\pi k}\,\frac{\sin \pi k}{\pi k},
$$

whose size is $|\sin(\pi k)/(\pi k)|$. For $k = \tfrac14$ this is
$(\sqrt2/2)/(\pi/4) = 2\sqrt2/\pi = 0.900$; for $k = \tfrac12$, $2/\pi = 0.637$;
for $k = 1$, $0$. In a phasor diagram the parts are arrows that should all
point one way; a steady drift bends them into an arc of $k$ turns, and a
whole turn closes into a circle whose arrows add to nothing. For finite $M$
the exact sum is $|\sin(\pi k)/(M\sin(\pi k/M))|$, which tends to the
integral as $M$ grows.

A reference at frequency $f + \delta f$, compared with a signal at $f$, gains
phase on it at the rate $2\pi\,\delta f$, so over a time $T$ the error grows
steadily from 0 to $k = \delta f\,T$ cycles. Keeping 0.90 of the sum over $T$
needs $|\delta f| \le 1/(4T)$, which is 0.0625 Hz for $T = 4$ s; at $|\delta
f| = 1/T = 0.25$ Hz nothing is kept. As a function of $\delta f$, the kept
fraction $|\sin(\pi\,\delta f\,T)/(\pi\,\delta f\,T)|$ is 1 at $\delta f =
0$, falls to 0 at $|\delta f| = 1/T$, and beyond that rises and falls in side
peaks, the largest of which is 0.217, at $k = 1.43$.

This assumes equal parts. A chirp grows louder toward the merger, so its
parts are not equal and the kept fractions differ from these; the even case
is the simple guide.

**Adding powers instead.** With the notation of the
[$N^{1/4}$ section](#semi-coherent), a signal of SNR $\rho$ spread evenly over
$N$ pieces gives each piece the SNR $\rho/\sqrt N$, 0.33 for $\rho = 8$ and
$N = 600$. Added in step, the signal parts total $\sqrt N\,\rho = 196$ against
noise of spread $\sqrt N = 24.5$: the ratio is $\rho = 8$. Added as squares,
the signal raises the total by $\rho^2 = 64$ against a noise spread of
$\sqrt{2N} = 34.6$, so it stands out by $\rho^2/\sqrt{2N} = 1.85$ standard
deviations.

**Check.** numpy: the mean of $e^{2\pi i k x}$ over $10^6$ evenly spaced
points in $[0, 1]$ gives 0.90032, 0.63662 and 0.00000 for $k = \tfrac14,
\tfrac12, 1$, equal to $|\sin(\pi k)/(\pi k)|$; the discrete sum over 600
parts gives the same to five decimals; the largest side peak, found on a
grid of $2 \times 10^6$ points in $1 < k \le 2$, is 0.2172 at $k = 1.4303$.
A Monte Carlo with 20,000 trials of 600 unit-variance Gaussian pieces at
SNR 8 gave 1.851 standard deviations for the sum of squares and 8.01 for
the in-step sum.

## One S4D state is a damped, driven oscillator {#oct15-oscillator}

**Claim** (15 October update): the S4D state equation
$\dot x = (-a + i\omega)x + u$, one complex equation of first order, is the
equation of a damped harmonic oscillator driven by $\dot u + a u$: with
$x = p + iq$,

$$
\ddot p + 2a\,\dot p + (a^2 + \omega^2)\,p = \dot u + a\,u .
$$

The output of an S4D channel compares the recent input with one fixed shape,
a sum of decaying waves that all start at the present.

**Setup.** One state of an S4D layer obeys $\dot x(t) = A\,x(t) + B\,u(t)$ with
complex $A = -a + i\omega$, $a > 0$, and real input $u(t)$ (Gu, Gupta, Goel
and Ré 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893), section 3).
In ml4gw, which we use, $B$ is absorbed into the output weights ($B = 1$
here), and the real part of $A$ is stored as minus an exponential
(`log_A_real`), so it is negative by construction. A channel with state size $N$ keeps $N/2$ such states and
outputs $y(t) = 2\,\mathrm{Re}\sum_n C_n x_n(t) + D\,u(t)$, with complex $C_n$
and real $D$ ([S4D in samples](#ck-s4d-step)).

**Derivation.** With $x = p + iq$, $p$ and $q$ real, the real and imaginary
parts of the equation are

$$
\dot p = -a\,p - \omega\,q + u, \qquad \dot q = \omega\,p - a\,q .
$$

Differentiating the first and inserting the second,
$\ddot p = -a\dot p - \omega\dot q + \dot u = -a\dot p - \omega^2 p + a\omega q + \dot u$.
The first equation gives $\omega q = -\dot p - a p + u$, so
$a\omega q = -a\dot p - a^2 p + a u$, and

$$
\ddot p + 2a\,\dot p + (a^2 + \omega^2)\,p = \dot u + a\,u .
$$

This is a mass on a spring with friction and a driving force: damping rate
$a$ (the free amplitude falls by $e$ in a time $1/a$), natural angular
frequency $\omega_0 = \sqrt{a^2 + \omega^2}$, and free oscillation at
$\sqrt{\omega_0^2 - a^2} = \omega$, since the roots of $s^2 + 2as + a^2 +
\omega^2$ are $s = -a \pm i\omega$. The force is the input's rate of change
plus $a$ times the input. The pair $(p, q)$ plays the part of position and
scaled momentum, as Hamilton's two first-order equations for a mass on a
spring, $\dot x = p/m$ and $\dot p = -kx$, together give Newton's $m\ddot x =
-kx$; the complex $x$ is the phasor of the oscillation.

**The response, and the output.** For a kick at $t = 0$, $u(t) = \delta(t)$,
with $x = 0$ before it, the state rings as $x(t) = e^{(-a + i\omega)t}$ for
$t > 0$. The equation is linear, so the response to any input is the sum of
the responses to the kicks that make it up:

$$
x(t) = \int_0^\infty e^{(-a + i\omega)s}\,u(t - s)\,ds ,
$$

and the channel's output is

$$
y(t) = \int_0^\infty K(s)\,u(t - s)\,ds + D\,u(t), \qquad
K(s) = 2\,\mathrm{Re}\sum_n C_n e^{(-a_n + i\omega_n)s}
= \sum_n 2|C_n|\,e^{-a_n s}\cos(\omega_n s + \arg C_n) .
$$

The input $s$ seconds ago is multiplied by $K(s)$ and the products are added:
a comparison of the recent past with one fixed shape, read backwards from
the present. Every term of $K$ starts at $s = 0$ and only decays. Once
training is over, every $a_n$, $\omega_n$ and $C_n$ is a fixed number, the
same at every moment and for every input ([input-dependent
steps](#early-mamba-step)). The sampled form, with the zero-order hold, is
in [S4D in samples](#ck-s4d-step).

**Check.** sympy: substituting the two real equations into
$\ddot p + 2a\dot p + (a^2 + \omega^2)p - (\dot u + a u)$ gives 0
identically, and the roots of $s^2 + 2as + a^2 + \omega^2$ come out as
$-a \pm i\omega$. numpy: integrating
$\dot x = (-a + i\omega)x + u$ exactly for an input held constant over steps
of 1 µs ($a = 3$ s⁻¹, $\omega = 2\pi \times 40$ rad/s, a 25 Hz input with a
Gaussian envelope, 0.2 s), then inserting $p = \mathrm{Re}\,x$ into the
second-order equation with finite differences, leaves a largest residual of
$1.06 \times 10^{-4}$ of the largest right-hand side.

## How long a chirp stays in step with one fixed frequency {#oct15-in-step-time}

**Claim** (15 October update): a chirp that passes the frequency $f$ stays
within an eighth of a cycle of a steady wave at $f$ for a time $\dot f^{-1/2}$,
centred on the moment it passes $f$. For chirp mass 1.2 M☉ this is 0.87 s at
50 Hz, 0.24 s at 100 Hz and 0.032 s at 300 Hz. Within that time the steady
wave keeps 97% of the in-step sum; over twice that time, 59 to 63%. However
long the steady wave lasts, its total overlap with the chirp is never more
than that of a perfectly in-step stretch $1.34\,\dot f^{-1/2}$ long.

**Derivation.** Let the chirp pass $f_0$ at time $t_0$. Its phase advances at
$\dot\Phi = 2\pi f$, so $\ddot\Phi = 2\pi\dot f$, and near $t_0$

$$
\Phi(t_0 + s) = \Phi(t_0) + 2\pi f_0\,s + \pi\dot f\,s^2 + O(s^3) .
$$

A steady wave at $f_0$, in step with the chirp at $t_0$, has the phase
$\Phi(t_0) + 2\pi f_0\,s$. The two differ by $\pi\dot f s^2$, which is at
most an eighth of a cycle, $\pi/4$, for $|s| \le \tfrac12\dot f^{-1/2}$: a
total time

$$
T_{\rm step} = \dot f^{-1/2} .
$$

At leading order ([chirp mass from the frequency](#late-chirp-rate);
[Newtonian chirp](#ck-chirp))

$$
\dot f = \frac{96}{5}\,\pi^{8/3}\left(\frac{G\mathcal M}{c^3}\right)^{5/3} f^{11/3},
$$

so $T_{\rm step}$ falls as $f^{-11/6}$ and as $\mathcal M^{-5/6}$:

<div markdown="1">

| chirp mass | 50 Hz | 100 Hz | 300 Hz |
|---|---|---|---|
| 0.85 M☉ | $\dot f$ = 0.75 Hz/s, 1.15 s | 9.52 Hz/s, 0.324 s | 535 Hz/s, 0.0432 s |
| 1.2 M☉ | 1.33 Hz/s, 0.866 s | 16.9 Hz/s, 0.243 s | 950 Hz/s, 0.0324 s |
| 2.75 M☉ | 5.31 Hz/s, 0.434 s | 67.4 Hz/s, 0.122 s | 3,785 Hz/s, 0.0163 s |

</div>

In our 4 s windows the chirp starts at 48 to 105 Hz ([cycles](#cycles)); it
passes 50 Hz inside the window only for chirp masses above 2.55 M☉.

**What the steady wave keeps.** With the chirp's amplitude taken as constant
over the interval and $v = s\,\dot f^{1/2}$, the in-step sum relative to its
full value is the mean of $e^{i\pi v^2}$. Over $|v| \le \tfrac12$ (the time
$T_{\rm step}$) it is $\left|\int_{-1/2}^{1/2} e^{i\pi v^2}\,dv\right| = 0.973$,
and over $|v| \le 1$ (twice the time) $\left|\tfrac12\int_{-1}^{1} e^{i\pi
v^2}\,dv\right| = 0.628$. The total overlap, $\left|\int_{-V}^{V} e^{i\pi
v^2}\,dv\right|$ in units of $T_{\rm step}$, is a Fresnel integral: it is
largest, 1.34, for $V = 0.855$, and tends to 1 as $V$ grows, since
$\int_{-\infty}^{\infty} e^{i\pi v^2}\,dv = e^{i\pi/4}$. A steady wave longer
than $1.71\,T_{\rm step}$ (that is, $V > 0.855$) therefore adds nothing more:
away from $t_0$ it goes in and out of step with the chirp, and its total
overlap settles toward 1.

**Check.** numpy: for chirp masses 0.85, 1.2 and 2.75 M☉ and 50, 100 and 300
Hz, the exact leading-order phase was compared with the tangent steady wave
on 600,001 points; the interval where the two differ by at most $\pi/4$ has
length $\dot f^{-1/2}$ to within 0.04%. The kept fraction inside it is 0.9729
in every case; over twice the time it is 0.593 to 0.628 with the exact phase
(the $s^3$ term lowers it most for heavy systems at high frequency) and 0.628
with the quadratic phase alone. The largest total overlap, 1.342 at $V =
0.855$, was found on a grid of 2,951 values of $V$ from 0.05 to 3, and the
overlap is 0.989 at $V = 20$. The chirp mass whose 4 s window starts at 50 Hz,
$1.2 \times (80.14/50)^{8/5} = 2.552$ M☉, returns 50.000 Hz from the
leading-order $f(\tau)$.

## Leftover cycles after heterodyning with a wrong chirp mass, and with a grid {#oct15-het-grid}

**Claim** (15 October update): over chirp masses 0.85 to 2.75 M☉ and the
last 3.5 to 4 s before the merger, the stretch of chirp our windows hold
([where the merger falls](#oct16-merger-position)), heterodyning with a chirp mass wrong by
0.1, 1, 2, 5 and 10% leaves 0.18 to 0.40, 1.75 to 3.98, 3.50 to 7.98, 8.70
to 20.07 and 17.25 to 40.55 cycles. The leftover is itself a chirp, with
$\tfrac58|\epsilon|$ times the frequency of the original to first order.
Heterodyning at the nearest of ten chirp masses spaced evenly in log over 0.85
to 2.75 M☉ leaves at most 23 to 25 cycles (median 8 to 9); at the nearest of
the 100 masses of the AFRAME BNS grid (1.0 to 2.5 M☉), at most 1.5 to 1.6.

**Setup.** As in [residual phase after heterodyning](#sep-het-phase). At
leading order the phase a binary accumulates from a time $\tau$ before the
merger to the merger is $|\Phi(\tau)| = 2\left(c^3\tau/(5G\mathcal
M)\right)^{5/8}$ ([Newtonian chirp](#ck-chirp)), $2\pi$ times the cycles $N$
of the [cycles table](#cycles) at $\tau = 4$ s. Heterodyning with an assumed
chirp mass $\tilde{\mathcal M}$ multiplies the data by
$e^{-i\Phi(\tau;\tilde{\mathcal M})}$; our heterodyne does this in the
frequency domain, which at leading order leaves the same phase
([residual phase](#sep-het-phase)). The error $\epsilon$ is defined by
$\mathcal M = \tilde{\mathcal M}(1 + \epsilon)$, and the two chirps are
aligned at the merger.

**Derivation.** At fixed $\tau$, $\lvert\Phi\rvert \propto \mathcal M^{-5/8}$, so
$\lvert\Phi(\tau;\tilde{\mathcal M})\rvert = (1 + \epsilon)^{5/8}\lvert\Phi(\tau;\mathcal
M)\rvert$ and the leftover phase has the size

$$
\left|1 - (1 + \epsilon)^{5/8}\right|\,|\Phi(\tau;\mathcal M)|
\approx \tfrac58\,|\epsilon|\,|\Phi(\tau;\mathcal M)| .
$$

It grows with $\tau$, so it is largest at the start of the window, where in
cycles it is $N\,|1 - (1 + \epsilon)^{5/8}|$, with $N$ the true signal's
cycles in the window: from 281 (2.75 M☉, 3.5 s) to 636 (0.85 M☉, 4 s). Its
rate of change is $|1 - (1 + \epsilon)^{5/8}|$ times the chirp's, $2\pi f$, so
the leftover is a chirp $\tfrac58|\epsilon|$ times slower: 0.00624 to 0.00626
of the chirp's frequency for $\epsilon = \pm 1\%$, 0.0614 to 0.0637 for $\pm
10\%$.

<div markdown="1">

| error $\lvert\epsilon\rvert$ | leftover cycles | leftover radians |
|---|---|---|
| 0.1% | 0.18 to 0.40 | 1.1 to 2.5 |
| 1% | 1.75 to 3.98 | 11.0 to 25.0 |
| 2% | 3.50 to 7.98 | 22.0 to 50.2 |
| 5% | 8.70 to 20.07 | 54.7 to 126.1 |
| 10% | 17.25 to 40.55 | 108.4 to 254.8 |

</div>

Ranges over chirp masses 0.85 to 2.75 M☉, the last 3.5 and 4 s, and both
signs of $\epsilon$. With the error measured the other way, $\tilde{\mathcal
M} = \mathcal M(1 + \epsilon)$, the rows for 0.1% to 2% change by at most 0.1
cycles, and the 5% and 10% rows become 8.44 to 20.73 and 16.25 to 43.31
cycles.

**Grids.** For $n$ chirp masses spaced evenly in log from $\mathcal M_{\rm lo}$
to $\mathcal M_{\rm hi}$, neighbours differ by the factor $r = (\mathcal M_{\rm
hi}/\mathcal M_{\rm lo})^{1/(n-1)}$, and every chirp mass in the range is
within a factor $\sqrt r$ of a grid mass. Taking the nearest grid mass (in
log) as $\tilde{\mathcal M}$, the leftover over chirp masses spaced evenly in
log over the grid's range is:

<div markdown="1">

| grid | neighbour ratio | largest error | leftover, worst | leftover, median |
|---|---|---|---|---|
| 10 masses, 0.85 to 2.75 M☉ | 1.1394 | 6.74% | 23.4 / 25.4 | 8.1 / 8.8 |
| 10 masses, 1.0 to 2.5 M☉ | 1.1072 | 5.22% | 16.5 / 18.0 | 6.2 / 6.8 |
| 100 masses, 1.0 to 2.5 M☉ | 1.0093 | 0.46% | 1.5 / 1.6 | 0.6 / 0.6 |

</div>

Cycles for the last 3.5 / 4 s before the merger. The last row is the grid of the AFRAME BNS
search ([how much phase heterodyning leaves](#proj-heterodyne)).

**Limits.** This compares chirps aligned at the merger, at leading order. A
network can also shift the merger time and the phase, which absorbs part of
the leftover ([Newtonian chirp](#ck-chirp)), and post-Newtonian terms, which
heterodyning at leading order does not remove, add to it.

**Check.** numpy: the closed form and the difference of the two phases, each
computed from the leading-order formula, agree to $10^{-10}$ (relative) on
4,001 chirp masses spaced evenly in log over 0.85 to 2.75 M☉, for the last
3.5 and 4 s before the merger and both signs of $\epsilon$; the leftover grows monotonically
toward the start of the window; grids built with `numpy.geomspace` give the
neighbour ratio 1.009298 of the [100-mass grid](#proj-heterodyne). The 0.1%
and 2% rows agree with [residual phase after heterodyning](#sep-het-phase)
(1.1 to 2.5 rad and 22 to 50 rad).

## How many of the 100 grid masses a first estimate leaves {#oct15-grid-count}

**Claim** (15 October update): a chirp-mass estimate good to ±5% leaves 10 to
11 of the 100 masses of the AFRAME BNS heterodyne grid as candidates; one good
to ±10% leaves 21 to 22.

**Derivation.** The grid has 100 masses spaced evenly in log from 1.0 to 2.5
M☉ ([how much phase heterodyning leaves](#proj-heterodyne)), so neighbours
differ by $\ln 2.5/99$ in $\ln\mathcal M$. The interval from $\hat{\mathcal
M}(1 - e)$ to $\hat{\mathcal M}(1 + e)$ around an estimate $\hat{\mathcal M}$
spans $\ln\frac{1+e}{1-e}$ in $\ln\mathcal M$, which is

$$
L = \frac{99\,\ln\frac{1+e}{1-e}}{\ln 2.5}
$$

grid spacings: 10.81 for $e = 5\%$ and 21.68 for $e = 10\%$. An interval $L$
spacings long, $L$ not an integer, holds either the integer below $L$ or the
one above it, depending on where it falls: 10 or 11, and 21 or 22. This holds
while the whole interval lies inside the grid, $\hat{\mathcal M}(1 - e) \ge
1.0$ M☉ and $\hat{\mathcal M}(1 + e) \le 2.5$ M☉. The interval for the true
chirp mass given the estimate, from $\hat{\mathcal M}/(1+e)$ to
$\hat{\mathcal M}/(1-e)$, has the same width in log, so the count is the same.

**Check.** numpy: for 20,001 estimates evenly spaced from 1.15 to 2.2 M☉
(inside the grid for both values of $e$), counting the grid masses inside
$[\hat{\mathcal M}(1 - e), \hat{\mathcal M}(1 + e)]$ gives 10 to 11 for $e =
5\%$ and 21 to 22 for $e = 10\%$.

## Heterodyning at the worst errors of the ten-mass grid {#oct15-het-grid-worst}

**Claim** (15 October update, section 8, rebuttal and verdict, revised on 16
October): on the grid of ten chirp masses spaced evenly in log over 0.85 to
2.75 M☉, the worst errors are a true chirp mass 6.74% above or 6.31% below
the nearest grid mass. Heterodyning there leaves a chirp with 4.0 to 4.2% of
the original's frequency and sweep, which stays in step with a fixed wave
4.9 to 5.0 times longer. The four leading-order chirps of the 7 October set
then need 21 to 34 Fourier tones for a match of 0.9, against 476 to 744
before heterodyning, and 3 to 7 at an error of 1%. At 1.2 M☉, while the
chirp rises from 80 to 512 Hz, the leftover stays between 3.2 and 21 Hz; in
the standard start, a channel of 32 oscillators lasting 1 s spans 0 to 31
Hz.

**Setup.** As in [leftover cycles after heterodyning](#oct15-het-grid):
leading order, the two chirps aligned at the merger, the true chirp mass
$\mathcal M = \tilde{\mathcal M}(1 + \epsilon)$ for the assumed one
$\tilde{\mathcal M}$, and the nearest grid mass taken in log. The ten masses
span the chirp-mass range of our training waveforms ([prior](#sep-prior)).
They are our example, not the grid of the AFRAME BNS search, which has 100
masses from 1.0 to 2.5 M☉ ([how much phase heterodyning
leaves](#proj-heterodyne)).

**Derivation.** Neighbouring grid masses differ by the factor $r =
(2.75/0.85)^{1/9} = 1.13935$, so the nearest one in log is never more than a
factor $\sqrt r = 1.06740$ away. A true chirp mass $\sqrt r$ times a grid
mass has $\epsilon = \sqrt r - 1 = +6.740\%$; one $1/\sqrt r$ times the next
grid mass up has $\epsilon = 1/\sqrt r - 1 = -6.315\%$. These are the worst
errors above and below.

At a fixed time $\tau$ before the merger, $\lvert\Phi(\tau;\mathcal
M)\rvert \propto \mathcal M^{-5/8}$ ([Newtonian chirp](#ck-chirp)), so the
leftover phase is exactly

$$
\Phi(\tau;\mathcal M) - \Phi(\tau;\tilde{\mathcal M}) = \left[1 - (1 + \epsilon)^{5/8}\right]\Phi(\tau;\mathcal M) ,
$$

the chirp's own phase times a constant. Its frequency and its sweep (the
rate $\dot f$ at which the frequency rises) are therefore the chirp's times

$$
q = \left|1 - (1 + \epsilon)^{5/8}\right|
$$

at every moment: $q = 4.161\%$ for $\epsilon = +6.740\%$ and $3.995\%$ for
$\epsilon = -6.315\%$ (the first-order value $\tfrac58\lvert\epsilon\rvert$
gives 4.213% and 3.947%). A chirp stays in step with a fixed wave for
$\dot f^{-1/2}$ ([in-step time](#oct15-in-step-time)); the leftover, whose
sweep is $q\dot f$, does so for $(q\dot f)^{-1/2}$, which is $q^{-1/2}$ =
4.902 and 5.003 times as long as the chirp at the same moment.

At 1.2 M☉ the chirp enters the 4 s window at 80.14 Hz ([cycles](#cycles)).
While it rises from there to 512 Hz, the leftover rises from 3.335 to 21.30
Hz for $\epsilon = +6.740\%$ and from 3.201 to 20.45 Hz for
$\epsilon = -6.315\%$, so it stays between 3.2 and 21 Hz. In the standard
start, a channel of 32 oscillators that last 1 s has them at 0, 1, 2, …, 31
Hz ([S4D tones](#s4d-tones)).

**Fourier tones.** Counted as in [keeping the strongest Fourier
tones](#ck-fourier-tones): the complex signal $\mathcal A e^{i\psi}$, 4 s at
2048 Hz with the merger at the end, amplitude $\propto \tau^{-1/4}$ while
the chirp is between 20 and 900 Hz and zero otherwise, and the fewest tones
that keep 81% of the power (a match of 0.9). Before heterodyning $\psi$ is
the chirp's phase, after it the leftover phase:

<div markdown="1">

| chirp mass | before heterodyning | $\epsilon = +6.740\%$ | $\epsilon = -6.315\%$ | $\epsilon = +1\%$ or $-1\%$ |
|---|---|---|---|---|
| 1.0 M☉ | 744 | 34 | 33 | 7 |
| 1.4 M☉ | 630 | 29 | 28 | 5 |
| 1.8 M☉ | 557 | 26 | 26 | 6 |
| 2.4 M☉ | 476 | 23 | 21 | 3 |

</div>

So 21 to 34 tones at the grid's worst errors, and 3 to 7 at an error of 1%,
where both signs give the same count. The first version of the rebuttal
also took $\epsilon = -6.740\%$, which no chirp mass in the grid's range
reaches, since none is more than 6.315% below its nearest grid mass; there
$q = 4.27\%$ and the counts are 34, 30, 27 and 23.

**Limits.** Those of [leftover cycles after heterodyning](#oct15-het-grid):
leading order only, and chirps aligned at the merger.

**Check.** numpy: a scan of 400,001 true chirp masses spaced evenly in log
over 0.85 to 2.75 M☉, each heterodyned at its nearest grid mass in log (grid
from `numpy.geomspace`), gives errors from $-6.3147\%$ to $+6.7403\%$ and a
largest $q$ of 4.1610%. On 200,001 times from 0.03 to 4 s before the merger,
finite differences of the leftover phase give 0.041610 and 0.039948 times
the chirp's frequency at every time, for 0.85, 1.2 and 2.75 M☉, and a sweep
within 0.1% of $q\dot f$. On the exact leading-order phase at 1.2 M☉, the
time for which the leftover stays within an eighth of a cycle of a fixed
wave, centred 0.5, 1, 2, 3 and 4 s before the merger, is 4.898 to 4.901
times the chirp's for $\epsilon = +6.740\%$ and 4.999 to 5.002 times for
$\epsilon = -6.315\%$. The counting code reproduces the 7 October counts
744, 630, 557 and 476 exactly, and for each count $k$ the match with $k$
tones is at least 0.9 and with $k - 1$ tones below it. Two earlier check
scripts, written for the 15 October update, give the same counts in every
case they cover, and a third code written for this check reproduces the
worst errors, $q$, the leftover frequencies, the in-step ratios and every
count in the table.

## When to stop training: patience and the learning-rate cycle {#oct16-stopping}

**Claim** (16 October status): stopping a signal-only run after 80 epochs
without a new best in validation within 1%, and never before the end of the
learning-rate cycle that contains the best epoch, loses at most 0.05
percentage points against running the full schedule.

**Setup.** Our runs use a linear warmup of 10 epochs followed by cosine
cycles of 40, 80, 160 and 320 epochs (each twice the last), so the learning
rate is lowest at epochs 49, 129, 289 and 609 and jumps up after each. New
bests tend to appear near those low points. Plain early stopping counts the
epochs since the best and stops after a fixed number (the patience).

**Derivation (empirical).** For each of our 31 training histories with at
least 60 validation epochs, I replayed plain early stopping at patience $P$
and compared the best value reached before stopping with the best of the full
history. Largest shortfall over the signal-only runs: 5.6 points for
$P \le 40$, 5.2 at 50, 0.05 at 60 and 80. Over the noisy runs the shortfall
stays above 0.5 points for some run up to $P = 160$ (1 of 31 runs at 160),
because their bests come at the ends of the long cycles. I chose 80 for
signal-only runs and 160 for noisy runs, and added the cycle rule so that a
run whose best falls early in a long cycle is still carried to that cycle's
low point.

**Check.** The replay script
([replay_patience.py](https://github.com/kyoon-mit/aframe/blob/reg-dev-latest/dev/analysis/claude_tests/stopping_rule/replay_patience.py))
reads the local training logs. Rerun on 16 October at 18:04, when 36
histories had at least 60 validation epochs (18 signal-only, 18 noisy), it
gives the same signal-only shortfalls, and at $P = 160$ one of the 18 noisy
runs is still more than 0.5 points short. The cycle end
after a given epoch is computed by the stopping callback itself and is tested
against the schedule (epochs 0, 49, 50, 130, 151, 207, 289, 290 map to 49,
49, 129, 289, 289, 289, 289, 609).

## Where the training time goes: one timing of a training batch {#oct16-step-time}

**Claim** (measured on 15 October): in our noisy runs with one layer of 256
free kernels or S4D kernels, preparing the data of one batch takes 2.7 ms of
GPU time and the network's training step 21.2 to 44.2 ms, while one batch
takes 238 to 284 ms of elapsed (wall-clock) time. So 83.5 to 90.0% of the
elapsed time per batch is outside the timed data preparation and training
step, and what fills it was not measured. These numbers come from one
measurement.

**Setup.** The three runs train one layer of 256 kernels 4 s long, either
free kernels or S4D with state size 64 or 512 (32 or 256 oscillators per
channel), on noisy data from both LIGO detectors sampled at 2048 Hz, which
the network halves to 1,024 Hz before its kernels, with 32 windows per
batch and 1,564 training batches and 64 validation batches per epoch (run
configurations). A short script timed the GPU work of one batch on random
numbers of the real shapes, without reading any data:

- data preparation: a power spectral density from 20 s of noise for each
  window, the response of H1 and L1 to 8 waveforms, each used in 4 windows,
  rescaling to a chosen SNR, and two whitenings (the noisy window and the
  clean signal);
- the training step of each of the three networks: a forward pass, the
  gradient and one AdamW update.

Each was run 8 times to warm up and then 40 times between two GPU timers,
and the time is the mean of the 40. The elapsed time per batch of each real
run was read from its run time recorded in Weights and Biases, with 1,628
batches per epoch counting validation.

**Derivation (measurement).**

<div class="table-scroll" markdown="1">

| network | data preparation | training step | sum | elapsed time per batch | outside the timed parts |
|---|---|---|---|---|---|
| free kernels | 2.7 ms | 21.2 ms | 23.9 ms | 238 ms | 90.0% |
| S4D, state size 64 | 2.7 ms | 24.1 ms | 26.8 ms | 260 ms | 89.7% |
| S4D, state size 512 | 2.7 ms | 44.2 ms | 46.9 ms | 284 ms | 83.5% |

</div>

The last column is 1 minus the sum divided by the elapsed time per batch.

**Caveats.** This is one measurement. The GPU was shared with 8 running
jobs, so the absolute times are upper bounds. The remaining 83.5 to 90.0%
was not broken down. It holds everything outside the two timed parts, among
them the data loading (cutting windows from the background files and
reading waveforms from disk, on the processor rather than the GPU) and the
waits caused by sharing the GPU; their shares were not measured.

**Check.** The run configurations give 32 windows per batch, 1,564 training
and 64 validation batches per epoch, and the settings the script used (20 s
of noise for the spectrum, 4 s windows, each waveform in 4 windows, 256
channels, state sizes 64 and 512, the rate halved to 1,024 Hz). The
free-kernel run ran without a break, and its record in Weights and Biases,
97,683 s over 395,899 training batches and the 64 validation batches of
each of its 253 completed epochs, gives 237.0 ms per batch. The S4D runs
were interrupted and resumed, so their records cannot be checked the same
way. The epoch timers of the progress bars in the three runs' training
logs, read at their last update in each epoch, give 236.1, 254.5 and
281.8 ms per batch over 253, 331 and 344 epochs, 0.8 to 2.1% below the
elapsed times above. The last column was recomputed from the others. The
GPU timing was not repeated.

## One S4D channel: transfer function, resonance width and phase {#oct16-s4d-resonance-curve}

**Claim** (16 October update): the transfer function of an S4D channel, its
gain and phase at each angular frequency $\omega$, is

$$
H(\omega) = D + \sum_n\left[\frac{C_n}{a_n + i(\omega - \omega_n)} + \frac{\bar C_n}{a_n + i(\omega + \omega_n)}\right].
$$

Near $\omega_n$ its power is the resonance curve
$|C_n|^2/\big(a_n^2 + (\omega - \omega_n)^2\big)$ of a driven oscillator,
whose full width at half maximum is $1/(\pi T_n)$ Hz for the ring time
$T_n = 1/a_n$. Across the resonance the phase turns by half a cycle.

**Derivation.** The channel's kernel is
$K(s) = 2\,\mathrm{Re}\sum_n C_n e^{(-a_n + i\omega_n)s}$ for $s \ge 0$
([oscillator](#oct15-oscillator)), so
$H(\omega) = D + \int_0^\infty K(s)e^{-i\omega s}\,ds$, and
$\int_0^\infty e^{(-a + i\omega_n - i\omega)s}\,ds = 1/\big(a + i(\omega - \omega_n)\big)$;
the conjugate term gives the mirror resonance at $-\omega_n$. Near
$\omega_n > 0$ the first term of index $n$ dominates. Its power falls to half
its peak where $(\omega - \omega_n)^2 = a_n^2$, so the full width is $2a_n$ in
angular frequency, $a_n/\pi = 1/(\pi T_n)$ in hertz. Its phase,
$\arg C_n - \arctan\big((\omega - \omega_n)/a_n\big)$, goes from $+90°$ to
$-90°$ relative to $\arg C_n$ as $\omega$ sweeps through the resonance: half a
cycle.

**Check.** Python: widths at half maximum measured on a fine grid, 0.63659,
1.59147 and 0.159147 Hz, against $a/\pi$ = 0.63662, 1.59155 and 0.159155 Hz
for $a$ = 2, 5 and 0.5 s⁻¹. $H(\omega)$ from a numerical Fourier integral of a
three-resonator kernel agrees with the sum above to $2.3\times10^{-5}$
between 10 and 400 Hz, and the ml4gw kernel agrees with the sum of damped
cosines to $2.0\times10^{-6}$ of its peak (float32 against float64). A second,
independent code rebuilt the first-layer kernels of the clean S4D network
from its stored parameters; they match the network's own kernels to
$8.4\times10^{-7}$, for a kernel peak of 3.9.

## The matched filter of a chirp holds each frequency until the merger {#oct16-s4d-matched-delay}

**Claim** (16 October update): a filter's group delay at frequency $f$,

$$
\tau_g(f) = -\frac{1}{2\pi}\frac{d\theta}{df},
$$

with $\theta$ the phase of its transfer function, is how late the envelope
of a narrow-band burst at $f$ comes out ([next section](#oct16-s4d-ring-delay)).
The matched filter of a chirp, $K(s) = \overline{h(t_c - s)}$, has
$\tau_g(f) = \tau(f)$ in the stationary-phase approximation: it holds the
part of the chirp at $f$ for the time between the chirp passing $f$ and the
merger. To leading order, at chirp mass 1.2 M☉, this is 4.02 s at 80 Hz,
2.22 s at 100 Hz, 0.349 s at 200 Hz and 0.0550 s at 400 Hz, and a resonator
ringing that long listens to a band $1/(\pi\tau)$ = 0.0792, 0.144, 0.912 and
5.79 Hz wide.

**Derivation.** Write
$\tilde h(f) = \int h(t)e^{-2\pi i f t}dt = |\tilde h|e^{i\psi(f)}$ and
$h = A e^{i\Phi}$, with $h$ the complex (analytic) whitened template and
$t_c$ the merger. The phase of the integrand, $\Phi(t) - 2\pi f t$, is
stationary where $\dot\Phi = 2\pi f$, at the time $t(f)$ when the chirp
passes $f$, and that time dominates the integral (stationary phase; Cutler
and Flanagan 1994, Phys. Rev. D 49, 2658,
[arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014)). So
$\psi(f) = \Phi(t(f)) - 2\pi f\,t(f) + \text{const}$, and since
$\dot\Phi = 2\pi f$ at $t(f)$, the terms in $dt/df$ cancel on
differentiating: $t(f) = -\frac{1}{2\pi}\frac{d\psi}{df}$. Substituting
$s = t_c - t$, $\tilde K(f) = \overline{\tilde h(f)}\,e^{-2\pi i f t_c}$, with
phase $\theta = -\psi - 2\pi f t_c$. The group delay is

$$
\tau_g = -\frac{1}{2\pi}\frac{d\theta}{df} = \frac{1}{2\pi}\frac{d\psi}{df} + t_c = t_c - t(f) = \tau(f).
$$

The numbers come from the leading-order
$\tau(f) = \frac{5}{256}\left(\frac{G\mathcal M}{c^3}\right)^{-5/3}(\pi f)^{-8/3}$
([cycles](#cycles)), and the widths from the
[resonance width](#oct16-s4d-resonance-curve) with $T = \tau$.

**Check.** Python: the group delay of leading-order chirp kernels, computed
from their discrete Fourier transforms as
$\mathrm{Re}[\mathrm{DFT}(\ell K)/\mathrm{DFT}(K)]/f_s$ and averaged over
±2 Hz, agrees with $\tau(f)$ to within 3.6 ms at every tested frequency from
100 to 800 Hz for 0.85, 1.2, 1.8 and 2.75 M☉, and to within 0.07% to 0.9%
where $\tau > 0.1$ s. Narrow pieces of the 1.2 M☉ chirp at 100, 200 and
400 Hz, centred 2.225, 0.349 and 0.0557 s before the merger ($\tau$ = 2.216,
0.349 and 0.0550 s), each leave the matched filter at the merger sample. The
values of $\tau$ and $1/(\pi\tau)$ above were recomputed separately for this
page ($G = 6.67430\times10^{-11}$ m³ kg⁻¹ s⁻², M☉ = $1.98847\times10^{30}$ kg):
4.0181, 2.2161, 0.3490 and 0.0550 s; 0.0792, 0.1436, 0.9120 and 5.791 Hz.

## A resonator delays a burst at its frequency by its ring time {#oct16-s4d-ring-delay}

**Claim** (16 October update): through any linear filter, a burst whose
envelope changes slowly comes out, to first order, with its envelope
unchanged and late by the group delay $\tau_g = -d\theta/d\omega$ at its
frequency. One resonance term has

$$
\tau_g(\omega) = \frac{a}{a^2 + (\omega - \omega_n)^2}:
$$

the ring time $T = 1/a$ at its centre, $T/2$ one half-width away, and area
$\pi$ over all frequencies (half a cycle of phase). For a burst exactly at
the resonance, the centre of the output envelope is delayed by exactly $T$,
whatever the burst's length.

**Derivation.** Let $u(t) = E(t)e^{i\omega_0 t}$ with $E$ slowly varying, so
its spectrum $\tilde E(\nu)$ is concentrated near $\nu = 0$, and let the
filter be $H = |H|e^{i\theta}$. Near $\omega_0$,
$|H| \approx |H(\omega_0)|$ and
$\theta(\omega_0 + \nu) \approx \theta(\omega_0) + \theta'(\omega_0)\,\nu$,
so the output is

$$
\frac{1}{2\pi}\int\tilde E(\nu)H(\omega_0 + \nu)e^{i(\omega_0 + \nu)t}\,d\nu \approx |H(\omega_0)|\,e^{i\theta(\omega_0)}e^{i\omega_0 t}\,E\big(t - \tau_g(\omega_0)\big)
$$

with $\tau_g = -\theta'(\omega_0)$. The phase of
$1/\big(a + i(\omega - \omega_n)\big)$ is
$-\arctan\big((\omega - \omega_n)/a\big)$; minus its derivative is the
expression above, whose integral over all $\omega$ is
$[\arctan(x/a)]_{-\infty}^{\infty} = \pi$. For a burst
$u = E(t)e^{i\omega_n t}$ exactly at the resonance, the term's response is
$\int_0^\infty e^{(-a + i\omega_n)s}E(t - s)e^{i\omega_n(t - s)}ds = e^{i\omega_n t}\,(E * e^{-a\,\cdot})(t)$:
the envelope is convolved with $e^{-at}$, $t \ge 0$. For positive functions a
convolution adds centres (first moments over areas), and the centre of
$e^{-at}$ is $1/a$. So the envelope's centre moves by exactly $T$.

**Check.** Python, $a$ = 7 s⁻¹: the centre value times $a$ is 1.0000; the
area over $|\omega - \omega_n| \le 2\times10^5$ s⁻¹ is $0.99998\,\pi$, which
is the exact $2\arctan(2\times10^5/a)$ for that range. Gaussian bursts at the
resonance with $a$ = 10 s⁻¹ have their envelope centre delayed by
$0.99975/a$ for widths $0.5/a$ to $10/a$ (the tail of $e^{-at}$ was cut at
$12/a$); a long burst one half-width off resonance is delayed by $0.502/a$,
against $0.5/a$ from the formula.

## A channel of $N$ resonators turns its phase by at most $N$ cycles {#oct16-s4d-phase-limit}

**Claim** (16 October update): over any band of positive frequencies, an S4D
channel with $N$ resonators turns its phase by at most
$\pi(N + Z_{\rm rhp}/2) \le 2\pi N$, where $Z_{\rm rhp} \le 2N$ is the number
of its zeros in the right half plane. A channel that is the matched filter
of a chirp over a band therefore needs

$$
N \ge \int_{\rm band}\tau(f)\,df .
$$

**Derivation.** Integrating the group delay gives the phase turned:
$\int_{\omega_a}^{\omega_b}\tau_g\,d\omega = \theta(\omega_a) - \theta(\omega_b)$.
The matched filter has $\tau_g = \tau$
([matched filter](#oct16-s4d-matched-delay)), so across a band it turns
$2\pi\int\tau\,df$ radians, $\int\tau\,df$ cycles. The channel's transfer
function is a ratio of polynomials in $s = i\omega$,

$$
H = D\,\frac{\prod_{k=1}^{2N}(s - z_k)}{\prod_{k=1}^{2N}(s - p_k)},
$$

with poles $p_k = -a_n \pm i\omega_n$ (each resonator and its mirror) and
zeros $z_k$ set by the weights (with $D = 0$ the numerator has degree at most
$2N - 1$). The phase of a product is the sum of the phases, so each factor
adds its own group delay. Using $\frac{d}{dy}\arg(x + iy) = x/(x^2 + y^2)$:
a pole at $-a + i\omega_0$ adds $a/\big(a^2 + (\omega - \omega_0)^2\big)$, a
resonance curve of area $\pi$; a zero at $\sigma + i\omega_0$ adds
$\sigma/\big(\sigma^2 + (\omega - \omega_0)^2\big)$, a delay of area $+\pi$ if
$\sigma > 0$ (right half plane) and an advance of area $-\pi$ if
$\sigma < 0$. The kernel is real, so poles and zeros come in mirror pairs at
$\pm\omega_0$, and a pair puts exactly $\pi$ of area at positive
frequencies:
$\int_0^\infty[L(\omega - \omega_0) + L(\omega + \omega_0)]\,d\omega = \int_{-\infty}^{\infty}L(\omega - \omega_0)\,d\omega = \pi$
for a resonance curve $L$ (a zero on the real axis has no partner and puts
$\pi/2$ there). The phase turned over any band is at most the positive area
inside it: at most $\pi$ per pole pair plus $\pi$ per pair of
right-half-plane zeros, $\pi(N + Z_{\rm rhp}/2) \le 2\pi N$. So
$2\pi N \ge 2\pi\int\tau\,df$. The limit is reached only with every zero in
the right half plane, as in an all-pass filter (zeros mirroring the poles,
$|H| = 1$; Oppenheim and Schafer, *Discrete-Time Signal Processing*, 3rd ed.
(2010), on all-pass systems). An S4D channel can be such a filter exactly,
since $D$ plus a sum of resonance terms is any ratio of this form with these
poles (partial fractions).

**Scope.** This is the channel in continuous time with its full kernel. The
network samples the kernel and cuts it at the 4 s window. Inside the window
$\tau \le 4$ s, and a resonator ringing longer than the window acts like a
Fourier tone of the window, covering $1/(4\ {\rm s})$ = 0.25 Hz, no more than
the $1/\tau \ge 0.25$ Hz the bound allows a resonator. Mixtures of long and
short rings are not covered by a proof; the
[fits](#oct16-s4d-fits) on sampled kernels are the test, and their match
jumps between 0.81 and 1.23 times the bound.

**Check.** Python, two independent codes. Over 200 random channels (2 to 8
resonators, decay rates 2 to 60 s⁻¹, frequencies 20 to 400 Hz, complex and
real kernels, $D$ on or off), the largest phase turned over any band was 0.87
of $2\pi N$. A 6-section all-pass filter turns 0.999997 of $2\pi N$, has
$|H| = 1$ to $2.1\times10^{-15}$, and equals $D$ plus partial fractions to
$2.1\times10^{-15}$. Over 60 more random channels, with the zeros found as
roots of the numerator, every channel stayed within $\pi(N + Z_{\rm rhp}/2)$
(largest 0.70 of $2\pi N$), and the total phase turned equalled
$(\pi/2)(2N + Z_{\rm rhp} - Z_{\rm lhp})$ to $10^{-4}\pi$.

## For a leading-order chirp, $\int\tau\,df$ is 3/8 of the cycles {#oct16-s4d-three-eighths}

**Claim** (16 October update): for a leading-order chirp,
$\int\tau\,df = \tfrac38 N_{\rm cyc}$ exactly, over any band. For any chirp
whose frequency rises steadily,
$\int_{f_1}^{f_2}\tau\,df = N_{\rm cyc} - \tau_1 f_1 + \tau_2 f_2$: the cycles
of the chirp minus those of a steady tone at the starting frequency over the
same time. In the last 4 s before the merger, the longest stretch of chirp
our windows hold ([where the merger falls](#oct16-merger-position)):

<div markdown="1">

| chirp mass | frequency 4 s before merger | cycles to merger | $\int\tau\,df$ to merger |
|---|---|---|---|
| 0.85 M☉ | 99.41 Hz | 636.2 | 238.6 |
| 1.2 M☉ | 80.14 Hz | 512.9 | 192.3 |
| 1.8 M☉ | 62.20 Hz | 398.1 | 149.3 |
| 2.75 M☉ | 47.72 Hz | 305.4 | 114.5 |

</div>

A channel's kernel is the same in every window, so a channel that is to be
the matched filter in all our windows must cover this longest case. The
chirp in a window whose merger falls 3.5 s in has $(3.5/4)^{5/8} = 0.9199$
of each count: 585.3, 471.8, 366.2 and 281.0 cycles and $\int\tau\,df$ =
219.5, 176.9, 137.3 and 105.4 at the four chirp masses, so that chirp alone
would need at least 106 to 220 resonators.

**Derivation.** With $\tau \propto f^{-8/3}$,
$\tau f = \tau_1 f_1 (f/f_1)^{-5/3}$ and
$\int_{f_1}^{f_2}\tau\,df = \tfrac35(\tau_1 f_1 - \tau_2 f_2)$. The cycles are
$N_{\rm cyc} = \int f\,dt = \int f\,|d\tau/df|\,df$ with
$|d\tau/df| = \tfrac83\tau/f$, so $N_{\rm cyc} = \tfrac83\int\tau\,df$. To
merger, $f_2 \to \infty$ and $\tau_2 f_2 \to 0$, so
$\int\tau\,df = \tfrac35\,\tau_1 f_1$ and $N_{\rm cyc} = \tfrac85\,\tau_1 f_1$;
with $\tau_1$ = 4 s this gives the table, and since $f_1 \propto \tau_1^{-3/8}$,
$\tau_1 f_1 \propto \tau_1^{5/8}$ gives the 3.5 s values. A channel's output
at the merger adds its kernel times the data back to the window's first
sample, so a kernel matched to the last 4 s is also the matched filter of the
shorter stretch in a window whose merger falls earlier, while one matched
only to the last 3.5 s misses the first 0.5 s of chirp in a window whose
merger falls at its end. In general, integrating by parts,
$\int_{f_1}^{f_2}\tau\,df = [\tau f]\_{f_1}^{f_2} + \int f\,|d\tau| = N_{\rm cyc} - \tau_1 f_1 + \tau_2 f_2$.
An earlier count asked for resonances spaced no further apart than their
angular width $1/\tau$; that gives
$2\pi\int\tau\,df = 2\pi\cdot\tfrac38 N_{\rm cyc} = \tfrac{3\pi}{4}N_{\rm cyc}$,
1,208 at 1.2 M☉, and it is not the requirement: the
[phase limit](#oct16-s4d-phase-limit) is $\int\tau\,df$.

**Check.** Python, two independent codes: by quadrature,
$\int\tau\,df / N_{\rm cyc}$ = 0.375000 at 0.85, 1.2, 1.8 and 2.75 M☉ (0.375
to $2\times10^{-16}$ in the second code); the frequencies, cycles and
integrals of the table; $\int\tau\,df$ = 192.32, $N_{\rm cyc}$ = 512.87 and
$2\pi\int\tau\,df$ = 1,208.4 at 1.2 M☉. The frequencies match the
[cycles](#cycles) section. The 3.5 s values were recomputed for this page
from the closed form and by quadrature, which agree to better than
$10^{-14}$ (relative): $\int\tau\,df$ = 219.48, 176.93, 137.32 and 105.37,
and 585.29, 471.81, 366.19 and 280.98 cycles. In one detector the shortest
stretch is 3.4795 s ([where the merger falls](#oct16-merger-position)),
which gives 104.98 at 2.75 M☉. A merger that falls after the window's end
in one detector, by up to 21.0 ms, cuts the top of the band, so
$\int\tau\,df$ stays below its 4 s value: 230.40 at 0.85 M☉ for a merger
21.0 ms after the end.

## Fitting resonators to chirp kernels {#oct16-s4d-fits}

**Claim** (16 October update): fits of one channel of $N$ resonators to the
matched filter of a whitened chirp give the following.

- One resonator per band of equal $\int\tau\,df$, ring time $\tau(f)$, only
  the weights solved: the match jumps from 0.457 to 0.480 at 0.81 to 0.98
  times $\int\tau\,df$ to 0.861 to 0.932 at 1.01 to 1.23 times it, counting
  the resonators on the dominant sign of frequency (1.2, 1.5 and 2.0 M☉). For 1.0 M☉, covering the larger of its two frequency signs
  gives 0.78, and 0.967 needs both covered (640 resonators).
- The matrix-pencil fits of the [earlier tone fits](#early-tone-fit) stop at
  0.875 to 0.917 with 2,048 resonators because growing poles were reflected;
  clipping them instead gives 0.933 to 0.958. The layout along the chirp
  reaches 0.99 with 448 resonators at 1.2 and 1.5 M☉, 320 at 2.0 M☉ and 896
  at 1.0 M☉.
- With frequencies, decay rates and weights all fitted and the result valid
  in float32, 32 resonators keep 0.290, 0.429, 0.476 and 0.564 at 1.0, 1.2,
  1.5 and 2.0 M☉; 64 keep 0.389, 0.540, 0.574 and 0.629; 128 keep 0.543,
  0.862, 0.908 and 0.942.
- On whitened templates of seven chirp masses from 0.85 to 2.75 M☉, with a cap
  on cancellation: 16 resonators keep 0.210 to 0.434; 32 keep 0.304 to
  0.592; 64 keep 0.465 to 0.778; 128 keep 0.658 to 0.947; 256 keep 0.942 to
  0.992.
- For a match of 0.9 over the whole chirp, resonators need 0.34 to 0.38 per
  cycle of the chirp (both template sets below), and the strongest Fourier
  tones 1.26 to 1.45 per cycle (leading-order chirps).

**The kernels.** Three sets, so absolute values differ a little between
them: leading-order chirps over the last 4 s, 20 to 900 Hz; whitened
templates of $h_+$ (analytic signal) from our training file, whitened with
the average O3 noise spectrum of our training windows; and the four whitened
kernels of the [earlier tone fits](#early-tone-fit), at detector-frame chirp
masses 1.0, 1.2, 1.5 and 2.0 M☉, built from $h_+ - ih_\times$. The 1.0 M☉
source is seen nearly edge-on (inclination 1.63 rad), so its kernel holds
61% of its energy at positive and 39% at negative frequencies, and a channel
must cover both; covering one sign alone keeps at most $\sqrt{0.61}$ = 0.78.

**The match** of a fitted kernel is defined as in the
[earlier tone fits](#early-tone-fit): the fraction of the matched filter's
SNR it keeps.

**The fits.**

- *Along the chirp, no fit:* the band is cut into $N$ bands of equal
  $\int\tau\,df$, with one resonator in each, ring time $\tau(f)$; only the
  weights are solved, by least squares. On the leading-order chirps a
  variant uses $c$ resonators per unit of $\int\tau\,df$, ring times
  $\tau/\alpha$ with the best $\alpha$ between 0.25 and $\pi$, and weights
  with a cap of 2 on cancellation (the summed energy of the terms at most
  twice the energy of their sum): the match is 0.535 to 0.538 at $c$ = 0.8,
  0.696 to 0.830 at 1.0, 0.945 to 0.962 at 1.1, 0.973 to 0.979 at 1.5, 0.994
  at 2 and 0.998 at $c = e$, for 0.85 to 2.75 M☉; from $c$ = 1.1 up the best
  ring times are 0.7 to 1 $\tau$.
- *Matrix pencil* (Hua and Sarkar 1990, IEEE Trans. ASSP 38, 814): as in the
  earlier fits, except that poles with $|z| > 1$ (the best pencil poles reach
  $|z|$ = 1.009) are clipped to $|z| = 1$ instead of reflected to
  $1/\bar z$, which changes their shape.
- *All parameters fitted:* frequencies, decay rates and weights by
  variable projection (the weights are the least-squares solution at every
  step; Golub and Pereyra 1973, SIAM J. Numer. Anal. 10, 413,
  [doi:10.1137/0710036](https://doi.org/10.1137/0710036)), from three
  fixed starts (the two matrix-pencil fits and the layout along the chirp)
  and from random starts (24 at 32 resonators, 8 at 64 and 128), keeping
  only results whose match holds when the kernel is evaluated in float32,
  the precision S4D computes in; the claim gives the best over all starts.
  The kept 32-resonator fits have cancellation ratios of 12 to 24.
- *Without any cap*, least squares with free poles drifts into pairs of poles
  almost on top of each other with large, opposite weights (for 1.2 M☉ at 256
  resonators: pairs near 83 to 85 Hz, 0.008 to 0.014 of a line width apart,
  weights of $2\times10^6$ to $5\times10^6$). In float64 the match climbs
  (1.0 M☉: 0.9954 at 512, 0.9998 at 1,024); the same kernels evaluated in
  float32 keep 0.014 to 0.084. They are not usable S4D kernels.

In the best 32-resonator fits, ring time grows as $\tau^{1.27}$ to
$\tau^{1.42}$ (log-log $R^2$ 0.92 to 0.94), and the median ring time is 0.43
to 0.70 of $\tau$.

**Check.** The fits of the layout along the chirp were evaluated in float64
and again in float32 and agree to 4 digits; a second, independent reading of
the saved results gives the same jump (1.2 M☉: 0.467 at 0.886 times, 0.902 at
1.065 times; 1.5 M☉: 0.457 at 0.806, 0.861 at 1.010; 2.0 M☉: 0.480 at 0.983,
0.932 at 1.231). The reflected (0.875 to 0.917) and clipped (0.933 to 0.958)
matrix-pencil values at 2,048 were reproduced by a second, independent least
squares. The 32-resonator fits were re-evaluated in complex64 with
independent code: 0.2896, 0.4288, 0.4762 and 0.5641, cancellation 12.3 to
24.3. The other values are read from the saved outputs of the fitting
scripts and were not rerun. The per-cycle ratios were recomputed for this page from
the counts for a match of 0.9, at 0.85, 1.2, 1.8 and 2.75 M☉, divided by the
cycles of the [3/8 section](#oct16-s4d-three-eighths): resonators 219, 182,
143 and 112 on leading-order chirps (0.344 to 0.367 per cycle) and 230, 194,
148 and 106 on whitened templates (0.347 to 0.378); Fourier tones 800, 685,
557 and 442 on leading-order chirps (1.257 to 1.447).

## How long a chirp stays in step with a linear chirp, and how many chirplets cover the window {#oct16-chirplet-count}

**Claim** (brainstorm, 16 October): a chirp that passes the frequency $f$
stays within an eighth of a cycle of the linear chirp (a wave whose
frequency changes at a constant rate) that has its phase, frequency and rate
of change of frequency at that moment for a time

$$
T_{\rm lin} = \left(\frac{6}{\ddot f}\right)^{1/3},
$$

centred on that moment. For chirp mass 1.2 M☉ this is 0.830 s at 100 Hz and
0.0816 s at 300 Hz, 3.41 and 2.52 times the
[in-step time](#oct15-in-step-time) $\dot f^{-1/2}$ of a steady wave. At
leading order, pieces of length $T_{\rm lin}$ laid end to end over a window
that ends at the merger and holds $N$ cycles number

$$
\frac35\left(\frac{55}{2}\,N\right)^{1/3} = 1.811\,N^{1/3},
$$

against $\tfrac25\sqrt{15N} = 1.549\sqrt N$ steady pieces and at least
$\int\tau\,df = \tfrac38 N$ resonators for one S4D channel
([3/8 section](#oct16-s4d-three-eighths)). Over the last 4 s before the
merger, rounded up to whole pieces, that is 10 to 12 linear pieces up to
1024 Hz, against at least 114 to 234 resonators:

<div markdown="1">

| chirp mass | cycles | linear pieces: to merger, to 1024 Hz, to 512 Hz | steady pieces: to merger, to 1024 Hz, to 512 Hz | $\int\tau\,df$: to merger, to 1024 Hz |
|---|---|---|---|---|
| 0.85 M☉ | 636.2 | 15.58, 11.31, 9.31 | 39.08, 33.48, 29.11 | 238.6, 233.7 |
| 1.2 M☉ | 512.9 | 14.50, 10.98, 9.32 | 35.08, 30.89, 27.60 | 192.3, 189.6 |
| 1.8 M☉ | 398.1 | 13.32, 10.51, 9.19 | 30.91, 27.91, 25.57 | 149.3, 147.9 |
| 2.75 M☉ | 305.4 | 12.20, 9.98, 8.93 | 27.07, 24.97, 23.33 | 114.5, 113.8 |

</div>

A chirplet is such a piece under a Gaussian envelope (Mann and Haykin 1995,
IEEE Trans. Signal Process. 43, 2745,
[doi:10.1109/78.482123](https://doi.org/10.1109/78.482123)). With the match
defined as in the [resonator fits](#oct16-s4d-fits), the fraction of the
matched filter's SNR kept:

- *Cut pieces*, each the tangent linear chirp at its midpoint in time: 9
  to 12 of them keep 0.958 to 0.959 (up to 512, 900 or 1024 Hz); steady
  pieces made the same way, 24 to 34 of them, keep 0.973.
- *Chirplets along the chirp, amplitudes solved:* on the leading-order
  chirps of the resonator fits (20 to 900 Hz), 9 to 10 chirplets reach a
  match of 0.9, 10 to 11 reach 0.95 and 14 reach 0.99, where for 0.9 the
  same chirps need 112 to 219 resonators and 442 to 800 Fourier tones
  ([resonator fits](#oct16-s4d-fits)). Up to 1024 Hz, 12 chirplets keep
  0.982 to 0.989.
- *Fitted* to the four whitened kernels of the resonator fits: 8 chirplets
  keep 0.953 to 0.962 at 1.2 to 2.0 M☉ and 12 keep 0.977 to 0.986, where 32
  resonators keep 0.429 to 0.564. From random starts, fits of 8 chirplets
  end at 0.600 to 0.915.
- *A start with no fit:* at the best of 256 chirp masses spaced evenly in
  log from 0.85 to 2.75 M☉, 12 chirplets laid along the leading-order chirp
  match the 1.2, 1.5 and 2.0 M☉ whitened kernels at 0.788 to 0.824, and at
  0.924 to 0.955 once their complex amplitudes alone are solved.

A chirplet has six numbers (centre time, width, centre frequency, rate of
change of frequency, and a complex amplitude), so a chain of 12 has 72; a
free kernel at 2048 Hz uses 8,032 ([counts](#parameters)).

**Setup.** One chirplet is

$$
g(t) = A\,e^{-(t - t_k)^2/(2\sigma^2)}\exp\!\Big(i\big[\phi + 2\pi f_k\,(t - t_k) + \pi c_k\,(t - t_k)^2\big]\Big),
$$

with centre time $t_k$, width $\sigma$, centre frequency $f_k$, rate of
change of frequency $c_k$, amplitude $A$ and phase $\phi$. Two sets of
targets:

- *Leading-order chirps:* $\tau^{-1/4}e^{i\Phi(\tau)}$ over the last 4 s at
  2048 Hz (8,192 samples), with $\tau$ the time before the merger, kept from
  20 Hz to $f_{\max}$ = 512, 900 or 1024 Hz; 900 Hz is the band of the
  leading-order chirps of the resonator fits.
- *Whitened kernels:* the four kernels of the
  [earlier tone fits](#early-tone-fit), whitened templates at detector-frame
  chirp masses 1.0, 1.2, 1.5 and 2.0 M☉ built from $h_+ - ih_\times$, 8,064
  samples (the 3.94 s before the merger) at 2048 Hz. The 1.0 M☉ source is
  seen nearly edge-on, so its kernel holds 39% of its energy at negative
  frequencies, and chirplets on one sign of frequency keep at most
  $\sqrt{0.61}$ = 0.78 of it ([resonator fits](#oct16-s4d-fits)).

The constructions:

- *Cut pieces:* one piece per unit of the count derived below, each the
  tangent linear chirp (or steady wave) at the midpoint in time of its
  piece, with the chirp's own amplitude.
- *Chirplets along the chirp:* $P$ chirplets centred at equal steps of the
  count, with the chirp's frequency and rate at each centre and a width
  $\sigma$ that is a fixed fraction of the local spacing in time (0.3, 0.4,
  0.5, 0.6, 0.8 or 1.0, the best kept for each $P$; it is 0.4 from 10 to 16
  chirplets). Only the complex amplitudes are solved, by least squares.
  Taking instead the chirp's own amplitude and phase at each centre, with
  nothing solved, needs the same numbers of chirplets for 0.9 and 0.95, and
  14 to 15 for 0.99.
- *Fitted:* the centre times, widths, frequencies and rates of $P$
  chirplets are fitted to a whitened kernel by variable projection, as for
  the resonators (the amplitudes are the least-squares solution at every
  step), with a gradient-based minimizer from SciPy and an exact gradient,
  until the match gains less than $10^{-6}$ in 500 steps. The start puts
  the chirplets at equal steps of the kernel's energy along its own
  frequency track (frequency and rate from local quadratic fits of the
  kernel's phase), each half as wide as the time over which the kernel's
  phase stays within a quarter cycle of the tangent linear chirp there; for
  1.0 M☉ the chirplets are split between the two signs of frequency in
  proportion to their energy. The random starts, three each at 1.2 and
  2.0 M☉, put the centres anywhere in the kernel, the frequencies between
  20 and 800 Hz, the widths between 32 and 1,024 samples and the rates at 0;
  for them the minimizer's own stop on a small relative gain was turned off,
  since with it the first random start stopped at 0.154 (1.2 M☉) and 0.383
  (2.0 M☉).
- *A start with no fit:* 12 chirplets along the leading-order chirp from
  20 to 1024 Hz, width 0.4 of the spacing, with the chirp's amplitude and
  phase at each centre, at the 256 chirp masses; the match is the largest
  over the kernel's lag, both signs of frequency and all 256 masses (the
  best lies 0.8% to 1.5% below the kernel's chirp mass). For the second
  number only the complex amplitudes are re-solved, by least squares, at
  the best mass and lag.

The fits:

<div markdown="1">

| chirplets | 1.0 M☉, both signs | 1.2 M☉ | 1.5 M☉ | 2.0 M☉ |
|---|---|---|---|---|
| 4 | | 0.791 | | |
| 6 | | 0.902 | | |
| 8 | | 0.955 | 0.953 | 0.962 |
| 12 | | 0.979 | 0.977 | 0.986 |
| 16 | 0.942 | 0.995 | | |
| 24 | 0.984 | | | |

</div>

The summed energy of the fitted chirplets is 0.80 to 1.26 times the energy
of their sum, so no fit relies on terms that cancel (the 32-resonator fits
have 12 to 24). From the random starts, 8 chirplets end at 0.600, 0.698 and
0.857 (1.2 M☉) and 0.915, 0.798 and 0.795 (2.0 M☉), against 0.955 and 0.962
from the start along the track. The start with no fit reaches 0.607 on the
1.0 M☉ kernel, and 0.727 with the amplitudes re-solved, below the one-sign
limit of 0.78.

**Derivation.** Near the moment $t_0$ when the chirp passes $f_0$,

$$
\Phi(t_0 + s) = \Phi(t_0) + 2\pi f_0\,s + \pi\dot f\,s^2 + \frac{\pi}{3}\,\ddot f\,s^3 + O(s^4).
$$

The tangent linear chirp keeps the first three terms, so the two differ by
$\tfrac{\pi}{3}\ddot f\,|s|^3$, which is at most an eighth of a cycle,
$\pi/4$, for $|s| \le \big(3/(4\ddot f)\big)^{1/3}$: a total time
$T_{\rm lin} = 2\,\big(3/(4\ddot f)\big)^{1/3} = (6/\ddot f)^{1/3}$. A steady wave
keeps only the first two terms and is limited by the $s^2$ term instead
([in-step time](#oct15-in-step-time)). The envelope, sharp-edged or
Gaussian, does not enter: the in-step time depends on the phase alone.

At leading order $f \propto \tau^{-3/8}$ ([cycles](#cycles)), so
$\dot f = \tfrac38 f/\tau$ and
$\ddot f = \tfrac38\cdot\tfrac{11}{8}\,f/\tau^2 = \tfrac{11}{3}\,\dot f^2/f$.
Then

$$
\frac{T_{\rm lin}}{T_{\rm step}} = \left(\frac{18}{11}\,f\,T_{\rm step}\right)^{1/3}, \qquad T_{\rm step} = \dot f^{-1/2},
$$

so the linear chirp gains most where a steady wave already holds many
cycles:

<div markdown="1">

| chirp mass | 50 Hz | 100 Hz | 300 Hz |
|---|---|---|---|
| 0.85 M☉ | $\ddot f$ = 0.0412 Hz/s², 5.26 s | 3.33 Hz/s², 1.22 s | 3,497 Hz/s², 0.120 s |
| 1.2 M☉ | 0.130 Hz/s², 3.59 s | 10.5 Hz/s², 0.830 s | 11,040 Hz/s², 0.0816 s |
| 2.75 M☉ | 2.07 Hz/s², 1.43 s | 167 Hz/s², 0.330 s | 175,100 Hz/s², 0.0325 s |

</div>

The 50 Hz column lies inside our windows only above 2.55 M☉
([in-step time](#oct15-in-step-time)).

Pieces of length $T_{\rm lin}$ laid end to end number
$\int dt/T_{\rm lin} = \int(\ddot f/6)^{1/3}\,d\tau$. Since
$\ddot f \propto \tau^{-19/8}$, the integrand grows only as $\tau^{-19/24}$
toward the merger, and the integral to the merger is finite:

$$
\int_0^T \left(\frac{\ddot f}{6}\right)^{1/3} d\tau = \frac{24}{5}\,T\left(\frac{\ddot f(T)}{6}\right)^{1/3} = \frac{24}{5}\left(\frac{11}{128}\right)^{1/3}(T f_T)^{1/3} = \frac35\left(\frac{55}{2}\,N\right)^{1/3},
$$

with $T$ = 4 s, $f_T$ the frequency at $\tau = T$ and $N = \tfrac85\,T f_T$
the cycles to the merger ([3/8 section](#oct16-s4d-three-eighths)). The same
steps for steady pieces give
$\int\dot f^{1/2}\,dt = \tfrac{16}{5}\,T\,\dot f(T)^{1/2} = \tfrac25\sqrt{15N}$,
the count in section 4 of the
[15 October lecture]({{ u | append: '2026-10-15-oscillators-and-chirps/' | relative_url }}).
Since $\tau \propto f^{-8/3}$, stopping at $f_{\max}$ instead of the merger
multiplies the two counts by $1 - (f_T/f_{\max})^{5/9}$ and
$1 - (f_T/f_{\max})^{5/6}$. With constant amplitude, a cut piece keeps
$\int_0^1\cos(\pi w^3/4)\,dw = 0.957$ of a perfectly in-step stretch of its
length, where $w$ runs from the piece's middle to its end, and a steady
piece keeps 0.973.

**Check.** Python (numpy and scipy, one thread), two codes written
separately:

- The exact leading-order phase was compared with the tangent linear chirp
  on 600,001 points in one code and 2,000,001 in the other. The interval
  where the two differ by at most $\pi/4$ is 0.02% to 0.49% shorter than
  $(6/\ddot f)^{1/3}$ for 0.85, 1.2 and 2.75 M☉ at 50, 100 and 300 Hz;
  the largest difference is at 2.75 M☉ and 300 Hz, 30 ms before the merger,
  where the $s^4$ term is largest. The same codes give $\dot f^{-1/2}$ for
  the steady wave to within 0.04%, and finite differences of $f(\tau)$ give
  $\dot f$ and $\ddot f$ to a relative $10^{-7}$.
- Numerical integration (SciPy's `quad`, after a change of variable that
  removes the growth at the merger) gives the closed forms to all digits
  shown: 15.576, 14.497, 13.322 and 12.196 linear pieces and 39.076,
  35.084, 30.909 and 27.075 steady pieces to the merger at 0.85, 1.2, 1.8
  and 2.75 M☉, and the counts to 1024 and 512 Hz. The first code, on a
  grid in $\log\tau$ that stopped 1 ns before the merger, came out 1% low
  for the linear pieces: the count grows as $\tau^{5/24}$, so its last
  nanosecond holds 1% of it.
- The cut pieces keep 0.958 to 0.959 in both codes with the tangent at the
  midpoint in time (0.954 to 0.957 with the tangent at the midpoint of the
  count), and the chirplet counts for 0.9, 0.95 and 0.99 agree between
  them. Both codes reproduce two numbers found before with other code: 800,
  685, 557 and 442 strongest Fourier tones for a match of 0.9
  ([resonator fits](#oct16-s4d-fits)), and steady pieces that keep 0.973
  with 24 to 30 pieces up to 512 Hz (section 4 of the lecture).
- Every saved fit was rebuilt from its saved parameters by separate code,
  in float64 and in complex64: the matches agree with the fitting code to
  four digits (one random start to 0.003 in complex64), and re-solving the
  amplitudes with numpy's least squares gives the same matches. The fit's
  exact gradient agrees with central finite differences of a separately
  written objective to a relative $2.2\times10^{-8}$ or better in every
  component above a thousandth of the largest, at the start along the track
  (8 chirplets, 1.2 M☉). The 8-chirplet fit at 1.2 M☉ from the track
  was run three times, the last without the stop on a small relative gain,
  and gave 0.9551 each time.
- The start with no fit: on a grid of chirp masses 0.05% apart, the
  leading-order chirp itself matches the 1.2, 1.5 and 2.0 M☉ kernels at
  0.816 to 0.846 and the chain of 12 chirplets at 0.814 to 0.835, so what
  the start lacks is in the leading-order phase and amplitude, not in the
  chirplets. A second code, which shifts and trims the chain to the kernel's
  length instead of padding it, gives 0.809 to 0.838 before the amplitudes
  are re-solved.
- A third code, written separately again to check the first two (root
  finding for the in-step lengths, counts integrated on a grid, least
  squares through a QR decomposition), reproduced every number in the
  three tables, the cut-piece and chirplet matches and counts, the 800,
  685, 557 and 442 Fourier tones, every saved fit rebuilt from its
  parameters, and the start with no fit (0.788 to 0.824, and 0.924 to
  0.955 with the amplitudes re-solved), taking the best over all 256
  masses.

## How the trained channels were measured {#oct16-s4d-channel-analysis}

**Claim** (16 October update): the numbers given for the trained channels:
for the clean S4D's first layer, the ring times, the matches, the group-delay
slope and the skip term; for the four noisy networks, the counts of channels
whose delay follows the chirp, their matches and slopes.

**The kernels.** Each channel's kernel is rebuilt from the stored
parameters, with frequency $f_n = \Delta t\,\mathrm{Im}A_n f_s/2\pi$ and ring
time $T_n = 1/(\Delta t\,|\mathrm{Re}A_n| f_s)$
([S4D tones](#s4d-tones)), where $f_s$ is the rate at which the kernel runs:
2048 Hz in the clean network, 1024 Hz in the four noisy ones.

**The templates.** 235 whitened templates, chirp masses 0.85 to 2.74 M☉,
mass ratio 0.70 to 0.90, spin near 0, whitened with the H1 noise spectrum.
Some numbers were also measured on 1,000 clean test windows of both
detectors.

**What is measured, per channel.**

- *In-band match:* the fraction of a template's SNR the channel keeps,
  counting only 20 Hz to the Nyquist frequency (the whitened data hold no
  power below 20 Hz), at the best template and the best output time.
- *One resonator alone:* the best match a single resonance reaches in the
  channel's band, and the gain $G$ = (channel's match / one resonance's
  match)².
- *Slope:* the slope of the channel's group delay against the chirp's
  $\tau(f)$ across its band; 1 means the channel delays each frequency as the
  matched filter does, 0 that it has no delay that depends on frequency.
- *Memory:* ring time over $\tau$ at the resonators' frequencies.

Channels with $G \ge 2$ and a slope between 0.5 and 2 are counted as
channels whose delay follows the chirp. These cuts are mine, fixed after
seeing the best channels; the clean first layer has none at $G$ cuts of 1.5,
2 and 3.

**Results, clean S4D 64 × 32 × 4, first layer, epoch 69.** 671 of 1,024
resonators lie between 20 and 1024 Hz; ring time median 5.7 ms, 95th
percentile 0.25 s; 1.0% (at 0.85 M☉) to 18% (at 2.75 M☉) ring as long as
$\tau$ at their frequency. Best match per channel on the 1,000 windows:
median 0.090, maximum 0.204, against 0.20 to 0.32 for one resonator alone at
60 to 400 Hz on the same windows. On the templates: median 0.060, maximum
0.175, against 0.22 for one resonance, so $G$ has a median of 0.083 and a
maximum of 0.59. Slope median 0.000; the best channel's group delay is flat
at 0 over 42 to 173 Hz, where the chirp's delay spans 3.7 s. Skip term:
$D^2/\lVert K\rVert^2$ median 0.72. Epoch 135: 676 resonators in band, ring
time median 5.4 ms, best match per channel median 0.089 and maximum 0.192 on
the same 1,000 windows.

**Results, noisy networks.** On real windows the channel matches and the
one-resonance bound are both 1.4 to 1.6 times the values on the templates;
ratios and counts do not change. The eight best channels of the
256-per-channel network hold 1.40 to 2.15 resonators per unit of
$\int\tau\,df$ in their band, with median ring times of 0.65 to 1.05 $\tau$.
Training moved the S4D-Lin frequencies by a median 0.05 to 0.09 of the
starting spacing $\pi$ (at most 2.5% of resonators moved more than half a
spacing), while 73% to 91% of resonators changed their ring time by more
than 10%. In the 256-per-channel network, the channels whose delay follows the
chirp have a median step $\Delta t$ of $1.7\times10^{-3}$, against 0.11 for
the other channels. The
five best channels' full width at half height in chirp mass is 3.6% to 5.7%
for the 256-per-channel network, 8% to 34% for the 32-per-channel and
band-init networks, and 1.4% to 2.0% for free kernels.

**Check.** A second, independent code rebuilt the clean first-layer kernels
from the raw parameters (match to the module $8.4\times10^{-7}$) and
reproduced 671 of 1,024, 5.68 ms and 0.255 s (with 324 aliased resonators
handled), the matches on the 1,000 windows, the one-resonator values on them,
$D^2/\lVert K\rVert^2$ = 0.7229 and the epoch-135 values. For the noisy
networks, kernels rebuilt from the stored parameters match the module code to
$3.7\times10^{-14}$ or better; the second code rebuilt the eight best
256-per-channel channels (slopes against the leading-order $\tau$ 1.05 to
1.21). The counts, the matches on templates, the slopes, the training changes
and the tuning widths are read from the saved analysis results and were not
rerun; the training changes compare each network with a fresh draw from the
same start code, not with the run's own start.

## A GELU passes each channel's linear response with gain 1/2 {#oct16-s4d-gelu-linear}

**Claim** (16 October update):
$\mathrm{GELU}(y) = \tfrac12 y + y\big(\Phi_{\mathcal N}(y) - \tfrac12\big)$,
and the second term is even. The part of a channel's output that is linear
in the input therefore reaches the next layer's mixing of channels with gain
1/2, where it can be added in step across channels. A GELU does not by
itself turn a sum of channels into a sum of powers.

**Derivation.** $\Phi_{\mathcal N}(y) - \tfrac12$ is odd, so
$y(\Phi_{\mathcal N}(y) - \tfrac12)$ is even, and $\tfrac12 y$ is the whole
odd part ([averaging after a GELU](#ck-gelu-mean); Hendrycks and Gimpel 2016,
[arXiv:1606.08415](https://arxiv.org/abs/1606.08415)). The mixing of
channels that follows in ml4gw's S4D layer is a 1×1 convolution, which is
linear, followed by a gated linear unit, which multiplies by a
data-dependent factor. This corrects the
[$N^{1/4}$ section](#semi-coherent), which listed a GELU among the
nonlinearities that turn a sum into a sum of powers: that holds for its even
part only. It holds exactly for the noisy one-layer networks, which square
each channel. The even part adds noise but no response linear in the
signal, so for pieces with independent Gaussian noise a sum in step after a
GELU keeps the fraction 0.838 to 0.910 of the SNR at noise spreads 0.5 to 2
([next section](#oct16-nonlinearity-linear-part)).

**Check.** Python, two codes:
$\tfrac12(\mathrm{GELU}(y) - \mathrm{GELU}(-y)) - \tfrac12 y$ is at most
$4.4\times10^{-16}$ on $[-8, 8]$ and on $[-12, 12]$.

## How much SNR a sum in step keeps after a nonlinear function {#oct16-nonlinearity-linear-part}

**Claim** (15 October update, section 5, as revised on 16 October; and the
corrected [$N^{1/4}$ section](#semi-coherent)): apply a function $\phi$ to
each of $K$ pieces of data $z_k = s_k + n_k$, whose noise $n_k$ is Gaussian
with spread $\sigma$ and independent from piece to piece, and add the outputs
with weights in step with the signal, $c_k \propto s_k$. To first order in
the signal of each piece the sum has SNR $r\rho$, where
$\rho = \lVert s\rVert/\sigma$ is the SNR of the same sum taken without
$\phi$, and

$$
r = \operatorname{corr}\big(n, \phi(n)\big) = \frac{E[n\,\phi(n)]}{\sigma\,\operatorname{std}\phi(n)}, \qquad n \sim \mathcal N(0, \sigma^2),
$$

the correlation between the noise that enters $\phi$ and what comes out. "A
sum in step keeps 86% of the SNR" means $r = 0.86$. The values:

- ReLU, $\max(0, x)$: $r = 1/\sqrt{2 - 2/\pi} = 0.856429$ at every $\sigma$.
- Threshold at zero (1 for $x > 0$, 0 otherwise), and the sign function:
  $r = \sqrt{2/\pi} = 0.797885$ at every $\sigma$.
- GELU, $x\,\Phi_{\mathcal N}(x)$, with $\sigma$ in the units of $x$: $r$ is
  0.909548 at $\sigma = 0.5$, 0.850463 at 1 and 0.839013 at 2, and smallest,
  0.838159, at $\sigma = 1.678$. For $0.5 \le \sigma \le 2$ it therefore lies
  between 0.838 and 0.910 (84 to 91%). It tends to 1 as $\sigma \to 0$ and to
  the ReLU's 0.856429 as $\sigma \to \infty$, so at any spread it lies
  between 0.838 and 1.
- The GELU and the ReLU pass a weak signal with an average gain of exactly
  1/2 at every $\sigma$.
- An even function, $\phi(-x) = \phi(x)$, such as a square, an absolute
  value, the energy of a channel or a threshold on $\lvert x\rvert$, has
  $r = 0$ at every $\sigma$. Nothing linear in the signal survives: a
  weighted sum of its outputs responds only to even powers of the pieces'
  signals, led by $s_k^2$, and with equal weights it is the power sum of the
  [$N^{1/4}$ section](#semi-coherent). A continuous function that grows no
  faster than a power of $x$ has $r = 0$ at every $\sigma$ only if it is
  even.
- In the setting of the [$N^{1/4}$ section](#semi-coherent), 600 pieces that
  each carry $8/\sqrt{600} = 0.327$ in unit noise, added with equal weights
  (which are in step there, since every piece carries the same signal), the
  exact SNR is 7.737 after a GELU, 7.736 after a ReLU, 6.271 after a
  threshold at zero and 1.848 after a square, against 8 without a function.

**Setup.** The SNR of a sum $o$ is the shift of its mean when the signal is
added, in units of its spread in noise alone:

$$
\mathrm{SNR}(o) = \frac{E[o \mid s] - E[o \mid 0]}{\operatorname{std}(o \mid 0)} .
$$

For the plain sum $\sum_k s_k z_k$ this is $\lVert s\rVert/\sigma = \rho$, the
matched-filter SNR. Samples of whitened data are such pieces, with
$\sigma = 1$, when the noise is Gaussian: white Gaussian noise is independent
from sample to sample. This section does not cover pieces whose noises are
correlated, such as two channels of one layer at the same time. Write
$p(x) = e^{-x^2/(2\sigma^2)}/(\sigma\sqrt{2\pi})$ for the density of $n$, and
$m(s) = E\,\phi(s + n)$ for the mean output of one piece that carries the
signal $s$.

**Derivation.**

**The average gain.** $m(s) = \int \phi(y)\,p(y - s)\,dy$. The first and second
derivatives of $p(y - s)$ with respect to $s$, at $s = 0$, are
$(y/\sigma^2)\,p(y)$ and $\big((y^2 - \sigma^2)/\sigma^4\big)\,p(y)$, so

$$
m(s) = m(0) + g\,s + \tfrac12\,h\,s^2 + O(s^3), \qquad
g = \frac{E[n\,\phi(n)]}{\sigma^2}, \qquad
h = \frac{E[(n^2 - \sigma^2)\,\phi(n)]}{\sigma^4} .
$$

This needs no derivative of $\phi$, so it covers a threshold too. When $\phi$
has one, integrating by parts with $x\,p(x) = -\sigma^2 p^\prime(x)$ gives
$g = E[\phi^\prime(n)]$, the average slope, and with two, $h = E[\phi^{\prime\prime}(n)]$
(Stein 1981, Ann. Statist. 9, 1135,
[doi:10.1214/aos/1176345632](https://doi.org/10.1214/aos/1176345632)). For a
Gaussian input, the cross-correlation of a function's output with its
input, at any time lag, is this same $g$ times the input's autocorrelation
(Bussgang
1952, MIT Research Laboratory of Electronics Technical Report 216,
[hdl:1721.1/4847](https://hdl.handle.net/1721.1/4847)).

**The sum in step.** The pieces are independent, so
$\operatorname{std}(o \mid 0) = \operatorname{std}\phi(n)\,\lVert c\rVert$. To
first order in the signal the mean moves by $g\sum_k c_k s_k$, and
$\lvert\sum_k c_k s_k\rvert \le \lVert c\rVert\,\lVert s\rVert$ (the
Cauchy–Schwarz inequality), with equality for $c \propto s$. Hence

$$
\mathrm{SNR} = \frac{\lvert g\rvert\,\lVert s\rVert}{\operatorname{std}\phi(n)} = \lvert r\rvert\,\rho, \qquad
r = \frac{\sigma g}{\operatorname{std}\phi(n)} = \frac{E[n\,\phi(n)]}{\operatorname{std}(n)\,\operatorname{std}\phi(n)} = \operatorname{corr}\big(n, \phi(n)\big),
$$

since $E[n] = 0$ makes $E[n\,\phi(n)]$ the covariance of $n$ and $\phi(n)$.
All the functions here have $g \ge 0$. As a correlation, $\lvert r\rvert \le 1$,
and $r = 1$ only if $\phi$ is linear plus a constant. The fraction of SNR²
kept is $r^2$.

**GELU and ReLU.** Each is $x/2$ plus an even function $e(x)$:
${\rm ReLU}(x) = x/2 + \lvert x\rvert/2$, and
${\rm GELU}(x) = x/2 + x\big(\Phi_{\mathcal N}(x) - \tfrac12\big)$
([GELU section](#oct16-s4d-gelu-linear); Hendrycks and Gimpel 2016,
[arXiv:1606.08415](https://arxiv.org/abs/1606.08415)). Because $x\,e(x)$ is
odd and $p$ is even, $E[n\,e(n)] = 0$. So $g = 1/2$ at every $\sigma$, and
${\rm Var}\,\phi(n) = \sigma^2/4 + {\rm Var}\,e(n)$:

$$
r^2 = \frac{\sigma^2/4}{\sigma^2/4 + {\rm Var}\,e(n)} ,
$$

so the even part costs SNR only by adding noise. Also $E\,e(s + n)$ is even
in $s$ (replace $n$ by $-n$), so $m(s) - m(-s) = s$ exactly. For a signal
whose samples come in pairs $\pm s$, the mean of the in-step sum therefore
moves by exactly $g\,\lVert c\rVert\,\lVert s\rVert$, and $\mathrm{SNR} =
r\rho$ holds at any signal strength. For other signals the next term,
$\tfrac12 h\sum_k c_k s_k^2$, is small next to $g\sum_k c_k s_k$ when every
$\lvert s_k\rvert$ is small next to $\sigma$.

**ReLU, closed form.** $E\,{\rm ReLU}(n) = \sigma/\sqrt{2\pi}$ and
$E\,{\rm ReLU}(n)^2 = \sigma^2/2$, so
${\rm Var}\,{\rm ReLU}(n) = \sigma^2\big(\tfrac12 - \tfrac{1}{2\pi}\big)$ and
$r = \tfrac12\big/\sqrt{\tfrac12 - \tfrac{1}{2\pi}} = 1/\sqrt{2 - 2/\pi}$, the
same at every $\sigma$ because $\max(0, x)$ has no scale of its own.

**Threshold at zero, closed form.** Write $H(x) = 1$ for $x > 0$ and 0
otherwise. $E[n\,H(n)] = \int_0^\infty x\,p(x)\,dx = \sigma/\sqrt{2\pi}$, and
$H(n)$ is 0 or 1 with chance 1/2 each, so ${\rm Var}\,H(n) = 1/4$ and
$r = (\sigma/\sqrt{2\pi})/(\sigma/2) = \sqrt{2/\pi}$. The sign function,
$2H(x) - 1$, is a scaled and shifted copy and has the same correlation. Here
$m(s) = \Phi_{\mathcal N}(s/\sigma)$, whose odd part is not linear:
$m(s) - \tfrac12 = p(0)\big(s - s^3/(6\sigma^2)\big) + O(s^5)$, and $h = 0$.

**GELU, closed form.** With $\Phi_{\mathcal N}^\prime(x) = e^{-x^2/2}/\sqrt{2\pi}$,
$\Phi_{\mathcal N}^{\prime\prime}(x) = -x\,\Phi_{\mathcal N}^\prime(x)$, and the Gaussian
integrals $E[e^{-n^2/2}] = 1/\sqrt{1+\sigma^2}$ and
$E[e^{-n^2}] = 1/\sqrt{1+2\sigma^2}$, integrating by parts as above,
$E[n\,f(n)] = \sigma^2 E[f^\prime(n)]$, gives
$E[n\,\Phi_{\mathcal N}(n)] = \sigma^2 E[\Phi_{\mathcal N}^\prime(n)] =
\sigma^2/\sqrt{2\pi(1+\sigma^2)}$ and

$$
E\big[n^2\,\Phi_{\mathcal N}(n)^2\big] = \sigma^2\Big(E\big[\Phi_{\mathcal N}(n)^2\big] + 2E\big[n\,\Phi_{\mathcal N}(n)\,\Phi_{\mathcal N}'(n)\big]\Big),
$$

$$
E\big[n\,\Phi_{\mathcal N}(n)\,\Phi_{\mathcal N}'(n)\big] = \frac{\sigma^2 E\big[\Phi_{\mathcal N}'(n)^2\big]}{1+\sigma^2} = \frac{\sigma^2}{2\pi(1+\sigma^2)\sqrt{1+2\sigma^2}} ,
$$

the last from $E[n\,f(n)] = \sigma^2 E[f^\prime(n)]$ with
$f = \Phi_{\mathcal N}\Phi_{\mathcal N}^\prime$, whose derivative is
$\big(\Phi_{\mathcal N}^\prime\big)^2 - x\,\Phi_{\mathcal N}\Phi_{\mathcal N}^\prime$.
$E[\Phi_{\mathcal N}(n)^2]$ is the chance that two standard normal variables
$Z_1$, $Z_2$, independent of each other and of $n$, both lie below $n$. The
differences $U_i = Z_i - n$ are Gaussian with variance $1 + \sigma^2$ and
correlation $c = \sigma^2/(1 + \sigma^2)$. Writing $U_1 \propto V$ and
$U_2 \propto cV + \sqrt{1 - c^2}\,W$, with $V$ and $W$ independent standard
normal, both are negative in a wedge of the $(V, W)$ plane whose opening is
$\pi/2 + \arcsin c$, and the density of $(V, W)$ is round, so the chance is
$\tfrac14 + \arcsin(c)/(2\pi)$ (a result of Sheppard 1899, Phil. Trans. R.
Soc. Lond. A 192, 101, §27,
[doi:10.1098/rsta.1899.0003](https://doi.org/10.1098/rsta.1899.0003)). These
give the variance, and with $g = 1/2$ the correlation:

$$
\frac{\operatorname{Var}\,\mathrm{GELU}(n)}{\sigma^2} = \frac14 + \frac{1}{2\pi}\Big(\arcsin c - c + \frac{2c}{\sqrt{1+2\sigma^2}}\Big),
$$

$$
r_{\rm GELU}(\sigma) = \Big[1 + \frac{2}{\pi}\Big(\arcsin c - c + \frac{2c}{\sqrt{1+2\sigma^2}}\Big)\Big]^{-1/2} .
$$

As $\sigma \to 0$, $c \to 0$ and $r = 1 - 2\sigma^2/\pi$ to leading order:
near zero the GELU is $x/2$ plus a term of order $x^2$. As
$\sigma \to \infty$, $c \to 1$, the term in parentheses tends to
$\pi/2 - 1$, and
$r \to 1/\sqrt{2 - 2/\pi}$, the ReLU value. In between, $r$ has one minimum,
0.838159 at $\sigma = 1.678$. Other values: 0.966450 at $\sigma = 0.25$,
0.848192 at 4 and 0.854688 at 10.

**Pieces that all carry the same signal.** If each of $N$ pieces carries the
same signal $a$, as in the [$N^{1/4}$ section](#semi-coherent), equal weights
are in step, and the mean of $\sum_k \phi(z_k)$ moves by
$N\big(m(a) - m(0)\big)$ exactly, so

$$
\mathrm{SNR} = \frac{\sqrt N\,\big(m(a) - m(0)\big)}{\operatorname{std}\phi(n)} ,
$$

with, from the same Gaussian integrals,
$m(a) = a\,\Phi_{\mathcal N}(b) + \sigma^2\,\Phi_{\mathcal N}^\prime(b)/\sqrt{1+\sigma^2}$,
$b = a/\sqrt{1+\sigma^2}$, for the GELU;
$a\,\Phi_{\mathcal N}(a/\sigma) + \sigma\,\Phi_{\mathcal N}^\prime(a/\sigma)$ for
the ReLU; $\Phi_{\mathcal N}(a/\sigma)$ for the threshold at zero; and
$a^2 + \sigma^2$ for the square. At $N = 600$, $\rho = 8$, $\sigma = 1$ and
$a = 8/\sqrt{600} = 0.327$ this gives 7.737 for the GELU, 7.736 for the ReLU,
6.271 for the threshold at zero and 1.848 for the square, the
$\rho^2/\sqrt{2N}$ of that section. The GELU and the ReLU are above
$r\rho = 6.804$ and 6.851 because their term $\tfrac12 h\sum_k s_k^2$ is
positive and adds to the linear one (at $\sigma = 1$,
$h = 3/(4\sqrt\pi) = 0.423$ for the GELU, whose second derivative is
$(2 - x^2)\,\Phi_{\mathcal N}^\prime(x)$, and $h = 1/\sqrt{2\pi} = 0.399$ for the
ReLU); the threshold at zero is below
$r\rho = 6.383$ because of its term in $s^3$, $-a^2/6 = -1.8\%$ of the
linear one.

**Even functions keep nothing linear.** If $\phi(-x) = \phi(x)$, then
$x\,\phi(x)$ is odd and $E[n\,\phi(n)] = 0$ at every $\sigma$: $g = 0$ and
$r = 0$. Also $m(-s) = E\,\phi(n - s) = E\,\phi(s - n) = E\,\phi(s + n) = m(s)$,
using first that $\phi$ is even and then that $-n$ has the same
distribution as $n$. So $m$ is even, and

$$
m(s) - m(0) = \tfrac12\,h\,s^2 + O(s^4) .
$$

To leading order each piece responds to its power $s_k^2$, and a weighted
sum to $\sum_k c_k s_k^2$, a sum of powers. With equal weights, and with
$\operatorname{std}(n^2 - \sigma^2) = \sqrt2\,\sigma^2$, its SNR to leading
order is

$$
\mathrm{SNR} = r_2\,\frac{\rho^2}{\sqrt{2K}}, \qquad
r_2 = \frac{\sigma^2 h}{\sqrt2\,\operatorname{std}\phi(n)} = \operatorname{corr}\big(\phi(n),\, n^2 - \sigma^2\big) \le 1 ;
$$

for the square $r_2 = 1$, the $\rho^2/\sqrt{2N}$ of the
[$N^{1/4}$ section](#semi-coherent). Weights in step see nothing: for a
signal in pairs $\pm s$, $\sum_k s_k\big(m(s_k) - m(0)\big) = 0$ at every
order. The energy of a complex channel output, the squared size of a
quantity linear in the data, is even in the data and belongs here. With
equal weights and a signal whose samples add to zero, as for an oscillation
averaged over time ([averaging over the window](#oct7-time-average)), the
first-order term cancels for any function, and the leading term left is this
power term ([averaging after a GELU](#ck-gelu-mean)).

**Only even functions lose the linear part at every spread.**
$E[n\,\phi(n)]$ depends only on the odd part
$\phi_{\rm o}(x) = \big(\phi(x) - \phi(-x)\big)/2$, and with $u = x^2$,

$$
E[n\,\phi(n)] = \frac{1}{\sigma\sqrt{2\pi}}\int_0^\infty \phi_{\rm o}\big(\sqrt u\big)\,e^{-u/(2\sigma^2)}\,du ,
$$

the Laplace transform of $\phi_{\rm o}(\sqrt u)$ at $1/(2\sigma^2)$. If this
vanishes for every $\sigma > 0$, and $\phi$ is continuous and grows no faster
than a power of $x$, then $\phi_{\rm o} = 0$ by the uniqueness of the Laplace
transform (NIST Digital Library of Mathematical Functions, §1.14(iii),
[dlmf.nist.gov/1.14.iii](https://dlmf.nist.gov/1.14.iii)), so $\phi$ is even.
A function that is not even can still lose the linear part at one spread:
$x^3 - 3x$ has $E[n\,\phi(n)] = 3\sigma^4 - 3\sigma^2$, which is zero only at
$\sigma = 1$. The GELU, the ReLU and a threshold at zero keep it at every
spread, with the $r$ above.

**Check.** Python with numpy, scipy, mpmath and PyTorch on the CPU, three
codes (`check_nonlin.py`, `check_nonlin_mp.py` and a third written to check
this section):

- Numerical integration against the Gaussian density, with scipy
  `integrate.quad` and with mpmath at 30 digits: $r$ equals the closed forms
  to $3\times10^{-16}$ and $10^{-31}$ for the ReLU, the threshold at zero, the
  sign and the GELU ($\sigma$ from 0.25 to 10), and is 0 for the square, the
  absolute value, a threshold on $\lvert x\rvert > \sigma$ and $\cos x$
  ($\sigma$ = 0.5, 1, 2). The GELU's mean and mean square agree with the
  formulas above to 20 digits.
- The minimum of $r_{\rm GELU}$: a bounded minimization gives 0.838159 at
  $\sigma = 1.678$, and the root of $dr/d\sigma$ is at $\sigma = 1.678185$,
  where $r = 0.8381593$. The slope changes sign once on 400,001 values of
  $\sigma$ from $10^{-3}$ to $10^3$, and once on 601 values in the second
  code; $r_{\rm GELU}(10^3) = 0.856429$, and at $\sigma = 0.01$
  $r = 0.99993636$ against $1 - 2\sigma^2/\pi = 0.99993634$. PyTorch's
  `nn.GELU()`, the function in ml4gw's S4D layer, equals
  $x\,\Phi_{\mathcal N}(x)$ to $1.8\times10^{-15}$ on $[-12, 12]$ in double
  precision.
- Monte Carlo of $r$ with $10^7$ Gaussian draws per case: GELU 0.90959,
  0.85030, 0.83825 and 0.83907 at $\sigma$ = 0.5, 1, 1.678 and 2; ReLU
  0.85641; threshold at zero 0.79785 (standard errors 0.00005 to 0.00011);
  square 0.00003 and absolute value $-0.00020$ (standard error 0.00032). All
  lie within two standard errors of the closed forms.
- Monte Carlo of the sum: $K$ = 8,192 pieces (4 s at 2048 Hz) at $\rho = 8$,
  each noise draw used with and without the signal, SNR from the measured
  noise spread. Signal $+a$ and $-a$ in turn, 20,000 draws, weights in step:
  GELU $7.225 \pm 0.036$, $6.806 \pm 0.034$ and $6.698 \pm 0.033$ at
  $\sigma$ = 0.5, 1 and 2, against $r\rho$ = 7.276, 6.804 and 6.712; ReLU
  $6.903 \pm 0.035$ against 6.851; threshold at zero $6.403 \pm 0.032$
  against 6.375 from its exact mean (6.383 at first order); square
  $0.001 \pm 0.001$ against 0. Equal weights: GELU $0.2056 \pm 0.0011$,
  $0.2549 \pm 0.0014$ and $0.2537 \pm 0.0014$ against
  $r_2\rho^2/\sqrt{2K}$ = 0.2065, 0.2545 and 0.2540; ReLU
  $0.2422 \pm 0.0013$ against 0.2416; square $0.5006 \pm 0.0027$ against
  $\rho^2/\sqrt{2K} = 0.5$; absolute value $0.4647 \pm 0.0025$ against
  0.4680; threshold at zero $-0.0012 \pm 0.0026$ against 0.
- The same with a 101.3 Hz cosine of random phase, two runs of 8,000 and
  16,000 draws. For the GELU and the ReLU the in-step mean shift is
  $g\lVert s\rVert$ exactly on average over the phase (each value of the
  cosine has its negative at another phase), so dividing the measured shift
  by the exact noise spread tests $r\rho$ itself: the GELU at $\sigma$ = 0.5,
  1, 1.678 and 2 and the ReLU agree with it to 0.04% (at most 2.4 standard
  errors in the first run, 1.5 in the second). The threshold at zero gives
  $6.374 \pm 0.005$ and $6.369 \pm 0.003$ against 6.371, its exact value
  for this cosine averaged over 4,000 phases (the first-order
  $r\rho = 6.383$ lowered by its $s^3$ term). With equal weights, divided by
  the exact spread in the same way, the GELU, the ReLU, the square and the
  absolute value agree with $r_2\rho^2/\sqrt{2K}$ to 0.5% (at most 1.4
  standard errors), and the threshold at zero gives $-0.003 \pm 0.004$ and
  $-0.001 \pm 0.003$ against 0.
- The setting of the [$N^{1/4}$ section](#semi-coherent), 600 pieces of
  0.327 each in unit noise, equal weights, 20,000 draws: GELU
  $7.72 \pm 0.04$ (exact 7.737), ReLU $7.72 \pm 0.04$ (7.736), threshold at
  zero $6.29 \pm 0.03$ (6.271), square $1.847 \pm 0.010$ (1.848). The closed
  forms of $m(a)$ above equal mpmath integration to the digits shown, and so
  do $h$ = 0.423142 (GELU), 0.398942 (ReLU) and 0 (threshold at zero) at
  $\sigma = 1$.
- By numerical integration, $m(a) - m(-a) - a$ is at most
  $1.4\times10^{-15}$ (rounding) in two codes for the GELU and the ReLU at
  $\sigma$ = 0.5, 1 and 2 and $a$ = 0.1, 1 and 3, and $E[n(n^3 - 3n)]$ is
  $-0.5625$, 0 and 36 at $\sigma$ = 0.5, 1 and 2, as $3\sigma^4 - 3\sigma^2$
  gives.
- Our analysis of 15 October, with its own integration and Monte Carlo
  codes, gave the same $r$ to six digits.
- The third code (scipy quadrature) reproduces the
  closed forms, the minimum, $g$, $h$, $r_2$, the exact SNRs of the 600
  pieces and the threshold's 6.375 and 6.371 to the digits shown.

## The 512 Hz bin and the GPU offset {#oct16-s4d-fft-offset}

**Claim** (16 October update): our long-convolution code halves the sample
rate by taking the real FFT of each 4 s window (8,192 samples at 2048 Hz),
keeping its first 2,049 bins (0 to 512 Hz, 0.25 Hz apart), and inverting
them as a real signal of 4,096 samples at 1024 Hz. The last kept bin, at
512 Hz, is complex in general, but it is the Nyquist bin of the new signal,
which must be real. On the GPU, when one call transforms 64 or more signals,
the inverse real FFT then adds $-\mathrm{Im}(X_{512})/4096$ to every output
sample: one constant per window and detector. With 62 or fewer it does not.
Training used batches of 32 windows of two detectors, 64 signals. Where the
rate is not halved, nothing is added.

**Derivation.** For a real signal $x_n$ of even length $M$, the DFT bin at
$M/2$ is $X_{M/2} = \sum_n x_n e^{-i\pi n} = \sum_n x_n(-1)^n$, which is real.
The kept bin is instead bin 2,048 of an 8,192-point transform,
$\sum_n x_n e^{-i\pi n/2}$, whose imaginary part $-\sum_n x_n\sin(\pi n/2)$ is
not zero in general. In the inverse transform of length $M$ = 4,096, the term
of bin $M/2$ is $X_{M/2}(-1)^n/M$; its imaginary part would add
$i\,\mathrm{Im}(X_{M/2})(-1)^n/M$, which a real output cannot hold. PyTorch
documents for its inverse real FFT that "Some input frequencies must be
real-valued to satisfy the Hermitian property. In these cases the imaginary
component will be ignored" (documentation of `torch.fft.irfft`), and NVIDIA
documents for cuFFT that "Complex-to-real (C2R) transforms accept
complex-Hermitian input. For one-dimensional signals, this requires the 0th
element (and the N/2 th input if N is even) to be real-valued, i.e. its
imaginary part should be zero. [...] Otherwise, the behavior of the transform
is undefined" (cuFFT documentation, section 2.3, Fourier Transform Types).
Our code passes a complex bin there, so the GPU result is not defined by
either; the measured behaviour is below. Where the rate is not halved, the
kept bins are the whole spectrum of a real signal, the last one is its true
Nyquist bin, and it is real.

**Check.** On the GPU, random unit-variance data, 2 to 128 signals per call,
compared with numpy in float64 on the same spectra. For 62 signals or fewer
the GPU result differs from numpy's by at most $2.4\times10^{-6}$ (float32
rounding), and the mean difference does not follow
$-\mathrm{Im}(X_{512})/4096$. For 64, 66, 96 and 128 signals the difference is
a constant per signal equal to $-\mathrm{Im}(X_{512})/4096$ to within
$1.0\times10^{-8}$, with an rms residual of $4.0\times10^{-7}$ after
removing it (the offset itself has rms 0.014 to 0.018). The trained networks
were then scored on the same 20,000 test windows with the offset (as in
training) and without it, each with its own read-out:

<div markdown="1">

| network | within 1%, with the offset | without it |
|---|---|---|
| S4D, 32 resonators per channel (S4D-Lin start) | 7.215% | 6.15% |
| S4D, 256 per channel (S4D-Lin start) | 21.23% | 20.575% |
| S4D, 256 per channel, band init | 9.44% | 9.425% |
| free kernels | 39.96% | 39.955% |

</div>

A second code, which computed the channel outputs separately for the
read-out tests of the 16 October update, gave 6.14% and 20.59% without the
offset for the first two. Scores of the same network from different codes
differ by up to 0.03 points, because of near-ties between neighbouring
chirp-mass bins (1 to 6 of 20,000 decisions).

## Inverted dropout keeps only averages that are linear in the dropped values {#oct16-dropout-linear}

**Claim** (16 October update): in training, inverted dropout of rate $p$
replaces each value $v$ by $\xi v$, where $\xi = 1/(1-p)$ with probability
$1-p$ and $\xi = 0$ with probability $p$, drawn anew for every example at
every training step; in evaluation it does nothing. Then $E[\xi] = 1$,
$E[\xi^2] = 1/(1-p)$ and ${\rm Var}[\xi] = p/(1-p)$, which are 1, 1.25 and
0.25 at $p = 0.2$. The average over dropout patterns of any quantity that is
linear in the dropped values (a sum, a mean over time, a convolution, a
linear layer) equals its value in evaluation. For a quantity that is not
linear in them the two differ in general: the average of a nonlinear
function is not the function of the average. At $p = 0.2$ the square of a
dropped value is 1.25 times larger on average; ${\rm GELU}(\xi v)$ averages
0.894 at $v = 1$, against ${\rm GELU}(1) = 0.841$, and $-0.106$ at $v = -1$,
against $-0.159$; a GLU whose two halves are the same dropped value averages
0.777 at $+1$, against 0.731, and $-0.223$ at $-1$, against $-0.269$.

**Derivation.** From the two values of $\xi$,

$$
E[\xi] = (1-p)\,\frac{1}{1-p} = 1, \qquad
E[\xi^2] = (1-p)\,\frac{1}{(1-p)^2} = \frac{1}{1-p}, \qquad
{\rm Var}[\xi] = \frac{1}{1-p} - 1 = \frac{p}{1-p}.
$$

Let $L(v) = b + \sum_i w_i v_i$ be linear in values $v_i$, each multiplied
by its own factor $\xi_i$. By linearity of expectation,

$$
E\left[L(\xi v)\right] = b + \sum_i w_i\,E[\xi_i]\,v_i = L(v).
$$

This needs no independence between the $\xi_i$, so it also holds for
channel dropout, where one factor multiplies every time sample of a
channel. For any function $f$ of one dropped value,

$$
E\left[f(\xi v)\right] = (1-p)\,f\!\left(\frac{v}{1-p}\right) + p\,f(0).
$$

For $f(x) = x^2$ this is $v^2/(1-p)$, 1.25 times the dropout-off value at
$p = 0.2$. With ${\rm GELU}(x) = x\,\Phi_{\mathcal N}(x)$, $\Phi_{\mathcal
N}$ the standard normal cumulative distribution (Hendrycks and Gimpel 2016,
[arXiv:1606.08415](https://arxiv.org/abs/1606.08415)), and ${\rm GLU}(a, b)
= a\,\sigma(b)$, $\sigma(x) = 1/(1 + e^{-x})$ (Dauphin, Fan, Auli and
Grangier, ICML 2017, [arXiv:1612.08083](https://arxiv.org/abs/1612.08083)),
the same formula gives the GELU and GLU numbers in the claim.

Srivastava et al. chose the scaling so that "for any hidden unit the
expected output (under the distribution used to drop units at training
time) is the same as the actual output at test time" (JMLR 15, 1929 (2014),
section 1). That is a statement about each dropped value; by linearity it
carries over to anything linear in the dropped values, and to nothing else.
Their section 10 states that multiplying the kept values by $1/q$ in
training, with $q$ the probability of keeping a value (their $p$), is
equivalent to scaling the weights at test time, "with appropriate scaling
of the learning rate and weight initializations at each layer". PyTorch
uses that form; the documentation of `nn.Dropout` (PyTorch 2.10) reads "the
outputs are scaled by a factor of 1/(1−p) during training. This means that
during evaluation the module simply computes an identity function".
`nn.Dropout1d`, the version our S4D layers use, zeroes whole channels; it
follows SpatialDropout
(Tompson, Goroshin, Jain, LeCun and Bregler, CVPR 2015,
[arXiv:1411.4280](https://arxiv.org/abs/1411.4280)).

Ma et al. write the dropout-off network as an approximation to the average
over dropout patterns, $E_S[H^{(L)}(x, S; \theta)] \approx h^{(L)}(x, E[S];
\theta)$, and call the difference the inference gap (ICLR 2017,
[arXiv:1609.08017](https://arxiv.org/abs/1609.08017), section 2.3,
equation 3). It is zero for a layer that is linear plus a constant; for it
to be zero for every input, "essentially the transformation function f has
to be affine" (their section 4). Li, Chen, Hu and Yang find that "Dropout
would shift the variance of a specific neural unit when we transfer the
state of that network from train to test", and name the resulting mismatch
with the variance that a batch normalization stores during training the
variance shift (CVPR 2019,
[arXiv:1801.05134](https://arxiv.org/abs/1801.05134)). For one dropped
value the spread over patterns is ${\rm Var}[\xi]\,v^2 = 0.25\,v^2$ in
training and zero in evaluation.

**Check.** PyTorch 2.10, CPU (`checks_linear.py`). `nn.Dropout1d(0.2)` in
training mode on a tensor of ones of shape 1,000 × 64 × 100 (examples ×
channels × time) returns only the values 0 and 1.25, constant along time
within each channel, with 20.07% of the channels zeroed and mean 0.9991. In
evaluation mode it returns its input unchanged, and with $p = 0$ it returns
its input unchanged in training mode too. $10^7$ draws of $\xi$ at $p =
0.2$: mean 0.99992, mean square 1.24990, variance 0.25006. The GELU averages
were computed over the two values of $\xi$ with
`torch.nn.functional.gelu` in double precision, the GLU averages with
numpy.

## Where the dropouts sit in our S4D regressors {#oct16-dropout-where}

**Claim** (16 October update): the real S4D 64 × 32 × 4 regressors have
eight channel dropouts with $p = 0.2$, two in each of the four blocks.
Between each of them and the output there is at least one step that is not
linear (a GLU, a later group norm or GELU, or the maximum over time), with
one exception: the second dropout of the fourth block, when the read-out is
the mean over time. So with the mean read-out seven of the eight dropouts
can shift the average output, and with the maximum all eight. The complex
energy-and-maximum regressor has six, all in blocks 1 to 3.

**Derivation** (from the code of the runs). A linear layer turns the two
detector samples at each time into 64 channels, $x_0$. Block $k = 1, \dots,
4$ then computes

$$
z = {\rm GN}_k(x_{k-1}), \quad
u = {\rm GELU}\big(K_k * z + d_k \odot z\big), \quad
h = {\rm GLU}\big(W_k\,\Delta^{(1)}_k(u) + c_k\big), \quad
x_k = x_{k-1} + \Delta^{(2)}_k(h).
$$

${\rm GN}_k$ is a group norm (32 groups of 2 channels). $K_k *$ convolves
each channel with its own S4D kernel, as long as the window, and $d_k$ is a
learned multiple of each channel. $W_k$ and $c_k$ form a linear layer,
applied at each time, from 64 to 128 channels, and the GLU splits these
into halves $a$ and $b$ and returns $a\,\sigma(b)$, 64 channels.
$\Delta^{(1)}_k$ and $\Delta^{(2)}_k$ are channel dropouts: the first inside
the S4D layer (`S4D` in ml4gw), the second in the block (`S4Model`). The
read-outs apply a linear layer to $\frac1T \sum_t x_4(t)$ (mean) or to
$\max_t x_4(t)$ (maximum), each channel separately. The group norms act only
on the input of each block's branch, so the series that the read-out pools
is never normalized: $x_4 = x_0 + \sum_k \Delta^{(2)}_k(h_k)$.

Following each dropout to the output:

- $\Delta^{(2)}_4$ is followed by the residual sum, the pooling and the
  linear layer. With the mean this path is linear, so this dropout leaves
  the average output unchanged
  ([previous section](#oct16-dropout-linear)); with the maximum it does not.
- $\Delta^{(1)}_4$ is followed by the GLU, which multiplies a linear
  function of the dropped values by $\sigma$ of another.
- $\Delta^{(1)}_k$ and $\Delta^{(2)}_k$ for $k \le 3$ are followed by the
  group norm, GELU and GLU of every later block (and $\Delta^{(1)}_k$ by
  its own block's GLU).

The complex regressor runs blocks 1 to 3 in the same way and then computes
a linear layer of $\max_t \log\big(1 + |K^{\rm c} * {\rm GN}_4(x_3)|^2\big)$,
with $K^{\rm c}$ a complex S4D kernel; the fourth block's real S4D layer and
its two dropouts are not used.

**Check.** I built the three regressors with the settings of the runs (64
channels, state size 32, 4 blocks, a group norm with 32 groups before each
block's S4D layer, dropout 0.2; PyTorch 2.10, CPU; `checks_arch.py`) and
recorded which dropout steps with $p > 0$ run in one pass through the
network in training mode: eight for the real mean and the real maximum
regressors (after the GELU inside each S4D layer and after each GLU), six
for the complex regressor (blocks 1 to 3). The real regressors have 51,010
learned numbers (parameters). Validation runs in evaluation mode: our
training runs in PyTorch Lightning 2.2.1, whose documentation of the hook
`on_validation_model_eval` reads "The validation loop by default calls
`.eval()` on the LightningModule before it starts", and our training code
does not change that hook. Each validation pass has 64 batches of 32
windows (`val_batches` and `batch_size` in the run configurations).

## A maximum adds a bias of its own {#oct16-dropout-max}

**Claim** (16 October update): for any random time series $y(t)$,
$E[\max_t y(t)] \ge \max_t E[y(t)]$. Comparing training with evaluation,
where the series is $y_{\rm off}(t)$,

$$
E\Big[\max_t y(t)\Big] - \max_t y_{\rm off}(t)
= \underbrace{E\Big[\max_t y(t)\Big] - \max_t E[y(t)]}_{J\ \ge\ 0}
+ \underbrace{\max_t E[y(t)] - \max_t y_{\rm off}(t)}_{G} .
$$

$J$, the excess of the maximum, is never negative. $G$ is zero when every
step between the dropouts and the maximum is linear, because then
$E[y(t)] = y_{\rm off}(t)$; otherwise it can have either sign. A mean over
time has no term like $J$: its change is $\frac1T \sum_t (E[y(t)] - y_{\rm
off}(t))$, zero in the linear case.

**Derivation.** For every dropout pattern and every time $s$, $\max_t y(t)
\ge y(s)$. Averaging over patterns, $E[\max_t y(t)] \ge E[y(s)]$ for every
$s$, so also for the $\hat s$ at which $E[y(s)]$ is largest. Hence $J =
E[\max_t y(t) - y(\hat s)] \ge 0$: it is zero only if $\hat s$ holds the maximum
for (almost) every pattern, and it grows with how often, and by how much,
other times overtake $\hat s$. This is Jensen's inequality, $f(E\,x) \le
E\,f(x)$ for a convex function $f$ (Boyd and Vandenberghe, *Convex
Optimization*, Cambridge University Press 2004, section 3.1.8, equation
3.5), for $f(y) = \max_t y(t)$, which is convex (their section 3.1.5). The
split into $J$ and $G$ adds and subtracts $\max_t E[y(t)]$. When the steps
are linear, $E[y(t)] = y_{\rm off}(t)$
([linear section](#oct16-dropout-linear)) and $G = 0$.

**Check.** In the toy model ([next section](#oct16-dropout-toy)) only $J$
is present, and the average maximum with dropout exceeded the dropout-off
maximum in all 200 draws. In the trained real maximum regressor (dropout
0.2, epoch 232), on the first 512 cached clean windows with a signal
([measurement](#oct16-dropout-same-windows)), I averaged each window's 64
maxima over 16 dropout patterns (`offset_check.py`). Of the 32,768
window-channel pairs, the average was above the dropout-off value for
76.7%; above it by more than three times the uncertainty of a 16-pattern
average (the patterns' standard deviation divided by 4) for 33.5%, and
below it by more than three times for 1.2%. If the 16 values were Gaussian,
chance alone would put 0.45% of pairs beyond three times on each side
(Student-t distribution with 15 degrees of freedom). Since $J$ can only
raise the average, the pairs that are clearly below need $G < 0$, which only
the nonlinear steps can produce. The mean of all 64 maxima was 0.652 with
dropout off and 0.778 averaged over the patterns, 1.19 times larger.

## A toy: the maximum of a sum of 64 channels under channel dropout {#oct16-dropout-toy}

**Claim** (16 October update): take 64 channels of independent standard
Gaussian values over 1,000 time steps, add the channels (a linear layer with
all weights 1), and read the sum out by its maximum or its mean over time.
With channel dropout $p = 0.2$ on the 64 channels, the mean over time is
unchanged on average and the average maximum is 11.8% higher, close to
$1/\sqrt{1-p} - 1$. The only step between the dropout and the read-out is
linear, so the whole rise is the excess $J$ of the
[previous section](#oct16-dropout-max). The more the channels share, the
smaller the rise: 0.7% when a peak common to all channels dominates.

**Setup.** Draw $g_c(t)$, $c = 1, \dots, 64$, $t = 1, \dots, 1000$,
independent standard Gaussians, once, and keep them fixed, as a trained
network's channels are fixed for a given input. Without dropout the read-out
sees $y_0(t) = \sum_c g_c(t)$. With channel dropout it sees $y_\xi(t) =
\sum_c \xi_c\, g_c(t)$, one factor $\xi_c$ per channel for all $t$.

**Derivation.** The mean over time is linear in the $\xi_c$, so its average
is unchanged ([linear section](#oct16-dropout-linear)). For the maximum, fix
a pattern that keeps $K$ channels. Then $y_\xi(t) = \frac{1}{1-p}
\sum_{c\ \rm kept} g_c(t)$ is, at each $t$, Gaussian with mean 0 and
standard deviation $\sigma_\xi = \sqrt{K}/(1-p)$, independently across $t$;
without dropout $\sigma_0 = \sqrt{64} = 8$. For $T$ independent Gaussian
values with mean 0 and standard deviation $\sigma$, $\max_t \sigma Z_t =
\sigma \max_t Z_t$, so the average maximum is $\sigma\,e_T$, where $e_T =
\int x\,T\,\varphi(x)\,\Phi_{\mathcal N}(x)^{T-1}\,dx$ is the average
maximum of $T$ standard Gaussian values ($\varphi$ their density); $e_{1000}
= 3.241$. Averaging over the channel values and over the patterns, with $K$
binomial with 64 trials and probability $1-p$,

$$
\frac{E[\max_t y_\xi(t)]}{E[\max_t y_0(t)]}
= \frac{E[\sigma_\xi]}{\sigma_0}
= \frac{E\big[\sqrt{K}\,\big]}{(1-p)\sqrt{64}} = 1.1175
\quad (p = 0.2).
$$

Since $K$ varies little around $64(1-p)$, this is close to $1/\sqrt{1-p} =
1.1180$: dropout multiplies the variance of the sum by $E[\xi^2] = 1/(1-p)$,
and the maximum follows the standard deviation.

If the channels share a part, $g_c(t) = a\,s(t) + n_c(t)$, with $s(t)$ a
peak common to all channels (a Gaussian bump of height 1 and width 20
samples centred at $t = 700$) and $n_c(t)$ independent standard Gaussians,
the shared part enters the sum as $a\,s(t)\sum_c \xi_c$. While the peak of
$s$ decides where the maximum is, that term is linear in the $\xi_c$ and
adds nothing on average; only the independent parts, whose spread dropout
widens, raise the maximum, and they matter less as $a$ grows.

**Check.** numpy (`toy_mc.py`, seed 20261015; a rerun on 16 October gave
the same numbers to 12 digits), 10,000 dropout patterns per draw of the
channels:

- 200 draws: average dropout-off maximum 25.88, average maximum with
  dropout 28.94, ratio 1.118 (prediction 1.1175). Per draw the ratio was
  $1.124 \pm 0.057$ (mean and standard deviation over draws), from 1.006 to
  1.300, above 1 in all 200. The mean over time agreed with its dropout-off
  value within the uncertainty of the 10,000-pattern average: largest
  difference 0.0032, typical uncertainty 0.0013; the differences divided by
  their uncertainties had standard deviation 0.98 (1 is expected for pure
  sampling noise), largest 2.7.
- Other rates, 50 draws each, ratio of the average maxima (prediction
  $E[\sqrt K]/((1-p)\sqrt{64})$ in brackets): $p = 0.1$: 1.056 (1.054);
  $p = 0.3$: 1.184 (1.194); $p = 0.5$: 1.428 (1.411).
- A shared peak, 50 draws each: $a = 0$: 1.114; $a = 0.5$: 1.036; $a = 1$:
  1.025; $a = 3$: 1.007.
- $e_{1000}$ by numerical integration (scipy `integrate.quad`): 3.24144;
  from 20,000 simulated sets of 1,000 values: $3.2414 \pm 0.0025$.

## From shifted pooled values to a chirp-mass offset {#oct16-dropout-offset}

**Claim** (16 October update): in each of our S4D regressors the read-out
ends in a linear layer, $\mu = b + \sum_c w_c m_c$, of the 64 pooled values
$m_c$, and the chirp-mass estimate is $\hat{\mathcal M} = 1.8 + 0.55\,\mu$
M☉. Training pulls the average of $\mu$ over dropout patterns toward the
true value. In evaluation the estimate differs from that average by exactly
$\Delta\hat{\mathcal M} = 0.55\,\Delta\mu$ M☉, with $\Delta\mu = \sum_c w_c
(m_c^{\rm off} - E[m_c])$. A shift alone uses up the whole 1% margin once
$|\Delta\mu|$ reaches $0.01\,\mathcal M/0.55$: 0.0155 at a chirp mass of
0.855 M☉ and 0.0500 at 2.749 M☉. The measured median of
$|\Delta\hat{\mathcal M}|/\mathcal M$ is 4.9% for the real maximum read-out
at epoch 232, 1.5% for the real mean read-out at epoch 48, and 0.11% for the
complex energy-and-maximum read-out at epoch 62.

**Derivation.** The estimate is $\hat{\mathcal M} = \bar y + s\,\mu$, with
the target's standardization $\bar y = 1.8$ M☉ and $s = 0.55$ M☉ (`y_mean`
and `y_std` in the run configurations). In training each example is scored
under its own dropout pattern $\xi$, by a β-weighted Gaussian likelihood
(Seitzer et al. 2022, [arXiv:2203.09168](https://arxiv.org/abs/2203.09168)).
For a predicted variance that is the same for every pattern, that term
depends on the estimate only through $(\tau - \mu_\xi)^2$, with $\tau =
(\mathcal M - \bar y)/s$, and

$$
E_\xi\big[(\tau - \mu_\xi)^2\big] = \big(\tau - E_\xi[\mu_\xi]\big)^2 +
{\rm Var}_\xi[\mu_\xi] ,
$$

so lowering the average loss pulls $E_\xi[\mu_\xi]$ toward $\tau$. (The
loss also has a penalty, with weight 0.2, when the estimates in a batch
spread less than the true values; I leave it out of this argument.) The
read-out is linear in the $m_c$, so $E_\xi[\mu_\xi] = b + \sum_c w_c
E[m_c]$ ([linear section](#oct16-dropout-linear)), and $\mu_{\rm off} -
E_\xi[\mu_\xi] = \sum_c w_c (m_c^{\rm off} - E[m_c])$ with no
approximation. An estimate is within 1% if $|\hat{\mathcal M} - \mathcal M|
< 0.01\,\mathcal M$; a shift alone uses up that margin when $0.55\,|\Delta
\mu| = 0.01\,\mathcal M$.

**Check.** On the first 512 cached clean windows with a signal
([measurement](#oct16-dropout-same-windows)) I compared each window's
dropout-off estimate with the average of the estimates from 16 dropout
patterns (`offset_check.py`, `diag_cpu.py`). The smallest and largest chirp
masses among them are 0.855 and 2.749 M☉.

- Real maximum, dropout 0.2, epoch 232: mean of the 64 maxima 0.652 off,
  0.778 averaged over patterns. $\Delta\mu$ averaged $-0.138$ (median
  $-0.133$, standard deviation 0.177 over windows), $-0.076$ M☉ in chirp
  mass. The dropout-off estimates moved by a median of 4.9% of the true
  chirp mass, downward for 70% of the windows, and by more than 1% for 91%.
  Within 1%: 9.4% of the windows with dropout off, 58.7% for single
  patterns, 87.7% for the 16-pattern average. Median error: 4.9% with
  dropout off, 0.44% for the average.
- Real maximum, dropout 0.2, epoch 63: $\Delta\mu$ averaged $-0.213$; median
  shift 6.1%, mean shift $-5.4\%$. Within 1%: 14.3% off, 70.3% for the
  average.
- Real mean, dropout 0.2, epoch 48: mean of the 64 means over time 0.120
  off, 0.109 averaged over patterns (0.914 times). $\Delta\mu$ averaged
  $-0.046$; median shift 1.5%, mean shift $-0.88\%$, so more than half of the
  windows moved by more than 1%. Within 1%: 37.7% off, 86.9% for the
  average.
- Complex energy and maximum, dropout 0.2, epoch 62: mean of the 64 maxima
  of the log energies 2.311 off, 2.329 averaged over patterns (1.008
  times). $\Delta\mu$ averaged $+0.0005$; median shift 0.11%. Within 1%:
  96.3% off, 95.7% for the average.

## Same weights, same windows: how the dropout-off and dropout-on numbers were measured {#oct16-dropout-same-windows}

**Claim** (16 October update): the table "The same weights with dropout off
and on" on the update page.

**Method.** The windows are the first 4,096 of 50,400 that our training
pipeline produced and stored on 7 October from the training waveforms,
with SNR drawn from a power law with index −3 between 8 and 100 and a
signal in each window with probability 0.96. The 3,915 of them that carry a
signal have SNR from 8.00 to 99.63 and chirp mass from 0.851 to 2.750 M☉.
Each network gets the clean whitened signal, as in training. I loaded the
last checkpoint of each run and, for the dropout-0.2 maximum run, also
epoch 63, which was kept because it was that run's best by validation. For
each checkpoint: the estimates with dropout off (evaluation mode); with dropout
on (training mode) for three random seeds, each scored on its own and the
three fractions averaged; and on the first 512 windows, the average of the
estimates from 16 dropout patterns (Monte Carlo dropout; Gal and
Ghahramani, ICML 2016, [arXiv:1506.02142](https://arxiv.org/abs/1506.02142),
section 4). An estimate is within 1% if it differs from the true chirp mass
by less than 1% of it. The pooled value is the mean, over windows and
channels, of the 64 numbers the final linear layer receives: maxima over
time, means over time, or maxima of the log energies. CPU, PyTorch 2.10, 32
windows per batch, peak memory 1.6 GB (`diag_cpu.py`, 15 October).

**Results.** Within 1% with dropout off, with dropout on (the three seeds in
brackets), and for the 16-pattern average (dropout off on the same 512
windows in brackets); then the pooled value off and on:

- Real maximum, dropout 0.2, epoch 232: 8.2%; 59.1% (59.6, 58.6, 59.0);
  87.7% (9.4%). Pooled 0.659 off, 0.788 on (1.196 times). Median error
  5.04% off, 0.81% on; mean signed error $-3.21\%$ off, $-0.20\%$ on.
- Real maximum, dropout 0.2, epoch 63: 13.0%; 39.5% (39.5, 39.8, 39.3);
  70.3% (14.3%). Pooled 0.885 off, 1.113 on (1.257 times). Median error
  6.39% off, 1.31% on; mean signed error $-5.77\%$ off, $-0.20\%$ on.
- Real mean, dropout 0.2, epoch 48: 35.5%; 51.3% (50.6, 52.6, 50.8); 86.9%
  (37.7%). Pooled 0.1179 off, 0.1065 on (0.903 times). Median error 1.59%
  off, 0.97% on; mean signed error $-0.96\%$ off, $+0.01\%$ on.
- Complex energy and maximum, dropout 0.2, epoch 62: 96.1%; 88.9% (88.9,
  89.2, 88.6); 95.7% (96.3%). Pooled 2.316 off, 2.334 on (1.008 times).
  Median error 0.31% off, 0.40% on.
- Real maximum, dropout 0, epoch 29 (the latest checkpoint on 15 October):
  90.0% off and 90.0% for every seed on; pooled 2.014 in both modes, as
  expected with nothing to switch.

Epochs 5 and 30 of the dropout-0.2 maximum run were measured on 14 October
on the same 3,915 windows: within 1% 14.7% off and 4.6% on at epoch 5, 0.1%
off and 31.3% on at epoch 30, and pooled values 0.905 off and 1.184 on at
epoch 30 (1.308 times). Those checkpoints were overwritten later and that
script was not kept, so how many dropout patterns the "on" values average
is not recorded.

## Why the energy-and-maximum read-out moves little {#oct16-dropout-energy}

**Claim** (16 October update): two features of the complex
energy-and-maximum regressor set it apart from the real ones. No dropout
acts after block 3, so none acts directly on the values that the maximum
picks from.
And the values entering the energy pass a group norm that recomputes, for
each example and in both modes, the mean and the standard deviation of each
pair of channels over the window, so any change that dropout makes to a
pair's overall level and size is divided out in the same way in training
and in evaluation. Measured: its pooled values are 1.008 times larger with
dropout on, against 1.196 for the real maximum read-out and 0.903 for the
real mean; its dropout-off estimates move by a median of 0.11%, against
4.9% and 1.5%. I have not tested which of the two features matters, nor
whether the energy and the logarithm play a part.

**Derivation.** The group norm here has 32 groups of 2 channels (ml4gw's
`GroupNorm1D`; group normalization: Wu and He, ECCV 2018,
[arXiv:1803.08494](https://arxiv.org/abs/1803.08494)). For each example and
each group $g$ it computes the mean $m_g$ of the two channels over all
times, and $s_g = (\langle x^2 \rangle_g - m_g^2 + \epsilon)^{1/2}$ with
$\epsilon = 10^{-5}$, and returns $\gamma_c\,(x_c(t) - m_g)/s_g + \beta_c$,
with $\gamma_c$ and $\beta_c$ learned per channel. If a dropout pattern
changes a group's values to $\alpha x + \delta$, with $\alpha > 0$ and
$\delta$ the same for both channels and all times, then $m_g \to \alpha m_g
+ \delta$ and $s_g \to \alpha s_g$ (up to $\epsilon$), and the output is
unchanged. It computes $m_g$ and $s_g$ from its input in evaluation too and
stores nothing from training, so the mismatch that Li et al. describe for a
batch normalization, a variance stored in training and applied in
evaluation ([linear section](#oct16-dropout-linear)), cannot occur in it.
What a dropout pattern changes in other ways, the shape over time and the
balance between the two channels of a pair, passes through. In the real
regressors the group norms act only on the input of each block's branch,
and the series the read-out pools is a sum of dropped branch outputs that
is never normalized ([where the dropouts sit](#oct16-dropout-where)).

**Check.** `GroupNorm1D` with 64 channels and 32 groups, random $\gamma_c$
and $\beta_c$, on random input of shape 4 × 64 × 8,192 (PyTorch 2.10, CPU;
`checks_arch.py`): multiplying each group by a random $\alpha$ between 0.5
and 2.5 and adding a random offset changes the output by at most $9 \times
10^{-5}$ (from $\epsilon$ and single-precision rounding), and the outputs
in training and evaluation mode are identical. The pooled values and
shifts are from the [same-windows measurement](#oct16-dropout-same-windows)
and the [offset section](#oct16-dropout-offset).
