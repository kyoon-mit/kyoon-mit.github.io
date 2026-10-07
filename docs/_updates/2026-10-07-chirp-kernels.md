---
title: "From damped tones to chirps: a state-space layer built for inspirals"
date: 2026-10-07
math: true
summary: >-
  A step-by-step look at what an S4D layer actually computes, why that suits a
  Project 8 tone and not a BNS chirp, and a proposed replacement: a layer whose
  kernels are physical chirps with a learned chirp mass, followed by the
  energy-and-maximum steps a matched filter uses. With its weaknesses and a
  sketch of the code. A proposal, not yet tested.
---

{%- assign u = '/projects/bns/updates/' -%}

The [matched-filter benchmark]({{ u | append: '2026-10-07-matched-filter-benchmark/' | relative_url }})
showed that the 4 s window holds the chirp mass to 2% for almost every event
above SNR 8, and our network gets 16 to 29% there. This entry works out why,
starting from what one S4D layer computes, and ends with a layer designed
for the job. Every symbol is defined where it first appears.

Figures use a toy setup: a Newtonian chirp (defined in section 2) sampled at
2048 samples per second, in a 4 s window of white noise. White noise is what
the network sees, because the detector data is whitened before it reaches
the network: divided, frequency by frequency, by the typical noise level, so
that the noise becomes equally strong at all frequencies.

## 1. What an S4D layer computes

**The setup.** One channel of the layer takes a time series in and gives a
time series out:

- $$t$$ is time, in seconds.
- $$u(t)$$ is the input at time $$t$$: here, whitened detector strain.
- $$y(t)$$ is the output at time $$t$$.
- $$x(t)$$ is the hidden **state**: a list of $$N$$ numbers the layer keeps
  as its memory of the input so far.
- $$A$$ is an $$N \times N$$ matrix that says how the state evolves on its
  own; $$B$$ is a column of $$N$$ numbers that says how the input enters the
  state; $$C$$ is a row of $$N$$ numbers that says how the state is read out.
  All three are learned.

The layer is defined by

$$
x'(t) = A\,x(t) + B\,u(t), \qquad y(t) = C\,x(t),
$$

where $$x'(t)$$ is the rate of change of the state. In words: the state
drifts according to $$A$$, gets nudged by the input through $$B$$, and the
output is a weighted sum of the state.

**The layer is a convolution.** Because $$A$$, $$B$$ and $$C$$ do not change
with time, the output is the input convolved with one fixed function $$K$$,
the **kernel**:

$$
y(t) = \int_0^\infty K(s)\,u(t-s)\,ds, \qquad K(s) = C\,e^{sA}\,B .
$$

Here $$s$$ is a **lag**: how far back in time an input sample lies. $$K(s)$$
is how much an input from $$s$$ seconds ago contributes to the output now.
$$e^{sA}$$ is the matrix exponential, defined by the same series as the
ordinary exponential: $$e^{sA} = I + sA + \tfrac{1}{2}(sA)^2 + \dots$$, with
$$I$$ the identity matrix.

**Proof.** Starting from a state of zero, the solution of the state equation
is $$x(t) = \int_0^\infty e^{sA} B\, u(t-s)\, ds$$: each past input
$$u(t-s)$$ entered through $$B$$ and has since evolved for a time $$s$$ under
$$A$$, which multiplies it by $$e^{sA}$$. (Differentiating under the
integral confirms it satisfies the equation.) Multiply by $$C$$ to get
$$y$$. $$\square$$

**S4D makes $$A$$ diagonal.** In general $$A$$ is a full matrix, so every
state number can feed every other one. S4D (the "D" stands for diagonal; Gu,
Gupta, Goel and Ré, 2022) keeps only the diagonal: each state number evolves
on its own. The diagonal entries are complex numbers, one per state:

$$
a_n = -\alpha_n + i\,\omega_n , \qquad n = 1, \dots, N,
$$

