---
layout: project
title: Readings
permalink: /projects/bns/readings/
eyebrow: Background reading
summary: >-
  What to read to follow the October 2026 work: why chirp mass needs a
  matched filter, why plain SNR fails on real noise, what an S4D kernel can
  and cannot hold, and what a learned long kernel is. In reading order.
---

{%- assign u = '/projects/bns/updates/' -%}

The updates of [12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})
and [13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})
lean on four ideas: convolution as filtering, the complex (two-quadrature)
signal, matched filtering for compact binaries, and how an S4D layer or a free
kernel builds its convolution. These are the sources, in the order I would
read them. If you read only two, read 3 and 6.

1. **Convolution and the convolution theorem.** A. V. Oppenheim and A. S.
   Willsky, *Signals and Systems*, chapter 2 (linear time-invariant systems)
   and section 4.4 (convolution in time is multiplication in frequency). The
   basis of every layer discussed here.

2. **Analytic signals.** A. V. Oppenheim and R. W. Schafer, *Discrete-Time
   Signal Processing*, the chapter on discrete Hilbert transforms. Why keeping
   only positive frequencies gives a cosine and a sine filter at once, and why
   |y|² does not depend on the signal's phase.

3. **Matched filtering for gravitational waves.** J. D. E. Creighton and
   W. G. Anderson, *Gravitational-Wave Physics and Astronomy* (2011), chapter 7;
   or M. Maggiore, *Gravitational Waves, Vol. 1* (2008), chapter 7. Why the
   optimal detector correlates the data with the waveform, what SNR means,
   and why time and phase are maximized over. A hands-on companion: the PyCBC
   matched-filtering tutorial.

4. **What a binary's signal can tell you.** C. Cutler and É. E. Flanagan,
   Phys. Rev. D 49, 2658 (1994), [arXiv:gr-qc/9402014](https://arxiv.org/abs/gr-qc/9402014).
   Chirp mass is set by the many cycles and measured well; mass ratio and spin
   trade off against it. Behind our findings that mass ratio is not
   measurable from 4 s windows and that spin biases chirp mass.

5. **Glitches and the χ² test.** B. Allen, Phys. Rev. D 71, 062001 (2005),
   [arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045). Why the SNR alone
   fails on real detector noise, and the band test that fixes most of it.
   The same pipeline in full: B. Allen et al., "FINDCHIRP", Phys. Rev. D 85,
   122006 (2012), [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116).

6. **S4D: a kernel made of damped tones.** A. Gu, A. Gupta, K. Goel and C. Ré,
   "On the Parameterization and Initialization of Diagonal State Space
   Models", NeurIPS 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893),
   sections 2 and 3. How a state-space layer becomes one long convolution,
   why its kernel is a sum of damped tones, and why the timestep range must
   match the data. Optional, the original S4: A. Gu, K. Goel and C. Ré,
   ICLR 2022, [arXiv:2111.00396](https://arxiv.org/abs/2111.00396).

7. **Free (long) kernels.** D. Y. Fu et al., "Simple Hardware-Efficient Long
   Convolutions for Sequence Modeling", ICML 2023,
   [arXiv:2302.06646](https://arxiv.org/abs/2302.06646). Learned kernels as
   long as the input, and the regularization that keeps them clean.

8. **Context: networks against matched filtering for short signals.**
   H. Gabbard, M. Williams, F. Hayes and C. Messenger, Phys. Rev. Lett. 120,
   141103 (2018), [arXiv:1712.06041](https://arxiv.org/abs/1712.06041). A small-kernel CNN matches matched filtering for
   short binary black hole signals, which is why aframe's ResNet works there
   and not for long BNS chirps. For the size of a template bank and its
   compression: K. Cannon et al., Phys. Rev. D 82, 044025 (2010),
   [arXiv:1005.0012](https://arxiv.org/abs/1005.0012).

9. <span id="mamba"></span>**Mamba: state spaces whose dynamics follow the input.**
   S4D keeps one fixed set of tones; Mamba lets the step size and the input
   and output weights change at every sample with the input. Papers:
   - A. Gu and T. Dao, "Mamba: Linear-Time Sequence Modeling with Selective
     State Spaces" (2023), [arXiv:2312.00752](https://arxiv.org/abs/2312.00752).
     Mamba-1: the selective layer and its scan.
   - T. Dao and A. Gu, "Transformers are SSMs: Generalized Models and
     Efficient Algorithms Through Structured State Space Duality", ICML 2024,
     [arXiv:2405.21060](https://arxiv.org/abs/2405.21060). Mamba-2: one real
     decay per head, computed as matrix products; faster, but no oscillation.
   - Lahoti et al., "Mamba-3: Improved Sequence Modeling using State Space
     Principles", ICLR 2026, [arXiv:2603.15569](https://arxiv.org/abs/2603.15569).
     A complex-valued state with input-dependent rotation.

   Simpler explanations, in the order I would read them:
   - M. Grootendorst, [A Visual Guide to Mamba and State Space Models](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-mamba-and-state)
     (2024). From recurrent networks to S4 to Mamba, almost entirely in
     diagrams.
   - K. Ayonrinde, [Mamba Explained](https://thegradient.pub/mamba-explained/),
     The Gradient (2024). What "selective" means and why it matters.
   - T. Dao, [State Space Duality (Mamba-2) Part I: The Model](https://tridao.me/blog/2024/mamba2-part1-model/)
     (2024). The authors' own walk through Mamba-2.
   - S. Rush, [Mamba: The Hard Way](https://srush.github.io/annotated-mamba/hard.html).
     The scan written out step by step in code, for when the above is not
     enough.
