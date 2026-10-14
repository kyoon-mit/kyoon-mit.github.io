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
showed that on the same 4 s windows a plain template bank puts 96 to 99% of
events at SNR 8 to 12 within 2% of the true chirp mass, and our network 16
to 29%. This entry works out why, starting from what one S4D layer computes,
and ends with a layer designed for the job. Every symbol is defined where it
first appears.

Figures use a toy setup: a Newtonian chirp (defined in section 2) sampled at
2048 samples per second, kept between 20 and 900 Hz, in a 4 s window of
white noise. The network sees whitened data: the detector data divided,
frequency by frequency, by an estimate of the noise level. If the noise is
stationary and Gaussian with that spectrum, whitened noise is white, with
independent samples of mean 0 and variance 1 (Allen et al. 2012, FINDCHIRP,
[arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116); Abbott et al.
2020, [arXiv:1908.11170](https://arxiv.org/abs/1908.11170)). Real detector
noise is only close to that: its spectrum drifts and it has short loud
glitches (Abbott et al. 2020), and our whitening filter cuts frequencies
below 20 Hz, so the data is not white there. The figures and arguments below
assume the ideal case.

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
Gupta, Goel and Ré 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893))
keeps only the diagonal: each state number evolves on its own. The diagonal
entries are complex numbers, one per state:

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
tone. S4D builds its real kernel this way: it keeps half the states and
takes twice the real part of their sum, which by the identity above is the
same as adding each state's conjugate partner (Gu et al. 2022, section 3).
Our runs set `d_state` = 64 state numbers per channel, so 32 pairs, 32
tones.

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

The factor $$(e^{\Delta t\, a_n}-1)/a_n$$ comes from holding the input
constant over each step and solving the state equation across it (the
zero-order hold; Gu et al. 2022, section 3.1). It plays the role of $$B_n$$
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-s4d-step)).

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/s4d_kernel.png"
   alt="Three damped cosines with different frequencies and decay times, and their sum"
   label="An S4D kernel"
   caption="Top: three states, each a tone that fades; the legend gives each tone's frequency and how long it remembers. Bottom: the layer's kernel is their weighted sum. Horizontal axis: lag, how far back the input lies." %}

**From the symbols to the code.** The learned parameters of one S4D channel:

- `A_imag`, one per state: the frequency $$\omega_n$$. In hertz the tone is
  at $$\Delta t\,\omega_n\, f_s / 2\pi$$, as long as $$\Delta t\,\omega_n < \pi$$
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-s4d-step)).
  Initialized at $$\omega = 0, \pi, 2\pi, \dots, (N/2-1)\pi$$, an evenly
  spaced comb (the S4D-Lin start; Gu et al. 2022, section 4 and Listing 1).
- `log_A_real`, one per state: the decay, $$\alpha_n = e^{\texttt{log\_A\_real}}$$,
  initialized at $$1/2$$.
- `log_dt`, one per channel: the step, $$\Delta t = e^{\texttt{log\_dt}}$$,
  drawn at the start log-uniformly between two bounds ($$10^{-4}$$ and 10 in
  our den-reg runs).
- `C`, one complex number per state: each tone's loudness and starting phase.

`d_model` = 128 means 128 channels, each with its own 32 tones. Channels are
mixed only after the convolution, by a layer that combines channels sample
by sample. So one channel's kernel is a sum of at most 32 tones.

**Memory.** Per sample, a tone's size is multiplied by
$$e^{-\Delta t\,\alpha_n}$$, so it has shrunk by a factor $$e$$ after
exactly $$1/(\Delta t\,\alpha_n)$$ samples
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-s4d-step)).
I read this off the trained network of the benchmark (the den-reg run at
epoch 630; 12 S4D layers of 128 channels with 32 tones each). The median
per layer is 16.5 to 134.2 samples, 8.06 to 65.50 ms; over all layers it is
31.3 samples, 15.28 ms. In each layer 4.6 to 11.9% of the tones last longer
than the 4 s window. The inspiral we need to integrate lasts seconds.

## 2. What the data holds: a chirp

**Symbols.**

- $$\tau$$ is the time left until the merger, in seconds.
- $$\mathcal{M}$$ is the **chirp mass**,
  $$\mathcal{M} = (m_1 m_2)^{3/5}/(m_1+m_2)^{1/5}$$ for star masses $$m_1$$
  and $$m_2$$, which controls how fast the orbit shrinks, in solar masses
  ($$M_\odot$$).
