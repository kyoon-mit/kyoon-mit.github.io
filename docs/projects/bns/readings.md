---
layout: project
title: Readings
permalink: /projects/bns/readings/
eyebrow: Background reading
summary: >-
  A starting order for readers new to learning the noise, then what to read
  to follow the October 2026 work: why chirp mass needs a
  matched filter, why plain SNR fails on real noise, what an S4D layer can
  and cannot hold, what the free kernels are, and whether a Gaussian
  describes the uncertainty of a chirp-mass estimate and how to check it;
  denoising and learning the noise; and the standard generative models, GANs
  and diffusion. In reading order.
---

{%- assign u = '/projects/bns/updates/' -%}

## Start here: learning the noise

The [20 October update]({{ u | append: '2026-10-20-slic-noise-score-on-bns/' | relative_url }})
uses ideas from four fields at once: detector noise and matched filtering,
Bayesian parameter estimation, samplers, and diffusion models. For a reader
new to some of them, this is the order I would take, from the most basic.
Each step names what it explains in that update.

- **First: noise, whitening and the matched filter.** LIGO Scientific
  Collaboration and Virgo Collaboration, "A guide to LIGO-Virgo detector
  noise and extraction of transient gravitational-wave signals", Class.
  Quantum Grav. 37, 055002 (2020),
  [arXiv:1908.11170](https://arxiv.org/abs/1908.11170). Why a signal far
  below the noise in every sample still stands out once the data are
  correlated with its expected shape, and what whitening does.
- **Second: what a likelihood and a posterior are.** E. Thrane and C.
  Talbot, "An introduction to Bayesian inference in gravitational-wave
  astronomy: parameter estimation, model selection, and hierarchical
  models", Publ. Astron. Soc. Aust. 36, e010 (2019),
  [arXiv:1809.02293](https://arxiv.org/abs/1809.02293). The Gaussian
  likelihood that SLIC replaces, and how a posterior turns into error bars.
- **Third: how a sampler draws a posterior.** D. W. Hogg and D.
  Foreman-Mackey, "Data analysis recipes: using Markov chain Monte Carlo",
  Astrophys. J. Suppl. 236, 11 (2018),
  [arXiv:1710.06068](https://arxiv.org/abs/1710.06068). Walkers, steps,
  burn-in, and how to judge whether a chain has run long enough.
- **Fourth: what a diffusion model learns.** Y. Song, "Generative modeling
  by estimating gradients of the data distribution", blog post, 5 May 2021,
  [yang-song.net/blog/2021/score](https://yang-song.net/blog/2021/score/).
  The score, and why removing added noise teaches it; then Vincent (2011)
  under 22 below for the proof.
- **Fifth: SLIC itself.** Legin et al. (2025) under 19 below.
- **Sixth: predicting the next sample.** J. Makhoul, "Linear prediction: a
  tutorial review", Proc. IEEE 63, 561 (1975),
  [doi:10.1109/PROC.1975.9792](https://doi.org/10.1109/PROC.1975.9792),
  for why the errors of the best linear predictor are whitened noise and
  why a Gaussian with a spectrum is a linear predictor; then WaveNet under
  23 below for the network version. This is the noise model the update
  turns to.
- **Seventh: when the matched filter can be beaten.** Allen et al. (2002)
  under 17 below: in Gaussian noise the matched filter is the best detector
  for a known waveform, and in noise with heavier tails it is not.

If you read only three, read the first, the sixth and the seventh: they
cover what the next test measures. The
[23 October update]({{ u | append: '2026-10-23-next-sample-noise-model/' | relative_url }})
reports that test. For it, the sixth explains the Gaussian it is compared
with (Makhoul describes the Levinson-Durbin recursion it uses), and the
seventh why the detection test compares likelihood ratios with the
template.

## Filters, matched filtering and S4D layers

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
   Chirp mass is measured well (0.1 to 1% in their study), the reduced mass,
   and so the mass ratio, much less well, and the masses and spins are
   strongly correlated. Behind our findings
   ([12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }}))
   that mass ratio is not measurable from 4 s windows and that spin biases
   chirp mass.

5. **Glitches and the χ² test.** B. Allen, Phys. Rev. D 71, 062001 (2005),
   [arXiv:gr-qc/0405045](https://arxiv.org/abs/gr-qc/0405045). Why the SNR alone
   fails on real detector noise, which produces large spurious filter
   outputs, and the χ² test across frequency bands that tells many of them
   from real signals.
   The same pipeline in full: B. Allen et al., "FINDCHIRP", Phys. Rev. D 85,
   122006 (2012), [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116).

6. **S4D: a kernel made of damped tones.** A. Gu, A. Gupta, K. Goel and C. Ré,
   "On the Parameterization and Initialization of Diagonal State Space
   Models", NeurIPS 2022, [arXiv:2206.11893](https://arxiv.org/abs/2206.11893),
   sections 2 to 4. How a state-space layer becomes one long convolution
   (sections 2 and 3), and why, with the S4D-Lin start, its kernel is a sum
   of damped tones (section 4). How the timestep sets the tones' frequencies
   and memory on our data is on the
   [derivations page]({{ '/projects/bns/derivations/' | relative_url }}#s4d-tones). Optional, the original S4:
   A. Gu, K. Goel and C. Ré, ICLR 2022,
   [arXiv:2111.00396](https://arxiv.org/abs/2111.00396).

7. **Free (long) kernels.** D. Y. Fu et al., "Simple Hardware-Efficient Long
   Convolutions for Sequence Modeling", ICML 2023,
   [arXiv:2302.06646](https://arxiv.org/abs/2302.06646). Learned kernels as
   long as the input, and simple steps, such as squashing the kernel weights,
   that keep them smooth.

8. **Context: networks against matched filtering for short signals.**
   H. Gabbard, M. Williams, F. Hayes and C. Messenger, Phys. Rev. Lett. 120,
   141103 (2018), [arXiv:1712.06041](https://arxiv.org/abs/1712.06041). A
   convolutional network reproduces the sensitivity of a matched filter for
   short binary black hole signals in Gaussian noise. Aframe's ResNet is
   built for such signals; the AFRAME BNS search heterodynes first, because
   that network works when the signal is concentrated in a few seconds
   (Gupta et al. 2026, [arXiv:2607.01372](https://arxiv.org/abs/2607.01372),
   section II B). On our 4 s windows without heterodyning, a time-domain
   ResNet of aframe's design stayed at the level of the den-reg in its first
   100 epochs, far below one layer of learned 4 s kernels
   ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }}),
   validation figure). For reducing a template bank's filters by an order of
   magnitude: K. Cannon et al., Phys. Rev. D 82, 044025 (2010),
   [arXiv:1005.0012](https://arxiv.org/abs/1005.0012).

9. <span id="mamba"></span>**Mamba: state spaces whose dynamics follow the input.**
   S4D keeps one fixed set of tones; Mamba lets the step size and the input
   and output weights change at every sample with the input. Papers:
   - A. Gu and T. Dao, "Mamba: Linear-Time Sequence Modeling with Selective
     State Spaces" (2023), [arXiv:2312.00752](https://arxiv.org/abs/2312.00752).
     Mamba-1: the selective layer and its scan. Its appendix E.4.1 finds that
     on long audio waveforms the selection mechanism hurts and a real state
     does worse than a complex one, as our Mamba-2 den-reg did against S4D
     ([26 October]({{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }})).
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

## Uncertainty for chirp mass

Our networks quote an uncertainty with each chirp-mass estimate. The den-reg
and the three networks of the
[signal-only test]({{ u | append: '2026-10-14-signal-only-test/' | relative_url }})
give each event a mean and a spread σ, and are trained as if the error were
Gaussian, with the β-weighted Gaussian likelihood
([derivation]({{ '/projects/bns/derivations/' | relative_url }}#beta-nll));
the noisy free-kernel runs of
[13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})
give a histogram over 235 chirp-mass bins instead. The readings below answer
two questions: is a Gaussian the right shape for our chirp-mass uncertainty,
and how do we check whether a quoted uncertainty is right? Our checks so far,
the ratio of the mean absolute error to the mean σ and the spread of error/σ
in SNR bins, compare widths on average and do not test the shape
([calibration]({{ '/projects/bns/derivations/' | relative_url }}#calibration),
[z-score spread]({{ '/projects/bns/derivations/' | relative_url }}#sep-zscore)).
The list continues in reading order. If you read only three, read Rodriguez
et al. under 10, Gneiting et al. under 12, and Angelopoulos and Bates under 14.

{: start="10"}
10. **When a Gaussian describes a measured chirp mass, and when it does not.**
    For a loud signal the measured parameters scatter as a Gaussian; near the
    noise level, near the edges of what is allowed, and when a glitch
    overlaps the signal, they need not.
    - C. Cutler and É. E. Flanagan, item 4 above, appendix A, section 5, "The
      Gaussian approximation and conditions for its validity". At high SNR
      the measured parameters of a binary scatter as a Gaussian whose width
      follows from the Fisher matrix; the appendix shows where this picture
      fails, at low SNR and where prior knowledge matters. That covers much of
      our test population: from SNR 4, 75% of events lie below SNR 8
      ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#late-snr-bands)).
    - M. Vallisneri, "Use and abuse of the Fisher information matrix in the
      assessment of gravitational-wave parameter-estimation prospects", Phys.
      Rev. D 77, 042001 (2008),
      [arXiv:gr-qc/0703086](https://arxiv.org/abs/gr-qc/0703086). How to tell
      when the SNR is high enough for the Gaussian estimate from the Fisher
      matrix to be trusted, what goes wrong when it is not or when prior
      knowledge matters, and the next corrections in 1/SNR. Our Cramér–Rao
      bound for chirp mass is such an estimate
      ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-fisher)).
    - C. L. Rodriguez, B. Farr, W. M. Farr and I. Mandel, "Inadequacies of the
      Fisher information matrix in gravitational-wave parameter estimation",
      Phys. Rev. D 88, 084013 (2013),
      [arXiv:1308.1397](https://arxiv.org/abs/1308.1397). For 200 simulated
      binaries without spin (component masses 1 to 15 M☉), the Fisher-matrix
      widths are compared with the full calculation by stochastic sampling:
      below an SNR near 8 the chirp-mass widths differ by several orders of
      magnitude in some cases, and boundaries such as equal masses, which a
      Gaussian cannot respect, bias the estimate. A direct test, at the SNRs
      of our faint events, of the assumption that the error is Gaussian.
    - E. Baird, S. Fairhurst, M. Hannam and P. Murphy, "Degeneracy between
      mass and spin in black-hole-binary waveforms", Phys. Rev. D 87, 024035
      (2013), [arXiv:1211.0546](https://arxiv.org/abs/1211.0546). For light
      binaries a change of mass ratio can be traded for a change of spin with
      little change in the waveform, while chirp mass stays well determined;
      the uncertain combinations lie along a ridge, a continuous trade-off,
      not at separate values. Our
      [12 October]({{ u | append: '2026-10-12-template-bank-network/' | relative_url }})
      update cites it for the shift in chirp mass of templates with the wrong
      spin.
    - M. Hannam, D. A. Brown, S. Fairhurst, C. L. Fryer and I. W. Harry, "When
      can gravitational-wave observations distinguish between black holes and
      neutron stars?", Astrophys. J. Lett. 766, L14 (2013),
      [arXiv:1301.5616](https://arxiv.org/abs/1301.5616). At SNR 10 to 20 the
      same trade-off between mass ratio and spins often prevents telling
      neutron stars from black holes, although chirp mass is measured.
      Background for why our networks learn chirp mass and barely learn mass
      ratio ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#sep-prior)).
    - B. P. Abbott et al. (LIGO Scientific Collaboration and Virgo
      Collaboration), "Properties of the binary neutron star merger
      GW170817", Phys. Rev. X 9, 011001 (2019),
      [arXiv:1805.11579](https://arxiv.org/abs/1805.11579). In their Table II
      the chirp mass of GW170817 as seen at the detector, before the
      correction for redshift, is 1.1975 +0.0001/−0.0001 M☉ with the spins
      limited to 0.05, and 1.1976 +0.0004/−0.0002 M☉ with spins up to 0.89
      (medians, with the distances to the 5% and 95% points): a narrow peak
      that becomes lopsided once large spins are allowed. The caption notes
      what the line of equal masses bounds: the component masses and the
      mass ratio.
    - J. Powell, "Parameter estimation and model selection of gravitational
      wave signals contaminated by transient detector noise glitches", Class.
      Quantum Grav. 35, 155017 (2018),
      [arXiv:1803.11346](https://arxiv.org/abs/1803.11346). A glitch that
      overlaps a signal biases its measured parameters most when it
      coincides with the signal's peak and is louder than the signal: a
      source of rare large errors that a Gaussian σ does not describe.
    - C. Pankow et al., "Mitigation of the instrumental noise transient in
      gravitational-wave data surrounding GW170817", Phys. Rev. D 98, 084016
      (2018), [arXiv:1808.03619](https://arxiv.org/abs/1808.03619).
      GW170817 had a loud glitch in LIGO-Livingston 1.1 s before the merger
      (Abbott et al., Phys. Rev. Lett. 119, 161101 (2017),
      [arXiv:1710.05832](https://arxiv.org/abs/1710.05832)). The paper
      compares the ways it was removed and shows, with simulated signals like
      GW170817, that the masses and the other parameters of the source itself
      can still be measured without bias.

11. **Networks that predict their own uncertainty, and known pitfalls.**
    - D. A. Nix and A. S. Weigend, "Estimating the mean and variance of the
      target probability distribution", Proc. 1994 IEEE International
      Conference on Neural Networks (ICNN'94), vol. 1, p. 55 (1994),
      [doi:10.1109/ICNN.1994.374138](https://doi.org/10.1109/ICNN.1994.374138).
      The original network with two outputs, a mean and a variance, trained
      with the Gaussian likelihood: the setup of our den-reg and signal-only
      networks. According to Sluijterman et al. (below), the authors advised
      training the mean alone first, with the variance held fixed.
    - A. Kendall and Y. Gal, "What uncertainties do we need in Bayesian deep
      learning for computer vision?", Advances in Neural Information
      Processing Systems 30 (NIPS 2017),
      [arXiv:1703.04977](https://arxiv.org/abs/1703.04977). Separates scatter
      caused by noise in the data, which a predicted σ can describe, from the
      network's own ignorance, which it cannot, and shows that the Gaussian
      likelihood allows a network to give less weight to events it marks as
      noisy. Our σ describes only the first kind.
    - B. Lakshminarayanan, A. Pritzel and C. Blundell, "Simple and scalable
      predictive uncertainty estimation using deep ensembles", Advances in
      Neural Information Processing Systems 30 (NIPS 2017),
      [arXiv:1612.01474](https://arxiv.org/abs/1612.01474). Several networks
      of this kind, trained from different random starts and combined (a deep
      ensemble), gave well-calibrated uncertainties in their tests, and larger
      ones on inputs unlike the training data. The spread between the
      networks measures what a single network's σ leaves out.
    - M. Seitzer, A. Tavakoli, D. Antic and G. Martius, "On the pitfalls of
      heteroscedastic uncertainty estimation with probabilistic neural
      networks", International Conference on Learning Representations (ICLR
      2022), [arXiv:2203.09168](https://arxiv.org/abs/2203.09168). The
      Gaussian likelihood divides each event's squared error by σ², so events
      the network fits badly get a large σ and then stop being fitted, which
      can stall the mean. The β-weighted version we use (β = 0.3) reduces
      this; the authors found β = 0.5 the best compromise in their tests, and
      note that the value of the weighted loss does not measure the model's
      quality, as we found
      ([derivation]({{ '/projects/bns/derivations/' | relative_url }}#beta-nll)).
    - A. Stirn, H.-H. Wessels, M. Schertzer, L. Pereira, N. E. Sanjana and
      D. A. Knowles, "Faithful heteroscedastic regression with neural
      networks", Proc. 26th International Conference on Artificial
      Intelligence and Statistics (AISTATS 2023), PMLR 206, 5593 (2023),
      [arXiv:2212.09184](https://arxiv.org/abs/2212.09184). A network trained
      with the Gaussian likelihood can give much less accurate means than the
      same network trained for the mean alone; two changes to training keep
      the mean as accurate and give calibrated variances. It suggests a check
      for us: is our mean as good as that of a network trained for the mean
      only?
    - N. Skafte (Detlefsen), M. Jørgensen and S. Hauberg, "Reliable training
      and estimation of variance networks", Advances in Neural Information
      Processing Systems 32 (NeurIPS 2019),
      [arXiv:1906.03260](https://arxiv.org/abs/1906.03260). In a simple test
      the fitted variance came out much too small and did not grow away from
      the training data. Their remedies include fitting the variance with the
      mean held fixed, and a Student-t output, whose tails are heavier than a
      Gaussian's.
    - L. Sluijterman, E. Cator and T. Heskes, "Optimal training of mean
      variance estimation neural networks", Neurocomputing 597, 127929
      (2024), [arXiv:2302.08875](https://arxiv.org/abs/2302.08875). The
      training problems of such networks largely disappear if the mean is
      first trained alone with a fixed variance, as Nix and Weigend advised;
      regularizing the mean and the variance separately helps further.
    - C. Guo, G. Pleiss, Y. Sun and K. Q. Weinberger, "On calibration of
      modern neural networks", Proc. 34th International Conference on Machine
      Learning (ICML 2017), PMLR 70, 1321 (2017),
      [arXiv:1706.04599](https://arxiv.org/abs/1706.04599). The class
      probabilities of modern classifiers are poorly calibrated, usually too
      confident, and dividing all the scores by one number, fitted on data
      kept apart from training (temperature scaling), fixes most of it. This applies to
      the 235-bin chirp-mass output of our noisy runs of 13 October.

12. **Checking whether a quoted uncertainty is right.** Over many simulated
    events with known true values, the fraction that falls inside each
    quoted interval should match the interval's stated probability.
    - T. Gneiting, F. Balabdaoui and A. E. Raftery, "Probabilistic forecasts,
      calibration and sharpness", J. R. Stat. Soc. B 69, 243 (2007),
      [doi:10.1111/j.1467-9868.2007.00587.x](https://doi.org/10.1111/j.1467-9868.2007.00587.x).
      Sets the goal, predicted distributions as narrow as possible while
      calibrated, and the main check: for each event, the predicted
      probability of a value below the true one, collected in a histogram
      (the PIT histogram). It is flat for a calibrated method, U-shaped when
      the intervals are too narrow and hump-shaped when they are too wide.
      Our ratio of mean absolute error to mean σ tests only the average
      width.
    - V. Kuleshov, N. Fenner and S. Ermon, "Accurate uncertainties for deep
      learning using calibrated regression", Proc. 35th International
      Conference on Machine Learning (ICML 2018), PMLR 80, 2796 (2018),
      [arXiv:1807.00263](https://arxiv.org/abs/1807.00263). Defines
      calibration for estimates of a number (a 90% interval should contain the
      truth 90% of the time) and corrects it after training with a monotone
      map fitted on data kept apart from training. Our definition of calibrated cites it.
    - S. R. Cook, A. Gelman and D. B. Rubin, "Validation of software for
      Bayesian models using posterior quantiles", J. Comput. Graph. Stat. 15,
      675 (2006),
      [doi:10.1198/106186006X136976](https://doi.org/10.1198/106186006X136976).
      Draw a true value from the prior, simulate data, and find where the
      truth falls in the computed distribution; if the method is right, this
      position is uniform over many trials. An early form of the p-p test used
      for gravitational-wave codes.
    - S. Talts, M. Betancourt, D. Simpson, A. Vehtari and A. Gelman,
      "Validating Bayesian inference algorithms with simulation-based
      calibration", [arXiv:1804.06788](https://arxiv.org/abs/1804.06788)
      (2018). The same test, using the position of the true value among the
      method's samples, with plots whose shape shows what kind of error is
      present.
    - J. Hermans, A. Delaunoy, F. Rozet, A. Wehenkel, V. Begy and G. Louppe,
      "A crisis in simulation-based inference? Beware, your posterior
      approximations can be unfaithful", Transactions on Machine Learning
      Research (2022), [arXiv:2110.06581](https://arxiv.org/abs/2110.06581).
      In benchmarks, methods trained on simulations, including the kind
      behind DINGO, often gave distributions too narrow for their stated
      coverage; averaging several trained networks helped. A reason to
      measure coverage directly rather than trust the training loss.
    - J. Veitch et al., "Parameter estimation for compact binaries with
      ground-based gravitational-wave observations using the LALInference
      software library", Phys. Rev. D 91, 042003 (2015),
      [arXiv:1409.7215](https://arxiv.org/abs/1409.7215). Validates the
      standard LIGO-Virgo inference code with a p-p plot: for each
      probability p, the fraction of simulated signals whose true value lies
      inside the interval that holds probability p, which should follow the
      diagonal (their Fig. 10).
    - I. M. Romero-Shaw et al., "Bayesian inference for compact binary
      coalescences with Bilby: validation and application to the first
      LIGO-Virgo gravitational-wave transient catalogue", Mon. Not. R. Astron.
      Soc. 499, 3295 (2020),
      [arXiv:2006.00714](https://arxiv.org/abs/2006.00714). The same p-p test
      for the Bilby code, described there as the traditional validation of
      gravitational-wave inference codes. Our σ and our 235-bin output can be
      put through it, overall and within SNR bins.

13. **Outputs that are not one Gaussian.**
    - C. M. Bishop, "Mixture density networks", Technical Report
      NCRG/94/004, Aston University, Birmingham (1994),
      [publications.aston.ac.uk/id/eprint/373](https://publications.aston.ac.uk/id/eprint/373).
      A network that outputs the weights, centres and widths of several
      Gaussians, so the predicted distribution can be lopsided or have
      several peaks; it is trained by maximizing the likelihood of the true
      values, as our networks are.
      The natural extension if one Gaussian is too simple.
    - E. Imani and M. White, "Improving regression performance with
      distributional losses", Proc. 35th International Conference on Machine
      Learning (ICML 2018), PMLR 80, 2157 (2018),
      [arXiv:1806.04613](https://arxiv.org/abs/1806.04613). Predicting
      probabilities for bins of the target, trained against a narrow Gaussian
      around the true value (their HL-Gaussian), gave more accurate estimates
      than fitting the value directly, which they trace to better-behaved
      gradients. Our 235-bin chirp-mass output ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})) is built this
      way; they take the mean of the histogram as the estimate, we take its
      peak.
    - R. Koenker and G. Bassett, "Regression quantiles", Econometrica 46, 33
      (1978), [doi:10.2307/1913643](https://doi.org/10.2307/1913643). How to
      estimate a quantile, for example the 5% or 95% point, directly, by
      minimizing an absolute error that weights misses above and below
      differently. A network trained this way gives lopsided intervals with
      no Gaussian assumption; the method of Romano, Patterson and Candès
      under 14 starts from such outputs.
    - G. Papamakarios, E. Nalisnick, D. J. Rezende, S. Mohamed and B.
      Lakshminarayanan, "Normalizing flows for probabilistic modeling and
      inference", J. Mach. Learn. Res. 22(57), 1 (2021),
      [arXiv:1912.02762](https://arxiv.org/abs/1912.02762). A review of
      normalizing flows, which build a complicated distribution from a simple
      one by a chain of invertible steps, so a network can output lopsided or
      many-peaked distributions over several parameters at once.
    - M. Dax, S. R. Green, J. Gair, J. H. Macke, A. Buonanno and B.
      Schölkopf, "Real-time gravitational wave science with neural posterior
      estimation", Phys. Rev. Lett. 127, 241103 (2021),
      [arXiv:2106.12594](https://arxiv.org/abs/2106.12594). DINGO: a
      normalizing flow trained on simulations gives the joint distribution of
      all of a binary's parameters in a minute per event, close to standard
      sampling codes, and passes a p-p test on 1,000 simulated signals. The
      reference for replacing one σ with a full distribution.
    - M. Dax, S. R. Green, J. Gair, N. Gupte, M. Pürrer, V. Raymond, J.
      Wildberger, J. H. Macke, A. Buonanno and B. Schölkopf, "Real-time
      inference for binary neutron star mergers using machine learning",
      Nature 639, 49 (2025),
      [arXiv:2407.09602](https://arxiv.org/abs/2407.09602). DINGO-BNS:
      complete inference for binary neutron stars, masses included, in one
      second. A full learned distribution is practical for our kind of
      source.
    - S. R. Green and J. Gair, "Complete parameter inference for GW150914
      using deep learning", Mach. Learn.: Sci. Technol. 2, 03LT01 (2021),
      [arXiv:2008.03312](https://arxiv.org/abs/2008.03312). A normalizing
      flow trained on simulated signals and noise gives the full distribution
      of the 15 parameters of GW150914, consistent with standard sampling.
    - H. Gabbard, C. Messenger, I. S. Heng, F. Tonolini and R. Murray-Smith,
      "Bayesian parameter estimation using conditional variational
      autoencoders for gravitational-wave astronomy", Nature Phys. 18, 112
      (2022), [arXiv:1909.06296](https://arxiv.org/abs/1909.06296). A network
      that learns to draw samples of the source parameters given the data
      reproduces the parameter distributions of binary black holes six
      orders of magnitude faster than standard sampling, in their estimate.
    - S. Sharma Chaudhary, G. Puleo and M. Cavaglià, "A neural network for
      estimating compact binary coalescence parameters of gravitational-wave
      events in real time", Class. Quantum Grav. 42, 185017 (2025),
      [arXiv:2505.18311](https://arxiv.org/abs/2505.18311). A
      gravitational-wave example of quantile outputs: a network trained to
      output quantiles gives lower and upper bounds on chirp mass, mass ratio
      and total mass for events found by low-latency searches.

14. **Intervals with a guaranteed hit rate: conformal prediction.** Compute
    a score, such as the size of the error divided by σ, on held-out
    simulated events (events kept apart from training), find the value that
    90% of the scores stay below, and use it to size the interval of each
    new event. The rate then holds on average over events drawn the same
    way, whatever the shape of the errors.
    - V. Vovk, A. Gammerman and G. Shafer, *Algorithmic Learning in a Random
      World* (Springer, 2005),
      [doi:10.1007/b106715](https://doi.org/10.1007/b106715); 2nd edition
      (Springer, 2022),
      [doi:10.1007/978-3-031-06649-8](https://doi.org/10.1007/978-3-031-06649-8).
      The founding book: given any score of how unusual an event is,
      prediction sets that contain the truth at a chosen rate, assuming only
      that the events are exchangeable.
    - A. N. Angelopoulos and S. Bates, "Conformal prediction: a gentle
      introduction", Found. Trends Mach. Learn. 16, 494 (2023),
      [doi:10.1561/2200000101](https://doi.org/10.1561/2200000101);
      [arXiv:2107.07511](https://arxiv.org/abs/2107.07511). A practical
      introduction with code; the place to start.
    - H. Papadopoulos, K. Proedrou, V. Vovk and A. Gammerman, "Inductive
      confidence machines for regression", in Machine Learning: ECML 2002,
      Lecture Notes in Computer Science, p. 345 (Springer, 2002),
      [doi:10.1007/3-540-36755-1_29](https://doi.org/10.1007/3-540-36755-1_29).
      The first version that uses a held-out set (split conformal
      prediction) for estimating a number, so that only one model has to be
      trained.
    - J. Lei, M. G'Sell, A. Rinaldo, R. J. Tibshirani and L. Wasserman,
      "Distribution-free predictive inference for regression", J. Am. Stat.
      Assoc. 113, 1094 (2018),
      [doi:10.1080/01621459.2017.1307116](https://doi.org/10.1080/01621459.2017.1307116);
      [arXiv:1604.04173](https://arxiv.org/abs/1604.04173). Split conformal
      prediction with its guarantee: coverage on average over events
      (marginal coverage), which the authors distinguish from the much
      stronger coverage for each input (conditional coverage). Their section
      5.2 divides each error by a predicted spread, the scaled score that
      would use our σ.
    - Y. Romano, E. Patterson and E. J. Candès, "Conformalized quantile
      regression", Advances in Neural Information Processing Systems 32
      (NeurIPS 2019), [arXiv:1905.03222](https://arxiv.org/abs/1905.03222).
      Starts from a network that outputs a lower and an upper quantile and
      shifts both by an amount fitted on held-out events, so the intervals can
      be lopsided and change width; a variant controls the misses on each side
      separately. A different method from scaling the error by σ.
    - R. F. Barber, E. J. Candès, A. Ramdas and R. J. Tibshirani, "Predictive
      inference with the jackknife+", Ann. Stat. 49, 486 (2021),
      [doi:10.1214/20-AOS1965](https://doi.org/10.1214/20-AOS1965);
      [arXiv:1905.02928](https://arxiv.org/abs/1905.02928). Uses refits with
      one event left out instead of a held-out set, and keeps a guarantee for
      exchangeable data that the plain jackknife lacks. It needs one refit
      per training event, which is not practical for our networks.
    - R. F. Barber, E. J. Candès, A. Ramdas and R. J. Tibshirani, "The limits
      of distribution-free conditional predictive inference", Inf. Inference
      10, 455 (2021),
      [doi:10.1093/imaiai/iaaa017](https://doi.org/10.1093/imaiai/iaaa017);
      [arXiv:1903.04684](https://arxiv.org/abs/1903.04684). Explains why
      exact coverage for each individual input is impossible without
      assumptions, and studies weaker versions that are possible. It is why a
      conformal interval is right on average over a test population and not
      automatically at each SNR.
    - V. Vovk, "Conditional validity of inductive conformal predictors",
      Proc. Asian Conference on Machine Learning (ACML 2012), PMLR 25, 475
      (2012), [arXiv:1209.2673](https://arxiv.org/abs/1209.2673); journal
      version Mach. Learn. 92, 349 (2013),
      [doi:10.1007/s10994-013-5355-6](https://doi.org/10.1007/s10994-013-5355-6).
      Coverage within chosen groups of events, obtained by calibrating each
      group on its own held-out events and keeping the groups large (his
      example: not below 100). For us the groups would have to be defined by
      something known for a real event, such as σ, not by the true SNR.
    - Y. Romano, M. Sesia and E. J. Candès, "Classification with valid and
      adaptive coverage", Advances in Neural Information Processing Systems
      33 (NeurIPS 2020), [arXiv:2006.02544](https://arxiv.org/abs/2006.02544).
      Conformal sets for classifiers built from the predicted class
      probabilities, adding classes from the most probable down until enough
      probability is covered. Applied to our 235-bin output, it gives a set of
      chirp-mass bins with a guaranteed average coverage.
    - M. Sesia and Y. Romano, "Conformal prediction using conditional
      histograms", Advances in Neural Information Processing Systems 34
      (NeurIPS 2021), [arXiv:2105.08747](https://arxiv.org/abs/2105.08747).
      Turns a predicted histogram into the shortest interval that holds enough
      probability and calibrates it on held-out events, so the intervals
      follow skewed distributions while keeping a guaranteed average
      coverage. It is the published method closest to our 235-bin output.
    - V. Chernozhukov, K. Wüthrich and Y. Zhu, "Distributional conformal
      prediction", Proc. Natl. Acad. Sci. USA 118, e2107794118 (2021),
      [doi:10.1073/pnas.2107794118](https://doi.org/10.1073/pnas.2107794118);
      [arXiv:1909.07889](https://arxiv.org/abs/1909.07889). Calibrates with
      each event's predicted probability of a value below the truth, the
      quantity behind the PIT histogram, which allows lopsided intervals, and
      validity for each input that holds approximately when the predicted
      distribution is good.

15. **Conformal prediction when events are not exchangeable, and its uses in
    gravitational-wave astronomy.**
    - R. F. Barber, E. J. Candès, A. Ramdas and R. J. Tibshirani, "Conformal
      prediction beyond exchangeability", Ann. Stat. 51, 816 (2023),
      [doi:10.1214/23-AOS2276](https://doi.org/10.1214/23-AOS2276);
      [arXiv:2202.13415](https://arxiv.org/abs/2202.13415). Weights the
      held-out events so that little coverage is lost when they are not
      exchangeable with the new ones, for example when the noise drifts.
      Relevant if we calibrate on O3a noise and apply the intervals on O3b,
      as our validation and test sets do ([13 October]({{ u | append: '2026-10-13-learned-long-kernels/' | relative_url }})).
    - V. Chernozhukov, K. Wüthrich and Y. Zhu, "Exact and robust conformal
      inference methods for predictive machine learning with dependent
      data", Proc. 31st Conference on Learning Theory (COLT 2018), PMLR 75,
      732 (2018), [arXiv:1802.06300](https://arxiv.org/abs/1802.06300).
      Conformal inference for time series by permuting blocks of consecutive
      points: exact for exchangeable data and approximately valid for
      dependent data under weak conditions.
    - C. Xu and Y. Xie, "Conformal prediction interval for dynamic
      time-series", Proc. 38th International Conference on Machine Learning
      (ICML 2021), PMLR 139, 11559 (2021),
      [arXiv:2010.09107](https://arxiv.org/abs/2010.09107); journal version
      "Conformal prediction for time series", IEEE Trans. Pattern Anal. Mach.
      Intell. 45, 11575 (2023),
      [doi:10.1109/TPAMI.2023.3272339](https://doi.org/10.1109/TPAMI.2023.3272339).
      Intervals for time series built around an ensemble of models, without
      assuming exchangeability and without
      refitting for every point, with bounds on how far the coverage can fall
      short.
    - H. Jiang, R. F. Barber, A. Pananjady and Y. Xie, "Leave a window out:
      modifying the jackknife for predictive inference in time series",
      [arXiv:2605.30292](https://arxiv.org/abs/2605.30292) (2026). For time
      series the plain jackknife can lose coverage badly; refitting without
      each point and a window of points after it restores approximately valid
      average coverage when the fitting is stable and the dependence between
      points fades. It needs one refit per point, and makes no claim about
      skewed errors, boundaries or coverage for each kind of event.
    - G. Ashton, N. Colombo, I. Harry and S. Sachdev, "Calibrating
      gravitational-wave search algorithms with conformal prediction", Phys.
      Rev. D 109, 123027 (2024),
      [arXiv:2402.19313](https://arxiv.org/abs/2402.19313). Introduces
      conformal prediction to gravitational-wave astronomy, to set detection
      thresholds with a validated error rate and to combine search pipelines.
      It concerns detection, not parameter estimates.
    - A.-K. Malz, G. Ashton and N. Colombo, "Classification uncertainty for
      transient gravitational-wave noise artifacts with optimized conformal
      prediction", Phys. Rev. D 111, 084078 (2025),
      [arXiv:2412.11801](https://arxiv.org/abs/2412.11801). Conformal sets for
      the Gravity Spy glitch classifier, and how the choice of score changes
      them: the nearest worked example for conformal sets on a classifier
      output like our 235 bins.
    - G. Ashton, A.-K. Malz and N. Colombo, "Enhancing gravitational-wave
      detection: a machine learning pipeline combination approach with robust
      uncertainty quantification", Phys. Rev. Lett. 136, 011402 (2026),
      [arXiv:2504.17587](https://arxiv.org/abs/2504.17587). Combines the
      outputs of several search pipelines with a learned classifier and
      conformal calibration, applied to the GWTC-3 catalogue.
    - A.-K. Malz, G. Ashton and N. Colombo, "Improving the sensitivity of
      gravitational wave detection with weighted conformal prediction", Proc.
      15th Symposium on Conformal and Probabilistic Prediction with
      Applications, PMLR 329, 937 (2026),
      [arXiv:2609.11401](https://arxiv.org/abs/2609.11401). Reweights
      simulated calibration events to match the real data when the two
      differ, which restored coverage in their tests. The same issue arises
      when we calibrate on simulated injections.

## Denoising and learning the noise

Our den-reg rebuilds the signal from noisy data: it denoises. The other side
of the problem is to learn the noise itself, from the detector's strain alone,
so that a search knows what real noise looks like instead of assuming it is
Gaussian. The readings below cover networks that denoise gravitational-wave
data, what is optimal when the noise is not Gaussian, how far real noise is
from Gaussian, and networks that have learned real detector noise. If you
read only two, read Legin et al. under 19 and Allen et al. 2002 under 17.

{: start="16"}
16. **Networks that denoise gravitational-wave signals.**
    - H. Shen, D. George, E. A. Huerta and Z. Zhao, "Denoising gravitational
      waves using deep learning with recurrent denoising autoencoders", ICASSP
      2019, [doi:10.1109/ICASSP.2019.8683061](https://doi.org/10.1109/ICASSP.2019.8683061),
      [arXiv:1711.09919](https://arxiv.org/abs/1711.09919). A recurrent
      autoencoder, trained only on simulated Gaussian noise, recovers
      gravitational-wave signals in real, non-Gaussian LIGO noise.
    - W. Wei and E. A. Huerta, "Gravitational wave denoising of binary black
      hole mergers with deep learning", Phys. Lett. B 800, 135081 (2020),
      [arXiv:1901.00869](https://arxiv.org/abs/1901.00869). Denoises
      GW150914, GW170104, GW170608 and GW170814 from LIGO noise, with overlaps
      of 0.99 or more against numerical-relativity waveforms.
    - P. Bacon, A. Trovato and M. Bejger, "Denoising gravitational-wave
      signals from binary black holes with dilated convolutional
      autoencoder", [arXiv:2205.13513](https://arxiv.org/abs/2205.13513)
      (2022). An encoder-decoder network trained on simulated signals in real
      O1 noise and on a set of glitches, tested on real events of O1 and O2.
    - C. Ma, X. Yu, Z. Cao and M. Jia, "Extraction of binary neutron star
      gravitational wave waveforms from Einstein Telescope using deep
      learning", [arXiv:2406.15813](https://arxiv.org/abs/2406.15813) (2024).
      The nearest to our case: neutron-star binaries, with separate denoising
      networks for the early inspiral, the late inspiral and the merger.
    - R. Raha and P. Kumar, "Survey of novel deep learning architectures for
      denoising gravitational-wave signals",
      [arXiv:2609.13272](https://arxiv.org/abs/2609.13272) (2026). Five
      architectures trained the same way across spinning binary black holes;
      networks whose branches follow the frequency ranges of inspiral, merger
      and ringdown did better than larger generic ones. On real noise with no
      known signal their output stays near zero except at noise transients.
    - Ours: the [8 September update]({{ u | append: '2026-09-08-denoiser-loss/' | relative_url }}).

17. **What is optimal when the noise is not Gaussian.** In stationary Gaussian
    noise the matched filter is the optimal detector for a known waveform;
    real noise has a heavier tail, and then it is not.
    - B. Allen, W. G. Anderson, P. R. Brady, D. A. Brown and J. D. E.
      Creighton, "FINDCHIRP: an algorithm for detection of gravitational waves
      from inspiraling compact binaries", Phys. Rev. D 85, 122006 (2012),
      [arXiv:gr-qc/0509116](https://arxiv.org/abs/gr-qc/0509116). The matched
      filter as the standard search computes it, under the Gaussian
      assumption.
    - B. Allen, J. D. E. Creighton, É. E. Flanagan and J. D. Romano, "Robust
      statistics for deterministic and stochastic gravitational waves in
      non-Gaussian noise I: frequentist analyses", Phys. Rev. D 65, 122002
      (2002), [arXiv:gr-qc/0105100](https://arxiv.org/abs/gr-qc/0105100).
      For weak signals in noise with a heavier tail than Gaussian, the best
      detector clips or truncates the whitened data before correlating it
      with the waveform: close to optimal in Gaussian noise, and far less
      sensitive to the large excursions of the tail.
    - S. A. Kassam, *Signal Detection in Non-Gaussian Noise* (Springer, 1988),
      [doi:10.1007/978-1-4612-3834-8](https://doi.org/10.1007/978-1-4612-3834-8).
      The general theory of detectors that are optimal for weak signals in
      non-Gaussian noise.

18. **How far real noise is from Gaussian, and how it changes with time.**
    - R. Macas and A. Lundgren, "Sensitive test of non-Gaussianity in
      gravitational-wave detector data", Phys. Rev. D 108, 063016 (2023),
      [arXiv:2306.09019](https://arxiv.org/abs/2306.09019). A test that
      measures how far real data depart from Gaussian. Around GW200129 it
      found that cleaning removed much of the excess noise below 50 Hz, that
      some remained, and that above 85 Hz none was removed.
    - S. Mozzon, L. K. Nuttall, A. Lundgren, T. Dent, S. Kumar and A. H.
      Nitz, "Dynamic normalization for compact binary coalescence searches in
      non-stationary noise", [arXiv:2002.09407](https://arxiv.org/abs/2002.09407)
      (2020). Broadband noise changes the sensitivity over tens of seconds and
      raises the rate of false events. A statistic for that change, used to
      re-rank the PyCBC candidates of the second observing run, gave a 5%
      larger sensitive volume for low-mass binaries, particularly neutron-star
      binaries.
    - T. Venumadhav, B. Zackay, J. Roulet, L. Dai and M. Zaldarriaga, "A new
      search pipeline for compact binary mergers: results for binary black
      holes in the first observing run of Advanced LIGO", Phys. Rev. D 100,
      023011 (2019), [arXiv:1902.10341](https://arxiv.org/abs/1902.10341). An
      independent search with its own treatment of glitches and of noise that
      changes with time.
    - K. Chatziioannou, N. Cornish, M. Wijngaarden and T. B. Littenberg,
      "Modeling compact binary signals and instrumental glitches in
      gravitational wave data", Phys. Rev. D 103, 044013 (2021),
      [arXiv:2101.01200](https://arxiv.org/abs/2101.01200). Fits the signal
      with waveforms and the glitches with short wave packets at the same
      time, instead of cleaning the data first.

19. **Networks that have learned real detector noise.**
    - R. Legin, M. Isi, K. W. K. Wong, Y. Hezaveh and L. Perreault-Levasseur,
      "Gravitational-wave parameter estimation in non-Gaussian noise using
      score-based likelihood characterization", Astrophys. J. Lett. 985, L46
      (2025), [arXiv:2410.19956](https://arxiv.org/abs/2410.19956). Diffusion
      models learn the distribution of real LIGO noise from detector data,
      without assuming it Gaussian or stationary, and are combined with a
      waveform model into a likelihood. On 400 simulated events in real
      Hanford or Livingston noise, the estimates stay unbiased, even with loud
      glitches and no cleaning. The closest existing work to learning the
      noise; it estimates parameters and does not search.
    - M. Lopez, V. Boudart, K. Buijsman, A. Reza and S. Caudill, "Simulating
      transient noise bursts in LIGO with generative adversarial networks",
      Phys. Rev. D 106, 023027 (2022),
      [arXiv:2203.06494](https://arxiv.org/abs/2203.06494). A GAN learns one
      glitch type (blips; glitches in general occur at around one per minute)
      and generates populations of them.
    - J. Powell, L. Sun, K. Gereb, P. D. Lasky and M. Dollmann, "Generating
      transient noise artefacts in gravitational-wave detector data with
      generative adversarial networks", Class. Quantum Grav. 40, 035006 (2023),
      [arXiv:2207.00207](https://arxiv.org/abs/2207.00207). GANs generate
      images of the 22 most common glitch types of LIGO, KAGRA and Virgo; a
      classifier assigns the generated ones to the right type 99.0% of the
      time.
    - T. Dooney, L. Curier, D. Tan, M. Lopez, C. Van Den Broeck et al., "One
      flexible model for multiclass gravitational wave signal and glitch
      generation", Phys. Rev. D 110, 022004 (2024),
      [arXiv:2401.16356](https://arxiv.org/abs/2401.16356). One GAN generates
      several kinds of signals and glitches in time, with a second
      discriminator that looks at the time derivative.

    These learn glitches one type at a time, or short stretches of noise for
    parameter estimation. None of them uses a learned noise model to search
    for signals.

20. **Removing noise with witness sensors (not our route; we use the strain
    only).** G. Vajente et al., "Machine-learning non-stationary noise out of
    gravitational wave detectors", Phys. Rev. D 101, 042003 (2020),
    [arXiv:1911.09083](https://arxiv.org/abs/1911.09083); R. Ormiston et al.,
    "Noise reduction in gravitational-wave data via deep learning", Phys. Rev.
    Research 2, 033066 (2020), [arXiv:2005.06534](https://arxiv.org/abs/2005.06534);
    M. Saleem et al., "Demonstration of machine learning-assisted real-time
    noise regression in gravitational wave detectors",
    [arXiv:2306.11366](https://arxiv.org/abs/2306.11366) (2023), on O3 data.

## Generative models: GANs and diffusion

A generative model learns to produce new samples that look like its training
data. Trained on detector noise, it would give unlimited realistic noise and,
for some kinds, the probability of any stretch of noise. The two standard
families are GANs and diffusion models; for raw waveforms there are also
models that predict one sample at a time.

{: start="21"}
21. **GANs.** A generator makes samples and a second network, the
    discriminator, learns to tell them from real data; each is trained
    against the other.
    - I. J. Goodfellow et al., "Generative adversarial networks",
      [arXiv:1406.2661](https://arxiv.org/abs/1406.2661) (2014). The original.
    - A. Radford, L. Metz and S. Chintala, "Unsupervised representation
      learning with deep convolutional generative adversarial networks",
      [arXiv:1511.06434](https://arxiv.org/abs/1511.06434) (2015). The
      convolutional GAN design.
    - T. Salimans et al., "Improved techniques for training GANs",
      [arXiv:1606.03498](https://arxiv.org/abs/1606.03498) (2016). Ways to
      keep training stable and to stop the generator from making only a few
      kinds of output.
    - M. Arjovsky, S. Chintala and L. Bottou, "Wasserstein GAN",
      [arXiv:1701.07875](https://arxiv.org/abs/1701.07875) (2017). A different
      measure of the distance between real and generated data, for more
      stable training.
    - C. Donahue, J. McAuley and M. Puckette, "Adversarial audio synthesis",
      [arXiv:1802.04208](https://arxiv.org/abs/1802.04208) (2018). GANs on raw
      audio waveforms, the nearest kind of data to strain.

22. **Diffusion models.** Training buries real samples under added random
    static of every strength and teaches a network to remove it; generating
    starts from pure static and removes it step by step. The static is
    Gaussian; the output is not, it looks like the training data.
    - J. Sohl-Dickstein et al., "Deep unsupervised learning using
      nonequilibrium thermodynamics",
      [arXiv:1503.03585](https://arxiv.org/abs/1503.03585) (2015). The
      original idea, taken from statistical physics.
    - Y. Song and S. Ermon, "Generative modeling by estimating gradients of
      the data distribution", [arXiv:1907.05600](https://arxiv.org/abs/1907.05600)
      (2019). The same idea seen as learning which way to nudge a sample to
      make it more probable.
    - J. Ho, A. Jain and P. Abbeel, "Denoising diffusion probabilistic
      models", [arXiv:2006.11239](https://arxiv.org/abs/2006.11239) (2020).
      The version that made diffusion practical.
    - Y. Song et al., "Score-based generative modeling through stochastic
      differential equations", [arXiv:2011.13456](https://arxiv.org/abs/2011.13456)
      (2020). Joins the two views and shows how to compute the probability of
      a sample.
    - P. Dhariwal and A. Nichol, "Diffusion models beat GANs on image
      synthesis", [arXiv:2105.05233](https://arxiv.org/abs/2105.05233)
      (2021). Why diffusion overtook GANs on images.
    - T. Karras, M. Aittala, T. Aila and S. Laine, "Elucidating the design
      space of diffusion-based generative models",
      [arXiv:2206.00364](https://arxiv.org/abs/2206.00364) (2022). Which
      design choices matter, and settings that work.
    - P. Vincent, "A connection between score matching and denoising
      autoencoders", Neural Computation 23, 1661 (2011),
      [doi:10.1162/NECO_a_00142](https://doi.org/10.1162/NECO_a_00142). Why a
      network trained to remove added static has learned the shape of the
      data's distribution: the link between denoising and learning the
      distribution.

23. **Generating raw waveforms, including with state-space models.**
    - A. van den Oord et al., "WaveNet: a generative model for raw audio",
      [arXiv:1609.03499](https://arxiv.org/abs/1609.03499) (2016). Predicts
      each sample from all earlier ones, so the probability of a whole
      waveform follows exactly.
    - Z. Kong et al., "DiffWave: a versatile diffusion model for audio
      synthesis", [arXiv:2009.09761](https://arxiv.org/abs/2009.09761) (2020).
      Diffusion on raw waveforms.
    - K. Goel, A. Gu, C. Donahue and C. Ré, "It's raw! Audio generation with
      state-space models", [arXiv:2202.09729](https://arxiv.org/abs/2202.09729)
      (2022). SaShiMi, a network built from S4 layers: the best at generating
      waveforms one sample at a time in their tests, and better than the
      original network when used inside DiffWave.

24. **Judging a generator with a classifier, and correcting it.**
    - D. Lopez-Paz and M. Oquab, "Revisiting classifier two-sample tests",
      [arXiv:1610.06545](https://arxiv.org/abs/1610.06545) (2016). Train a
      classifier to tell real samples from generated ones: if on held-out
      data it does no better than chance, the two match, and what it does
      catch shows what the generator is missing.
    - A. Grover et al., "Bias correction of learned generative models using
      likelihood-free importance weighting",
      [arXiv:1906.09531](https://arxiv.org/abs/1906.09531) (2019). The
      classifier's output becomes a weight that corrects the generator's
      errors without retraining it.
