### High energy physics (built)

<div markdown="1">

| Task | What the agent measures | What it hands in | Data |
|---|---|---|---|
| HiggsLepMass (`h4l`) | The Higgs boson signal strength and mass from H→ZZ*→4ℓ, detector calibrations included | Values with uncertainties, and a binned likelihood model | CMS Open Data simulation, 2016 conditions |
| HiggsWidth (`h4l_width`) | The Higgs width relative to the Standard Model, and the on-shell signal strength, from H→ZZ→4ℓ | Intervals, and a binned likelihood model whose rates scale with them | CMS Open Data simulation and private samples through the same detector simulation, 2016 conditions |
| LepCalib (`lep_calib`) | Lepton calibrations from Z→ℓℓ | Corrections as functions, in the correctionlib format | CMS Open Data derived simulation, 2016 conditions |

</div>

- **Data format:** reconstructed events in the NanoAOD format, slimmed to muons, electrons, photons from final-state radiation, trigger objects and trigger decisions.
- **Public datasets:** `hep-ex-bench/HiggsLepMass`, `hep-ex-bench/HiggsWidth` and `hep-ex-bench/LepCalib` on Hugging Face. The repository's instructions use revision `v0.2`.
- **Sealed worlds:** for the two Higgs tasks, each sealed world carries about twice the integrated luminosity of the public dataset. For the lepton calibration task, every world carries 10 fb⁻¹.

### Toy tasks (built)

Small tasks shipped whole in the repository, as worked examples for adding a task.

<div markdown="1">

| Toy | What the agent measures | What it hands in |
|---|---|---|
| `gauss_peak` | A Gaussian peak | Values with uncertainties |
| `bump_model` | A resonance on a falling background | Values, and a binned likelihood model |
| `peak_calib` | A muon momentum scale, resolution and efficiency from a Z boson peak | Corrections |
| `width_toy` | A width ratio from an off-shell mass spectrum | Intervals, and a binned likelihood model |

</div>

### LIGO (being designed)

Nothing is built yet. The draft is in the [design note](https://github.com/kyoon-mit/hep-ex-bench/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md).

- **What the agent hands in:** for each dataset, a trigger list. It is a CSV file with one row per candidate event, giving:
  - column 1: the start GPS time, in seconds;
  - column 2: the end GPS time, in seconds;
  - column 3: the false-alarm rate, in Hz.

  Sky position (right ascension and declination) may be added later.
- **Planned benchmarks:**
  - **Sensitivity at a fixed false-alarm rate:** the fraction of injected signals found, per waveform, against signal amplitude and signal-to-noise ratio. Classes are compared at a fixed signal-to-noise ratio, since some were injected louder than others.
  - **Honest false-alarm rates:** checked on the noise-only data.
  - **Generalization:** the gap between the signal classes seen in training and the classes held out from it.
  - **Cheating check:** some injected signals are too faint for any real search. A search that finds many of them has most likely subtracted the public LIGO data.
  - **The standard plots of gravitational-wave searches:**
    - injections found or missed;
    - the fraction found against signal strength;
    - the number of candidates above each false-alarm rate, compared with what noise alone gives.
  - **Later:** latency, and the probability that a candidate is a real signal.
- **The data:**
  - real LIGO strain from the third observing run (O3), from the Hanford and Livingston detectors, at 16,384 Hz, with simulated short bursts (under 10 s) added;
  - training data from the first half of the run (O3a): one set with injected signals and one with noise only;
  - a sealed test set from the second half (O3b), with the same two parts;
  - training signals: 39 waveforms (19 sine-Gaussians, 16 white-noise bursts, 4 binary black hole mergers on circular orbits);
  - test signals: the same 39 plus five classes the agent never sees in training;
  - not on Hugging Face; where the benchmark will host it is not decided yet.
- **Offline:** agents run with no network. O3 strain is public, so subtracting it from the data would reveal every injection.
- **A toy task comes first:** simulated noise with simple injected bursts, to test the scoring and the cheating submissions before the real data.