where $$n$$ numbers the states, $$i = \sqrt{-1}$$, $$\alpha_n > 0$$ is a
**decay rate** (per second) and $$\omega_n$$ is an **angular frequency**
(radians per second; the frequency in hertz is $$\omega_n / 2\pi$$). The
code we use (ml4gw's `S4DKernel`) stores exactly this: a list of $$a_n$$,
not a matrix.

**Why a diagonal $$A$$ splits the kernel into separate states.** Multiplying
a diagonal matrix by itself just multiplies its diagonal entries:

$$
\begin{pmatrix} a_1 & \\ & a_2 \end{pmatrix}^{2} = \begin{pmatrix} a_1^2 & \\ & a_2^2 \end{pmatrix}.
$$

Every power stays diagonal, so the whole series for $$e^{sA}$$ stays
diagonal, and each diagonal entry is the ordinary series for one number:

$$
e^{sA} = \begin{pmatrix} e^{s a_1} & & \\ & e^{s a_2} & \\ & & \ddots \end{pmatrix}.
$$

Putting this between the row $$C$$ and the column $$B$$ picks out each
diagonal entry, weights it by $$\beta_n = C_n B_n$$ (the product of the
$$n$$-th entries of $$C$$ and $$B$$), and adds them up:

$$
K(s) = C\,e^{sA}B = \sum_{n=1}^{N} \beta_n\, e^{s a_n} = \sum_{n=1}^{N} \beta_n\, e^{-\alpha_n s}\, e^{i \omega_n s}.
$$

The last step splits $$e^{s a_n}$$ into $$e^{-\alpha_n s}$$, which shrinks
with the lag, times $$e^{i\omega_n s}$$, which rotates. So the kernel is a
plain sum with one independent term per state.

**Each term is a damped tone.** A *tone* is a pure sinusoid at one fixed
frequency, like a tuning fork: $$\cos(\omega s + \varphi)$$, where
$$\varphi$$ is its starting phase. A *damped* tone is a sinusoid whose
amplitude fades, $$e^{-\alpha s}\cos(\omega s + \varphi)$$, like the fork's
ring dying out. State $$n$$ contributes a damped tone with frequency
$$\omega_n$$ and decay rate $$\alpha_n$$; the kernel is their weighted sum.

**Why 64 state numbers make 32 tones.** One complex term on its own is not
a real signal: $$e^{(-\alpha + i\omega)s}$$ is an arrow in the complex plane
that spins at rate $$\omega$$ while shrinking at rate $$\alpha$$. Its complex
conjugate $$e^{(-\alpha - i\omega)s}$$ (the bar means complex conjugate)
shrinks the same way but spins the other way. With weight $$\beta$$ on one
and $$\bar\beta$$ on the other, the imaginary parts cancel:

$$
\beta\,e^{(-\alpha+i\omega)s} + \bar \beta\,e^{(-\alpha-i\omega)s}
= 2\,\mathrm{Re}\big(\beta\,e^{(-\alpha+i\omega)s}\big)
= 2\lvert \beta\rvert\, e^{-\alpha s}\cos\!\big(\omega s + \arg \beta\big),
$$

where $$\mathrm{Re}$$ takes the real part, $$\lvert\beta\rvert$$ is the size
of $$\beta$$ and $$\arg\beta$$ its angle. That is one real damped cosine: one
tone. Because the data and the kernel are real, the states come in such
conjugate pairs. Our runs set `d_state` = 64 state numbers per channel, so
32 pairs, 32 tones. The code stores one member of each pair and takes twice
the real part instead of adding the partner, which by the identity above is
the same thing.

**From continuous time to samples.** The data comes in samples, at a
sampling rate $$f_s$$ = 2048 per second. The code evaluates the kernel once
per sample, at lags $$\ell = 0, 1, \dots, L-1$$ samples, where $$L$$ is the
window length in samples (8192 for 4 s). A learned number per channel, the
**step** $$\Delta t$$, sets how much of the tones' own time passes between
two samples: a larger $$\Delta t$$ makes every tone in that channel rotate
faster and fade sooner per sample. Written per sample, the kernel is

$$
K_\ell = 2\,\mathrm{Re}\sum_{n=1}^{N/2} C_n \frac{e^{\Delta t\, a_n}-1}{a_n}\, e^{\Delta t\, a_n \ell}.
$$

The factor $$(e^{\Delta t\, a_n}-1)/a_n$$ is the standard way of turning the
continuous equation into a per-sample one (it plays the role of $$B_n$$).

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/s4d_kernel.png"
   alt="Three damped cosines with different frequencies and decay times, and their sum"
   label="An S4D kernel"
   caption="Top: three states, each a tone that fades; the legend gives each tone's frequency and how long it remembers. Bottom: the layer's kernel is their weighted sum. Horizontal axis: lag, how far back the input lies." %}

