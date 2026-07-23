// ChordLab — songs.js
// Defines window.SONGS, an array of song objects per CONTRACT.md section 3.
// Chord symbols use the ChordEngine format (e.g. F, Em7, A7, Dm/C, Bbmaj7, A7sus4).
window.SONGS = [
  {
    id: 'yesterday',
    title: 'Yesterday',
    artist: 'The Beatles',
    year: '1965',
    key: 'F',
    capo: 0,
    tags: ['ballad', '60s', 'beatles', 'acoustic'],
    sections: [
      { name: 'Intro', bars: ['F', 'F'] },
      {
        name: 'Verse',
        bars: ['F', 'Em7 A7', 'Dm', 'Dm/C Bbmaj7 C7', 'F Em', 'Dm7 G7', 'Bb F']
      },
      {
        name: 'Bridge',
        bars: ['Em7 A7', 'Dm C Bb Dm/A', 'Gm7 C7', 'F F7', 'Em7 A7', 'Dm C Bb Dm/A', 'Gm7 C7', 'F']
      },
      {
        name: 'Verse',
        bars: ['F', 'Em7 A7', 'Dm', 'Dm/C Bbmaj7 C7', 'F Em', 'Dm7 G7', 'Bb F']
      },
      {
        name: 'Outro',
        bars: ['F/C G7/B', 'Bb F']
      }
    ]
  },
  {
    id: 'knockin-heavens-door',
    title: "Knockin' on Heaven's Door",
    artist: 'Bob Dylan',
    year: '1973',
    key: 'G',
    capo: 0,
    tags: ['folk', 'rock', '70s', 'classic'],
    sections: [
      {
        name: 'Verse',
        bars: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C']
      },
      {
        name: 'Chorus',
        bars: ['G', 'D', 'C', 'C', 'G', 'D', 'C', 'C']
      }
    ]
  },
  {
    id: 'let-it-be',
    title: 'Let It Be',
    artist: 'The Beatles',
    year: '1970',
    key: 'C',
    capo: 0,
    tags: ['ballad', 'beatles', 'piano', '70s'],
    sections: [
      {
        name: 'Verse',
        bars: ['C', 'G', 'Am', 'F', 'C', 'G', 'F C', 'C']
      },
      {
        name: 'Chorus',
        bars: ['Am', 'G', 'F', 'C', 'C', 'G', 'F C', 'C']
      },
      {
        name: 'Outro',
        bars: ['C', 'G', 'F C', 'C']
      }
    ]
  },
  {
    id: 'stand-by-me',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    year: '1961',
    key: 'A',
    capo: 0,
    tags: ['soul', 'oldies', '60s', 'classic'],
    sections: [
      {
        name: 'Intro',
        bars: ['A', 'A', 'F#m', 'F#m', 'D', 'E', 'A', 'A']
      },
      {
        name: 'Verse',
        bars: ['A', 'A', 'F#m', 'F#m', 'D', 'E', 'A', 'A']
      },
      {
        name: 'Chorus',
        bars: ['A', 'A', 'F#m', 'F#m', 'D', 'E', 'A', 'A']
      }
    ]
  },
  {
    id: 'wonderwall',
    title: 'Wonderwall',
    artist: 'Oasis',
    year: '1995',
    key: 'F#m',
    capo: 2,
    tags: ['britpop', 'rock', '90s', 'acoustic'],
    sections: [
      {
        name: 'Intro',
        bars: ['Em7', 'G', 'Dsus4', 'A7sus4']
      },
      {
        name: 'Verse',
        bars: ['Em7', 'G', 'Dsus4', 'A7sus4', 'Em7', 'G', 'Dsus4', 'A7sus4']
      },
      {
        name: 'Pre-Chorus',
        bars: ['C', 'D', 'A7sus4', 'A7sus4', 'C', 'D', 'G', 'G']
      },
      {
        name: 'Chorus',
        bars: ['Cadd9', 'Em7', 'G', 'Em7', 'Cadd9', 'Em7', 'G', 'G']
      }
    ]
  },
  {
    id: 'hey-jude',
    title: 'Hey Jude',
    artist: 'The Beatles',
    year: '1968',
    key: 'F',
    capo: 0,
    tags: ['ballad', 'beatles', '60s', 'anthem'],
    sections: [
      {
        name: 'Verse',
        bars: ['F', 'C', 'C7', 'F', 'Bb', 'F', 'C7', 'F']
      },
      {
        name: 'Bridge',
        bars: ['Bb', 'Bb', 'F', 'F', 'C7', 'C7', 'F', 'F']
      },
      {
        name: 'Outro',
        bars: ['F', 'Eb', 'Bb', 'F']
      }
    ]
  },
  {
    id: 'wish-you-were-here',
    title: 'Wish You Were Here',
    artist: 'Pink Floyd',
    year: '1975',
    key: 'G',
    capo: 0,
    tags: ['rock', 'acoustic', '70s', 'classic'],
    sections: [
      {
        name: 'Intro',
        bars: ['Em7', 'G', 'Em7', 'G', 'Em7', 'A7sus4', 'Em7', 'A7sus4', 'G']
      },
      {
        name: 'Verse',
        bars: ['C', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C', 'Am', 'Am', 'G', 'G']
      }
    ]
  },

  // ── Scaletta importata da lista titoli ───────────────────────────────
  {
    id: 'white-room',
    title: 'White Room', artist: 'Cream', year: '1968', key: 'Dm', capo: 0,
    tags: ['rock', '60s', 'psychedelic', 'classic'],
    sections: [
      { name: 'Intro', bars: ['Dm', 'C', 'G', 'G'] },
      { name: 'Verse', bars: ['D', 'C', 'G', 'D', 'C', 'G'] },
      { name: 'Chorus', bars: ['Bb', 'C', 'D', 'Bb', 'C', 'D'] },
      { name: 'Outro', bars: ['G', 'F', 'C', 'D'] }
    ]
  },
  {
    id: 'heroes',
    title: 'Heroes', artist: 'David Bowie', year: '1977', key: 'D', capo: 0,
    tags: ['rock', '70s', 'art-rock', 'classic'],
    sections: [
      { name: 'Intro', bars: ['D', 'G', 'D', 'G'] },
      { name: 'Verse', bars: ['D', 'G', 'D', 'G'] },
      { name: 'Chorus', bars: ['C', 'D', 'G', 'C', 'D', 'G'] },
      { name: 'Bridge', bars: ['Em', 'D', 'C', 'D'] }
    ]
  },
  {
    id: 'wicked-game',
    title: 'Wicked Game', artist: 'Chris Isaak', year: '1989', key: 'Bm', capo: 0,
    tags: ['rock', '80s', 'ballad', 'moody'],
    sections: [
      { name: 'Intro', bars: ['Bm', 'A', 'E', 'Bm', 'A', 'E'] },
      { name: 'Verse', bars: ['Bm', 'A', 'E', 'Bm', 'A', 'E'] },
      { name: 'Chorus', bars: ['Bm', 'A', 'E', 'Bm', 'A', 'E'] }
    ]
  },
  {
    id: 'cocaine',
    title: 'Cocaine', artist: 'Eric Clapton', year: '1977', key: 'E', capo: 0,
    tags: ['rock', '70s', 'blues', 'riff'],
    sections: [
      { name: 'Intro', bars: ['E', 'D', 'E', 'D'] },
      { name: 'Verse', bars: ['E', 'D', 'E', 'D'] },
      { name: 'Chorus', bars: ['D', 'C', 'G', 'D'] },
      { name: 'Outro', bars: ['E', 'D', 'E', 'D'] }
    ]
  },
  {
    id: 'bohemian-like-you',
    title: 'Bohemian Like You', artist: 'The Dandy Warhols', year: '2000', key: 'E', capo: 0,
    tags: ['rock', '00s', 'indie'],
    sections: [
      { name: 'Verse', bars: ['E', 'G', 'A', 'A'] },
      { name: 'Chorus', bars: ['A', 'B', 'E', 'E'] }
    ]
  },
  {
    id: 'easy',
    title: 'Easy', artist: 'Commodores', year: '1977', key: 'Bb', capo: 0,
    tags: ['soul', '70s', 'ballad'],
    sections: [
      { name: 'Verse', bars: ['Bb', 'Gm', 'Eb', 'F'] },
      { name: 'Chorus', bars: ['Bb', 'F', 'Gm', 'Eb', 'F', 'Bb'] }
    ]
  },
  {
    id: 'while-my-guitar-gently-weeps',
    title: 'While My Guitar Gently Weeps', artist: 'The Beatles', year: '1968', key: 'Am', capo: 0,
    tags: ['rock', '60s', 'beatles', 'classic'],
    sections: [
      { name: 'Intro', bars: ['Am', 'Am/G', 'D/F#', 'F'] },
      { name: 'Verse', bars: ['Am', 'Am/G', 'D/F#', 'F', 'Am', 'G', 'D', 'E'] },
      { name: 'Chorus', bars: ['A', 'C#m', 'F#m', 'C#m', 'Bm', 'E', 'A', 'A'] }
    ]
  },
  {
    id: 'karma-police',
    title: 'Karma Police', artist: 'Radiohead', year: '1997', key: 'Am', capo: 0,
    tags: ['rock', '90s', 'alternative'],
    sections: [
      { name: 'Verse', bars: ['Am', 'E/G#', 'G', 'D/F#', 'F', 'C/E', 'Dm', 'E'] },
      { name: 'Chorus', bars: ['D', 'G', 'C', 'Am'] }
    ]
  },
  {
    id: 'angie',
    title: 'Angie', artist: 'The Rolling Stones', year: '1973', key: 'Am', capo: 0,
    tags: ['rock', '70s', 'ballad', 'stones'],
    sections: [
      { name: 'Verse', bars: ['Am', 'E', 'G', 'F', 'C', 'G'] },
      { name: 'Chorus', bars: ['C', 'F', 'G', 'Dm', 'Am', 'E'] }
    ]
  },
  {
    id: 'the-man-who-sold-the-world',
    title: 'The Man Who Sold the World', artist: 'David Bowie', year: '1970', key: 'F', capo: 0,
    tags: ['rock', '70s', 'art-rock'],
    sections: [
      { name: 'Intro', bars: ['F', 'F'] },
      { name: 'Verse', bars: ['F', 'Bb', 'F', 'Bb'] },
      { name: 'Chorus', bars: ['A', 'D', 'A', 'D', 'A', 'D', 'A', 'D'] },
      { name: 'Bridge', bars: ['Dm', 'C', 'Bb', 'A'] }
    ]
  },
  {
    id: 'born-to-run',
    title: 'Born to Run', artist: 'Bruce Springsteen', year: '1975', key: 'E', capo: 0,
    tags: ['rock', '70s', 'anthem', 'classic'],
    sections: [
      { name: 'Verse', bars: ['E', 'A', 'E', 'A', 'B', 'A', 'E'] },
      { name: 'Chorus', bars: ['E', 'A', 'B', 'E', 'A', 'B', 'E', 'E'] }
    ]
  },
  {
    id: 'streets-of-love',
    title: 'Streets of Love', artist: 'The Rolling Stones', year: '2005', key: 'A', capo: 0,
    tags: ['rock', '00s', 'ballad', 'stones'],
    sections: [
      { name: 'Verse', bars: ['A', 'F#m', 'D', 'E'] },
      { name: 'Chorus', bars: ['D', 'E', 'A', 'F#m', 'D', 'E', 'A', 'A'] }
    ]
  },
  {
    id: 'bad-day',
    title: 'Bad Day', artist: 'Daniel Powter', year: '2005', key: 'D', capo: 0,
    tags: ['pop', '00s', 'piano'],
    sections: [
      { name: 'Verse', bars: ['D', 'F#m', 'G', 'A'] },
      { name: 'Chorus', bars: ['G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'A'] }
    ]
  },
  {
    id: 'comfortably-numb',
    title: 'Comfortably Numb', artist: 'Pink Floyd', year: '1979', key: 'Bm', capo: 0,
    tags: ['rock', '70s', 'prog', 'classic'],
    sections: [
      { name: 'Verse', bars: ['Bm', 'A', 'G', 'Em', 'Bm', 'A', 'G', 'Em', 'Bm'] },
      { name: 'Chorus', bars: ['D', 'A', 'C', 'G', 'D', 'A', 'C', 'G', 'D'] }
    ]
  },
  {
    id: 'time',
    title: 'Time', artist: 'Pink Floyd', year: '1973', key: 'F#m', capo: 0,
    tags: ['rock', '70s', 'prog', 'classic'],
    sections: [
      { name: 'Intro', bars: ['F#m', 'A', 'F#m', 'A'] },
      { name: 'Verse', bars: ['F#m', 'A', 'F#m', 'A'] },
      { name: 'Chorus', bars: ['D', 'A', 'E', 'F#m', 'D', 'A', 'E', 'F#m'] }
    ]
  },
  {
    id: 'whiskey-in-the-jar',
    title: 'Whiskey in the Jar', artist: 'Thin Lizzy', year: '1972', key: 'G', capo: 0,
    tags: ['rock', '70s', 'folk-rock', 'irish'],
    sections: [
      { name: 'Verse', bars: ['G', 'Em', 'C', 'G', 'G', 'Em', 'D', 'D'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'G', 'C', 'G', 'D', 'G'] }
    ]
  },
  {
    id: 'purple-rain',
    title: 'Purple Rain', artist: 'Prince', year: '1984', key: 'Bb', capo: 0,
    tags: ['rock', '80s', 'ballad', 'classic'],
    sections: [
      { name: 'Intro', bars: ['Bb', 'Bb', 'Gm', 'Gm', 'F', 'F', 'Eb', 'Eb'] },
      { name: 'Verse', bars: ['Bb', 'Gm', 'F', 'Eb'] },
      { name: 'Chorus', bars: ['Bb', 'Gm', 'F', 'Eb'] }
    ]
  },
  {
    id: 'perfect-day',
    title: 'Perfect Day', artist: 'Lou Reed', year: '1972', key: 'A', capo: 0,
    tags: ['rock', '70s', 'ballad'],
    sections: [
      { name: 'Verse', bars: ['A', 'F#m', 'D', 'E'] },
      { name: 'Chorus', bars: ['Bm', 'E', 'A', 'F#m', 'Bm', 'E', 'A', 'A'] },
      { name: 'Bridge', bars: ['E', 'A', 'E', 'A'] }
    ]
  },
  {
    id: 'californication',
    title: 'Californication', artist: 'Red Hot Chili Peppers', year: '1999', key: 'Am', capo: 0,
    tags: ['rock', '90s', 'alternative'],
    sections: [
      { name: 'Verse', bars: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'] },
      { name: 'Chorus', bars: ['F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'G'] },
      { name: 'Solo', bars: ['Am', 'F', 'C', 'G'] }
    ]
  },
  {
    id: 'tunnel-of-love',
    title: 'Tunnel of Love', artist: 'Bruce Springsteen', year: '1987', key: 'G', capo: 0,
    tags: ['rock', '80s'],
    sections: [
      { name: 'Verse', bars: ['G', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'D'] }
    ]
  },
  {
    id: 'narcotic',
    title: 'Narcotic', artist: 'Liquido', year: '1998', key: 'Bm', capo: 0,
    tags: ['rock', '90s', 'alternative'],
    sections: [
      { name: 'Verse', bars: ['Bm', 'G', 'D', 'A'] },
      { name: 'Chorus', bars: ['G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'A'] }
    ]
  },
  {
    id: 'dont-you',
    title: "Don't You (Forget About Me)", artist: 'Simple Minds', year: '1985', key: 'D', capo: 0,
    tags: ['rock', '80s', 'new-wave'],
    sections: [
      { name: 'Intro', bars: ['D', 'C', 'G', 'D', 'C', 'G'] },
      { name: 'Verse', bars: ['D', 'C', 'G', 'D', 'C', 'G'] },
      { name: 'Chorus', bars: ['G', 'A', 'Bm', 'G', 'A', 'D'] },
      { name: 'Outro', bars: ['Bm', 'A', 'G', 'Bm', 'A', 'G'] }
    ]
  },
  {
    id: 'mr-crowley',
    title: 'Mr. Crowley', artist: 'Ozzy Osbourne', year: '1980', key: 'Dm', capo: 0,
    tags: ['rock', '80s', 'metal'],
    sections: [
      { name: 'Intro', bars: ['Dm', 'A', 'Bb', 'F', 'Gm', 'A', 'Dm', 'A'] },
      { name: 'Verse', bars: ['Dm', 'A', 'Bb', 'F', 'Gm', 'A', 'Dm', 'Dm'] },
      { name: 'Chorus', bars: ['Bb', 'F', 'C', 'Gm', 'A', 'Dm'] }
    ]
  },
  {
    id: 'leaving-new-york',
    title: 'Leaving New York', artist: 'R.E.M.', year: '2004', key: 'G', capo: 0,
    tags: ['rock', '00s', 'alternative'],
    sections: [
      { name: 'Verse', bars: ['Em', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'D'] }
    ]
  },
  {
    id: 'now-and-then',
    title: 'Now and Then', artist: 'The Beatles', year: '2023', key: 'A', capo: 0,
    tags: ['rock', 'beatles', 'ballad'],
    sections: [
      { name: 'Verse', bars: ['A', 'C#m', 'D', 'E'] },
      { name: 'Chorus', bars: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'E', 'E'] }
    ]
  },
  {
    id: 'one-u2',
    title: 'One', artist: 'U2', year: '1991', key: 'Am', capo: 0,
    tags: ['rock', '90s', 'ballad', 'anthem'],
    sections: [
      { name: 'Verse', bars: ['Am', 'D', 'Fmaj7', 'G'] },
      { name: 'Chorus', bars: ['C', 'Am', 'F', 'C', 'G', 'G'] }
    ]
  },
  {
    id: 'like-a-rolling-stone',
    title: 'Like a Rolling Stone', artist: 'Bob Dylan', year: '1965', key: 'C', capo: 0,
    tags: ['rock', '60s', 'classic', 'dylan'],
    sections: [
      { name: 'Verse', bars: ['C', 'Dm', 'Em', 'F', 'G', 'G'] },
      { name: 'Chorus', bars: ['F', 'Em', 'Dm', 'C', 'F', 'Em', 'Dm', 'C', 'F', 'G'] }
    ]
  },

  // ── Seconda scaletta ─────────────────────────────────────────────────
  {
    id: 'la-flaca', title: 'La Flaca', artist: 'Jarabe de Palo', year: '1996', key: 'Am', capo: 0,
    tags: ['latin', 'pop', '90s'],
    sections: [
      { name: 'Verse', bars: ['Am', 'G', 'F', 'E'] },
      { name: 'Chorus', bars: ['Dm', 'Am', 'E', 'Am'] }
    ]
  },
  {
    id: 'volevo-essere-un-duro', title: 'Volevo Essere un Duro', artist: 'Lucio Corsi', year: '2025', key: 'C', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['C', 'Am', 'F', 'G'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'Am'] }
    ]
  },
  {
    id: 'angels', title: 'Angels', artist: 'Robbie Williams', year: '1997', key: 'E', capo: 0,
    tags: ['pop', '90s', 'ballad'],
    sections: [
      { name: 'Verse', bars: ['E', 'B', 'C#m', 'A'] },
      { name: 'Pre-Chorus', bars: ['A', 'B', 'E', 'E'] },
      { name: 'Chorus', bars: ['E', 'A', 'E', 'A', 'B', 'E'] }
    ]
  },
  {
    id: 'prendila-cosi', title: 'Prendila Così', artist: 'Max Pezzali', year: '2004', key: 'G', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['G', 'Em', 'C', 'D'] },
      { name: 'Chorus', bars: ['C', 'D', 'G', 'Em', 'C', 'D', 'G'] }
    ]
  },
  {
    id: 'losing-my-religion', title: 'Losing My Religion', artist: 'R.E.M.', year: '1991', key: 'Am', capo: 0,
    tags: ['rock', '90s', 'alternative'],
    sections: [
      { name: 'Verse', bars: ['Am', 'Em', 'Am', 'Em'] },
      { name: 'Chorus', bars: ['Dm', 'G', 'Am', 'Am', 'Dm', 'G', 'F', 'F'] }
    ]
  },
  {
    id: 'il-mare-d-inverno', title: "Il Mare d'Inverno", artist: 'Loredana Bertè', year: '1983', key: 'Em', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Em', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['C', 'D', 'Em', 'C', 'D', 'Em'] }
    ]
  },
  {
    id: 'vivere', title: 'Vivere', artist: 'Vasco Rossi', year: '1993', key: 'D', capo: 0,
    tags: ['rock', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['D', 'A', 'Bm', 'G'] },
      { name: 'Chorus', bars: ['G', 'A', 'D', 'Bm', 'G', 'A', 'D'] }
    ]
  },
  {
    id: '50-mila', title: '50 Mila', artist: 'Tananai', year: '2025', key: 'C', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['C', 'G', 'Am', 'F'] },
      { name: 'Chorus', bars: ['F', 'C', 'G', 'Am', 'F', 'C', 'G'] }
    ]
  },
  {
    id: 'every-breath-you-take', title: 'Every Breath You Take', artist: 'The Police', year: '1983', key: 'G', capo: 0,
    tags: ['rock', '80s', 'classic'],
    sections: [
      { name: 'Verse', bars: ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'D'] },
      { name: 'Bridge', bars: ['C', 'C', 'G', 'G', 'A', 'A', 'D', 'D'] }
    ]
  },
  {
    id: 'dimmi-di-si', title: 'Dimmi di Sì', artist: 'Alex Britti', year: '1998', key: 'C', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['C', 'Am', 'F', 'G'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'C'] }
    ]
  },
  {
    id: 'la-mia-signorina', title: 'La Mia Signorina', artist: 'Neffa', year: '2006', key: 'Am', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'D', 'G', 'C'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'Am'] }
    ]
  },
  {
    id: 'laura-non-ce-uomo-ragno', title: "Laura Non C'è / Hanno Ucciso l'Uomo Ragno", artist: 'Nek / 883', year: '1997', key: 'Bm', capo: 0,
    tags: ['pop', 'italiano', 'medley', 'da-verificare'],
    sections: [
      { name: "Laura Non C'è", bars: ['Bm', 'G', 'D', 'A'] },
      { name: "Hanno Ucciso l'Uomo Ragno", bars: ['Am', 'F', 'C', 'G'] }
    ]
  },
  {
    id: 'figli-delle-stelle', title: 'Figli delle Stelle', artist: 'Alan Sorrenti', year: '1977', key: 'Am', capo: 0,
    tags: ['disco', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'G', 'F', 'E'] },
      { name: 'Chorus', bars: ['Am', 'G', 'F', 'E'] }
    ]
  },
  {
    id: 'crazy-little-thing-called-love', title: 'Crazy Little Thing Called Love', artist: 'Queen', year: '1979', key: 'D', capo: 0,
    tags: ['rock', '70s', 'classic'],
    sections: [
      { name: 'Verse', bars: ['D', 'G', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['Bb', 'C', 'D', 'Bb', 'C', 'D'] },
      { name: 'Bridge', bars: ['G', 'C', 'G', 'D'] }
    ]
  },
  {
    id: 'yes-i-know-my-way', title: 'Yes I Know My Way', artist: 'Pino Daniele', year: '1981', key: 'Em', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Em', 'A', 'Em', 'A'] },
      { name: 'Chorus', bars: ['C', 'D', 'G', 'Em', 'C', 'D'] }
    ]
  },
  {
    id: 'disperato-erotico-stomp', title: 'Disperato Erotico Stomp', artist: 'Lucio Dalla', year: '1977', key: 'E', capo: 0,
    tags: ['rock', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['E', 'A', 'E', 'A'] },
      { name: 'Chorus', bars: ['A', 'B', 'E', 'E'] }
    ]
  },
  {
    id: 'cera-un-ragazzo', title: 'C’era un Ragazzo che come me Amava i Beatles e i Rolling Stones', artist: 'Gianni Morandi', year: '1966', key: 'G', capo: 0,
    tags: ['pop', 'italiano', '60s', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['G', 'C', 'D', 'G'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'G'] }
    ]
  },
  {
    id: 'amore-disperato', title: 'Amore Disperato', artist: 'Nada', year: '1983', key: 'Am', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'Dm', 'E', 'Am'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'E', 'Am'] }
    ]
  },
  {
    id: 'ma-che-freddo-fa', title: 'Ma Che Freddo Fa', artist: 'Nada', year: '1969', key: 'Am', capo: 0,
    tags: ['pop', 'italiano', '60s', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'E', 'Am', 'E'] },
      { name: 'Chorus', bars: ['C', 'G', 'F', 'E'] }
    ]
  },
  {
    id: 'cuore-matto', title: 'Cuore Matto', artist: 'Little Tony', year: '1967', key: 'Am', capo: 0,
    tags: ['pop', 'italiano', '60s', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'E', 'Am', 'E'] },
      { name: 'Chorus', bars: ['C', 'G', 'C', 'E', 'Am'] }
    ]
  },
  {
    id: 'tu-vuo-fa-lamericano', title: "Tu Vuò Fà l'Americano", artist: 'Renato Carosone', year: '1956', key: 'Am', capo: 0,
    tags: ['swing', 'italiano', 'classic'],
    sections: [
      { name: 'Verse', bars: ['Am', 'E', 'Am', 'E'] },
      { name: 'Chorus', bars: ['Dm', 'Am', 'E', 'Am'] }
    ]
  },
  {
    id: 'svalutation', title: 'Svalutation', artist: 'Adriano Celentano', year: '1976', key: 'Am', capo: 0,
    tags: ['funk', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'D', 'Am', 'D'] },
      { name: 'Chorus', bars: ['F', 'G', 'Am', 'Am'] }
    ]
  },
  {
    id: 'baila-morena', title: 'Baila Morena', artist: 'Zucchero', year: '2001', key: 'Dm', capo: 0,
    tags: ['latin', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Dm', 'Am', 'Bb', 'A'] },
      { name: 'Chorus', bars: ['Dm', 'Bb', 'A', 'Dm'] }
    ]
  },
  {
    id: 'timmagini', title: "T'Immagini / Non l'Hai Mica Capito", artist: 'Ornella Vanoni', year: '1970', key: 'C', capo: 0,
    tags: ['pop', 'italiano', 'medley', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['C', 'G', 'Am', 'F'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'Am'] }
    ]
  },
  {
    id: 'mentre-tutto-scorre', title: 'Mentre Tutto Scorre', artist: 'Negramaro', year: '2005', key: 'Em', capo: 0,
    tags: ['rock', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Em', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'Em'] }
    ]
  },
  {
    id: 'wind-of-change', title: 'Wind of Change', artist: 'Scorpions', year: '1990', key: 'C', capo: 0,
    tags: ['rock', '90s', 'ballad', 'classic'],
    sections: [
      { name: 'Verse', bars: ['C', 'Dm', 'G', 'C'] },
      { name: 'Chorus', bars: ['F', 'G', 'C', 'Am', 'F', 'G', 'C', 'C'] }
    ]
  },
  {
    id: 'do-it-again', title: 'Do It Again', artist: 'Steely Dan', year: '1972', key: 'Am', capo: 0,
    tags: ['rock', '70s', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['Am', 'G', 'Am', 'G'] },
      { name: 'Chorus', bars: ['Dm', 'Am', 'E', 'Am'] }
    ]
  },
  {
    id: 'everything-i-do', title: '(Everything I Do) I Do It for You', artist: 'Bryan Adams', year: '1991', key: 'D', capo: 0,
    tags: ['pop', '90s', 'ballad'],
    sections: [
      { name: 'Verse', bars: ['D', 'A', 'Bm', 'G', 'D'] },
      { name: 'Chorus', bars: ['G', 'A', 'D', 'Bm', 'G', 'A', 'D'] }
    ]
  },
  {
    id: 'despacito', title: 'Despacito', artist: 'Luis Fonsi', year: '2017', key: 'Bm', capo: 0,
    tags: ['latin', 'pop', '10s'],
    sections: [
      { name: 'Verse', bars: ['Bm', 'G', 'D', 'A'] },
      { name: 'Chorus', bars: ['Bm', 'G', 'D', 'A'] }
    ]
  },
  {
    id: 'you-never-can-tell', title: 'You Never Can Tell', artist: 'Chuck Berry', year: '1964', key: 'C', capo: 0,
    tags: ['rock', '60s', 'classic'],
    sections: [
      { name: 'Verse', bars: ['C', 'C', 'C', 'C', 'G', 'G', 'C', 'C'] },
      { name: 'Chorus', bars: ['F', 'F', 'C', 'C', 'G', 'G', 'C', 'C'] }
    ]
  },
  {
    id: 'stella-stai', title: 'Stella Stai', artist: 'Umberto Tozzi', year: '1980', key: 'D', capo: 0,
    tags: ['pop', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['D', 'A', 'G', 'D'] },
      { name: 'Chorus', bars: ['G', 'A', 'D', 'Bm', 'G', 'A', 'D'] }
    ]
  },
  {
    id: 'medley-gianna', title: 'Medley: Gianna / Obladì / La Canzone del Sole / Ma il Cielo è Sempre più Blu', artist: 'Vari', year: '', key: 'D', capo: 0,
    tags: ['italiano', 'medley', 'da-verificare'],
    sections: [
      { name: 'Gianna', bars: ['D', 'G', 'A', 'D'] },
      { name: 'Obladì Obladà', bars: ['C', 'G', 'C', 'F', 'C', 'G', 'C'] },
      { name: 'La Canzone del Sole', bars: ['D', 'G', 'A', 'D'] },
      { name: 'Ma il Cielo è Sempre più Blu', bars: ['C', 'F', 'G', 'C'] }
    ]
  },
  {
    id: '50-special', title: '50 Special', artist: 'Lùnapop', year: '1999', key: 'D', capo: 0,
    tags: ['pop', 'italiano', '90s', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['D', 'A', 'Bm', 'G'] },
      { name: 'Chorus', bars: ['G', 'A', 'D', 'Bm', 'G', 'A', 'D'] }
    ]
  },
  {
    id: 'balliamo-sul-mondo', title: 'Balliamo sul Mondo', artist: 'Ligabue', year: '1990', key: 'E', capo: 0,
    tags: ['rock', 'italiano', 'da-verificare'],
    sections: [
      { name: 'Verse', bars: ['E', 'A', 'E', 'B'] },
      { name: 'Chorus', bars: ['A', 'B', 'E', 'E'] }
    ]
  },
  {
    id: 'sweet-child-o-mine', title: "Sweet Child o' Mine", artist: "Guns N' Roses", year: '1987', key: 'D', capo: 0,
    tags: ['rock', '80s', 'classic'],
    sections: [
      { name: 'Intro', bars: ['D', 'D', 'C', 'C', 'G', 'G', 'D', 'D'] },
      { name: 'Verse', bars: ['D', 'C', 'G', 'D'] },
      { name: 'Chorus', bars: ['A', 'C', 'G', 'D', 'A', 'C', 'G', 'D'] }
    ]
  },
  {
    // Demo delle funzioni iReal: metriche per battuta (N/D) + durate per accordo (*N).
    id: 'time-signatures-demo', title: 'Time Signatures (Demo)', artist: 'ChordLab', year: '', key: 'Emaj7', meter: '4/4',
    capo: 0, tags: ['demo', 'metriche', 'time signatures', 'ireal'],
    sections: [
      { name: 'A', bars: ['Emaj7 G#m7', '6/8 C#m7', 'B7', '3/8 Bb7', '7/8 Ebmaj7 Ebm7 Ab7'] },
      { name: 'B', bars: ['6/8 Dbmaj7', 'Fm7', '12/8 Bbm7', '9/8 Ab7 G7 Ab7 G7', '3/8 Cmaj7'] },
      { name: 'Durate', bars: ['4/4 C*3 G7', 'Am D7', 'F G7 C7 A7', 'Dm7*2 G7'] }
    ]
  }
  ,
  // ── Scaletta Acustica ──────────────────────────────────────────────────
  {
    id: 'war-pigs',
    title: 'War Pigs', artist: 'Black Sabbath', year: '1970', key: 'Em', capo: 0,
    tags: ['acustica', 'hard-rock', '70s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Em', 'Em', 'Em', 'Em'] },
      { name: 'Riff', bars: ['Em', 'Em', 'Em', 'Em'] },
      { name: 'Verse', bars: ['Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em'] },
      { name: 'Bridge', bars: ['Em', 'G', 'A', 'Em'] },
      { name: 'Outro', bars: ['Em', 'G', 'A', 'Em'] }
    ]
  },
  {
    id: 'tush',
    title: 'Tush', artist: 'ZZ Top', year: '1975', key: 'G', capo: 0,
    tags: ['acustica', 'blues-rock', '70s', 'shuffle'],
    sections: [
      { name: 'Intro', bars: ['G', 'G', 'G', 'G'] },
      { name: 'Verse', bars: ['G', 'G', 'G', 'G', 'C', 'C', 'G', 'G', 'D', 'C', 'G', 'D'] },
      { name: 'Solo', bars: ['G', 'G', 'G', 'G', 'C', 'C', 'G', 'G', 'D', 'C', 'G', 'D'] }
    ]
  },
  {
    id: 'shoot-to-thrill',
    title: 'Shoot to Thrill', artist: 'AC/DC', year: '1980', key: 'A', capo: 0,
    tags: ['acustica', 'hard-rock', '80s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['A', 'A', 'A', 'A'] },
      { name: 'Verse', bars: ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'] },
      { name: 'Chorus', bars: ['D', 'A', 'D', 'A', 'E', 'E', 'A', 'A'] }
    ]
  },
  {
    id: 'back-in-black',
    title: 'Back in Black', artist: 'AC/DC', year: '1980', key: 'E', capo: 0,
    tags: ['acustica', 'hard-rock', '80s'],
    sections: [
      { name: 'Intro', bars: ['E', 'D A', 'E', 'D A'] },
      { name: 'Verse', bars: ['E', 'D A', 'E', 'D A', 'E', 'D A', 'E', 'D A'] },
      { name: 'Chorus', bars: ['E', 'D A', 'E', 'D A', 'B', 'A', 'E', 'E'] }
    ]
  },
  {
    id: 'thunderstruck',
    title: 'Thunderstruck', artist: 'AC/DC', year: '1990', key: 'B', capo: 0,
    tags: ['acustica', 'hard-rock', '90s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['B', 'B', 'B', 'B'] },
      { name: 'Riff', bars: ['B', 'B', 'A', 'B'] },
      { name: 'Verse', bars: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'] },
      { name: 'Chorus', bars: ['B', 'A', 'E', 'B', 'B', 'A', 'E', 'B'] }
    ]
  },
  {
    id: 'the-jack',
    title: 'The Jack', artist: 'AC/DC', year: '1975', key: 'A', capo: 0,
    tags: ['acustica', 'blues', '70s', 'slow-blues'],
    sections: [
      { name: 'Intro', bars: ['A', 'A', 'A', 'A'] },
      { name: 'Verse', bars: ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'] },
      { name: 'Solo', bars: ['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'] }
    ]
  },
  {
    id: 'live-wire',
    title: 'Live Wire', artist: 'AC/DC', year: '1975', key: 'E', capo: 0,
    tags: ['acustica', 'hard-rock', '70s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['E', 'E', 'E', 'E'] },
      { name: 'Verse', bars: ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'] },
      { name: 'Chorus', bars: ['A', 'E', 'A', 'E', 'B', 'A', 'E', 'E'] }
    ]
  },
  {
    id: 'hells-bells',
    title: "Hells Bells", artist: 'AC/DC', year: '1980', key: 'Am', capo: 0,
    tags: ['acustica', 'hard-rock', '80s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Am', 'Am', 'Am', 'Am'] },
      { name: 'Verse', bars: ['A', 'A', 'A', 'A', 'G', 'D', 'A', 'A'] },
      { name: 'Chorus', bars: ['D', 'A', 'D', 'A', 'E', 'D', 'A', 'A'] }
    ]
  },
  {
    id: 'fade-to-black',
    title: 'Fade to Black', artist: 'Metallica', year: '1984', key: 'Bm', capo: 0,
    tags: ['acustica', 'metal', '80s', 'arpeggio'],
    sections: [
      { name: 'Intro', bars: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A'] },
      { name: 'Verse', bars: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A'] },
      { name: 'Pre-Chorus', bars: ['G', 'D', 'A', 'Bm'] },
      { name: 'Chorus', bars: ['Bm', 'A', 'G', 'A', 'Bm', 'A', 'G', 'A'] },
      { name: 'Outro', bars: ['Bm', 'A', 'G', 'G'] }
    ]
  },
  {
    id: 'personal-jesus',
    title: 'Personal Jesus', artist: 'Johnny Cash', year: '2002', key: 'Em', capo: 0,
    tags: ['acustica', 'cover', 'blues', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Em', 'Em', 'Em', 'Em'] },
      { name: 'Verse', bars: ['Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em'] },
      { name: 'Chorus', bars: ['C', 'D', 'Em', 'Em', 'C', 'D', 'Em', 'Em'] }
    ]
  },
  {
    id: 'heart-of-gold',
    title: 'Heart of Gold', artist: 'Neil Young', year: '1972', key: 'Em', capo: 0,
    tags: ['acustica', 'folk', '70s', 'classic'],
    sections: [
      { name: 'Intro', bars: ['Em', 'Em', 'Em', 'Em'] },
      { name: 'Verse', bars: ['Em', 'C D', 'G', 'Em', 'Em', 'C D', 'G', 'Em'] },
      { name: 'Chorus', bars: ['G', 'D', 'Em', 'Em', 'G', 'D', 'Em', 'Em'] },
      { name: 'Outro', bars: ['Em', 'C D', 'G', 'Em'] }
    ]
  },
  {
    id: 'sangue-impazzito',
    title: 'Sangue impazzito', artist: 'Timoria', year: '1993', key: 'Am', capo: 0,
    tags: ['acustica', 'rock', 'italiano', '90s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Am', 'F', 'C', 'G'] },
      { name: 'Verse', bars: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'] },
      { name: 'Chorus', bars: ['F', 'C', 'G', 'Am', 'F', 'C', 'G', 'G'] }
    ]
  },
  {
    id: 'creep',
    title: 'Creep', artist: 'Radiohead', year: '1992', key: 'G', capo: 0,
    tags: ['acustica', 'alternative', '90s'],
    sections: [
      { name: 'Intro', bars: ['G', 'G', 'B', 'B', 'C', 'C', 'Cm', 'Cm'] },
      { name: 'Verse', bars: ['G', 'G', 'B', 'B', 'C', 'C', 'Cm', 'Cm'] },
      { name: 'Chorus', bars: ['G', 'G', 'B', 'B', 'C', 'C', 'Cm', 'Cm'] },
      { name: 'Bridge', bars: ['Cm', 'Cm', 'Cm', 'Cm'] }
    ]
  },
  {
    id: 'lo-chiamavano-trinita',
    title: 'Lo chiamavano Trinità', artist: 'Franco Micalizzi', year: '1970', key: 'G', capo: 0,
    tags: ['acustica', 'colonna-sonora', 'italiano', '70s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['G', 'G', 'D', 'D'] },
      { name: 'Verse', bars: ['G', 'G', 'C', 'C', 'G', 'G', 'D', 'G'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'G', 'C', 'G', 'D', 'G'] }
    ]
  },
  {
    id: 'toxicity',
    title: 'Toxicity', artist: 'System of a Down', year: '2001', key: 'C#m', capo: 0,
    tags: ['acustica', 'metal', '2000s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['C#m', 'A', 'E', 'B'] },
      { name: 'Verse', bars: ['C#m', 'C#m', 'A', 'A', 'E', 'E', 'B', 'B'] },
      { name: 'Chorus', bars: ['A', 'E', 'B', 'C#m', 'A', 'E', 'B', 'B'] }
    ]
  },
  {
    id: 'aerials',
    title: 'Aerials', artist: 'System of a Down', year: '2001', key: 'Bm', capo: 0,
    tags: ['acustica', 'metal', '2000s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Bm', 'A', 'G', 'F#'] },
      { name: 'Verse', bars: ['Bm', 'A', 'G', 'F#', 'Bm', 'A', 'G', 'F#'] },
      { name: 'Chorus', bars: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A'] }
    ]
  },
  {
    id: 'chop-suey',
    title: 'Chop Suey!', artist: 'System of a Down', year: '2001', key: 'Em', capo: 0,
    tags: ['acustica', 'metal', '2000s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['Em', 'C', 'G', 'D'] },
      { name: 'Verse', bars: ['Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em', 'Em'] },
      { name: 'Chorus', bars: ['C', 'G', 'D', 'Em', 'C', 'G', 'D', 'Em'] },
      { name: 'Outro', bars: ['C', 'G', 'D', 'Em'] }
    ]
  },
  {
    id: 'babe-im-gonna-leave-you',
    title: "Babe I'm Gonna Leave You", artist: 'Led Zeppelin', year: '1969', key: 'Am', capo: 0,
    tags: ['acustica', 'folk-rock', '60s', 'arpeggio'],
    sections: [
      { name: 'Intro', bars: ['Am', 'Am/G#', 'Am/G', 'D/F#', 'Fmaj7', 'E7'] },
      { name: 'Verse', bars: ['Am', 'Am/G#', 'Am/G', 'D/F#', 'Fmaj7', 'E7'] },
      { name: 'Chorus', bars: ['Am', 'G', 'F', 'E7', 'Am', 'G', 'F', 'E7'] },
      { name: 'Bridge', bars: ['C', 'G', 'Am', 'Am'] }
    ]
  },
  {
    id: 'wasted-years',
    title: 'Wasted Years', artist: 'Iron Maiden', year: '1986', key: 'A', capo: 0,
    tags: ['acustica', 'metal', '80s', 'da-verificare'],
    sections: [
      { name: 'Intro', bars: ['A', 'A', 'A', 'A'] },
      { name: 'Verse', bars: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'A', 'E'] },
      { name: 'Chorus', bars: ['D', 'A', 'E', 'F#m', 'D', 'A', 'E', 'E'] }
    ]
  }
];

