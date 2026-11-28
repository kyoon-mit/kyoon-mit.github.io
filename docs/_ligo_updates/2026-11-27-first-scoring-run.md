---
title: First end-to-end scoring run
date: 2026-11-27 18:00:00
summary: >-
  The burst-benchmark scorer now runs end to end on the training split, and
  every cheating strategy we tried is caught.
---

- I wrote a first scorer for the burst benchmark. It reads a trigger list (start time, end time, false-alarm rate, plus the LVK 9-column format), matches triggers to injected signals by time overlap, and reports three things: sensitivity at fixed false-alarm rate, whether the claimed false-alarm rates are honest on noise-only data, and a check for detecting signals too quiet for any real search to see.
- I checked the answer-key handling against the dataset's own reference counts, and they agree exactly.
- I scored five fake trigger lists: reporting nothing; reporting every second, with honest and with dishonest false-alarm rates; random triggers with dishonest rates; and an "oracle" that reads the answer key. Each behaved as designed. The dishonest lists fail the honesty check. The oracle passes the honesty check, because it reports nothing on noise, and is caught only by the quiet-signal check. That is why that check exists.
- I also ran a deliberately simple excess-power search on one day of training data, with background from time slides. Its false-alarm rates came out honest, but it is weak. It is a plumbing test, not a baseline.
- Still open: the matching tolerance (0.1 s for now), the false-alarm-rate threshold, and a real baseline search. The scorer goes next into the agentic-ligo repo as the first pull request.
