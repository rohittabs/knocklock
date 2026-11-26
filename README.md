# KnockLock

Rhythm passwords for a music studio door.

KnockLock makes a 4 bar rhythm that a student has to knock on the door before coming in. You choose the note values the student can read, press **New Rhythm**, and download a print-ready PDF poster to stick on the door. After 3 wrong attempts, the penalty printed on the poster applies.

## Use it

Open `index.html` in any web browser. It is a single file with everything built in, so it works offline and can be shared by email, chat or a USB stick.

## Features

- Note values, note groups, rests, triplets (eighth, quarter and 16th), 32nds and ties, with Beginner, Intermediate, Advanced and All presets
- Time signatures 2/4, 3/4, 4/4, 6/8, 7/8 (2+2+3) and 12/8, plus swing 8ths and swing 16ths
- Engraving rules: beaming by beat group, and ties instead of notes that hide the beat
- Counting under the notes (1 e + a, triplets as 1 T L)
- Always 4 lines, one bar per line
- Penalty picker made for one-to-one lessons, or write your own
- A4 or Letter, portrait or landscape, black and white or four colour themes
- A 4-digit password number recreates the same rhythm later

## Build from source

`index.html` is generated from `src/app.html`.

```
npm install
python3 build.py
```

## Credits

- [VexFlow](https://github.com/0xfe/vexflow) 4.2.5 for music notation (MIT licence)
- [jsPDF](https://github.com/parallax/jsPDF) 4.2.1 for the PDF export (MIT licence)
- [Inter](https://rsms.me/inter/) and [Playfair Display](https://github.com/clauseggers/Playfair) fonts (SIL Open Font Licence)
