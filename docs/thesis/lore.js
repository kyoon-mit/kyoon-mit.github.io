/* Thesis gate: the three-headed beast's lore of binary neutron stars. */
'use strict';
window.LORE = {
  wake: [
    'MIDDLE HEAD: ...Hrrm? Who wakes us?',
    'LEFT HEAD: A small one. On two legs.',
    'RIGHT HEAD: Do not eat it. It came for a story.',
    'MIDDLE HEAD: We three keep the lore of the neutron stars, the dense dead hearts of giant stars.',
  ],
  begin: 'MIDDLE HEAD: The tale is long. Shall we begin?',
  goOn: 'MIDDLE HEAD: Shall we go on?',
  later: 'MIDDLE HEAD: Then let us sleep. Wake us when you want the rest. Zzz...',
  resume: ['LEFT HEAD: ...You again.', 'MIDDLE HEAD: Where were we? Ah, yes.'],
  again: 'MIDDLE HEAD: The tale is told. Shall we tell it again?',
  score: (n, m) => `MIDDLE HEAD: You solved ${n} of ${m} riddles. ` +
    (n === m ? 'Not bad, for a small one.' : n >= m / 2 ? 'Hrm. Acceptable.' : 'Hrm. Come back and listen again.'),
  chapters: [
    {
      lines: [
        'LEFT HEAD: When a star of more than about eight Suns runs out of fuel, its core collapses.',
        'RIGHT HEAD: Electrons are crushed into protons. What is left is mostly neutrons: a neutron star.',
        'MIDDLE HEAD: About one and a half Suns of mass, in a ball only about 25 kilometres across.',
        'LEFT HEAD: A teaspoon of it would weigh over a billion tonnes.',
        'RIGHT HEAD: James Chadwick found the neutron in 1932.',
        'MIDDLE HEAD: In 1934 Walter Baade and Fritz Zwicky guessed that supernovae leave such stars behind.',
        'LEFT HEAD: Nobody saw one for more than thirty years.',
      ],
      ask: true,
    },
    {
      lines: [
        'MIDDLE HEAD: In 1967 Jocelyn Bell Burnell, a student at Cambridge, found radio pulses that ticked every 1.34 seconds.',
        'RIGHT HEAD: The team half-jokingly named the source LGM-1. Little Green Men.',
        'LEFT HEAD: It was no message. It was a spinning neutron star, sweeping a radio beam past us like a lighthouse. A pulsar.',
      ],
      quiz: [{
        q: 'MIDDLE HEAD: Riddle! Who found the first pulsar?',
        a: ['BELL BURNELL', 'OPPENHEIMER'],
        yes: 'MIDDLE HEAD: Yes. The 1974 Nobel Prize went to her supervisor Antony Hewish, and to Martin Ryle.',
        no: 'MIDDLE HEAD: No. Jocelyn Bell Burnell, in 1967.',
      }],
    },
    {
      lines: [
        'RIGHT HEAD: In 1974 Russell Hulse and Joseph Taylor found a pulsar in orbit around another neutron star, with the Arecibo telescope.',
        'LEFT HEAD: One orbit takes less than eight hours.',
        'MIDDLE HEAD: Year after year the orbit shrinks, exactly as Einstein\'s theory says it must if the pair loses energy to gravitational waves.',
        'RIGHT HEAD: The first evidence that gravitational waves exist. Hulse and Taylor won the Nobel Prize in 1993.',
        'LEFT HEAD: In about 300 million years, those two will collide.',
      ],
      quiz: [{
        q: 'RIGHT HEAD: Riddle! What did Hulse and Taylor find?',
        a: ['BINARY PULSAR', 'BLACK HOLE PAIR'],
        yes: 'RIGHT HEAD: Yes. Two neutron stars, one of them a pulsar.',
        no: 'RIGHT HEAD: No. A binary pulsar: two neutron stars, one of them a pulsar.',
      }],
      ask: true,
    },
    {
      lines: [
        'MIDDLE HEAD: Two neutron stars in orbit shake space-time. The ripples spread out at the speed of light.',
        'LEFT HEAD: A passing wave stretches space one way and squeezes it the other.',
        'RIGHT HEAD: By the time it reaches Earth, it changes the 4 kilometre arms of LIGO by far less than the width of a proton.',
        'MIDDLE HEAD: LIGO has two detectors, at Hanford in Washington and Livingston in Louisiana. Virgo is in Italy.',
        'LEFT HEAD: On 14 September 2015 LIGO heard its first chirp. Two black holes. GW150914.',
      ],
    },
    {
      lines: [
        'RIGHT HEAD: As two stars spiral in, their waves rise in pitch and grow louder. A chirp!',
        'MIDDLE HEAD: The waves come at twice the orbital frequency.',
        'LEFT HEAD: How fast the pitch rises depends, at leading order, on one mix of the two masses: the chirp mass.',
        'RIGHT HEAD: (m1 m2)^(3/5) / (m1 + m2)^(1/5). For two stars of 1.4 Suns, about 1.22 Suns.',
        'MIDDLE HEAD: Such a pair sings from 20 hertz to the merger for about two and a half minutes.',
      ],
      quiz: [{
        q: 'LEFT HEAD: Riddle! What sets how fast the chirp rises, at leading order?',
        a: ['CHIRP MASS', 'TOTAL MASS'],
        yes: 'LEFT HEAD: Yes. Of all the masses, it is the one measured best.',
        no: 'LEFT HEAD: No. The chirp mass.',
      }],
      ask: true,
    },
    {
      lines: [
        'MIDDLE HEAD: Then came the day. 17 August 2017.',
        'LEFT HEAD: LIGO and Virgo heard two neutron stars spiral together. GW170817.',
        'RIGHT HEAD: 1.7 seconds after the merger, the Fermi satellite caught a burst of gamma rays.',
        'MIDDLE HEAD: Telescopes found a new light in the galaxy NGC 4993, about 40 megaparsecs away. Some 130 million light years.',
        'LEFT HEAD: A kilonova: the glow of freshly made heavy elements.',
        'RIGHT HEAD: Gravity and light raced for 130 million years and arrived 1.7 seconds apart. Gravity moves at the speed of light.',
      ],
      quiz: [{
        q: 'MIDDLE HEAD: Riddle! Which was the first neutron star merger ever heard?',
        a: ['GW170817', 'GW150914'],
        yes: 'MIDDLE HEAD: Correct! GW150914 was two black holes.',
        no: 'MIDDLE HEAD: No. GW150914 was two black holes. The first neutron star pair was GW170817.',
      }, {
        q: 'RIGHT HEAD: Riddle! How long after the merger did the gamma rays arrive?',
        a: ['1.7 SECONDS', '1.7 DAYS'],
        yes: 'RIGHT HEAD: Yes. 1.7 seconds.',
        no: 'RIGHT HEAD: No. Only 1.7 seconds.',
      }],
      ask: true,
    },
    {
      lines: [
        'LEFT HEAD: A second pair came on 25 April 2019. GW190425.',
        'MIDDLE HEAD: Its total mass was about 3.4 Suns, heavier than any neutron star pair known in our own galaxy.',
        'RIGHT HEAD: Only one LIGO detector was running that day, so its place in the sky was poorly known.',
      ],
    },
    {
      lines: [
        'MIDDLE HEAD: How do you find a chirp buried in noise? You guess its shape.',
        'LEFT HEAD: Slide a template of the expected wave along the data, and measure how well they agree. A matched filter.',
        'RIGHT HEAD: Where the template fits, the output peaks. The height of the peak is the signal-to-noise ratio: the SNR.',
        'MIDDLE HEAD: Searches use banks of many thousands of templates, for the possible masses and spins.',
      ],
      quiz: [{
        q: 'LEFT HEAD: Riddle! What does a matched filter slide along the data?',
        a: ['A TEMPLATE', 'WHITE NOISE'],
        yes: 'LEFT HEAD: Yes. The wave you expect.',
        no: 'LEFT HEAD: No. A template of the wave you expect.',
      }],
      ask: true,
    },
    {
      lines: [
        'RIGHT HEAD: A pair twice as far away is half as loud. SNR falls as one over the distance.',
        'MIDDLE HEAD: But far away there is more room. The number of pairs within a distance d grows as d cubed.',
        'LEFT HEAD: So the number of events louder than an SNR ρ falls as ρ to the minus three.',
        'RIGHT HEAD: And the density of events at SNR ρ falls as ρ to the minus four. Most events are faint.',
      ],
      quiz: [{
        q: 'MIDDLE HEAD: Riddle! SNR falls with distance d as...?',
        a: ['1/d', '1/d^2'],
        yes: 'MIDDLE HEAD: Yes. The wave\'s amplitude falls as 1/d.',
        no: 'MIDDLE HEAD: No. As 1/d. It is the energy flux that falls as 1/d^2.',
      }, {
        q: 'LEFT HEAD: Riddle! Pairs spread evenly in space. The density of their SNRs goes as...?',
        a: ['SNR^-4', 'SNR^-3'],
        yes: 'LEFT HEAD: Yes! Minus three is the count above an SNR. Minus four is the density.',
        no: 'LEFT HEAD: No. Minus four for the density. Minus three is the count above a given SNR.',
      }],
      ask: true,
    },
    {
      lines: [
        'MIDDLE HEAD: Now some teach neural networks to hear the chirps.',
        'LEFT HEAD: Some networks listen through sums of tones that never change pitch.',
        'RIGHT HEAD: But a chirp sweeps upward. A fixed tone hears it only while the chirp passes by.',
        'MIDDLE HEAD: That riddle is for you to solve, small one.',
      ],
    },
  ],
  end: [
    'LEFT HEAD: The rest of the tale is not yet written.',
    'RIGHT HEAD: The old tree in the western forest keeps the unwritten pages. It answers only to its word.',
    'MIDDLE HEAD: Now... let us sleep. Zzz...',
  ],
};
