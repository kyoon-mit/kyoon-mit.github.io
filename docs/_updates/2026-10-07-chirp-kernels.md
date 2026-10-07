---
title: "From damped tones to chirps: a state-space layer built for inspirals"
date: 2026-10-07
math: true
summary: >-
  A step-by-step look at what an S4D layer actually computes, why that suits a
  Project 8 tone and not a BNS chirp, and a proposed replacement: a layer whose
  kernels are physical chirps with a learned chirp mass, followed by the
  energy-and-maximum step a matched filter uses. A proposal, not yet tested.
---

{%- assign u = '/projects/bns/updates/' -%}

The [matched-filter benchmark]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }})
showed that the 4 s window holds the chirp mass to 2% for almost every event
above SNR 8, and our network gets 16 to 29% there. This entry works out why,
starting from what one S4D layer computes, and ends with a layer designed
for the job. Figures use a toy setup: a Newtonian chirp sampled at 2048 Hz in
4 s of white noise (the whitened data the network sees).

## 1. What an S4D layer computes

A state-space model reads an input $$u(t)$$ through a hidden state $$x(t)$$:

$$
x'(t) = A\,x(t) + B\,u(t), \qquad y(t) = C\,x(t).
$$

Because the system is linear and does not change in time, the output is the
input convolved with one fixed kernel:

$$
y(t) = \int_0^\infty K(s)\,u(t-s)\,ds, \qquad K(s) = C\,e^{sA}\,B .
$$

**Proof.** The equation for $$x$$ is linear with constant coefficients, so
its solution from rest is $$x(t) = \int_0^\infty e^{sA} B\, u(t-s)\, ds$$
(differentiate under the integral to check). Multiply by $$C$$. $$\square$$

**S4D makes $$A$$ diagonal.** In general $$A$$ is a full matrix, so every
state can feed every other state. S4D (the "D" stands for diagonal; Gu,
Gupta, Goel and Ré, 2022) keeps only the diagonal: each state talks to
itself and nothing else. The code we use stores $$A$$ as a plain list of
complex numbers, one per state,

$$
a_n = -\alpha_n + i\,\omega_n ,
$$

with a negative real part (so each state fades instead of blowing up) and an
imaginary part that sets how fast it rotates.

**Why that splits the kernel into separate states.** The kernel needs
$$e^{sA}$$, which is defined by the same series as an ordinary exponential:
$$e^{sA} = I + sA + \tfrac{1}{2}(sA)^2 + \dots$$. For a diagonal matrix,
multiplying it by itself just multiplies the diagonal entries:

$$
\begin{pmatrix} a_1 & \\ & a_2 \end{pmatrix}^{2} = \begin{pmatrix} a_1^2 & \\ & a_2^2 \end{pmatrix}.
$$

Every power stays diagonal, so the whole series stays diagonal, and each
diagonal entry is the ordinary series for one number:

$$
e^{sA} = \begin{pmatrix} e^{s a_1} & & \\ & e^{s a_2} & \\ & & \ddots \end{pmatrix}.
$$

Sandwiching this between the row $$C$$ and the column $$B$$ just picks out
each diagonal entry, weights it by $$C_n B_n$$, and adds them up:

$$
K(s) = C\,e^{sA}B = \sum_n C_n B_n\, e^{s a_n} = \sum_{n} c_n\, e^{-\alpha_n s}\, e^{i \omega_n s}, \qquad c_n = C_n B_n .
$$

The last step uses $$e^{s a_n} = e^{-\alpha_n s}\,e^{i\omega_n s}$$: a fade
times a rotation. So the kernel is a plain sum, one independent term per
state, with no state influencing another.

One practical detail: the states come in complex-conjugate pairs, so each
pair adds up to a real cosine. That is why the code's formula below has
$$2\,\mathrm{Re}$$ and sums over only half the states.

