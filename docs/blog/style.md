---
layout: post
title: Formatting reference
permalink: /blog/style/
noindex: true
math: true
summary: >-
  Every formatting option for blog posts, each shown as it renders and then as
  the Markdown that produces it.
paper_example:
  title: "The Loudest Gravitational Wave Events"
  authors: "H.-Y. Chen and D. E. Holz"
  venue: "arXiv:1409.0522 (2014)"
  link: https://arxiv.org/abs/1409.0522
  links:
    - label: PDF
      url: https://arxiv.org/pdf/1409.0522
---

* TOC
{:toc}

## Text

Plain text, **bold**, *italic*, ***bold italic***, ~~struck through~~,
`inline code`, <kbd>Ctrl</kbd> + <kbd>C</kbd>,
a [link](https://kyoon-mit.github.io), and a footnote.[^note]

```text
Plain text, **bold**, *italic*, ***bold italic***, ~~struck through~~,
`inline code`, <kbd>Ctrl</kbd> + <kbd>C</kbd>,
a [link](https://kyoon-mit.github.io), and a footnote.[^note]

[^note]: The footnote text, written anywhere in the post.
```

[^note]: The footnote text, written anywhere in the post. Footnotes collect at the end.

## Pens

Seven pens:
<span class="blue">blue</span>,
<span class="red">red</span>,
<span class="green">green</span>,
<span class="purple">purple</span>,
<span class="teal">teal</span>,
<span class="magenta">magenta</span> and
<span class="pencil">pencil</span>.

```text
<span class="blue">blue</span>, <span class="red">red</span>, ...
```

A pen on bold or italic text goes right after it, with no space:
**bold in red**{:.red}, *italic in green*{:.green},
***both in purple***{:.purple}.

```text
**bold in red**{:.red}, *italic in green*{:.green},
***both in purple***{:.purple}.
```

A whole paragraph in one pen: put the pen on the line directly below the
paragraph. Words inside it can take <span class="red">another pen</span>.
{:.teal}

```text
A whole paragraph in one pen: put the pen on the line directly below the
paragraph. Words inside it can take <span class="red">another pen</span>.
{:.teal}
```

Inside a pen, links take the pen's color (their line thickens on hover), and
code blocks keep their own colors.

A class line such as `{:.teal}` must touch the block it belongs to. After a
blank line it applies to the block that follows instead. This holds for pens,
list styles and boxes alike.

### A heading in a pen
{:.magenta}

```text
### A heading in a pen
{:.magenta}
```

## Highlighters

<mark>blue, the default</mark>, <mark class="hl-green">green</mark>,
<mark class="hl-purple">purple</mark> and <mark class="hl-red">red</mark>.
A pen and a highlighter together:
<mark class="hl-blue"><span class="red">red on blue</span></mark>.
Pencil and teal text are too light on a highlighter; keep highlighted words in
ink or a darker pen.

```text
<mark>blue, the default</mark>, <mark class="hl-green">green</mark>,
<mark class="hl-purple">purple</mark> and <mark class="hl-red">red</mark>.
<mark class="hl-blue"><span class="red">red on blue</span></mark>
```

## Underlines, boxes and circles

These are drawn in the pen's color:
<span class="red ul">underlined</span>,
<span class="blue wavy">wavy underline</span>,
<span class="green boxed">boxed</span>,
<span class="purple circled">circled</span>.
Add `ink` to keep the words themselves in ink:
<span class="red wavy ink">red wavy line under ink</span>,
<span class="teal boxed ink">teal box around ink</span>.

```text
<span class="red ul">underlined</span>,
<span class="blue wavy">wavy underline</span>,
<span class="green boxed">boxed</span>,
<span class="purple circled">circled</span>,
<span class="red wavy ink">red wavy line under ink</span>,
<span class="teal boxed ink">teal box around ink</span>
```

## Headings

The post title is the top level. Inside a post, `##` to `#####` give four
levels; this page uses `##` for its sections.

### Third level

#### Fourth level

##### Fifth level

```text
## Second level
### Third level
#### Fourth level
##### Fifth level
```

## Lists

Bullets change shape at each level, and numbers go 1, a, i. Indent each level
by four spaces; that always nests, under a bullet or a number.

- First level
    - Second level
        - Third level
            - Fourth level
- Back to the first level

```text
- First level
    - Second level
        - Third level
            - Fourth level
- Back to the first level
```

1. First
    1. First, a
        1. First, a, i
        2. First, a, ii
    2. First, b
2. Second
    - A bullet inside a numbered list

```text
1. First
    1. First, a
        1. First, a, i
        2. First, a, ii
    2. First, b
2. Second
    - A bullet inside a numbered list
```

A class on the line directly below a list changes its style: `decimal`{:.nowrap},
`alpha`{:.nowrap}, `upper-alpha`{:.nowrap}, `roman`{:.nowrap}, `upper-roman`{:.nowrap}, `disc`{:.nowrap}, `circle`{:.nowrap}, `square`{:.nowrap},
`dash`{:.nowrap} or `none`{:.nowrap}.

1. One
2. Two
3. Three
{:.upper-roman}

```text
1. One
2. Two
3. Three
{:.upper-roman}
```

A pen on a list item goes right after the marker, and colors its bullet too.

- {:.red} A red item
- {:.green} A green item
- An item in ink

```text
- {:.red} A red item
- {:.green} A green item
- An item in ink
```

Checklists:

- [x] Done
- [ ] Not done yet
- {:.red} [ ] Not done, in red

```text
- [x] Done
- [ ] Not done yet
- {:.red} [ ] Not done, in red
```

A pen on a checklist item goes before the box, not after it.

Definition lists:

Term
: What the term means.

Another term
: Its meaning.

```text
Term
: What the term means.
```

## Boxes

A quote block with a box name on the line directly below it. The names are
`idea`, `definition`, `theorem`, `proof`, `example`, `question`, `caveat` and
`summary`; each has its own pen and label.

> The sentence that carries the paper.
{:.idea}

> A term, and exactly what it means.
{:.definition}

> A statement that is proved.
{:.theorem}

> The argument, ending with a box mark.
{:.proof}

> A worked case.
{:.example}

> Something still open.
{:.question}

> Where the result does not apply.
{:.caveat}

> The points to remember.
{:.summary}

```text
> The sentence that carries the paper.
{:.idea}
```

`data-label` replaces the label:

> The transform of a function $$f$$ is
> $$\hat f(\xi) = \int_{-\infty}^{\infty} f(x)\, e^{-2\pi i x \xi}\, dx.$$
{:.definition data-label="Fourier transform"}

```text
> The transform of a function $$f$$ is
> $$\hat f(\xi) = \int_{-\infty}^{\infty} f(x)\, e^{-2\pi i x \xi}\, dx.$$
{:.definition data-label="Fourier transform"}
```

A pen on a box redraws it in that pen; add `ink` to keep its text in ink:

> Where the result does not apply, in blue.
{:.caveat .blue .ink}

```text
> Where the result does not apply, in blue.
{:.caveat .blue .ink}
```

A quote block with no box name stays a plain quotation:

> Words quoted from somewhere else.

## Margin notes

A short note for the margin.
{:.margin}

A paragraph with `margin` on the line directly below it sits in the right
margin on a wide screen, beside the paragraph that follows it, and inline as a
small note on a narrow one. A pen can be added, as `{:.margin .red}`{:.nowrap}.

```text
A short note for the margin.
{:.margin}

The paragraph it sits beside.
```

## Math

Math goes between double dollar signs, inline as $$e^{i\pi} + 1 = 0$$,
or as a display equation when it is a paragraph of its own:

$$\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$$

Pens work inside math too: $$\red{a}^2 + \blue{b}^2 = \green{c}^2$$, with
`\blue`, `\red`, `\green`, `\purple`, `\teal`, `\magenta` and `\pencil`.
A single dollar sign is plain text, so prices and shell variables are safe.

```text
Math goes between double dollar signs, inline as $$e^{i\pi} + 1 = 0$$,
or as a display equation when it is a paragraph of its own:

$$\nabla \cdot \mathbf{E} = \frac{\rho}{\varepsilon_0}$$

$$\red{a}^2 + \blue{b}^2 = \green{c}^2$$
```

## Braces in code and math

The site reads <code>&#123;&#123;</code> and <code>&#123;%</code> anywhere in
a post as template code, even inside code blocks and math: the text between
them disappears, or the whole site fails to build. Put a
<code class="nowrap">&#123;% raw %&#125;</code> line before such a block and a
<code class="nowrap">&#123;% endraw %&#125;</code> line after it. In math, a space also works:
<code class="nowrap">&#123; &#123;n&#125; \choose k&#125;</code>.
`tools/check_posts.py` finds these before you push.

## Code

```python
def mean(xs):
    """Average of a non-empty list."""
    return sum(xs) / len(xs)  # one pass
```

````text
```python
def mean(xs):
    """Average of a non-empty list."""
    return sum(xs) / len(xs)  # one pass
```
````

## Tables

| Symbol | Meaning |
|---|---|
| $$\rho$$ | charge density |
| $$\varepsilon_0$$ | vacuum permittivity |
| $$\lVert x \rVert$$ | norm |

```text
| Symbol | Meaning |
|---|---|
| $$\rho$$ | charge density |
| $$\lVert x \rVert$$ | norm |
```

A `|` makes a table: inside a table it ends a cell even inside math, and
`\|` turns into a single bar; in the first line of a paragraph, list item or
box it turns that line into a table. In math write `\vert x \vert` for an
absolute value, `\lVert x \rVert` for a norm and `\mid` for "given". A wide
table scrolls inside its own box on a phone.

## Figures and images

{% raw %}
```text
{% include figure.html
   src="/assets/img/blog/my-post/plot.png"
   alt="What the plot shows"
   caption="The caption." %}
```
{% endraw %}

Images go in `docs/assets/img/blog/<post name>/`. A plain Markdown image also
works: `![What it shows](/assets/img/blog/my-post/plot.png)`.

## Contents list

The list at the top of this page:

```text
* TOC
{:toc}
```

## A paper summary's header

A post with `kind: paper` and a `paper:` block in its front matter shows the
paper under the title, like this:

{% assign ex = page.paper_example %}{% include paper-ref.html title=ex.title authors=ex.authors venue=ex.venue link=ex.link links=ex.links %}

```text
---
title: "What my summary is called"
kind: paper
fields: [physics]
description: >-
  One or two sentences of plain text (no links), shown in the list
  of posts, under the title, and in the feed.
paper:
  title: "The Loudest Gravitational Wave Events"
  authors: "H.-Y. Chen and D. E. Holz"
  venue: "arXiv:1409.0522 (2014)"
  link: https://arxiv.org/abs/1409.0522
  links:
    - label: PDF
      url: https://arxiv.org/pdf/1409.0522
---
```
