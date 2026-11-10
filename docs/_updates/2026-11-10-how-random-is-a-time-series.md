---
title: "How random is a time series: entropy, what the past tells about the next sample, and the spectrum, with an hour of reading"
date: 2026-11-10
tags: [noise, denoising, matched-filter]
math: true
summary: >-
  Definitions for one question: can any model learn detector noise well
  enough to remove it and beat the matched filter? Randomness is measured by
  entropy, in nats. What the past tells about the next sample is the mutual
  information between them. For Gaussian noise both follow from the spectrum
  alone, by Kolmogorov's formula. In these units the spectrum of our whitened
  noise accounts for 0.142 (H1) and 0.066 (L1) nats per sample, which a
  Gaussian detector already uses, and the 23 October network found 0.036 to
  0.060 nats per sample beyond the spectrum in clean O3a windows. Five
  readings with page numbers are listed.
---

{%- assign u = '/projects/bns/updates/' -%}
{%- assign d = '/projects/bns/derivations/' -%}
{%- assign c = '/projects/bns/derivations/#nov10-entropy' -%}

The goal is to beat the matched filter. One route is a model that learns the
noise and removes it. Before trying that on raw, unwhitened data, I need a
number that says how much of the noise can be learned at all. This page
defines that number, with small examples I checked numerically, and points
to the standard texts for each step. It reports no new measurement: the
numbers for our data come from the updates of 19, 23 and 26 October, restated
in the new units.

## 1. Randomness of one draw: entropy

- **Surprise.** An outcome of probability $p$ carries a surprise $-\ln p$.
  A certain outcome ($p = 1$) carries none, and a rare one carries a lot.
  Surprises of independent outcomes add, because their probabilities
  multiply.
- **Entropy is the average surprise:** $H = -\sum_i p_i \ln p_i$. It is the
  same expression as the Gibbs entropy of statistical mechanics without
  Boltzmann's constant, as Shannon notes in his section 6. He shows there
  that it is the only measure of uncertainty that is continuous in the
  $p_i$, grows with the number of equally likely outcomes, and adds up when
  a choice is made in two steps.
- **Units.** With the natural logarithm the unit is the nat; with the
  logarithm to base 2 it is the bit. One bit is $\ln 2 = 0.6931$ nats.
- **Examples** ([check]({{ c | relative_url }})):

| | Entropy in nats | in bits |
|---|---|---|
| Fair coin | 0.6931 | 1.0000 |
| Coin that lands heads 9 times in 10 | 0.3251 | 0.4690 |
| Fair die | 1.7918 | 2.5850 |

The unfair coin is less random than the fair one, and its entropy is lower.
That is the sense in which entropy measures randomness.

## 2. Values on a continuous scale

- For a density $p(x)$ the entropy is $-\int p(x) \ln p(x)\,dx$ (Shannon,
  section 20). A Gaussian of standard deviation $\sigma$ has
  $\tfrac12 \ln(2\pi e \sigma^2)$, which is 1.4189 nats for $\sigma = 1$.
- This value changes when the units of $x$ change, so only differences
  between entropies of the same variable mean something. Every statement
  below is about such a difference.
- **At a fixed variance the Gaussian has the largest entropy** (Shannon,
  section 20, item 5). The amount by which a distribution falls short of the
  Gaussian with its variance is its negentropy. It is 0 only for a Gaussian.
  At unit variance ([check]({{ c | relative_url }})):

| Density | Entropy in nats | Negentropy |
|---|---|---|
| Gaussian | 1.4189 | 0 |
| Laplace (heavier tails) | 1.3466 | 0.0724 |
| Uniform (no tails) | 1.2425 | 0.1765 |

## 3. What the past tells about the next sample

- **Conditional entropy** $H(X \mid Y)$ is the entropy that $X$ still has,
  on average, once $Y$ is known. Knowing something never raises it:
  $H(X \mid Y) \le H(X)$.
- **Mutual information** is the drop: $I(X; Y) = H(X) - H(X \mid Y)$. It is
  0 exactly when $X$ and $Y$ are independent, and it catches any kind of
  dependence, where a correlation catches only the linear kind.
- **For a time series,** take $X$ to be the next sample and $Y$ all the
  earlier ones. $H(X \mid Y)$ is then the entropy rate $h$: the randomness
  that each new sample brings that no model of the past can remove
  (Shannon, section 7). The dependence of the series on its past is
  $I = H(x_t) - h$, in nats per sample.