Each state is a **damped tone**. A *tone* is a pure sinusoid: one fixed
frequency, like a tuning fork, $$\cos(\omega t + \varphi)$$. A *damped*
tone is a sinusoid whose amplitude fades, $$e^{-\alpha t}\cos(\omega t +
\varphi)$$, like the fork's ring dying out. State $$n$$ has frequency
$$\omega_n$$ and fades at rate $$\alpha_n$$. The layer's kernel is a weighted
sum of them. In the code
we use (ml4gw's `S4DKernel`) each channel has 32 such tones, discretized with
a step $$\Delta t$$, so the kernel is

$$
K_\ell = 2\,\mathrm{Re}\sum_n C_n \frac{e^{\Delta t\, a_n}-1}{a_n}\, e^{\Delta t\, a_n \ell}, \qquad \ell = 0, 1, \dots, L-1 .
$$

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/s4d_kernel.png"
   alt="Three damped cosines with different frequencies and decay times, and their sum"
   label="An S4D kernel"
   caption="Top: three states, each a tone that fades. Bottom: the layer's kernel is their weighted sum." %}

**From a tone to the model's parameters.** In the code, each state's tone is
set by three learned numbers and one per-channel step size:

- `A_imag` (one per state) sets the frequency. The kernel advances by
  $$\Delta t \cdot$$`A_imag` radians per sample, so the tone's frequency in
  hertz is $$f_n = \Delta t\,\omega_n\, f_s / 2\pi$$, with $$f_s$$ = 2048 Hz.
  It is initialized at $$\omega_n = \pi n$$, an evenly spaced comb.
- `log_A_real` (one per state) sets the fade: $$\alpha_n = e^{\texttt{log\_A\_real}}$$.
- `log_dt` (one per channel) sets $$\Delta t$$, which scales all of that
  channel's frequencies and fades together.
- `C` (one complex number per state) sets how loud each tone is in the sum
  and its starting phase.

In the architecture, `d_state` = 64 means 32 tones per channel (they come
in conjugate pairs), and `d_model` = 128 means 128 channels, each with its
own 32 tones. Channels are mixed only after the convolution, by a pointwise
layer. So one channel can be a sum of at most 32 tones.

**Memory.** A tone with decay $$\alpha_n$$ forgets the input after about
$$1/(\Delta t\,\alpha_n)$$ samples. In our trained models the median is 13 to
46 samples, 6 to 22 ms. The inspiral we need to integrate lasts seconds.

## 2. What the data holds: a chirp

Far from merger, a binary's gravitational-wave frequency rises as

$$
f(\tau) = \frac{1}{8\pi}\left(\frac{5}{\tau}\right)^{3/8}\left(\frac{G\mathcal{M}}{c^3}\right)^{-5/8},
$$

where $$\tau$$ is the time left to merger and $$\mathcal{M}$$ the chirp mass.
The phase is the integral of the frequency,
$$\Phi(\tau) = -2\left(\tau\, c^3 / 5G\mathcal{M}\right)^{5/8}$$,
and the signal is $$h(t) = A(\tau)\cos\Phi(\tau)$$ with
$$A \propto \tau^{-1/4}$$. The chirp mass sets how fast the frequency sweeps.
Over a 4 s window the signal goes through hundreds of cycles, and a 1%
change in $$\mathcal{M}$$ shifts the phase near merger by many radians. That
phase is where the chirp mass is measured.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/chirp.png"
   alt="A BNS chirp waveform in its last 0.4 seconds, and the frequency against time for chirp masses 1.2 and 1.8"
   label="A BNS chirp"
   caption="Top: the waveform before merger. Bottom: its frequency sweeps upward; heavier systems sweep faster and merge at lower frequency." %}

## 3. The optimal way to find it: the matched filter

Suppose the whitened data is $$u = h + n$$ with white noise $$n$$ of unit
variance, and we score it with any linear filter $$w$$:
$$s = \langle w, u\rangle = \sum_t w(t)\,u(t)$$.

**Claim.** The signal-to-noise ratio of $$s$$ is largest when $$w \propto h$$.

**Proof.** The signal part of $$s$$ is $$\langle w, h\rangle$$. The noise
part has variance $$\langle w, w\rangle$$, because the noise samples are
independent with unit variance. So

$$
\mathrm{SNR}^2(w) = \frac{\langle w,h\rangle^2}{\langle w,w\rangle} \le \frac{\langle w,w\rangle\,\langle h,h\rangle}{\langle w,w\rangle} = \langle h,h\rangle ,
$$

by Cauchy–Schwarz, with equality exactly when $$w$$ is a multiple of $$h$$. $$\square$$

Two details make this usable:

