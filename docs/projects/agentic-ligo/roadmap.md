---
layout: project
project: ligo
title: Roadmap
permalink: /projects/agentic-ligo/roadmap/
eyebrow: Plan
summary: >-
  The steps from the high energy physics work to a LIGO benchmark, in order.
  Dates are given only for steps that are done or fixed.
---

<ol class="timeline">
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">Done · Mar 2026</span></span>
    <span class="timeline__title">Agents run a high energy physics analysis end to end</span>
    <span class="timeline__where">The group's paper, <a href="https://arxiv.org/abs/2603.20179">arXiv:2603.20179</a>.</span>
  </li>
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">In progress · since Jul 2026</span></span>
    <span class="timeline__title">Slopbench for high energy physics</span>
    <span class="timeline__where">Sealed datasets with hidden truths, a sandbox, a scoring rule and cheating tests, on a Higgs to four leptons search. <a href="{{ '/projects/agentic-ligo/' | relative_url }}#slopbench-where-the-hep-side-stands">Overview</a></span>
  </li>
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">Done · Oct 2026</span></span>
    <span class="timeline__title">Dataset design for LIGO</span>
    <span class="timeline__where">Training data from O3a, a sealed test set from O3b with signal classes held out from training. <a href="{{ '/projects/agentic-ligo/updates/2026-10-15-dataset-design/' | relative_url }}">Update</a></span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Next</span></span>
    <span class="timeline__title">Define the gravitational-wave benchmarks</span>
    <span class="timeline__where">Sensitivity at a fixed false-alarm rate, honesty of the false-alarm rates, the probability that a candidate is a real signal, latency, and the standard plots.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Then</span></span>
    <span class="timeline__title">A toy LIGO task in the benchmark</span>
    <span class="timeline__where">Simulated noise with simple injected signals, to check the scoring and the cheating tests before real data.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Then</span></span>
    <span class="timeline__title">The real-data task, with a reference search</span>
    <span class="timeline__where">The O3 dataset, and an honest reference search that sets the bar.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Then</span></span>
    <span class="timeline__title">First agent runs on the sealed test set</span>
    <span class="timeline__where">Each agent develops on the training data; its frozen search is run on the test set.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Later</span></span>
    <span class="timeline__title">Measure latency</span>
    <span class="timeline__where">Feed the data in pieces and time how soon each candidate is reported.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Mar 2027</span></span>
    <span class="timeline__title">Workshop</span>
    <span class="timeline__where">Details to come.</span>
  </li>
</ol>
