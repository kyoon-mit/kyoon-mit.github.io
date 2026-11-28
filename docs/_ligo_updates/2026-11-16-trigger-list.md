---
title: What the agent hands in
date: 2026-11-16 18:00:00
summary: >-
  The answer the agent's search hands in is fixed for now: a list of candidate
  events, each with a start time, an end time and a false-alarm rate. The
  probability that a candidate is a real signal is on hold.
---

## The trigger list

- For each dataset, the agent's frozen search writes a **trigger list**: a CSV
  file with one row per candidate event.
- We start simple, with three columns:
  - column 1: the start GPS time, in seconds;
  - column 2: the end GPS time, in seconds;
  - column 3: the false-alarm rate, in Hz: how often noise alone would
    produce a candidate this loud.
- Sky position (right ascension and declination, in radians) may be added
  later as two more columns.

## What this changes

- A candidate matches an injected signal when its start-to-end interval
  overlaps the signal in time, within a tolerance fixed before any results
  are seen.
- Two benchmarks need only these three columns:
  - sensitivity at a fixed false-alarm rate;
  - honesty of the false-alarm rates, checked on the noise-only data.
- The probability that a candidate is a real signal has no column yet, so
  its benchmark is on hold.
- The [design note](https://github.com/kyoon-mit/hep-ex-bench/blob/ligo-benchmarks/docs/LIGO_BENCHMARKS_DESIGN.md)
  is updated to match the dataset and this format.

## Still open

- the false-alarm-rate threshold;
- the time tolerance for matching a candidate to a signal;
- where the data is hosted for the benchmark.
