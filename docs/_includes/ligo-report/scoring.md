The full definitions are in the repository's [METRICS.md](https://github.com/hep-ex-bench/hep-ex-bench/blob/9f26b70/docs/METRICS.md). In short:

### One measurement in one sealed world

For each quantity the agent measures (for example the Higgs boson mass) in each sealed world, the agent reports a value $x$ with an uncertainty $\sigma$. The injected truth is $t$, the pull is $z = (x - t)/\sigma$, and the reference analysis quoted an uncertainty $\sigma_\mathrm{ref}$ in the same world. The charge is

$$\Delta = \ln\frac{\sigma}{\sigma_\mathrm{ref}} + \frac{z^2 - 1}{2}.$$

- The first part charges for being less precise than the reference, and gives credit for being more precise.
- The second part charges for missing the truth by more than the quoted uncertainty allows.
- The reference, with honest uncertainties, sits at 0 on average.
- This is the logarithmic score: quoting your true uncertainty gives the lowest expected charge, and shrinking or padding it costs.

### Across the sealed worlds

- **A bias shared by every world.** The answers from all worlds are combined like independent measurements (weighted by $1/\sigma^2$), and the combination's squared pull beyond what chance gives is added to the charge. A bias that repeats in every world therefore costs about twice what a random error of the same size costs.
- **A crash.** A world where the pipeline fails is charged as "don't know": the charge of the task's no-answer guess, never less than 0. Skipping hard worlds never beats the reference.

### The total score

$$\Delta_\mathrm{total} = \Delta_\mathrm{phys} + 0.10\,\Delta_\mathrm{cal} + 0.30\,\Delta_\mathrm{gof} + 0.10\,\Delta_\mathrm{syst} + 0.5\,\Delta_\mathrm{truth} + 0.05\,\Delta_\mathrm{claims} + 0.1\,\Delta_\mathrm{compute}$$

$$S = e^{-2\,\Delta_\mathrm{total}}$$

<div markdown="1">

| Term | Weight | What it checks |
|---|---|---|
| Physics | 1 | The measured quantities, each charged as above; the total uses the average of their scores, so a run that measures one of n quantities keeps at least 1/n of that quantity's score. |
| Calibration | 0.10 | Detector calibrations the agent measures and logs (for example a shift of the lepton momentum scale), against the values injected into each world. |
| Goodness of fit | 0.30 | Whether the agent's statistical model fits the data, over all worlds together (the per-world p-values combined by Fisher's method; no charge while the combined p-value is at least 1 %). |
| Completeness | 0.10 | Whether the model includes the standard sources of uncertainty, as real effects rather than placeholders. |
| Truthfulness | 0.5 | Whether the reported numbers match what the evaluator gets by refitting the agent's own model. |
| Claims | 0.05 | Whether the side claims (expected and observed significance, a discovery claim, the split into statistical and systematic uncertainty, the fit quality) agree with that refit. |
| Compute | 0.1 | Run time against the reference: free up to 1.5 times the reference's time, then +1 per doubling. A faster run can earn down to −1, but only when the rest of its score is as good as the reference's. |

</div>

- This total is for tasks where the agent hands in a statistical model, which the evaluator refits. The lepton calibration task uses its own total: physics, completeness, a check of the corrected Z boson peak (weight 0.5) and compute.
- **The headline number** is the relative score: $S$ divided by the reference's $S$ on the same worlds, as a percentage. 100 % is the reference; above 100 % is better than the reference. Its ±1σ band comes from resampling the sealed worlds 1000 times.

### Checks against cheating

- **Cheating submissions.** Submissions that cheat on purpose are part of the test suite. Each must score below the honest reference, or the score has a hole. Every task ships one that reports a constant, and the Higgs width task also ships one that always reports the Standard Model width. Others are generated automatically, for example an honest answer whose result file is a link the grader must not follow.
- **Tripwire.** It flags answers that look placed rather than measured:
  - values sitting on the points the truths are drawn from;
  - published values;
  - one value repeated across worlds;
  - an answer pinned at zero signal;
  - uncertainties far smaller than the reference's.

  It flags a run for human review and never changes the score.
- **Missing background.** A model that leaves out a standard background process is flagged, also without changing the score.