- $$G$$ is Newton's gravitational constant and $$c$$ the speed of light.
  $$G\mathcal{M}/c^3$$ is the chirp mass expressed as a time: 5.911 μs for
  $$1.2\,M_\odot$$, from $$GM_\odot/c^3$$ = 4.925491 μs (the IAU 2015
  nominal solar mass parameter and the exact speed of light; Prša et al.
  2016, [arXiv:1605.09788](https://arxiv.org/abs/1605.09788)).
- $$f(\tau)$$ is the wave's frequency in hertz, and $$\Phi(\tau)$$ its phase
  in radians.

Far from the merger, Newtonian gravity plus energy loss to gravitational
waves gives (Maggiore 2008, *Gravitational Waves*, Vol. 1, chapter 4;
Sathyaprakash and Schutz 2009, [arXiv:0903.0338](https://arxiv.org/abs/0903.0338))

$$
f(\tau) = \frac{1}{8\pi}\left(\frac{5}{\tau}\right)^{3/8}\left(\frac{G\mathcal{M}}{c^3}\right)^{-5/8},
\qquad
\Phi(\tau) = -2\left(\frac{\tau\, c^3}{5\,G\mathcal{M}}\right)^{5/8}.
$$

The phase is the accumulated angle: $$d\Phi/dt = 2\pi f$$, with
$$\Phi = 0$$ at the merger. The signal in one detector is
$$h(t) = \mathcal{A}(\tau)\cos\Phi(\tau)$$, where $$\mathcal{A}(\tau)$$ is
the amplitude, growing as $$\tau^{-1/4}$$ toward the merger (same sources;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-chirp)).

The chirp mass sets how fast the frequency sweeps. In the last 4 s the
signal goes through 305 (at $$2.75\,M_\odot$$) to 636 (at $$0.85\,M_\odot$$)
cycles ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#cycles)).
Since $$\Phi \propto \mathcal{M}^{-5/8}$$, a 1% change in $$\mathcal{M}$$
changes the phase accumulated over those 4 s by 0.62%: 12 to 25 radians, 20
for $$1.2\,M_\odot$$
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-chirp)).
That accumulated phase is where the chirp mass is measured. A search also
fits the merger time and phase, which absorbs part of the shift; section 6
shows what remains.

In the figure below both frequency curves stop at the toy setup's 900 Hz
cut, because the Newtonian formula has no end of its own. A real inspiral
ends at a frequency set by the total mass, not the chirp mass
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-chirp)).

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/chirp.png"
   alt="A BNS chirp waveform in its last 0.4 seconds, and the frequency against time for chirp masses 1.2 and 1.8"
   label="A BNS chirp"
   caption="Top: the waveform in its last 0.4 s. Bottom: its frequency against time in the 4 s window. The heavier system starts lower (62 Hz against 80 Hz) and sweeps faster. Both curves stop at the 900 Hz cut of the toy setup." %}

## 3. The optimal way to find it: the matched filter

**Symbols.**

- The whitened data is $$u(t) = h(t) + \eta(t)$$: the signal $$h$$ plus
  noise $$\eta$$, where each noise sample is independent with mean 0 and
  variance 1 (ideal whitened noise, as assumed at the top).
- A **linear filter** is a fixed list of weights $$w(t)$$. Its score on the
  data is the inner product $$\langle w, u\rangle = \sum_t w(t)\,u(t)$$,
  summing over the samples.
- The **SNR** (signal-to-noise ratio) of a score is the size of its signal
  part divided by the standard deviation of its noise part.

**Claim.** The SNR is largest when the filter has the same shape as the
signal, $$w \propto h$$. This is the **matched filter** (for stationary
Gaussian noise; FINDCHIRP, cited above).

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
(the angle-addition formula). If the two quadratures are orthogonal with
equal size $$\lVert h\rVert$$ (the size of a template, $$\lVert h\rVert = \sqrt{\langle h, h\rangle}$$), then at the merger the two outputs are
$$\lVert h\rVert^2\cos\varphi$$ and $$-\lVert h\rVert^2\sin\varphi$$, and the
sum of their squares is $$\lVert h\rVert^4$$ whatever $$\varphi$$ is. $$\square$$