- **Independent samples have $I = 0$.** The past says nothing about the next
  sample. This is the earlier conclusion that nothing can be learned from
  independent Gaussian samples, as a number.
- **A series with memory.** Let $x_t = a\,x_{t-1} + e_t$ with independent
  Gaussian $e_t$. The best prediction is $a\,x_{t-1}$, the share of the
  variance it predicts is $a^2$, and $I = -\tfrac12 \ln(1 - a^2)$
  ([derivation and check]({{ c | relative_url }})):

| $a$ | Share of variance predicted | $I$ in nats per sample |
|---|---|---|
| 0 | 0 | 0 |
| 0.5 | 25% | 0.1438 |
| 0.9 | 81% | 0.8304 |
| 0.99 | 98.01% | 1.9585 |

- **The limit on prediction.** No predictor that uses the past, linear or
  not, has a mean squared error below $e^{2h}/(2\pi e)$. For Gaussian noise
  the best linear predictor reaches this limit
  ([derivation]({{ c | relative_url }})). So $h$ is the limit on removing
  noise by predicting it.

## 4. Gaussian noise: the spectrum says everything

For stationary Gaussian noise with spectrum $S(f)$:

- **Kolmogorov's formula.** The mean squared error of the best prediction
  from the whole past is $\exp\big(\overline{\ln S}\big)$, the geometric
  mean of the spectrum over frequency
  ([derivation]({{ d | relative_url }}#oct26-predictable-share)). The
  variance is the arithmetic mean $\overline{S}$.
- **Spectral flatness** is their ratio,
  $\exp\big(\overline{\ln S}\big)/\overline{S}$, between 0 and 1. A flat
  spectrum has flatness 1. One minus the flatness is the share of the
  variance that the past predicts.
- **In nats:** $I = -\tfrac12 \ln(\text{flatness})$
  ([derivation]({{ c | relative_url }})). In the example above the flatness
  is $1 - a^2$.
- **Whitening** divides each frequency by the noise amplitude there, to make
  the spectrum flat. Noise that is Gaussian with an exactly flat spectrum
  has independent samples and $I = 0$.

## 5. How a model measures entropy, and why its number can be trusted

- A model assigns a probability density to each sample given the earlier
  ones. Its score on data it was not trained on is the average of minus the
  log of that density, in nats per sample. This is the loss the 23 October
  network was trained with.
- **This score is never below the entropy rate on average, and equals it
  only for the true distribution** (Gibbs' inequality, MacKay, section 2.6;
  [derivation]({{ c | relative_url }})). Example: unit Gaussian draws scored
  by a Gaussian model of width 1.5 give 1.5466 nats, above their entropy of
  1.4189.
- So a model can make the noise look more random than it is, and not less.
  Each score on held-out data is an upper limit on $h$, up to the scatter of
  an average over a finite number of windows, and a lower score from any
  model is a real finding about the noise.

## 6. Our noise in these units

From the earlier updates, with no new measurement:

| | H1 | L1 | Source |
|---|---|---|---|
| Raw strain: nats per sample from the previous sample alone, for Gaussian noise | 3.48 | 3.66 | correlations 0.99953 and 0.99967, [26 October]({{ u | append: '2026-10-26-subtracting-noise-and-mamba-2/' | relative_url }}) |
| Whitened: share of variance the infinite past predicts | 24.73% | 12.28% | 26 October |
| Whitened: the same in nats per sample, for Gaussian noise | 0.1420 | 0.0655 | $-\tfrac12\ln(1 - \text{share})$ |
| Clean held-out O3a windows: score of the best Gaussian (typical spectrum) | 1.3785 | 1.3825 | [23 October]({{ u | append: '2026-10-23-next-sample-noise-model/' | relative_url }}) |
| The same windows: score of the network | 1.3185 | 1.3469 | 23 October |
| Network below the Gaussian | 0.0601 | 0.0355 | 23 October |

- **Raw strain is far from random from one sample to the next,** and
  whitening removes most of that.
- **Whitened noise is not white.** The past still predicts 24.7% (H1) and
  12.3% (L1) of a sample's variance, because narrow lines survive whitening
  ([19 October]({{ u | append: '2026-10-19-how-gaussian-is-our-noise/' | relative_url }})).
- **Beyond the spectrum,** the network found 0.036 to 0.060 nats per sample
  in clean O3a windows, and 10.40 to 17.52 in loud ones. By section 5 the
  entropy rate of clean O3a noise is at most 1.3185 (H1) and 1.3469 (L1)
  nats per sample. On O3b the network did not hold this lead (L1: 0.1318
  nats worse than the Gaussian).

## 7. What this says about beating the matched filter

- **If the noise is Gaussian with a known spectrum, nothing beats the
  matched filter for a known signal.** The likelihood ratio is then the
  matched filter weighted by that spectrum, and the likelihood ratio finds
  the most signals at every false-alarm probability
  ([derivation]({{ d | relative_url }}#oct23-known-template)).
- **The dependence that the spectrum accounts for is already used.**
  Predicting the noise from its past, subtracting the prediction, and
  matched filtering what is left is the same Gaussian detector
  ([derivation]({{ d | relative_url }}#oct26-subtract-then-filter)). This
  holds for raw data as for whitened data: the large dependence of raw
  strain on its past is what whitening removes.
- **The room left is what the Gaussian with that spectrum misses:**
  dependence that is not linear or a spectrum that drifts, and a shape that
  is not Gaussian (section 2). The 0.036 to 0.060 nats per sample is the
  sum of these in clean windows. It has not been split into its parts.
- **A gap in nats is necessary and not sufficient.** With no gap, the noise
  is the Gaussian and no model can win. With a gap, a model may win, but on
  23 October the network with the better score found 0.2% of signals where
  the matched filter found 91.9%. The score is an average over the whole
  window, and detection depends only on how the model changes when the
  template is added.

## 8. An hour of reading

Each item is the standard source for one section above. The times are my
estimates.

1. **Entropy and bits** (15 min). MacKay, *Information Theory, Inference, and
   Learning Algorithms* (Cambridge University Press, 2003), sections 2.4 to
   2.6, pages 32 to 35
   ([free PDF from the author](https://www.inference.org.uk/itprnn/book.pdf),
   pages 44 to 47 of the file). Section 2.6 is Gibbs' inequality, used in
   section 5 here.
2. **Conditional entropy and mutual information** (10 min). MacKay, section
   8.1, pages 138 to 140 (150 to 152 of the file).
3. **Why this formula, and a source with memory** (15 min). Shannon, "A
   Mathematical Theory of Communication", Bell Syst. Tech. J. 27, 379 and
   623 (1948), sections 6 and 7, pages 10 to 14 of the
   [reprint](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf).
4. **Continuous values, the Gaussian, and filters** (10 min). Shannon,
   section 20, items 5 and 6 (pages 36 and 37), and section 22 (pages 39 and
   40), where the entropy of filtered noise changes by the average of the
   log of the filter's gain: the geometric mean of section 4 here.
5. **Kolmogorov's formula** (10 min). Gray, "Toeplitz and Circulant
   Matrices: A Review", Found. Trends Commun. Inf. Theory 2, 155 (2006),
   [doi:10.1561/0100000006](https://doi.org/10.1561/0100000006), section
   1.2, the two pages headed "One-step prediction error"
   ([free PDF from the author](https://ee.stanford.edu/~gray/toeplitz.pdf),
   page 16 of the file).

Further, if wanted:

- Brockwell and Davis, *Time Series: Theory and Methods*, 2nd ed. (Springer,
  1991), section 5.8, for the proof of Kolmogorov's formula.
- Gray and Markel, "A spectral-flatness measure for studying the
  autocorrelation method of linear prediction of speech analysis", IEEE
  Trans. Acoust. Speech Signal Process. 22, 207 (1974),
  [doi:10.1109/TASSP.1974.1162572](https://doi.org/10.1109/TASSP.1974.1162572),
  for spectral flatness.
- Hyvärinen and Oja, "Independent component analysis: algorithms and
  applications", Neural Networks 13, 411 (2000),
  [doi:10.1016/S0893-6080(00)00026-5](https://doi.org/10.1016/S0893-6080(00)00026-5),
  section 4.2.2, one page on negentropy
  ([PDF from the author](https://www.cs.helsinki.fi/u/ahyvarin/papers/NN00new.pdf)).

## Not yet measured

- The spectral flatness of the raw strain over its whole past. The table
  gives only the part from the previous sample.
- How the 0.036 to 0.060 nats per sample beyond the spectrum divide between
  a non-Gaussian shape and dependence on the past.
