/* Thesis gate: overworld dialogue (cave, digging, fire tree, asylum, Cinderella). */
'use strict';
window.STORY = {
  sign: '↑ THE CAVE\n→ RABBIT PEN     ← OLD FOREST',
  caveRock: 'Dark rock. Something big is snoring inside.',
  cave: { wall: 'Cold, damp rock.', torch: 'A torch. It crackles.', bones: 'Old bones. Best not to ask.' },
  whiteout: { crossroads: '...You came to at the crossroads.', ward: '...You woke up back in the padded room.' },
  dig: {
    soft: 'The soil here looks soft. Dig?',
    found: 'You dug up a RARE CANDY!',
    ate: 'You ate the RARE CANDY.',
    empty: 'Nothing else is buried here.',
  },
  rabbit: {
    dig: 'The RABBIT is digging at the ground...',
    sniff: place => `It found nothing. It sniffs the air and points its ears toward the ${place}.`,
    bored: 'It found nothing. It looks bored.',
  },
  tree: {
    warn: 'ANCIENT TREE: ...Careful. My patience is running short.',
    third: 'ANCIENT TREE: ...NO!',
    burst: ['The ANCIENT TREE burst into flames!', 'FIRE TREE: Three wrong words! Now you answer to the fire!'],
    win: ['The flames died down.', 'ANCIENT TREE: ...Hmph. Forgive me. I lost my temper.',
          'ANCIENT TREE: The pages still open only to their word.'],
    ran: ['Behind you, the flames slowly die down.'],
    police: ['A while later, the police brought the ANCIENT TREE back.', 'It does not want to talk about it.'],
    lost: ['You smell faintly of smoke.'],
  },
  asylum: {
    wake: ['...You woke up in a white room.', 'It smells of disinfectant.', 'You will have to find your own way out.'],
    wall: 'A padded white wall. It is soft and very clean.',
    bed: "A bed with leather straps. You'd rather not.",
    desk: 'A file on the desk reads: PATIENT: YOU. REASON: ATTACKED AN INSECTOLOGIST.',
    cell: 'Steel bars. The cell is empty.',
  },
  trainers: {
    dale: { intro: 'ORDERLY DALE: Hey! Patients stay in their rooms!', defeat: "ORDERLY DALE: Okay, okay. I didn't see you.", after: "ORDERLY DALE: I'm on my break." },
    irma: { intro: 'NURSE IRMA: Time for your medicine, dear.', defeat: "NURSE IRMA: My, you're feisty today.", after: 'NURSE IRMA: At least drink some water.' },
    gus:  { intro: 'ORDERLY GUS: Nobody gets past GUS.', defeat: '...Somebody got past GUS.', after: "ORDERLY GUS: Don't tell my supervisor." },
    pam:  { intro: 'NURSE PAM: Visiting hours are over!', defeat: 'NURSE PAM: Fine. Five minutes.', after: "NURSE PAM: The sisters won't be so easy." },
  },
  sisters: {
    intro: ['PRUDENCE: Well, well. A visitor for our little sister?', "GRISELDA: Nobody talks to HER. Not on our watch."],
    defeat: ['PRUDENCE: Ugh! Fine. FINE.', 'GRISELDA: Mother will hear about this.'],
    after: ['PRUDENCE: Hmph.', "GRISELDA: Don't look at me."],
  },
  cinderella: {
    psst: 'CINDERELLA: Psst! Over here! My stepsisters locked me in.',
    rescue: [
      'CINDERELLA: You did it! Thank you.',
      'CINDERELLA: They put me in here for talking to mice. Can you believe it?',
      "CINDERELLA: I can't leave before midnight... but YOU can.",
      'CINDERELLA: Close your eyes. Pumpkin, slipper, stroke of twelve... take this one home!',
    ],
    home: ['...You are back at the crossroads.', 'Your pockets smell faintly of pumpkin.'],
  },
};