The condition holds exactly when $$h_s$$ is made from $$h_c$$ by the
Hilbert transform (Oppenheim and Schafer 2010, *Discrete-Time Signal
Processing*), and approximately for $$\mathcal{A}\cos\Phi$$ and
$$\mathcal{A}\sin\Phi$$, because $$\mathcal{A}$$ changes little over one
cycle. For the toy chirps their normalized overlap is at most 0.0013 and
their squared sizes differ by at most 0.47%
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-quadratures)).

**Then the maximum over time.** Without noise, the energy is largest at the
true merger time: by Cauchy–Schwarz again, no shifted template overlaps the
signal more than the aligned one
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-quadratures)).
With noise, the largest energy over time is the matched-filter statistic for
an unknown arrival time (FINDCHIRP), so the final statistic is
$$\max_t e(t)$$.

So a matched filter is three steps: a **convolution**, an **energy**, a
**maximum over time**. S4D has the first. Our network does not have the
other two: after the convolution it applies a GELU (a smooth version of
"keep positive values, zero the rest"), and at the end it averages over
time. Over an oscillating output, the average cancels the part that is
linear in the signal; only the small positive mean the GELU leaves survives
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-gelu-mean)).

### Why it gains so much: coherent addition

Multiply the data by $$e^{-i\Phi(t)}$$, which undoes the signal's rotation
(this is called dechirping), and add up $$m$$ samples. The signal part of
each product is half the amplitude plus a term that keeps turning and
nearly cancels in the sum. So for a constant amplitude the signal part of
the sum grows like $$m$$; a chirp's amplitude rises toward the merger, so
there it grows faster. The noise part is a sum of $$m$$ independent
unit-variance terms, of typical size $$\sqrt{m}$$. For a constant amplitude
the ratio grows like $$\sqrt{m}$$: this is why seconds of weak signal add up
to a clear detection
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-coherent)).
The figure also weights each sample by the template's amplitude, which
makes the full sum the two quadrature outputs of the matched filter above.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/coherent_sum.png"
   alt="Magnitude of the running sum of dechirped data against time, for signal plus noise and for noise only"
   label="Coherent addition"
   caption="Size of the running sum of the data times the conjugate of the unit-size complex template (cosine quadrature minus i times sine quadrature), from the start of the window. With a signal of SNR 10 and the correct chirp, it grows toward the SNR, faster near the merger. With noise only, it wanders." %}

## 4. Why damped tones fit Project 8 and not BNS

An S4D kernel can only be a sum of damped tones. How many tones does it take
to build each kind of signal?

**How the plot below is made.** Take the signal over its window (one clean
Project 8 record, or a 4 s BNS chirp) and compute its Fourier transform.
Each Fourier coefficient $$\hat h_q$$ ($$q$$ numbers them) is one tone that
lasts the whole window. Sort the tones by power $$\lvert \hat h_q\rvert^2$$,
keep the strongest $$k$$, and measure how well those $$k$$ tones reproduce
the signal. Because Fourier tones are orthogonal, the best approximation
with $$k$$ of them keeps exactly the strongest $$k$$ (by Parseval's theorem;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-fourier-tones)),
and its **match** (its overlap with the signal, 1 for a perfect copy) is

$$
\text{match}(k) = \sqrt{\frac{\sum_{\text{strongest } k} \lvert \hat h_q\rvert^2}{\sum_{\text{all } q} \lvert \hat h_q\rvert^2}} .
$$

Both signals in the first plot are complex (the Project 8 record as
$$I + iQ$$, the chirp as $$\mathcal{A}e^{i\Phi}$$), so each tone is one
complex exponential. For a real signal, as in the second plot, a tone is the
pair of coefficients at $$\pm f$$: one real cosine, as in S4D.

This counts undamped tones on the Fourier grid; S4D's tones can also fade
and sit at any frequency, so the count is an indication of scale, not an
exact number for S4D. For BNS, freeing the tones did not change the
picture: in fits to whitened chirps on
[12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }}),
32 tones that could fade and sit anywhere (matrix-pencil fits) reached a
match of 0.20 to 0.29, against 0.25 to 0.33 for the strongest 32 Fourier
tones, and stayed below 0.92 even with 2,048
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-fourier-tones)).

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/p8_vs_bns_tones.png"
   alt="Match with the signal against the number of fixed tones kept, for 50 Project 8 signals and four BNS chirps"
   label="Tones needed: Project 8 against BNS"
   caption="A match of 0.9 takes a median of 3 tones (1 to 6) for 50 noise-free records of our Project 8 test set, and 476 to 744 (median 593.5) for four toy BNS chirps of 4 s with chirp mass 1.0 to 2.4 M☉. One S4D channel has 32." %}