**From the symbols to the code.** The learned parameters of one S4D channel:

- `A_imag`, one per state: the frequency $$\omega_n$$. In hertz the tone is
  at $$\Delta t\,\omega_n\, f_s / 2\pi$$. Initialized at $$\omega_n = \pi n$$,
  an evenly spaced comb.
- `log_A_real`, one per state: the decay, $$\alpha_n = e^{\texttt{log\_A\_real}}$$.
- `log_dt`, one per channel: the step, $$\Delta t = e^{\texttt{log\_dt}}$$.
- `C`, one complex number per state: each tone's loudness and starting phase.

`d_model` = 128 means 128 channels, each with its own 32 tones. Channels are
mixed only after the convolution, by a layer that combines channels sample
by sample. So one channel's kernel is a sum of at most 32 tones.

**Memory.** A tone with decay $$\alpha_n$$ has shrunk by a factor $$e$$
after about $$1/(\Delta t\,\alpha_n)$$ samples. In our trained models the
median is 13 to 46 samples, 6 to 22 ms. The inspiral we need to integrate
lasts seconds.

## 2. What the data holds: a chirp

**Symbols.**

- $$\tau$$ is the time left until the merger, in seconds.
- $$\mathcal{M}$$ is the **chirp mass**, a combination of the two star
  masses that controls how fast the orbit shrinks, in solar masses
  ($$M_\odot$$).
- $$G$$ is Newton's gravitational constant and $$c$$ the speed of light.
  $$G\mathcal{M}/c^3$$ is the chirp mass expressed as a time: about 6 μs for
  $$1.2\,M_\odot$$.
- $$f(\tau)$$ is the wave's frequency in hertz, and $$\Phi(\tau)$$ its phase
  in radians.

Far from the merger, Newtonian gravity plus energy loss to gravitational
waves gives

$$
f(\tau) = \frac{1}{8\pi}\left(\frac{5}{\tau}\right)^{3/8}\left(\frac{G\mathcal{M}}{c^3}\right)^{-5/8},
\qquad
\Phi(\tau) = -2\left(\frac{\tau\, c^3}{5\,G\mathcal{M}}\right)^{5/8}.
$$

The phase is the accumulated angle, $$2\pi$$ times the integral of the
frequency. The signal in one detector is $$h(t) = \mathcal{A}(\tau)\cos\Phi(\tau)$$,
where $$\mathcal{A}(\tau)$$ is the amplitude, growing as $$\tau^{-1/4}$$
toward the merger.

The chirp mass sets how fast the frequency sweeps. Over a 4 s window the
signal goes through hundreds of cycles, and a 1% change in $$\mathcal{M}$$
shifts the phase near merger by many radians. That accumulated phase is
where the chirp mass is measured.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/chirp.png"
   alt="A BNS chirp waveform in its last 0.4 seconds, and the frequency against time for chirp masses 1.2 and 1.8"
   label="A BNS chirp"
   caption="Top: the waveform in its last 0.4 s. Bottom: its frequency against time in the 4 s window; heavier systems sweep faster and merge at a lower frequency." %}