- **Unknown merger time.** Score every shift at once. Correlating with $$h$$
  ending at time $$t$$ is a convolution with $$h$$ reversed in time, which is
  exactly the operation in section 1:
  $$z(t) = \sum_{\ell} h(T-\ell)\, u(t-\ell)$$.
- **Unknown phase.** The signal's overall phase $$\varphi$$ is unknown.
  Filter with both quadratures, $$h_c = A\cos\Phi$$ and $$h_s = A\sin\Phi$$,
  and keep the energy

$$
e(t) = z_c(t)^2 + z_s(t)^2 .
$$

**Why this removes the phase.** A signal with phase $$\varphi$$ is
$$A\cos(\Phi+\varphi) = \cos\varphi\, h_c - \sin\varphi\, h_s$$. Since
$$h_c$$ and $$h_s$$ are orthogonal with equal norm, the two filter outputs
are $$\lVert h\rVert^2\cos\varphi$$ and $$-\lVert h\rVert^2\sin\varphi$$,
and the sum of their squares is $$\lVert h\rVert^4$$ for every $$\varphi$$. $$\square$$

So the matched-filter statistic is a convolution, then an energy, then a
maximum over time: $$\max_t e(t)$$. The step S4D has is the convolution. The
energy and the maximum are what our network does not have: its nonlinearity
is a GELU, and its pooling is a mean, which cancels an oscillating signal
rather than accumulating it.

### Why it gains so much: coherent addition

Multiply the data by $$e^{-i\Phi(t)}$$ (dechirp it) and sum. Every signal
sample now points the same way, so after $$N$$ samples the signal part has
size about $$N \bar A$$. The noise samples point in random directions, so
their sum grows only as $$\sqrt{N}$$. The ratio grows as $$\sqrt{N}$$: this is
why seconds of weak signal add up to a clear detection.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/coherent_sum.png"
   alt="Magnitude of the running sum of dechirped data against time, for signal plus noise and for noise only"
   label="Coherent addition"
   caption="Dechirped by the right chirp, a weak signal's running sum grows steadily; pure noise only wanders." %}

## 4. Why damped tones fit Project 8 and not BNS

A filter built from S4D states can only be a sum of damped tones. How many
tones does it take to build each kind of signal?

**How the plot below is made.** Take the signal over its window (one clean
Project 8 record, or a 4 s BNS chirp) and compute its Fourier transform. Each
Fourier coefficient is one tone that lasts the whole window. Sort the tones
by power, keep the strongest $$N$$, and measure how well those $$N$$ tones
reproduce the signal. Because Fourier tones are orthogonal, the best
approximation with $$N$$ of them keeps exactly the strongest $$N$$, and its
match with the signal is

$$
\text{match}(N) = \sqrt{\frac{\sum_{\text{strongest } N} \lvert \hat h_j\rvert^2}{\sum_{\text{all}} \lvert \hat h_j\rvert^2}},
$$

where $$\hat h_j$$ are the Fourier coefficients. A match of 1 is a perfect
copy. This counts undamped tones on the Fourier grid; S4D's tones can also
fade and sit at any frequency, so the count is an indication of scale, not
an exact number for S4D. The gap it shows, single digits against hundreds,
is far larger than that difference.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/p8_vs_bns_tones.png"
   alt="Match with the signal against the number of fixed tones kept, for 50 Project 8 signals and four BNS chirps"
   label="Tones needed: Project 8 against BNS"
   caption="A Project 8 signal reaches 90% with a median of 3 tones (1 to 6). A 4 s BNS chirp needs about 590 (480 to 740). One S4D channel has 32." %}

**Project 8.** A trapped electron's signal is a nearly constant tone: a
carrier plus a few sidebands, with constant amplitude over the whole record.
It is already in the shape an S4D state has. A handful of long-memory states
at the right frequencies is the matched filter for it. And the PhyTS
baseline feeds the network the Fourier transform of the record: for a tone,
the Fourier transform is itself the bank of tone filters, and the signal's
whole energy lands in one bin. The front end does the coherent integration
before the network sees anything. The network only has to find the peak and
avoid the sidebands. Our own Project 8 runs fed the raw time series instead
and did worse than a plain spectrum peak, which fits this picture.