// ── Scalette (setlist) ───────────────────────────────────────────────────
// Ogni setlist è un elenco ORDINATO di id presenti in window.SONGS.
// La UI mostra un menu per scegliere la scaletta; "Tutta la libreria" mostra
// tutti i brani. Aggiungere una scaletta = aggiungere un oggetto qui sotto.
window.SETLISTS = [
  {
    id: 'rock-set',
    name: 'Rock Set',
    songs: [
      'white-room', 'heroes', 'wicked-game', 'cocaine', 'bohemian-like-you', 'easy',
      'while-my-guitar-gently-weeps', 'karma-police', 'angie', 'the-man-who-sold-the-world',
      'born-to-run', 'streets-of-love', 'bad-day', 'comfortably-numb', 'time',
      'whiskey-in-the-jar', 'purple-rain', 'perfect-day', 'californication', 'tunnel-of-love',
      'narcotic', 'dont-you', 'mr-crowley', 'leaving-new-york', 'now-and-then', 'one-u2',
      'like-a-rolling-stone'
    ]
  },
  {
    id: 'scaletta-italiana',
    name: 'Scaletta Italiana',
    songs: [
      'la-flaca', 'volevo-essere-un-duro', 'angels', 'prendila-cosi', 'losing-my-religion',
      'il-mare-d-inverno', 'one-u2', 'vivere', '50-mila', 'every-breath-you-take',
      'dimmi-di-si', 'la-mia-signorina', 'laura-non-ce-uomo-ragno', 'figli-delle-stelle',
      'crazy-little-thing-called-love', 'yes-i-know-my-way', 'disperato-erotico-stomp',
      'cera-un-ragazzo', 'amore-disperato', 'ma-che-freddo-fa', 'cuore-matto',
      'tu-vuo-fa-lamericano', 'svalutation', 'baila-morena', 'timmagini', 'mentre-tutto-scorre',
      'wind-of-change', 'do-it-again', 'everything-i-do', 'despacito', 'you-never-can-tell',
      'stella-stai', 'medley-gianna', 'wish-you-were-here', '50-special', 'balliamo-sul-mondo',
      'sweet-child-o-mine'
    ]
  },
  {
    id: 'scaletta-acustica',
    name: 'Scaletta Acustica',
    songs: [
      'war-pigs', 'mr-crowley', 'tush', 'shoot-to-thrill', 'back-in-black',
      'thunderstruck', 'the-jack', 'live-wire', 'hells-bells', 'fade-to-black',
      'whiskey-in-the-jar', 'personal-jesus', 'heart-of-gold', 'sangue-impazzito',
      'creep', 'karma-police', 'lo-chiamavano-trinita', 'toxicity', 'aerials',
      'chop-suey', 'babe-im-gonna-leave-you', 'wasted-years'
    ]
  }
];