## 3. The optimal way to find it: the matched filter

**Symbols.**

- The whitened data is $$u(t) = h(t) + \eta(t)$$: the signal $$h$$ plus
  noise $$\eta$$, where each noise sample is independent with mean 0 and
  variance 1 (that is what whitening achieves).
- A **linear filter** is a fixed list of weights $$w(t)$$. Its score on the
  data is the inner product $$\langle w, u\rangle = \sum_t w(t)\,u(t)$$,
  summing over the samples.
- The **SNR** (signal-to-noise ratio) of a score is the size of its signal
  part divided by the standard deviation of its noise part.

**Claim.** The SNR is largest when the filter has the same shape as the
signal, $$w \propto h$$. This is the **matched filter**.

**Proof.** The signal part of the score is $$\langle w, h\rangle$$. The noise
part is $$\sum_t w(t)\eta(t)$$, a sum of independent unit-variance terms
weighted by $$w$$, so its variance is $$\langle w, w\rangle$$. Therefore

$$
\mathrm{SNR}^2(w) = \frac{\langle w,h\rangle^2}{\langle w,w\rangle} \le \frac{\langle w,w\rangle\,\langle h,h\rangle}{\langle w,w\rangle} = \langle h,h\rangle ,
$$

using the Cauchy–Schwarz inequality, $$\langle w,h\rangle^2 \le \langle w,w\rangle\langle h,h\rangle$$,
which is an equality exactly when $$w$$ is a multiple of $$h$$. $$\square$$

Two unknowns remain, and each is handled by one extra step.

**Unknown merger time: convolve.** Score every possible merger time at
once. The score for a template whose merger falls at time $$t$$ is

$$
z(t) = \sum_{\ell=0}^{L-1} h(T-\ell)\, u(t-\ell),
$$

where $$h(T-\ell)$$ is the template read backwards from its merger at sample
$$T$$. This is a convolution of the data with the reversed template: exactly
the operation an S4D layer performs (section 1), with the reversed template
as the kernel.

**Unknown phase: take the energy.** A real signal arrives with an unknown
starting phase $$\varphi$$. Filter with two versions of the template, the
**quadratures**: $$h_c = \mathcal{A}\cos\Phi$$ and $$h_s = \mathcal{A}\sin\Phi$$.
Call their outputs $$z_c(t)$$ and $$z_s(t)$$, and keep the **energy**

$$
e(t) = z_c(t)^2 + z_s(t)^2 .
$$

**Why this removes the phase.** A signal with phase $$\varphi$$ is
$$\mathcal{A}\cos(\Phi+\varphi) = \cos\varphi\, h_c - \sin\varphi\, h_s$$
(the angle-addition formula). The two quadratures are orthogonal with equal
size $$\lVert h\rVert$$ (the size of a template, $$\lVert h\rVert = \sqrt{\langle h, h\rangle}$$), so at the merger the two outputs are
$$\lVert h\rVert^2\cos\varphi$$ and $$-\lVert h\rVert^2\sin\varphi$$, and the
sum of their squares is $$\lVert h\rVert^4$$ whatever $$\varphi$$ is. $$\square$$

**Then the maximum over time.** The energy peaks at the true merger time, so
the final statistic is $$\max_t e(t)$$.

So a matched filter is three steps: a **convolution**, an **energy**, a
**maximum over time**. S4D has the first. Our network does not have the
other two: after the convolution it applies a GELU (a smooth version of
"keep positive values, zero the rest"), and at the end it averages over time,
which cancels an oscillating signal instead of accumulating it.

### Why it gains so much: coherent addition