**Project 8.** A trapped electron's signal is a narrow-band tone whose
frequency rises slowly as the electron radiates, with sidebands from its
motion along the trap (Asner et al. 2015,
[arXiv:1408.5362](https://arxiv.org/abs/1408.5362)). Over one of our records
it is close to a few steady tones: 1 to 6 Fourier tones give a match of 0.9
(figure above). That is already the shape of an S4D state, so a handful of
long-memory states at the right frequencies can hold its matched filter. An
internal baseline feeds the network the Fourier transform of the record
instead. Each Fourier coefficient is the overlap of the record with one
steady tone, which is the matched filter for a tone at that frequency, so
81% of the signal's energy lands in 1 to 6 bins. The front end does the
coherent addition before the network sees anything; the network only has to
find the peak and avoid the sidebands. Our own Project 8 runs fed the raw
time series instead, and did worse than a plain spectrum peak
([7 October]({{ u | append: '2026-10-07-why-denoising-does-not-detect/' | relative_url }})),
which fits this picture.

**BNS.** A chirp is not a tone. Its frequency sweeps, so a tone at one
frequency overlaps it only during the moment the chirp passes that
frequency. Tones that last the 4 s window are 0.25 Hz apart, so a chirp
needs close to one tone per 0.25 Hz of the band that holds its energy. For
the toy chirp at $$1.2\,M_\odot$$, 81% of the energy (a match of 0.9) lies
between 80.1 and 247.6 Hz, 670 tones wide; the measured count is 689
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-fourier-tones)).
One channel has 32 tones. Fitted to four whitened BNS chirps, the best of
three fitting methods kept a match of 0.25 to 0.33 with 32
([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})).
These are the best fits found, not proven limits. And in the trained
network the median memory per layer is 8.06 to 65.50 ms (section 1), far
shorter than a 4 s chirp.

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/tones_vs_chirp.png"
   alt="Left: match against number of tones for one chirp. Right: spectrogram of the chirp with horizontal lines at fixed tone frequencies"
   label="A tone meets a chirp only briefly"
   caption="Left: the real toy chirp at 1.2 M☉, tones counted as real cosines: 689 for a match of 0.9 and 2,470 for 0.99. Right: the chirp's frequency over time (darker is stronger). Each fixed tone (dashed line) at 95, 170 or 300 Hz crosses its track at one moment only; the one at 40 Hz, below the chirp's 80 Hz start, never does." %}

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
  that lag 0 is the merger. (The code below uses $$(\ell + 1)/f_s$$, so that
  the amplitude $$\tau^{-1/4}$$ stays finite at lag 0.)
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
   caption="Only each kernel's chirp mass and envelope are learned: one chirp mass plus the envelope's parameters per kernel, against 8,192 weights (one per lag) for a free-form 4 s kernel at 2048 Hz." %}

What one kernel produces on data containing a signal at SNR 10, in one
detector. On noise alone, where the kernel overlaps the data fully, its
energy has mean 2 and exceeds a value $$x$$ with probability $$e^{-x/2}$$ at
any one time (0.7% for 10). Over many samples the largest value is higher:
for $$N$$ independent samples its expected value is
$$2(\ln N + 0.577)$$, which is 16.4 for the 2,048 samples of one second.
Neighbouring samples are correlated, and the measured value is lower
(caption;
[derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-noise)).

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/kernel_output.png"
   alt="Energy output of one chirp kernel against time: a sharp spike at the merger for the right chirp mass, a smaller earlier bump for a kernel 1 percent off, and noise only"
   label="One chirp kernel's output"
   caption="Energy e(t) of one kernel over the last second of the window, one detector. At the true chirp mass it spikes at the merger (dotted line). A kernel 1% off peaks lower and earlier (without noise: match 0.40, 33 ms early): chirp mass and merger time partly trade off. Noise only: the same kernel at the true chirp mass on a separate stretch of pure noise. On 400 such noise windows, the largest energy in this last second had median 13.9, with 10% and 90% points at 11.4 and 17.3." %}

