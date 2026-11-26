<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <img src="assets/logo.svg" alt="KnockLock" width="380">
  </picture>
</p>

<p align="center"><strong>Rhythm passwords for your studio door.</strong><br>
Generate a 4 bar rhythm, print it as a PDF poster, and your student knocks it to come in.</p>

<p align="center"><a href="https://rohittabs.github.io/knocklock/"><strong>Open KnockLock</strong></a> · <a href="https://rohittabs.github.io/knocklock/about.html">Everything it does</a> · <a href="https://github.com/rohittabs/knocklock/blob/main/index.html">Offline file</a></p>

---

KnockLock runs in the browser. There is nothing to install and no account to make. It is a single file that works without an internet connection, and nothing is sent to a server.

## How it works

1. Choose the note values your student can read.
2. Press **New Rhythm** until you like the rhythm, then **Download PDF** and print it at 100% size.
3. Stick the poster on your studio door.
4. Before coming in, your student figures out the rhythm and knocks it on the door, at a tempo of their choice.
5. They get three attempts. After three incorrect ones, the penalty on the poster applies.

## What it can do

- **Choose the note values.** Whole, half, dotted half, quarter and dotted quarter notes; eighths, 16ths and 32nds; dotted rhythms and syncopation; eighth, quarter and 16th note triplets; rests from the whole rest to the 16th rest; and ties. Beginner, Intermediate, Advanced and All presets.
- **Time signatures.** 2/4, 3/4, 4/4, 6/8, 7/8 (grouped 2+2+3) and 12/8, with note groups made for compound time.
- **Swing.** Straight, swing 8ths or swing 16ths, with the standard swing marking on the poster.
- **Proper engraving.** Notes are beamed by the beat, a tie is used instead of a note that would hide the middle of the bar, half rests appear only where they belong, and ties can cross the barline.
- **Counting under the notes.** Counted 1 e + a, with triplets as 1 T L. Beats that are held or rested are shown in brackets. Or switch the counting off.
- **Always four lines.** One bar per line, so the poster reads from across the room.
- **Penalties for one-to-one lessons.** 19 to choose from, or write your own. The default is 5 minutes of extra rhythm practice at the start of the lesson.
- **Your poster, your look.** A4 or Letter, portrait or landscape. Black and white, navy, charcoal and gold, burgundy or forest green. Your own title and studio name.
- **Password number.** Every rhythm has a 4-digit number. Type it into **Recall a rhythm** to get the same rhythm back.
- **Works offline.** Save `index.html` and share it by email, chat or a USB stick. On the website, KnockLock can also be installed as an app from the browser menu.

## Run it on your own computer

Open `index.html` in any web browser. That is all.

To try the website version (with the app install), run a local server with [Node.js](https://nodejs.org/) 18 or newer:

```sh
npm start
```

Then open <http://localhost:8080>.

## Publish it on GitHub Pages

The repository includes a workflow that publishes the website every time `main` changes.

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. (**Deploy from a branch**, with `main` and `/ (root)`, works too.)
3. Push a commit (or run the **Deploy to GitHub Pages** workflow from the **Actions** tab). The site appears at `https://rohittabs.github.io/knocklock/`.

## Change it

`index.html` is built from `src/app.html`, with the fonts and the notation and PDF libraries put inside it so it works offline.

```sh
npm install         # VexFlow, jsPDF and Playwright
python3 build.py    # src/app.html -> index.html
npm test            # rhythm rules, the page, and the PDF download (run `npx playwright install chromium` once first)
npm run assets      # redraw the icons, the About page pictures and the social preview
```

The tests generate thousands of rhythms in every time signature and check that each bar is full, every note is placed and beamed by the rules, ties are valid, and the poster draws in every paper size and colour. They also download the PDF with the internet switched off.

## Project layout

```
index.html            the app: one file with everything built in (generated, do not edit)
src/app.html          the app's source: rhythm rules, notation, poster and PDF
src/fonts.css         the fonts, embedded into index.html
about.html            everything KnockLock does, as a page of slides
build.py              builds index.html from src/
manifest.webmanifest  app name and icons, for installing from the browser
sw.js                 lets the website open offline after the first visit
assets/               logo, app icons, fonts, About page pictures, social preview
tests/                rhythm, page and file tests
tools/                local server, logo, icon and picture generators
```

## License

[MIT](LICENSE).

KnockLock uses [VexFlow](https://github.com/0xfe/vexflow) 4.2.5 for the music notation and [jsPDF](https://github.com/parallax/jsPDF) 4.2.1 for the PDF, both under the MIT licence. The fonts are [Inter](https://github.com/rsms/inter) and [Playfair Display](https://github.com/clauseggers/Playfair-Display), used under the [SIL Open Font License 1.1](assets/fonts/).