Multiply the data by $$e^{-i\Phi(t)}$$, which undoes the signal's rotation
(this is called dechirping), and add up $$m$$ samples. Every signal sample
now points the same way, so their sum grows like $$m$$. Noise samples point
in random directions, so their sum grows only like $$\sqrt{m}$$. The ratio
grows like $$\sqrt{m}$$: this is why seconds of weak signal add up to a clear
detection.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/coherent_sum.png"
   alt="Magnitude of the running sum of dechirped data against time, for signal plus noise and for noise only"
   label="Coherent addition"
   caption="Size of the running sum of dechirped data, from the start of the window. With a signal of SNR 10, dechirped by the correct chirp, it grows steadily. With noise only, it wanders." %}

## 4. Why damped tones fit Project 8 and not BNS

An S4D kernel can only be a sum of damped tones. How many tones does it take
to build each kind of signal?

**How the plot below is made.** Take the signal over its window (one clean
Project 8 record, or a 4 s BNS chirp) and compute its Fourier transform.
Each Fourier coefficient $$\hat h_q$$ ($$q$$ numbers them) is one tone that
lasts the whole window. Sort the tones by power $$\lvert \hat h_q\rvert^2$$,
keep the strongest $$k$$, and measure how well those $$k$$ tones reproduce
the signal. Because Fourier tones are orthogonal, the best approximation
with $$k$$ of them keeps exactly the strongest $$k$$, and its **match** (its
overlap with the signal, 1 for a perfect copy) is

$$
\text{match}(k) = \sqrt{\frac{\sum_{\text{strongest } k} \lvert \hat h_q\rvert^2}{\sum_{\text{all } q} \lvert \hat h_q\rvert^2}} .
$$

This counts undamped tones on the Fourier grid; S4D's tones can also fade
and sit at any frequency, so the count is an indication of scale, not an
exact number for S4D. The gap it shows, single digits against hundreds, is
far larger than that difference.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/p8_vs_bns_tones.png"
   alt="Match with the signal against the number of fixed tones kept, for 50 Project 8 signals and four BNS chirps"
   label="Tones needed: Project 8 against BNS"
   caption="A Project 8 signal reaches 90% with a median of 3 tones (1 to 6). A 4 s BNS chirp needs about 590 (480 to 740). One S4D channel has 32." %}

**Project 8.** A trapped electron's signal is a nearly constant tone: a
carrier plus a few sidebands, with constant amplitude over the whole record.
It already has the shape of an S4D state, so a handful of long-memory states
at the right frequencies is its matched filter. And the PhyTS baseline feeds
the network the Fourier transform of the record: for a tone, the Fourier
transform is itself a bank of tone filters, and the signal's whole energy
lands in one bin. The front end does the coherent addition before the
network sees anything; the network only has to find the peak and avoid the
sidebands. Our own Project 8 runs fed the raw time series instead, and did
worse than a plain spectrum peak, which fits this picture.

**BNS.** A chirp is not a tone. Its frequency sweeps, so a tone at one
frequency overlaps it only during the moment the chirp passes that
frequency. Building a chirp takes hundreds of tones, roughly its duration
times its bandwidth. A channel with 32 tones can hold a blurred sketch of a
chirp at best, and with 6 to 22 ms of memory, not even that.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/tones_vs_chirp.png"
   alt="Left: match against number of tones for one chirp. Right: spectrogram of the chirp with horizontal lines at fixed tone frequencies"
   label="A tone meets a chirp only briefly"
   caption="Left: one chirp, 689 tones for 90% and 2,470 for 99%. Right: the chirp's frequency over time (darker is stronger); each fixed tone (dashed line) crosses its track at one moment only." %}

## 5. The proposal: chirp kernels

Keep the S4D layer's structure, a set of kernels applied by convolution, but
change what a kernel is. Instead of a sum of damped tones, each kernel is a
physical chirp.

**Symbols.**