**BNS.** A chirp is not a tone. Its frequency sweeps, so a tone at frequency
$$\omega$$ overlaps it only during the moment the chirp passes $$\omega$$,
and building the chirp takes hundreds of tones, roughly its time-bandwidth
product. A channel with 32 tones can hold a blurred sketch of a chirp at
best, and with 6 to 22 ms of memory, not even that.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/tones_vs_chirp.png"
   alt="Left: match against number of tones for one chirp. Right: spectrogram of the chirp with horizontal lines at fixed tone frequencies"
   label="A tone meets a chirp only briefly"
   caption="Left: one chirp, 689 tones for 90% and 2,470 for 99%. Right: each fixed tone (dashed) crosses the chirp's track at one moment." %}

## 5. The proposal: chirp kernels

Keep the S4D layer's structure (a bank of kernels applied by FFT
convolution) but change what a kernel is. Instead of a sum of damped tones,
each kernel $$k$$ is a physical chirp with its own learned chirp mass
$$\mathcal{M}_k$$ and a learned amplitude envelope, in two quadratures,
reversed in time so that its merger sits at lag zero:

$$
K^{(c)}_{k}(\ell) = A_k(\tau_\ell)\cos\Phi(\tau_\ell;\mathcal{M}_k), \qquad
K^{(s)}_{k}(\ell) = A_k(\tau_\ell)\sin\Phi(\tau_\ell;\mathcal{M}_k), \qquad \tau_\ell = \ell\,\Delta t .
$$

Then add the two steps the network is missing:

$$
e_k(t) = \sum_{\text{detectors}} \Big[ \big(K^{(c)}_k * u\big)(t)^2 + \big(K^{(s)}_k * u\big)(t)^2 \Big],
\qquad E_k = \max_t e_k(t),
$$

and a small network maps $$\log E_1, \dots, \log E_K$$ to the chirp mass and
its uncertainty.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/architecture.png"
   alt="Block diagram: whitened strain, chirp-kernel convolution, energy summed over detectors, maximum over time, small MLP giving chirp mass and sigma"
   label="The proposed layer"
   caption="Only the chirp mass and envelope of each kernel are learned, a few numbers each instead of thousands." %}

What one kernel produces, on data with a signal at SNR 10:

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/kernel_output.png"
   alt="Energy output of one chirp kernel against time: a sharp spike at the merger for the right chirp mass, a smaller earlier bump for a kernel 1 percent off, and noise only"
   label="One chirp kernel's output"
   caption="At the true chirp mass the energy spikes at the merger. A kernel 1% off peaks lower and earlier: chirp mass and merger time partly trade off. Noise alone stays low." %}

**What it keeps from each side.**

- From the matched filter: the right statistic, by construction. Each
  kernel is the optimal linear filter for its own chirp mass (section 3), and
  energy plus maximum make it blind to phase and merger time.
- From learning: where the kernels sit, how their envelopes taper, and how
  their scores combine into an estimate are all trained, end to end, on real
  detector noise.
- From S4D: the same convolution machinery, so it slots into the existing
  code. The kernel module only has to return a tensor of the right shape.

**How it differs from a template bank.** A bank uses fixed, physically
placed templates, often hundreds of thousands. Here a few dozen kernels are
placed by training, and a network interpolates between their scores. If that
reaches the bank's accuracy, the chirp mass is carried by far fewer
projections than a bank uses, which would be a result in itself.

## 6. The risk

The match between a kernel and a signal, as a function of the kernel's chirp
mass, is a narrow peak.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/match_vs_mc.png"
   alt="Best match over time against kernel chirp mass offset, sharply peaked at zero with a long tail on one side"
   label="Match against kernel chirp mass"
   caption="Sharp near the true value, which is what makes precise estimates possible. Away from it the match is small and flat, so training gets little signal about which way to move a kernel." %}

Sharp peaks are good for precision and bad for gradient descent: a kernel far
from every event's chirp mass gets almost no push in the right direction.
Spreading the initial chirp masses across the prior should help, and a soft
maximum over time instead of a hard one would spread the gradient. Whether
the kernels actually move during training is the first thing to measure.

## Status

Nothing here has been trained yet. The test is direct: on the same windows
as the benchmark, does a chirp-kernel layer move the SNR 8 to 12 accuracy
from about 20% toward the bank's 95%?