## 6. One correct kernel, or many?

For a single event whose waveform is known, one kernel equal to that
waveform is all you need: it is the matched filter (section 3) and recovers
the full SNR. A Newtonian kernel at the right chirp mass recovers less,
because the real waveform differs from it (weakness 3): on 300 noise-free
benchmark signals, the best of 512 Newtonian kernels had a median match of
0.80 ([8 October]({{ u | append: '2026-10-08-chirp-kernels-work/' | relative_url }})).

But the layer is fixed once trained, and events arrive with any chirp mass
from 0.85 to 2.75 $$M_\odot$$ (the range of our injection set). A kernel's
response falls below half once the event's chirp mass is 0.6% below or
0.19% above its own
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-tuning)):

{% include figure.html
   src="/assets/img/bns/2026-10-07/chirp-kernel/tuning_curves.png"
   alt="Response of three fixed kernels at chirp masses 1.15, 1.20 and 1.25 against the event chirp mass: each a narrow peak at its own value"
   label="Each kernel's tuning curve"
   caption="Noise-free response (match, 1 = perfect) of three fixed kernels to events across a range of chirp masses. Each peaks sharply at its own chirp mass and falls below 0.5 at 0.58 to 0.60% below it and 0.18 to 0.19% above it. Below, it falls slowly (0.23 to 0.24 at 2.96% below); above, it drops at once." %}

So one fixed kernel fails twice:

1. **It misses most events.** Its response is above half over a band 0.78%
   wide in chirp mass, while events span a factor 3.2, from 0.85 to 2.75
   $$M_\odot$$. With several kernels, an event between them gets a weak
   response from all of them.
2. **It cannot measure the chirp mass.** Its single number, $$E_j$$, mixes
   two unknowns: how loud the signal is, and how close its chirp mass is to
   the kernel's. Without noise its peak is the SNR squared times the match
   squared ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#peak-energy)),
   so a loud signal slightly off and a weak signal right on give the same
   number.

There are two ways around this:

- **Many kernels spread over the range** (the proposal). Some kernel is
  always close, and the *pattern* of the $$J$$ responses locates the chirp
  mass: the loudness scales all of them together, while the chirp mass
  decides which one is largest. How few kernels suffice depends on how well
  the network $$g$$ can interpolate between them; the benchmark's template
  bank, with no interpolation, used 613.
- **One kernel adjusted per event.** Move its chirp mass until its response
  peaks. That is fitting, not a fixed layer, and because the peak is narrow
  it needs a starting point already close, so in practice it is the second
  stage after a coarse set of kernels.

## 7. It keeps S4D's convolution view

An S4D layer can be computed in two equivalent ways:

- **The recurrent view.** Step through the samples one at a time, updating
  the $$N$$ state numbers. Each state follows
  $$x_\ell = e^{\Delta t\, a_n} x_{\ell-1} + \frac{e^{\Delta t\, a_n}-1}{a_n}\, u_\ell$$:
  one multiplication and one addition per sample, which generates its
  damped tone
  ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-s4d-step)).
  This needs only the current state, so it can run on a live stream.
- **The convolution view.** Build the whole kernel $$K_\ell$$ once, then
  convolve it with the input using the fast Fourier transform (FFT): a
  convolution becomes a multiplication in the frequency domain. This is how
  our training code actually runs S4D.

The chirp kernel keeps the convolution view exactly: the kernel module
returns a tensor of the same shape, and the same FFT convolution applies it.
The convolution is still linear and time-invariant, and the energy acts on
its output sample by sample. That is what makes the merger-time search
free: shifting the signal in time shifts $$e_j(t)$$ by the same amount
(away from the window's edges), so the maximum over time finds it wherever
it is.

It gives up the recurrent view. Generating a kernel step by step takes at
least as many states as the kernel's structure demands
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-states)),
and a chirp demands many: the best fits we found with 32 tones keep a match
of 0.25 to 0.33 (section 4). That matters only for streaming sample by
sample; on fixed 4 s windows, which is how we use the model, the convolution
view is all we need. Strictly, the result is
a long-convolution layer with a physical kernel, not a state-space model.