- $$J$$ is the number of chirp kernels, numbered $$j = 1, \dots, J$$.
- $$\mathcal{M}_j$$ is kernel $$j$$'s chirp mass, **learned**.
- $$\mathcal{A}_j(\tau)$$ is kernel $$j$$'s amplitude envelope, also
  **learned** (how exactly to parameterize it is an open choice, below).
- $$\tau_\ell = \ell / f_s$$ is the time before merger that lag $$\ell$$
  corresponds to. The kernel is the chirp read backwards from its merger, so
  that lag 0 is the merger.
- $$K^{(c)}_j$$ and $$K^{(s)}_j$$ are the two quadratures of kernel $$j$$.

$$
K^{(c)}_{j}(\ell) = \mathcal{A}_j(\tau_\ell)\cos\Phi(\tau_\ell;\mathcal{M}_j), \qquad
K^{(s)}_{j}(\ell) = \mathcal{A}_j(\tau_\ell)\sin\Phi(\tau_\ell;\mathcal{M}_j),
$$

with $$\Phi$$ the chirp phase from section 2, evaluated at chirp mass
$$\mathcal{M}_j$$.

Then add the two steps a matched filter has and our network lacks:

- **Energy.** Square the outputs of the cosine and sine kernels and add
  them, and add over the two detectors. This removes the unknown phase and
  turns the oscillating output into one positive bump.
- **Maximum over time.** Keep the largest energy in the window. This
  removes the unknown merger time.

With $$u_D$$ the whitened data from detector $$D$$ (H1 or L1) and $$*$$
denoting convolution:

$$
e_j(t) = \sum_{D \in \{\mathrm{H1},\, \mathrm{L1}\}} \Big[ \big(K^{(c)}_j * u_D\big)(t)^2 + \big(K^{(s)}_j * u_D\big)(t)^2 \Big],
\qquad E_j = \max_t e_j(t).
$$

$$e_j(t)$$ is kernel $$j$$'s energy at time $$t$$, and $$E_j$$ its best
match anywhere in the window. A small network $$g$$ maps the $$J$$ numbers
$$\log E_1, \dots, \log E_J$$ to the chirp mass and its uncertainty.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/architecture.png"
   alt="Block diagram: whitened strain, chirp-kernel convolution, energy summed over detectors, maximum over time, small MLP giving chirp mass and sigma"
   label="The proposed layer"
   caption="Only each kernel's chirp mass and envelope are learned: a few numbers each, instead of the thousands a free-form filter would need." %}

What one kernel produces on data containing a signal at SNR 10:

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/kernel_output.png"
   alt="Energy output of one chirp kernel against time: a sharp spike at the merger for the right chirp mass, a smaller earlier bump for a kernel 1 percent off, and noise only"
   label="One chirp kernel's output"
   caption="Energy e(t) of one kernel over the last second of the window. At the true chirp mass it spikes at the merger (dotted line). A kernel 1% off peaks lower and earlier: chirp mass and merger time partly trade off. Noise only: the same kernel at the true chirp mass on a separate stretch of pure noise; its energy averages 2 (each normalized quadrature gives a unit-variance output on noise) and reaches 10 to 15 only by chance." %}

## 6. One correct kernel, or many?

For a single event whose chirp mass is known, one kernel at that chirp mass
is all you need: it is the matched filter (section 3) and recovers the full
SNR.

But the layer is fixed once trained, and events arrive with any chirp mass
from 0.85 to 2.75 $$M_\odot$$. A kernel responds strongly only to events
within a few tenths of a percent of its own chirp mass:

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/tuning_curves.png"
   alt="Response of three fixed kernels at chirp masses 1.15, 1.20 and 1.25 against the event chirp mass: each a narrow peak at its own value"
   label="Each kernel's tuning curve"
   caption="Noise-free response (match, 1 = perfect) of three fixed kernels to events across a range of chirp masses. Each peaks sharply at its own chirp mass and falls below 0.5 within about 1% on the low side and a few tenths of a percent on the high side." %}

