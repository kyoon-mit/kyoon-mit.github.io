---
layout: project
title: The free-kernel network
permalink: /projects/bns/free-kernel/
eyebrow: Method
math: true
summary: >-
  What the free-kernel network computes, how many outputs it has, how many
  numbers it learns, and why it trains five times faster than an S4D with a
  quarter of its parameters.
---

{%- assign u = '/projects/bns/updates/' -%}

The free-kernel network is a network with one hidden layer. Each of its 256
hidden units is a learned filter as long as the 4 s window, applied to the
whitened strain of both detectors. Results are in the updates of
[13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})
(noisy data) and
[14 October]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})
(clean signal only).

## As a network

{% include figure.html
   src="/assets/img/bns/2026-10-14/free_kernel_nodes.png"
   alt="Node diagram: 2 times 8192 input samples connected to 256 hidden units, each a learned 4 s kernel, connected to 2 outputs, the chirp-mass mean and variance"
   label="One hidden layer"
   caption="The version that regresses chirp mass from the clean signal, at 2048 Hz. Each line into a hidden unit is a kernel weight; the same kernel is applied at every time shift, so the hidden layer is a convolution, read out by its largest response." %}

Hidden unit $c$ convolves each detector's strain $x$ with its kernel $k_c$
and keeps the largest energy over the window:

$$
E_c(t) = 2\,\Big|\sum_{\ell=0}^{8191} k_c(\ell)\, x(t-\ell)\Big|^2,
\qquad
h_c = \log\Big(1 + \max_t \big[E_c^{\rm H1}(t) + \max_{|\tau| \le 10\,{\rm ms}} E_c^{\rm L1}(t+\tau)\big]\Big),
$$

then the 256 values $h_c$ are standardized (zero mean, unit spread across the
units) and passed to a linear output layer.

The kernels are complex, which gives each unit a cosine and a sine filter at
once, so its energy does not depend on the signal's phase. Each kernel is
scaled to unit norm, so $E_c$ is the SNR² of the signal it matches best
(white noise gives 2 on average at each time).

### Why the log and the standardization

For a loud signal, a kernel's peak energy is roughly the signal's SNR²
times the kernel's match to the waveform squared,

$$
\max_t E_c \approx {\rm SNR}^2\, m_c^2,
\qquad
\log \max_t E_c \approx \log {\rm SNR}^2 + \log m_c^2 .
$$

Chirp mass sets which kernels match well, the pattern of $m_c$ across the
256 units. Loudness sets ${\rm SNR}^2$, which multiplies every unit by the
same factor and carries no information about chirp mass.

- **The log** turns that common factor into a common offset, and compresses
  a range of about 10 (noise) to a few thousand (SNR 50) into a range the
  linear layer can handle. The 1 inside $\log(1 + \cdot)$ keeps it finite.
- **Standardizing across the 256 units** (subtracting their mean and
  dividing by their spread, separately for every window) removes the common
  offset $\log {\rm SNR}^2$. What reaches the output layer is the shape of
  the response across the kernels, the same whether the event is at SNR 10
  or 50. Without it, the output layer would have to learn to ignore
  loudness, and its inputs would change scale with every event.

This holds for signals well above the noise. Near the noise level, the
largest energies come partly from noise, and the pattern carries less
information.

{% include figure.html
   src="/assets/img/bns/2026-10-14/free_kernel_diagram.png"
   alt="Block diagram of the same network, step by step, with the tensor shape after each step"
   label="Step by step"
   caption="The same network as a sequence of operations, with the shape of the data after each one, for one 4 s window." %}

## Outputs

<div markdown="1">

| version | outputs | trained with | estimate and uncertainty |
|---|---|---|---|
| regressor (clean signal, 14 Oct) | 2: mean μ and variance σ² (softplus) | β-weighted Gaussian likelihood (β = 0.3) | μ, and σ from σ² |
| classifier (noisy data, 13 Oct) | 235: one per log-chirp-mass bin from 0.85 to 2.75 M☉ | cross-entropy against a narrow Gaussian around the true value | peak of the softmax, and its spread |

</div>

## What it learns

<div markdown="1">

| part | numbers stored | numbers used |
|---|---|---|
| kernels, 2048 Hz: 256 × 8192 complex values | 4,194,304 | 2,056,192 (positive frequencies, 20 to 1024 Hz) |
| kernels, 1024 Hz (noisy runs): 256 × 4096 complex values | 2,097,152 | 1,007,616 (20 to 512 Hz) |
| output layer, regressor: 256 × 2 + 2 | 514 | 514 |
| output layer, classifier: 256 × 235 + 235 | 60,395 | 60,395 |

</div>

Each kernel is stored as its spectrum: one complex number per frequency,
set to zero outside the band. An inverse Fourier transform turns it into the
kernel's time samples. Storing the time samples directly gives the same set
of possible kernels; a run that does so is in progress, to test whether the
spectrum storage matters for training.

## Why it trains faster than S4D

With 4.2 million stored numbers, the free-kernel network takes 39 ms per
training step (batch of 32 windows at 2048 Hz). The S4D regressor with 256
channels, state size 256 and 4 layers has 1.06 million numbers and takes
208 ms; it also needs 24 GB of GPU memory against 5 GB. Speed depends on how
often each number is used and how much data flows through the network, not
on how many numbers there are.

- **Free kernels: each number used once per window.** There is one layer.
  The input's spectrum is multiplied by the 256 stored kernel spectra and
  transformed back, about 0.6 billion operations per window. The maximum
  over time then reduces each window to 256 numbers, and the rest is tiny.
- **S4D: few numbers, reused at every time step.** Each of the 4 layers
  carries all 256 channels at all 8,192 time steps. Each layer builds its
  256 kernels from 128 tones each (an array of 256 × 128 × 8,192 terms),
  convolves the 256 channels, and then mixes channels with a 256 → 512 linear
  map applied separately at every one of the 8,192 time steps: the same
  131,000 numbers used 8,192 times, about a billion multiply-adds per window
  per layer. In all, about 10 billion operations per window, and every
  layer's full-length activations are kept in memory for training.

So the free kernels are wide and shallow, with each number used once; the
S4D has fewer numbers but uses them at every time step of every layer.
