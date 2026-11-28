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
    <span class="timeline__meta"><span class="timeline__kind">Public · Nov 2026</span></span>
    <span class="timeline__title">The high energy physics benchmark, HEP-Ex-Bench</span>
    <span class="timeline__where">Started in July 2026 as Slopbench. Sealed datasets with hidden truths, a sandbox, a scoring rule and cheating tests, on Higgs boson and lepton calibration tasks. Its code is <a href="https://github.com/hep-ex-bench/hep-ex-bench">public</a>, with its public datasets on <a href="https://huggingface.co/hep-ex-bench">Hugging Face</a>. <a href="{{ '/projects/agentic-ligo/monitor/' | relative_url }}">Monitor</a></span>
  </li>
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">Done · Oct 2026</span></span>
    <span class="timeline__title">The LIGO dataset, designed and generated</span>
    <span class="timeline__where">Training data from O3a, a sealed test set from O3b with signal classes held out from training. <a href="{{ '/projects/agentic-ligo/updates/2026-10-15-dataset-design/' | relative_url }}">Update</a></span>
  </li>
  <li class="timeline__item">
    <span class="timeline__meta"><span class="timeline__kind">Done · Nov 2026</span></span>
    <span class="timeline__title">What the agent hands in: a trigger list</span>
    <span class="timeline__where">One row per candidate event: start time, end time and false-alarm rate, the first three columns of the trigger files of the LIGO burst group's pipeline benchmark. <a href="{{ '/projects/agentic-ligo/updates/2026-11-16-trigger-list/' | relative_url }}">Update</a></span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">In progress</span></span>
    <span class="timeline__title">Define the gravitational-wave benchmarks</span>
    <span class="timeline__where">Sensitivity at a fixed false-alarm rate, honesty of the false-alarm rates, and the standard plots. To decide: the false-alarm-rate threshold, how close in time a candidate must be to a signal to match it, and whether the list of analysed time segments is handed in too.</span>
  </li>
  <li class="timeline__item timeline__item--pending">
    <span class="timeline__meta"><span class="timeline__kind timeline__kind--pending">Next</span></span>
    <span class="timeline__title">Host the data for the benchmark</span>
    <span class="timeline__where">The training data where agents develop their searches; the sealed test set only where the scoring runs.</span>
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
    <span class="timeline__title">The probability that a candidate is a real signal</span>
    <span class="timeline__where">On hold until the trigger list carries it; then checked against the truth: of the candidates given 70 %, about 70 % should be real.</span>
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
