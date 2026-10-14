---
layout: project
title: Definitions
permalink: /projects/bns/definitions/
eyebrow: Glossary
summary: >-
  The terms used on the BNS pages, in plain language, each with a source.
  On every other page, the first appearance of a term links here; resting
  the pointer on it for a second shows the short definition.
---

{%- assign order = "Gravitational waves|Detectors and data|Searching for signals|Signal processing|Statistics|Machine learning|State-space models|This project|Project 8" | split: "|" -%}

{% for g in order %}
{%- assign entries = site.data.glossary | where: "group", g | sort_natural: "term" -%}
<section class="glossary__group">
<h2 id="{{ g | slugify }}">{{ g }}</h2>
<dl class="glossary">
{%- for t in entries %}
<dt id="{{ t.id }}">{{ t.term }}{% if t.also %} <span class="glossary__also">({{ t.also | join: ", " }})</span>{% endif %}</dt>
<dd>
{{ t.def | default: t.short | markdownify }}
<div class="glossary__source">Source: {{ t.source | markdownify | remove: "<p>" | remove: "</p>" | strip }}</div>
</dd>
{%- endfor %}
</dl>
</section>
{% endfor %}
