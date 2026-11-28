---
title: The benchmark monitor gets its own page
date: 2026-11-28 02:00:00
summary: >-
  The interactive benchmark monitor now lives in the agentic-ligo repository,
  on a page of its own, and shows only the LIGO benchmark: its data, the
  searches and agents, and the scores.
---

## Where it lives

- The monitor started on this site, as an interactive page in the Agentic LIGO section (27 November).
- The same evening it moved to the `gh-pages` branch of [kyoon-mit/agentic-ligo](https://github.com/kyoon-mit/agentic-ligo), my fork of the benchmark harness, so that it sits next to the code whose runs it shows. GitHub Pages serves it at [kyoon-mit.github.io/agentic-ligo](https://kyoon-mit.github.io/agentic-ligo/).
- The branch holds only the monitor and shares no history with the harness code.
- On this site, the Monitor link in the Agentic LIGO menu opens it in a new tab, and the old address, `/projects/agentic-ligo/monitor/`, redirects to it.

## How it is built

- One page of plain HTML, CSS and JavaScript, with no framework.
- The leaderboard reads `runs.json` when the page loads, so publishing a run means adding a row to that file; nothing has to be rebuilt.
- Anyone can also open a results file from their own computer. It is read in the browser and never uploaded, so unpublished runs can be looked at without publishing them.
- The reference text is Markdown written by the project session. A short script (`build.py`) renders it into the page.

## How it looks

- Like a code editor's workbench: a top bar, a rail of views on the left, and a drawer that slides in with the details of a run or a dataset.
- Near-black panels, not dark blue, with muted pastel accents: sage, sky blue, lavender, olive and rose.
- Panels and tiles have soft shadows, so they read as raised rather than flat.
- On a phone, the rail turns into tabs across the top.

## What it shows

The first version copied a trading terminal, with a ticker, a heatmap and sliders. It was confusing, so I redesigned it around the three things the benchmark has:

- **Scores:** the leaderboard, how a search is scored, and the checks against cheating.
- **Datasets:** the O3 training and sealed test sets, the waveform families, and the planned toy task.
- **Models:** the reference searches and the agent harnesses.
- A fourth view, **Reference**, holds the full text.

Since 28 November it shows only the LIGO benchmark. The board has the three toy searches of [27 November](/projects/agentic-ligo/updates/2026-11-27-toy-searches/), scored at 1 per week, and the five fake trigger lists are under "Scorer tests".

<div class="plot-pair">
{% include figure.html
   src="/assets/img/ligo/2026-11-28/monitor-scores.png"
   alt="The monitor's Scores view: a dark page with a rail of views on the left and a leaderboard of the three toy searches, each with the fraction of signals found and a rates-honest check"
   label="Scores view" %}
{% include figure.html
   src="/assets/img/ligo/2026-11-28/monitor-datasets.png"
   alt="The monitor's Datasets view: tiles for the training and sealed test sets, the waveform families, the held-out classes and the planned toy task"
   label="Datasets view" %}
</div>
