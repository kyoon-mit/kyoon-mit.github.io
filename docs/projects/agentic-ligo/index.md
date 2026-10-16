---
layout: project
project: ligo
title: Agentic LIGO
permalink: /projects/agentic-ligo/
eyebrow: Current project
summary: >-
  An AI agent that runs a gravitational-wave search on its own, from detector
  data to a list of candidate events, and a benchmark that checks whether its
  answers are right.
next_page: /projects/agentic-ligo/roadmap/
next_title: Roadmap
---

## Goal

- Test whether an AI agent can run a gravitational-wave search on its own,
  from LIGO strain data to a list of candidate events.
- The search should find two kinds of signals:
  - mergers of black holes and neutron stars, whose waveform is known in
    advance;
  - short bursts with no fixed shape.
- Anomaly detection is tested with signal classes that are left out of the
  training data: can the agent find a kind of signal it was never shown?
- The exact scope is still being decided.

## Starting point: agents in high energy physics

- Members of our group showed that LLM-based agents can carry out a high
  energy physics analysis from start to finish: event selection, background
  estimation, uncertainty quantification, statistical inference and paper
  drafting.
- See [E. A. Moreno, S. Bright-Thonney, A. Novak, D. Garcia, P. Harris, "AI
  Agents Can Already Autonomously Perform Experimental High Energy
  Physics"](https://arxiv.org/abs/2603.20179) (2026).
- Where a published measurement of the same quantity existed, their results
  were compared with it.

## Slopbench: where the HEP side stands

Slopbench is the group's next step. It asks a harder question than the paper:
does the agent's analysis give the right answer on data where the agent cannot
see the answer?

How it works:

- The agent builds its analysis on one public dataset, where it may see the
  right answer.
- Its code is then frozen and run, unchanged, on many sealed datasets. Each one
  hides an injected truth: a Higgs boson mass, a signal strength, and in some
  datasets no signal at all.
- Each result is compared with the hidden truth, and the score also checks
  that the quoted uncertainties are honest.
- The code runs in a sandbox, with no network and no access to the answer key.
- Fake submissions that cheat on purpose are scored as well. One, for example,
  always reports the textbook Higgs mass without reading the data. Every one
  of them must score below an honest reference analysis. This is how we check
  that the score cannot be gamed.

Where it stands, as of October 2026:

- **Tasks.** They include a small toy task and a search for the Higgs boson
  decaying to four leptons, on simulated CMS Open Data events. Detector
  effects are injected into the sealed datasets, such as shifts and blurring
  of the lepton momenta and changes of the lepton efficiency, and the agent
  must measure them from the data.
- **Reference analysis.** It recovers the injected truths and sets the bar
  that agents are compared with.
- **Scoring.** The scoring rule was settled at the start of October 2026.
- **Agent runs.** Several AI agents have been run on the benchmark. The
  results are internal and not yet published.

## This project

- We bring the same design to LIGO. The agent develops its search on
  documented training data, and its frozen search is then run on a sealed test
  set.
- The first step is the dataset and the benchmarks:
  - a group member is preparing the dataset
    ([15 October update]({{ '/projects/agentic-ligo/updates/2026-10-15-dataset-design/' | relative_url }}));
  - we are defining the benchmarks: how far out the search can see at a fixed
    false-alarm rate, whether its false-alarm rates are honest, whether its
    probability that a candidate is a real signal is right, how fast it
    reports, and the standard plots of gravitational-wave searches.
- The planned steps are on the
  [roadmap]({{ '/projects/agentic-ligo/roadmap/' | relative_url }}).