So one fixed kernel fails twice:

1. **It misses most events.** An event between kernels gets a weak response
   from all of them.
2. **It cannot measure the chirp mass.** Its single number, $$E_j$$, mixes
   two unknowns: how loud the signal is, and how close its chirp mass is to
   the kernel's. A loud signal slightly off and a weak signal right on give
   the same number.

There are two ways around this:

- **Many kernels spread over the range** (the proposal). Some kernel is
  always close, and the *pattern* of the $$J$$ responses locates the chirp
  mass: the loudness scales all of them together, while the chirp mass
  decides which one is largest. How few kernels suffice depends on how well
  the network $$g$$ can interpolate between them; a template bank with no
  interpolation used 613.
- **One kernel adjusted per event.** Move its chirp mass until its response
  peaks. That is fitting, not a fixed layer, and because the peak is narrow
  it needs a starting point already close, so in practice it is the second
  stage after a coarse set of kernels.

## 7. It keeps S4D's convolution view

An S4D layer can be computed in two equivalent ways:

- **The recurrent view.** Step through the samples one at a time, updating
  the $$N$$ state numbers. This needs only the current state, so it can run
  on a live stream. It works because the kernel is a sum of a few damped
  tones, each of which a single state number can generate step by step.
- **The convolution view.** Build the whole kernel $$K_\ell$$ once, then
  convolve it with the input using the fast Fourier transform (FFT): a
  convolution becomes a multiplication in the frequency domain. This is how
  our training code actually runs S4D.

The chirp kernel keeps the convolution view exactly: the kernel module
returns a tensor of the same shape, and the same FFT convolution applies it.
The layer is still linear and time-invariant, which is what makes the
merger-time search free: shifting the signal in time shifts the output by
the same amount, so the maximum over time finds it wherever it is.

It gives up the recurrent view. A chirp is not a sum of a few damped tones
(section 4), so no small state can generate it step by step. That matters
only for streaming sample by sample; on fixed 4 s windows, which is how we
use the model, the convolution view is all we need. Strictly, the result is
a long-convolution layer with a physical kernel, not a state-space model.

## 8. A code sketch

The S4D layer we use computes, in its forward pass (ml4gw `S4D.forward`):

```python
k = self.kernel(L=L)                              # kernel, (channels, L)
k_f = torch.fft.rfft(k, n=2 * L)                  # kernel in frequency
u_f = torch.fft.rfft(u, n=2 * L)                  # input in frequency
y = torch.fft.irfft(u_f * k_f, n=2 * L)[..., :L]  # convolution
y = self.activation(y)                            # GELU
```

The chirp version swaps the kernel module, keeps the same three FFT lines,
and replaces the GELU with the energy:

```python
TSUN = 4.925491e-6  # G * (1 solar mass) / c^3, in seconds


class ChirpKernel(nn.Module):
    """J chirp kernels, each with a learned chirp mass, two quadratures."""

    def __init__(self, J, mc_min, mc_max, sample_rate):
        super().__init__()
        self.fs = sample_rate
        # chirp masses spread over the prior, stored as logs
        self.log_mc = nn.Parameter(
            torch.linspace(math.log(mc_min), math.log(mc_max), J)
        )
        # envelope parameters: form to be decided (see open choices)

    def forward(self, L):
        # lag l -> time before merger, in seconds
        tau = (torch.arange(L) + 1) / self.fs
        # chirp mass as a time, one row per kernel
        T = TSUN * self.log_mc.exp()[:, None]
        phase = -2 * (tau / (5 * T)) ** (5 / 8)
        # physical growth times a learned envelope
        amp = tau ** -0.25 * self.envelope(tau)
        kc = amp * torch.cos(phase)
        ks = amp * torch.sin(phase)
        norm = kc.pow(2).sum(-1, keepdim=True).sqrt()
        return torch.cat([kc / norm, ks / norm])  # (2J, L)


class ChirpEnergy(nn.Module):
    def forward(self, u):
        # u: whitened data, (batch, detectors, L)
        L = u.shape[-1]
        k = self.kernel(L)  # (2J, L)
        k_f = torch.fft.rfft(k, n=2 * L)
        u_f = torch.fft.rfft(u, n=2 * L)
        z = torch.fft.irfft(u_f[:, :, None] * k_f, n=2 * L)[..., :L]
        # z: (batch, detectors, 2J, L); cosine half, then sine half
        J = k.shape[0] // 2
        energy = z[:, :, :J] ** 2 + z[:, :, J:] ** 2
        return energy.sum(1)  # e_j(t), summed over detectors: (batch, J, L)
```

