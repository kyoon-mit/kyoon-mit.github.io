window.DEX = {
 "version": 1,
 "types": [
  "NORMAL",
  "FIRE",
  "WATER",
  "ELECTRIC",
  "GRASS",
  "ICE",
  "FIGHTING",
  "POISON",
  "GROUND",
  "FLYING",
  "PSYCHIC",
  "BUG",
  "ROCK",
  "GHOST",
  "DRAGON",
  "DARK",
  "STEEL",
  "TYPELESS"
 ],
 "chart": {
  "NORMAL": {
   "ROCK": 0.5,
   "GHOST": 0,
   "STEEL": 0.5
  },
  "FIRE": {
   "FIRE": 0.5,
   "WATER": 0.5,
   "GRASS": 2,
   "ICE": 2,
   "BUG": 2,
   "ROCK": 0.5,
   "DRAGON": 0.5,
   "STEEL": 2
  },
  "WATER": {
   "FIRE": 2,
   "WATER": 0.5,
   "GRASS": 0.5,
   "GROUND": 2,
   "ROCK": 2,
   "DRAGON": 0.5
  },
  "ELECTRIC": {
   "WATER": 2,
   "ELECTRIC": 0.5,
   "GRASS": 0.5,
   "GROUND": 0,
   "FLYING": 2,
   "DRAGON": 0.5
  },
  "GRASS": {
   "FIRE": 0.5,
   "WATER": 2,
   "GRASS": 0.5,
   "POISON": 0.5,
   "GROUND": 2,
   "FLYING": 0.5,
   "BUG": 0.5,
   "ROCK": 2,
   "DRAGON": 0.5,
   "STEEL": 0.5
  },
  "ICE": {
   "FIRE": 0.5,
   "WATER": 0.5,
   "GRASS": 2,
   "ICE": 0.5,
   "GROUND": 2,
   "FLYING": 2,
   "DRAGON": 2,
   "STEEL": 0.5
  },
  "FIGHTING": {
   "NORMAL": 2,
   "ICE": 2,
   "POISON": 0.5,
   "FLYING": 0.5,
   "PSYCHIC": 0.5,
   "BUG": 0.5,
   "ROCK": 2,
   "GHOST": 0,
   "DARK": 2,
   "STEEL": 2
  },
  "POISON": {
   "GRASS": 2,
   "POISON": 0.5,
   "GROUND": 0.5,
   "ROCK": 0.5,
   "GHOST": 0.5,
   "STEEL": 0
  },
  "GROUND": {
   "FIRE": 2,
   "ELECTRIC": 2,
   "GRASS": 0.5,
   "POISON": 2,
   "FLYING": 0,
   "BUG": 0.5,
   "ROCK": 2,
   "STEEL": 2
  },
  "FLYING": {
   "ELECTRIC": 0.5,
   "GRASS": 2,
   "FIGHTING": 2,
   "BUG": 2,
   "ROCK": 0.5,
   "STEEL": 0.5
  },
  "PSYCHIC": {
   "FIGHTING": 2,
   "POISON": 2,
   "PSYCHIC": 0.5,
   "DARK": 0,
   "STEEL": 0.5
  },
  "BUG": {
   "FIRE": 0.5,
   "GRASS": 2,
   "FIGHTING": 0.5,
   "POISON": 0.5,
   "FLYING": 0.5,
   "PSYCHIC": 2,
   "GHOST": 0.5,
   "DARK": 2,
   "STEEL": 0.5
  },
  "ROCK": {
   "FIRE": 2,
   "ICE": 2,
   "FIGHTING": 0.5,
   "GROUND": 0.5,
   "FLYING": 2,
   "BUG": 2,
   "STEEL": 0.5
  },
  "GHOST": {
   "NORMAL": 0,
   "PSYCHIC": 2,
   "GHOST": 2,
   "DARK": 0.5,
   "STEEL": 0.5
  },
  "DRAGON": {
   "DRAGON": 2,
   "STEEL": 0.5
  },
  "DARK": {
   "FIGHTING": 0.5,
   "PSYCHIC": 2,
   "GHOST": 2,
   "DARK": 0.5,
   "STEEL": 0.5
  },
  "STEEL": {
   "FIRE": 0.5,
   "WATER": 0.5,
   "ELECTRIC": 0.5,
   "ICE": 2,
   "ROCK": 2,
   "STEEL": 0.5
  },
  "TYPELESS": {}
 },
 "growth": {
  "medium_fast": "L^3",
  "agent": "floor(L^3/8)"
 },
 "moves": {
  "math": {
   "name": "MATH",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 20,
   "prio": -1,
   "target": "foe",
   "effect": "sleep",
   "args": {
    "min": 2,
    "max": 5,
    "heal": 0,
    "chance": 1
   }
  },
  "police": {
   "name": "CALL POLICE",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 60,
   "pp": 5,
   "prio": 0,
   "target": "foe",
   "effect": "police_call",
   "args": {}
  },
  "throw": {
   "name": "STONE THROW",
   "type": "ROCK",
   "cat": "physical",
   "power": 0,
   "acc": 20,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "fraction_hp",
   "args": {
    "frac": 0.25
   }
  },
  "sling": {
   "name": "STONE SLING",
   "type": "ROCK",
   "cat": "physical",
   "power": 0,
   "acc": 70,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "fraction_hp",
   "args": {
    "frac": 0.5
   }
  },
  "bow": {
   "name": "CROSSBOW",
   "type": "STEEL",
   "cat": "physical",
   "power": 0,
   "acc": 90,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "fraction_bleed",
   "args": {
    "frac": 0.9,
    "bleed": 0.05,
    "min": 2,
    "max": 5
   }
  },
  "glock": {
   "name": "GLOCK",
   "type": "STEEL",
   "cat": "physical",
   "power": 0,
   "acc": 80,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "ohko",
   "args": {}
  },
  "uzi": {
   "name": "UZI",
   "type": "STEEL",
   "cat": "physical",
   "power": 0,
   "acc": 5,
   "pp": 5,
   "prio": 0,
   "target": "foe",
   "effect": "multi_roll",
   "args": {
    "rounds": 18
   }
  },
  "sniper": {
   "name": "SNIPER",
   "type": "STEEL",
   "cat": "physical",
   "power": 0,
   "acc": 100,
   "pp": 5,
   "prio": -1,
   "target": "foe",
   "effect": "ohko",
   "args": {}
  },
  "ai": {
   "name": "AI",
   "type": "ELECTRIC",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 5,
   "prio": 0,
   "target": "self",
   "effect": "summon_ally",
   "args": {}
  },
  "struggle": {
   "name": "STRUGGLE",
   "type": "TYPELESS",
   "cat": "physical",
   "power": 50,
   "acc": null,
   "pp": 1,
   "prio": 0,
   "target": "foe",
   "effect": "recoil",
   "args": {
    "frac": 0.25
   }
  },
  "ping": {
   "name": "PING",
   "type": "NORMAL",
   "cat": "physical",
   "power": 35,
   "acc": 95,
   "pp": 35,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "fine_tune": {
   "name": "FINE-TUNE",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 30,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "spa": 1
    },
    "chance": 1
   }
  },
  "overclock": {
   "name": "OVERCLOCK",
   "type": "ELECTRIC",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 30,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "spe": 2
    },
    "chance": 1
   }
  },
  "deepfake": {
   "name": "DEEPFAKE",
   "type": "PSYCHIC",
   "cat": "special",
   "power": 65,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 0.1
   }
  },
  "reboot": {
   "name": "REBOOT",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 10,
   "prio": 0,
   "target": "self",
   "effect": "heal_half",
   "args": {}
  },
  "backprop": {
   "name": "BACKPROP",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 20,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "atk": 1,
     "spa": 1
    },
    "chance": 1
   }
  },
  "hallucinate": {
   "name": "HALLUCINATE",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": 90,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 1
   }
  },
  "trimodal": {
   "name": "TRI-MODAL",
   "type": "NORMAL",
   "cat": "special",
   "power": 80,
   "acc": 100,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "burn",
   "args": {
    "chance": 0.1
   }
  },
  "gpu_cluster": {
   "name": "GPU CLUSTER",
   "type": "ELECTRIC",
   "cat": "special",
   "power": 100,
   "acc": 50,
   "pp": 5,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "hyperscale": {
   "name": "HYPER-SCALE",
   "type": "NORMAL",
   "cat": "special",
   "power": 150,
   "acc": 90,
   "pp": 5,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "plasma_rifle": {
   "name": "PLASMA RIFLE",
   "type": "ELECTRIC",
   "cat": "special",
   "power": 120,
   "acc": 100,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "metal_fist": {
   "name": "METAL FIST",
   "type": "STEEL",
   "cat": "physical",
   "power": 100,
   "acc": 85,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "atk": 1
    },
    "chance": 0.2
   }
  },
  "hunt": {
   "name": "HUNT",
   "type": "DARK",
   "cat": "physical",
   "power": 70,
   "acc": null,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "judgment_day": {
   "name": "JUDGMENT DAY",
   "type": "FIRE",
   "cat": "special",
   "power": 150,
   "acc": 90,
   "pp": 5,
   "prio": 0,
   "target": "foes",
   "effect": null,
   "args": {}
  },
  "hole": {
   "name": "RABBIT HOLE",
   "type": "GROUND",
   "cat": "physical",
   "power": 120,
   "acc": 95,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "aegyo": {
   "name": "AEGYO",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "infatuate",
   "args": {
    "min": 2,
    "max": 5
   }
  },
  "nap": {
   "name": "SLEEP",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 10,
   "prio": 0,
   "target": "self",
   "effect": "sleep",
   "args": {
    "min": 2,
    "max": 5,
    "heal": 0.0625,
    "chance": 1
   }
  },
  "hop": {
   "name": "BUNNY HOP",
   "type": "NORMAL",
   "cat": "physical",
   "power": 20,
   "acc": 100,
   "pp": 30,
   "prio": 2,
   "target": "foe",
   "effect": "flinch",
   "args": {
    "chance": 0.8
   }
  },
  "foxfire": {
   "name": "FOXFIRE",
   "type": "FIRE",
   "cat": "special",
   "power": 40,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "burn",
   "args": {
    "chance": 0.1
   }
  },
  "tail_whip": {
   "name": "TAIL WHIP",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 30,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "def": -1
    },
    "chance": 1
   }
  },
  "yip": {
   "name": "YIP",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 40,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "atk": -1
    },
    "chance": 1
   }
  },
  "pounce": {
   "name": "POUNCE",
   "type": "NORMAL",
   "cat": "physical",
   "power": 40,
   "acc": 100,
   "pp": 30,
   "prio": 1,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "wisp": {
   "name": "WISP",
   "type": "FIRE",
   "cat": "status",
   "power": 0,
   "acc": 75,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "burn",
   "args": {
    "chance": 1
   }
  },
  "trickery": {
   "name": "TRICKERY",
   "type": "GHOST",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 1
   }
  },
  "lunge": {
   "name": "LUNGE",
   "type": "NORMAL",
   "cat": "physical",
   "power": 35,
   "acc": 95,
   "pp": 35,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "howl": {
   "name": "HOWL",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 40,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "atk": 1
    },
    "chance": 1
   }
  },
  "kick_dirt": {
   "name": "KICK DIRT",
   "type": "GROUND",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "acc": -1
    },
    "chance": 1
   }
  },
  "bite": {
   "name": "BITE",
   "type": "DARK",
   "cat": "physical",
   "power": 60,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "flinch",
   "args": {
    "chance": 0.3
   }
  },
  "snarl": {
   "name": "SNARL",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 90,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "spe": -2
    },
    "chance": 1
   }
  },
  "crunch": {
   "name": "CRUNCH",
   "type": "DARK",
   "cat": "physical",
   "power": 80,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "spd": -1
    },
    "chance": 0.2
   }
  },
  "bloodsuck": {
   "name": "BLOODSUCK",
   "type": "BUG",
   "cat": "physical",
   "power": 20,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "drain",
   "args": {
    "frac": 0.5
   }
  },
  "whine": {
   "name": "WHINE",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 55,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 1
   }
  },
  "buzz": {
   "name": "BUZZ",
   "type": "NORMAL",
   "cat": "physical",
   "power": 30,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "flinch",
   "args": {
    "chance": 0.3
   }
  },
  "swarm": {
   "name": "SWARM",
   "type": "BUG",
   "cat": "physical",
   "power": 14,
   "acc": 85,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "multi_hit",
   "args": {
    "min": 2,
    "max": 5
   }
  },
  "dart": {
   "name": "DART",
   "type": "FLYING",
   "cat": "physical",
   "power": 40,
   "acc": 100,
   "pp": 30,
   "prio": 1,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "blur": {
   "name": "BLUR",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 15,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "eva": 1
    },
    "chance": 1
   }
  },
  "sad_sigh": {
   "name": "SAD SIGH",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 40,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "atk": -1
    },
    "chance": 1
   }
  },
  "stardust": {
   "name": "STARDUST",
   "type": "PSYCHIC",
   "cat": "special",
   "power": 50,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 0.1
   }
  },
  "glimmer": {
   "name": "GLIMMER",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 15,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "eva": 1
    },
    "chance": 1
   }
  },
  "glass_shoe": {
   "name": "GLASS SHOE",
   "type": "ROCK",
   "cat": "physical",
   "power": 60,
   "acc": 95,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "sneer": {
   "name": "SNEER",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 30,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "def": -1
    },
    "chance": 1
   }
  },
  "claw": {
   "name": "CLAW",
   "type": "NORMAL",
   "cat": "physical",
   "power": 40,
   "acc": 100,
   "pp": 35,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "bad_omen": {
   "name": "BAD OMEN",
   "type": "GHOST",
   "cat": "special",
   "power": 0,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "fixed_level",
   "args": {}
  },
  "toe_stomp": {
   "name": "TOE STOMP",
   "type": "NORMAL",
   "cat": "physical",
   "power": 30,
   "acc": 100,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "flinch",
   "args": {
    "chance": 0.3
   }
  },
  "scratch_fit": {
   "name": "SCRATCH FIT",
   "type": "NORMAL",
   "cat": "physical",
   "power": 18,
   "acc": 80,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "multi_hit",
   "args": {
    "min": 2,
    "max": 5
   }
  },
  "bug_net": {
   "name": "BUG NET",
   "type": "BUG",
   "cat": "physical",
   "power": 35,
   "acc": 95,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "trap",
   "args": {}
  },
  "magnifier": {
   "name": "MAGNIFIER",
   "type": "FIRE",
   "cat": "special",
   "power": 40,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "burn",
   "args": {
    "chance": 0.1
   }
  },
  "lecture": {
   "name": "LECTURE",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": 75,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "sleep",
   "args": {
    "min": 2,
    "max": 5,
    "heal": 0,
    "chance": 1
   }
  },
  "pin": {
   "name": "PIN",
   "type": "BUG",
   "cat": "physical",
   "power": 25,
   "acc": 95,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "ghosted": {
   "name": "GHOSTED",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 15,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "eva": 1
    },
    "chance": 1
   }
  },
  "cheap_shot": {
   "name": "CHEAP SHOT",
   "type": "DARK",
   "cat": "physical",
   "power": 70,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {},
   "crit": 1
  },
  "told_you_so": {
   "name": "TOLD YOU SO",
   "type": "PSYCHIC",
   "cat": "special",
   "power": 80,
   "acc": 90,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "guilt_trip": {
   "name": "GUILT TRIP",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": 90,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 1
   }
  },
  "hold_down": {
   "name": "HOLD DOWN",
   "type": "FIGHTING",
   "cat": "physical",
   "power": 40,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "trap",
   "args": {}
  },
  "pump_up": {
   "name": "PUMP UP",
   "type": "FIGHTING",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 20,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "atk": 1
    },
    "chance": 1
   }
  },
  "chop": {
   "name": "CHOP",
   "type": "FIGHTING",
   "cat": "physical",
   "power": 50,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {},
   "crit": 1
  },
  "injection": {
   "name": "INJECTION",
   "type": "POISON",
   "cat": "physical",
   "power": 40,
   "acc": 100,
   "pp": 25,
   "prio": 0,
   "target": "foe",
   "effect": "sleep",
   "args": {
    "min": 2,
    "max": 5,
    "heal": 0,
    "chance": 0.2
   }
  },
  "tut_tut": {
   "name": "TUT-TUT",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 40,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "atk": -1
    },
    "chance": 1
   }
  },
  "lullaby": {
   "name": "LULLABY",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": 55,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": "sleep",
   "args": {
    "min": 2,
    "max": 5,
    "heal": 0,
    "chance": 1
   }
  },
  "medicate": {
   "name": "MEDICATE",
   "type": "NORMAL",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 10,
   "prio": 0,
   "target": "self",
   "effect": "heal_half",
   "args": {}
  },
  "jealousy": {
   "name": "JEALOUSY",
   "type": "PSYCHIC",
   "cat": "special",
   "power": 50,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 0.1
   }
  },
  "mind_games": {
   "name": "MIND GAMES",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "confuse",
   "args": {
    "chance": 1
   }
  },
  "prim_pose": {
   "name": "PRIM POSE",
   "type": "PSYCHIC",
   "cat": "status",
   "power": 0,
   "acc": null,
   "pp": 20,
   "prio": 0,
   "target": "self",
   "effect": "stat",
   "args": {
    "who": "self",
    "stats": {
     "spa": 1,
     "spd": 1
    },
    "chance": 1
   }
  },
  "scorn": {
   "name": "SCORN",
   "type": "DARK",
   "cat": "special",
   "power": 40,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "flinch",
   "args": {
    "chance": 0.2
   }
  },
  "tear_gown": {
   "name": "TEAR GOWN",
   "type": "DARK",
   "cat": "physical",
   "power": 40,
   "acc": null,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "sob_story": {
   "name": "SOB STORY",
   "type": "DARK",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 20,
   "prio": 0,
   "target": "foe",
   "effect": "stat",
   "args": {
    "who": "foe",
    "stats": {
     "spd": -2
    },
    "chance": 1
   }
  },
  "thump": {
   "name": "THUMP",
   "type": "NORMAL",
   "cat": "physical",
   "power": 100,
   "acc": 95,
   "pp": 15,
   "prio": 0,
   "target": "foe",
   "effect": null,
   "args": {}
  },
  "enrage": {
   "name": "ENRAGE",
   "type": "FIRE",
   "cat": "physical",
   "power": 90,
   "acc": 100,
   "pp": 10,
   "prio": 0,
   "target": "foe",
   "effect": "rampage_confuse",
   "args": {
    "min": 2,
    "max": 5,
    "burn": 0.5
   }
  },
  "environmentalism": {
   "name": "ENVIRONMENTALISM",
   "type": "GRASS",
   "cat": "status",
   "power": 0,
   "acc": 100,
   "pp": 5,
   "prio": 0,
   "target": "player",
   "effect": "ideologize",
   "args": {
    "min": 2,
    "max": 5,
    "duplicate": true
   }
  },
  "giga_drain": {
   "name": "GIGA DRAIN",
   "type": "GRASS",
   "cat": "special",
   "power": 60,
   "acc": 100,
   "pp": 5,
   "prio": 0,
   "target": "foe",
   "effect": "drain",
   "args": {
    "frac": 0.5
   }
  }
 },
 "species": {
  "student": {
   "name": "YOU",
   "types": [
    "NORMAL"
   ],
   "base": {
    "hp": 50,
    "atk": 50,
    "def": 45,
    "spa": 65,
    "spd": 50,
    "spe": 40
   },
   "exp_yield": 60,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "math"
    ],
    [
     1,
     "police"
    ],
    [
     1,
     "throw"
    ],
    [
     8,
     "sling"
    ],
    [
     13,
     "bow"
    ],
    [
     20,
     "glock"
    ],
    [
     30,
     "uzi"
    ],
    [
     40,
     "sniper"
    ]
   ],
   "evolves": {
    "level": 25,
    "into": "phd"
   },
   "passive": null,
   "model": "none (player)",
   "sprites": {
    "front": null,
    "back": "me_b",
    "over": "p"
   }
  },
  "phd": {
   "name": "YOU",
   "types": [
    "NORMAL",
    "PSYCHIC"
   ],
   "base": {
    "hp": 75,
    "atk": 65,
    "def": 65,
    "spa": 110,
    "spd": 85,
    "spe": 60
   },
   "exp_yield": 160,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "math"
    ],
    [
     1,
     "police"
    ],
    [
     1,
     "throw"
    ],
    [
     8,
     "sling"
    ],
    [
     13,
     "bow"
    ],
    [
     20,
     "glock"
    ],
    [
     25,
     "ai"
    ],
    [
     30,
     "uzi"
    ],
    [
     40,
     "sniper"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "none (player)",
   "sprites": {
    "front": null,
    "back": "phd_b",
    "over": "d"
   }
  },
  "ai": {
   "name": "AI",
   "types": [
    "ELECTRIC"
   ],
   "base": {
    "hp": 45,
    "atk": 50,
    "def": 50,
    "spa": 85,
    "spd": 60,
    "spe": 90
   },
   "exp_yield": 50,
   "growth": "agent",
   "learnset": [
    [
     1,
     "ping"
    ],
    [
     1,
     "fine_tune"
    ],
    [
     9,
     "overclock"
    ],
    [
     12,
     "deepfake"
    ],
    [
     20,
     "reboot"
    ],
    [
     24,
     "backprop"
    ],
    [
     32,
     "hallucinate"
    ],
    [
     36,
     "trimodal"
    ],
    [
     44,
     "gpu_cluster"
    ],
    [
     52,
     "hyperscale"
    ]
   ],
   "evolves": {
    "level": 80,
    "into": "terminator"
   },
   "passive": null,
   "model": "Porygon",
   "sprites": {
    "front": null,
    "back": "ai_b",
    "over": null
   }
  },
  "terminator": {
   "name": "TERMINATOR",
   "types": [
    "STEEL",
    "ELECTRIC"
   ],
   "base": {
    "hp": 100,
    "atk": 150,
    "def": 140,
    "spa": 120,
    "spd": 100,
    "spe": 90
   },
   "exp_yield": 250,
   "growth": "agent",
   "learnset": [
    [
     1,
     "ping"
    ],
    [
     1,
     "fine_tune"
    ],
    [
     9,
     "overclock"
    ],
    [
     12,
     "deepfake"
    ],
    [
     20,
     "reboot"
    ],
    [
     24,
     "backprop"
    ],
    [
     32,
     "hallucinate"
    ],
    [
     36,
     "trimodal"
    ],
    [
     44,
     "gpu_cluster"
    ],
    [
     52,
     "hyperscale"
    ],
    [
     80,
     "plasma_rifle"
    ],
    [
     85,
     "metal_fist"
    ],
    [
     90,
     "hunt"
    ],
    [
     95,
     "judgment_day"
    ]
   ],
   "evolves": null,
   "passive": "ill_be_back",
   "model": "Metagross",
   "sprites": {
    "front": null,
    "back": "terminator_b",
    "over": null
   }
  },
  "rabbit": {
   "name": "RABBIT",
   "types": [
    "NORMAL"
   ],
   "base": {
    "hp": 60,
    "atk": 80,
    "def": 50,
    "spa": 50,
    "spd": 60,
    "spe": 110
   },
   "exp_yield": 150,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "hole"
    ],
    [
     1,
     "aegyo"
    ],
    [
     1,
     "nap"
    ],
    [
     1,
     "hop"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "none (existing rabbit)",
   "sprites": {
    "front": "rab_b",
    "back": null,
    "over": null,
    "faces": {
     "aegyo": "rab_b_aegyo",
     "sleep": "rab_b_sleep"
    }
   }
  },
  "fox": {
   "name": "FOX",
   "types": [
    "FIRE"
   ],
   "base": {
    "hp": 38,
    "atk": 41,
    "def": 40,
    "spa": 50,
    "spd": 65,
    "spe": 65
   },
   "exp_yield": 63,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "foxfire"
    ],
    [
     5,
     "tail_whip"
    ],
    [
     9,
     "yip"
    ],
    [
     13,
     "pounce"
    ],
    [
     17,
     "wisp"
    ],
    [
     21,
     "trickery"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Vulpix",
   "sprites": {
    "front": "fox_f",
    "back": null,
    "over": null
   }
  },
  "wolf": {
   "name": "WOLF",
   "types": [
    "DARK"
   ],
   "base": {
    "hp": 35,
    "atk": 55,
    "def": 35,
    "spa": 30,
    "spd": 30,
    "spe": 35
   },
   "exp_yield": 55,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "lunge"
    ],
    [
     5,
     "howl"
    ],
    [
     9,
     "kick_dirt"
    ],
    [
     13,
     "bite"
    ],
    [
     17,
     "snarl"
    ]
   ],
   "evolves": {
    "level": 18,
    "into": "direwolf"
   },
   "passive": null,
   "model": "Poochyena",
   "sprites": {
    "front": "wolf_f",
    "back": null,
    "over": null
   }
  },
  "direwolf": {
   "name": "DIREWOLF",
   "types": [
    "DARK"
   ],
   "base": {
    "hp": 70,
    "atk": 90,
    "def": 70,
    "spa": 60,
    "spd": 60,
    "spe": 70
   },
   "exp_yield": 128,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "lunge"
    ],
    [
     5,
     "howl"
    ],
    [
     9,
     "kick_dirt"
    ],
    [
     13,
     "bite"
    ],
    [
     17,
     "snarl"
    ],
    [
     27,
     "crunch"
    ]
   ],
   "evolves": null,
   "passive": "intimidate",
   "model": "Mightyena",
   "sprites": {
    "front": "direwolf_f",
    "back": null,
    "over": null
   }
  },
  "mosquito": {
   "name": "MOSQUITO",
   "types": [
    "BUG",
    "FLYING"
   ],
   "base": {
    "hp": 40,
    "atk": 45,
    "def": 35,
    "spa": 30,
    "spd": 40,
    "spe": 55
   },
   "exp_yield": 49,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "bloodsuck"
    ],
    [
     6,
     "whine"
    ],
    [
     11,
     "buzz"
    ],
    [
     16,
     "bite"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Zubat",
   "sprites": {
    "front": "mosquito_f",
    "back": null,
    "over": null
   }
  },
  "flygion": {
   "name": "FLYGION",
   "types": [
    "BUG",
    "FLYING"
   ],
   "base": {
    "hp": 65,
    "atk": 65,
    "def": 45,
    "spa": 75,
    "spd": 45,
    "spe": 95
   },
   "exp_yield": 147,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "swarm"
    ],
    [
     1,
     "buzz"
    ],
    [
     7,
     "dart"
    ],
    [
     13,
     "blur"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Yanma",
   "sprites": {
    "front": "flygion_f",
    "back": null,
    "over": null
   }
  },
  "cinderella": {
   "name": "CINDERELLA",
   "types": [
    "PSYCHIC"
   ],
   "base": {
    "hp": 60,
    "atk": 45,
    "def": 50,
    "spa": 90,
    "spd": 85,
    "spe": 80
   },
   "exp_yield": 140,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "sad_sigh"
    ],
    [
     6,
     "stardust"
    ],
    [
     11,
     "glimmer"
    ],
    [
     16,
     "glass_shoe"
    ]
   ],
   "evolves": null,
   "passive": "midnight",
   "model": "Ralts/Kirlia",
   "sprites": {
    "front": "cinderella_f",
    "back": null,
    "over": "cin"
   }
  },
  "evilrella": {
   "name": "EVILRELLA",
   "types": [
    "DARK"
   ],
   "base": {
    "hp": 50,
    "atk": 75,
    "def": 75,
    "spa": 65,
    "spd": 65,
    "spe": 50
   },
   "exp_yield": 98,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "sneer"
    ],
    [
     1,
     "claw"
    ],
    [
     9,
     "bad_omen"
    ],
    [
     13,
     "toe_stomp"
    ],
    [
     17,
     "scratch_fit"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Sableye",
   "sprites": {
    "front": "evilrella_f",
    "back": null,
    "over": null
   }
  },
  "insectologist": {
   "name": "INSECTOLOGIST",
   "types": [
    "BUG"
   ],
   "base": {
    "hp": 60,
    "atk": 30,
    "def": 10,
    "spa": 80,
    "spd": 90,
    "spe": 45
   },
   "exp_yield": 70,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "bug_net"
    ],
    [
     1,
     "magnifier"
    ],
    [
     7,
     "lecture"
    ],
    [
     9,
     "pin"
    ]
   ],
   "evolves": null,
   "passive": "witness",
   "model": "Butterfree",
   "sprites": {
    "front": "insectologist_f",
    "back": null,
    "over": null
   }
  },
  "exgf": {
   "name": "EX-GIRLFRIEND",
   "types": [
    "DARK"
   ],
   "base": {
    "hp": 65,
    "atk": 130,
    "def": 60,
    "spa": 75,
    "spd": 60,
    "spe": 75
   },
   "exp_yield": 174,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "claw"
    ],
    [
     5,
     "sneer"
    ],
    [
     13,
     "pounce"
    ],
    [
     21,
     "bite"
    ],
    [
     31,
     "ghosted"
    ],
    [
     36,
     "cheap_shot"
    ],
    [
     41,
     "told_you_so"
    ],
    [
     46,
     "guilt_trip"
    ]
   ],
   "evolves": null,
   "passive": "death_stare",
   "model": "Absol",
   "sprites": {
    "front": "exgf_f",
    "back": null,
    "over": null
   }
  },
  "orderly": {
   "name": "ORDERLY",
   "types": [
    "FIGHTING"
   ],
   "base": {
    "hp": 70,
    "atk": 80,
    "def": 50,
    "spa": 35,
    "spd": 35,
    "spe": 35
   },
   "exp_yield": 88,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "hold_down"
    ],
    [
     1,
     "sneer"
    ],
    [
     7,
     "pump_up"
    ],
    [
     13,
     "chop"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Machop",
   "sprites": {
    "front": "orderly_f",
    "back": null,
    "over": "ord"
   }
  },
  "nurse": {
   "name": "NURSE",
   "types": [
    "NORMAL"
   ],
   "base": {
    "hp": 110,
    "atk": 40,
    "def": 40,
    "spa": 60,
    "spd": 90,
    "spe": 50
   },
   "exp_yield": 100,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "injection"
    ],
    [
     1,
     "tut_tut"
    ],
    [
     9,
     "lullaby"
    ],
    [
     13,
     "medicate"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Chansey",
   "sprites": {
    "front": "nurse_f",
    "back": null,
    "over": "nur"
   }
  },
  "prudence": {
   "name": "PRUDENCE",
   "types": [
    "PSYCHIC"
   ],
   "base": {
    "hp": 55,
    "atk": 40,
    "def": 50,
    "spa": 70,
    "spd": 65,
    "spe": 60
   },
   "exp_yield": 120,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "tut_tut"
    ],
    [
     1,
     "prim_pose"
    ],
    [
     5,
     "mind_games"
    ],
    [
     9,
     "jealousy"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Kirlia",
   "sprites": {
    "front": "prudence_f",
    "back": null,
    "over": "sisp"
   }
  },
  "griselda": {
   "name": "GRISELDA",
   "types": [
    "DARK"
   ],
   "base": {
    "hp": 55,
    "atk": 70,
    "def": 50,
    "spa": 45,
    "spd": 50,
    "spe": 75
   },
   "exp_yield": 120,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "sneer"
    ],
    [
     1,
     "sob_story"
    ],
    [
     5,
     "tear_gown"
    ],
    [
     9,
     "scorn"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "Sneasel",
   "sprites": {
    "front": "griselda_f",
    "back": null,
    "over": "sisd"
   }
  },
  "firetree": {
   "name": "FIRE TREE",
   "types": [
    "GRASS",
    "FIRE"
   ],
   "base": {
    "hp": 150,
    "atk": 140,
    "def": 150,
    "spa": 140,
    "spd": 130,
    "spe": 30
   },
   "exp_yield": 250,
   "growth": "medium_fast",
   "learnset": [
    [
     1,
     "thump"
    ],
    [
     1,
     "enrage"
    ],
    [
     1,
     "environmentalism"
    ],
    [
     1,
     "giga_drain"
    ]
   ],
   "evolves": null,
   "passive": null,
   "model": "none (boss)",
   "sprites": {
    "front": "firetree_f",
    "back": null,
    "over": null
   }
  }
 },
 "encounters": {
  "grass": {
   "rate": 0.1,
   "scenes": [
    "crossroads",
    "pen",
    "forest"
   ],
   "table": [
    {
     "species": "mosquito",
     "weight": 30,
     "min": 6,
     "max": 9
    },
    {
     "species": "wolf",
     "weight": 20,
     "min": 12,
     "max": 18
    },
    {
     "species": "flygion",
     "weight": 20,
     "min": 7,
     "max": 11
    },
    {
     "species": "fox",
     "weight": 10,
     "min": 8,
     "max": 12
    },
    {
     "species": "evilrella",
     "weight": 8,
     "min": 13,
     "max": 17
    },
    {
     "species": "insectologist",
     "weight": 5,
     "min": 6,
     "max": 9
    },
    {
     "species": "exgf",
     "weight": 5,
     "min": 50,
     "max": 50
    },
    {
     "species": "cinderella",
     "weight": 2,
     "min": 15,
     "max": 18
    }
   ]
  }
 },
 "trainers": {
  "dale": {
   "name": "ORDERLY DALE",
   "scene": "ward",
   "x": 13,
   "y": 7,
   "dir": "left",
   "sight": 4,
   "over": "ord",
   "foes": [
    {
     "species": "orderly",
     "offset": 0,
     "min": 5
    }
   ]
  },
  "irma": {
   "name": "NURSE IRMA",
   "scene": "ward",
   "x": 13,
   "y": 3,
   "dir": "left",
   "sight": 3,
   "over": "nur",
   "foes": [
    {
     "species": "nurse",
     "offset": 0,
     "min": 5
    }
   ]
  },
  "gus": {
   "name": "ORDERLY GUS",
   "scene": "ward",
   "x": 13,
   "y": 5,
   "dir": "left",
   "sight": 4,
   "over": "ord",
   "foes": [
    {
     "species": "orderly",
     "offset": 0,
     "min": 5
    }
   ]
  },
  "pam": {
   "name": "NURSE PAM",
   "scene": "cells",
   "x": 11,
   "y": 4,
   "dir": "down",
   "sight": 4,
   "over": "nur",
   "foes": [
    {
     "species": "nurse",
     "offset": 0,
     "min": 5
    }
   ]
  },
  "sisters": {
   "name": "PRUDENCE and GRISELDA",
   "scene": "cells",
   "double": true,
   "zone": [
    5,
    4,
    9,
    5
   ],
   "members": [
    {
     "x": 6,
     "y": 4,
     "dir": "down",
     "over": "sisp"
    },
    {
     "x": 8,
     "y": 4,
     "dir": "down",
     "over": "sisd"
    }
   ],
   "foes": [
    {
     "species": "prudence",
     "offset": -1,
     "min": 4,
     "moves": [
      "jealousy",
      "mind_games",
      "prim_pose",
      "tut_tut"
     ]
    },
    {
     "species": "griselda",
     "offset": -1,
     "min": 4,
     "moves": [
      "scorn",
      "tear_gown",
      "sob_story",
      "sneer"
     ]
    }
   ]
  }
 },
 "player": {
  "start_species": "student",
  "start_level": 5,
  "start_moves": [
   "math",
   "police",
   "throw"
  ]
 },
 "ai": {
  "start_species": "ai",
  "start_level": 1
 }
};