## 8. A code sketch

The S4D layer we use computes, in its forward pass (ml4gw `S4D.forward`):

```python
k = self.kernel(L=L)                              # kernel, (channels, L)
k_f = torch.fft.rfft(k, n=2 * L)                  # kernel in frequency
u_f = torch.fft.rfft(u, n=2 * L)                  # input in frequency
y = torch.fft.irfft(u_f * k_f, n=2 * L)[..., :L]  # convolution
y = y + u * self.D.unsqueeze(-1)                  # skip term
y = self.activation(y)                            # GELU
y = self.output_linear(self.dropout(y))           # mix channels
```

The chirp version swaps the kernel module, keeps the same three FFT lines,
and replaces the GELU with the energy:

```python
TSUN = 4.925491e-6  # G * (1 solar mass) / c^3, in seconds (IAU 2015 nominal)


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
   caption="The best match over time between a signal and a kernel, as the kernel's chirp mass moves away from the true one. Sharp near zero. A heavier kernel keeps a slowly falling partial match (0.40 at +1%, 0.24 at +3%); a lighter one drops below 0.25 by -0.25% and below 0.11 past -1%." %}

1. **Narrow peaks, weak gradients.** A kernel's response falls to half
   within 0.6% below and 0.19% above its chirp mass (the tuning curves
   above). A kernel far from every training event gets little signal about
   which way to move. Spreading the initial chirp masses and using a soft
   maximum should help; whether the kernels move at all is the first thing
   to check.
2. **Chirp mass and merger time trade off.** A kernel slightly off in chirp
   mass still finds a partial match by shifting its merger time (the earlier
   peak in the kernel-output figure, 33 ms early for a kernel 1% heavy, and
   the long tail above). Peak heights alone may confuse "slightly off" with
   "weaker".
3. **The Newtonian phase is approximate.** Real BNS signals have phase
   corrections that depend on the mass ratio and the spins (Cutler and
   Flanagan 1994, [arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014))
   and on the stars' tidal deformation (Flanagan and Hinderer 2008,
   [arXiv:0709.1915](https://arxiv.org/abs/0709.1915)). Over 305 to 636
   cycles a small phase error adds up, so a kernel at exactly the right
   chirp mass can still lose match (median 0.80 on noise-free benchmark
   signals, section 6). Higher-order phase terms would fix this at the cost
   of more kernel parameters.
4. **Only the chirp mass is in the kernel.** The mass ratio and the spins
   enter the phase only through the higher-order terms the kernel leaves out
   (Cutler and Flanagan 1994), so the layer says little about them.
5. **Coverage.** The kernels must tile the whole range finely enough that
   every event is near one. If too few, the head must interpolate from weak,
   partial matches, which may cap the precision.
6. **Glitches.** The energy responds to any loud transient that resembles
   part of a chirp. In the benchmark, with no veto, a handful of windows
   with loud glitches scored 30 to 300 on the template bank. Searches add
   signal-consistency tests (Allen 2005,
   [arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045); Babak et al.
   2013, [arXiv:1208.3491](https://arxiv.org/abs/1208.3491)); this layer has
   none.
7. **Look-elsewhere.** Taking the maximum over many kernels and all times
   raises the score of pure noise. For $$N$$ independent tries the expected
   largest energy is $$2(\ln N + 0.577)$$, so each doubling of the number of
   kernels raises it by at most $$2\ln 2 = 1.39$$
   ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#ck-noise)).
   The benchmark's bank (613 templates, all times, two detectors) gave
   empty windows a best network SNR with median 6.27 and 99th percentile
   7.73.
8. **Sparse gradient from the hard maximum.** Only one time sample per kernel
   per event receives any gradient: the derivative of a maximum is zero for
   every entry but the largest.
9. **Whitening assumption.** The matched filter is optimal for stationary
   Gaussian noise (FINDCHIRP). Real detector noise drifts and has glitches;
   away from them it is close to stationary and Gaussian (Abbott et al.
   2020).
10. **No streaming.** It loses S4D's recurrent view (section 7).

## Status

Nothing here has been trained yet. The test is direct: on the same windows
as the benchmark, does a chirp-kernel layer move the fraction of SNR 8 to 12
events within 2% from the network's 16 to 29% toward the template bank's 96
to 99%?