A head then takes the maximum over time of $$e_j(t)$$, its log, and a small
MLP to the chirp mass and its uncertainty.

**Open choices, to settle before building:**

- the envelope $$\mathcal{A}_j$$: fixed physical $$\tau^{-1/4}$$ only, or a
  learned correction, and of what form;
- the frequency band: where each kernel starts and stops (20 Hz at the low
  end; a smooth taper at both ends so the gradient in $$\mathcal{M}_j$$ is
  well behaved);
- the number of kernels $$J$$ and their initial spread;
- hard maximum over time, or a soft maximum with a temperature;
- the phase model: Newtonian only, or higher order (see weaknesses);
- whether to also give the head the time of each kernel's peak, not just
  its height.

## 9. Weaknesses

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/match_vs_mc.png"
   alt="Best match over time against kernel chirp mass offset, sharply peaked at zero with a long tail on one side"
   label="Match against kernel chirp mass"
   caption="The best match over time between a signal and a kernel, as the kernel's chirp mass moves away from the true one. Sharp near zero, small and nearly flat elsewhere." %}

1. **Narrow peaks, weak gradients.** A kernel's response falls off within a
   fraction of a percent of its chirp mass (the tuning curves above). A
   kernel far from every training event gets almost no signal about which way
   to move. Spreading the initial chirp masses and using a soft maximum
   should help; whether the kernels move at all is the first thing to check.


2. **Chirp mass and merger time trade off.** A kernel slightly off in chirp
   mass still finds a partial match by shifting its merger time (the earlier
   peak in the kernel-output figure, and the long tail above). Peak heights
   alone may confuse "slightly off" with "weaker".
3. **The Newtonian phase is approximate.** Real BNS signals have phase
   corrections that depend on the mass ratio, the spins and, near merger,
   tidal effects. Over hundreds of cycles a small phase error adds up, so a
   kernel at exactly the right chirp mass can still lose match. Higher-order
   phase terms would fix this at the cost of more kernel parameters.
4. **Only the chirp mass is in the kernel.** Mass ratio and spin barely
   enter, so the layer says little about them.
5. **Coverage.** The kernels must tile the whole range finely enough that
   every event is near one. If too few, the head must interpolate from weak,
   partial matches, which may cap the precision.
6. **Glitches.** The energy responds to any loud transient that resembles
   part of a chirp. The benchmark's template bank gave glitches scores of 30
   to 300 with no veto. Searches add consistency tests; this layer has none.
7. **Look-elsewhere.** Taking the maximum over many kernels and all times
   raises the score of pure noise (the bank's noise floor was about 6.3).
   More kernels, higher floor.
8. **Sparse gradient from the hard maximum.** Only one time sample per kernel
   per event receives any gradient.
9. **Whitening assumption.** The matched filter is optimal for noise that is
   stationary and Gaussian after whitening. Real detector noise is neither,
   exactly.
10. **No streaming.** It loses S4D's recurrent view (section 7).

## Status

Nothing here has been trained yet. The test is direct: on the same windows
as the benchmark, does a chirp-kernel layer move the SNR 8 to 12 accuracy
from about 20% toward the bank's 95%?
