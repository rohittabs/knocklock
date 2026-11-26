"""Makes dist/KnockLock.html: one file to send to other teachers.

It is index.html with the About page built in (it opens inside the file, with its
pictures and fonts included), and without links to the website or to GitHub.
It works with no internet connection.

It also makes dist/About-KnockLock.pdf, the About page as a PDF, which the file
can download too.

Run after python3 build.py:  python3 tools/make-team-copy.py   (needs: pip install pillow pypdf, npm install)
"""
import base64, io, pathlib, re, subprocess
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent


def data_uri(path):
    p = root / path
    if p.suffix == '.png':  # WebP keeps the pictures sharp at a fraction of the size
        buf = io.BytesIO()
        Image.open(p).convert('RGBA').save(buf, 'WEBP', quality=88, method=6)
        return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
    mime = {'.svg': 'image/svg+xml', '.woff2': 'font/woff2'}[p.suffix]
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()


def sub_once(pattern, repl, text, flags=re.S):
    out, n = re.subn(pattern, repl, text, count=1, flags=flags)
    assert n == 1, pattern
    return out


# ---- the About page, made self-contained ----
about = (root / 'about.html').read_text()
about = re.sub(r'<meta (?:property="og|name="twitter)[^>]*>\n', '', about)
about = re.sub(r'<link rel="(?:icon|apple-touch-icon)"[^>]*>\n', '', about)
about = re.sub(r'(src="|url\()(assets/[^")\s]+)', lambda m: m.group(1) + data_uri(m.group(2)), about)
about = sub_once(r'\s*<a class="ghost" href="https://github.com/[^"]*">[^<]*</a>', '', about)
about = about.replace('Save <code>index.html</code> and it works', 'This one file works')
# In the PDF, "Open KnockLock" opens KnockLock.html in the same folder as the PDF. The browser can only
# print absolute links, so it prints a placeholder that is swapped for the relative link afterwards.
OPEN_PLACEHOLDER = 'https://open.knocklock.invalid/'
about_pdf = about.replace('href="./"', f'href="{OPEN_PLACEHOLDER}"')
about_pdf = about_pdf.replace('Or open <b>KnockLock.html</b> in any web browser.', 'Keep this PDF in the same folder as <b>KnockLock.html</b>, or open KnockLock.html in any web browser.')
# Inside the file, "Open KnockLock" closes the About panel instead of going to the website
about = about.replace('href="./"', 'href="#" data-close')
about = sub_once(r'(<a class="open" href="#" data-close>)', r'<a class="open pdf" href="#" data-pdf>Download PDF</a>\1', about)
about = about.replace('</style>', '.bar .open.pdf{background:transparent;color:var(--acc);border:1px solid var(--acc)}.bar .pdf+.open{margin-left:0}\n</style>', 1)
about = about.replace('</body>', '''<script>
  document.querySelectorAll('[data-pdf]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); parent.postMessage('knocklock-about-pdf', '*'); }));
  document.querySelectorAll('[data-close]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); parent.postMessage('knocklock-close-about', '*'); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') parent.postMessage('knocklock-close-about', '*'); });
</script>
</body>''')
assert 'github' not in about.lower() and 'assets/' not in about, 'About page still has outside links'

# ---- the About page as a PDF ----
dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'about.html').write_text(about_pdf)
pdf = dist / 'About-KnockLock.pdf'
subprocess.run(['node', str(root / 'tools' / 'make-about-pdf.mjs'), str(dist / 'about.html'), str(pdf)], check=True, cwd=root)

from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject
writer = PdfWriter(clone_from=PdfReader(pdf))
links = 0
for page in writer.pages:
    for annot in page.get('/Annots') or []:
        action = annot.get_object().get('/A')
        if action is not None and action.get_object().get('/URI') == OPEN_PLACEHOLDER:
            action.get_object()[NameObject('/URI')] = TextStringObject('KnockLock.html')
            links += 1
writer.add_metadata({'/Title': 'About KnockLock', '/Author': 'Rohit Mishra'})
with open(pdf, 'wb') as fh:
    writer.write(fh)
assert links >= 2, 'Open KnockLock links not found in the PDF'
assert b'github' not in pdf.read_bytes().lower(), 'the PDF still mentions GitHub'
pdf_b64 = base64.b64encode(pdf.read_bytes()).decode()

# ---- the app ----
app = (root / 'index.html').read_text()
app = re.sub(r'<meta (?:property="og|name="twitter)[^>]*>\n', '', app)
app = sub_once(r'<a class="about" href="[^"]*"[^>]*>About</a>', '<a class="about" href="#about" id="aboutBtn">About</a>', app)
app = sub_once(r'<p class="links">.*?</p>', '<p class="links"><a href="#about" data-about>About KnockLock</a> · <a href="#about-pdf" data-about-pdf>About KnockLock (PDF)</a> · Free and open source (MIT licence). Notation by VexFlow, PDF by jsPDF.</p>', app)
app = sub_once(r'<script>\n// Installable and offline.*?</script>\n', '', app)
panel = '''<dialog id="aboutDlg" aria-label="About KnockLock" style="width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#f4f5f7">
<iframe id="aboutFrame" title="About KnockLock" style="width:100%;height:100%;border:0;display:block"></iframe>
</dialog>
<script type="text/plain" id="aboutSrc">''' + about.replace('</script', '<\\/script') + '''</script>
<script type="text/plain" id="aboutPdf">''' + pdf_b64 + '''</script>
<script>
// About opens inside this file, so it works with no internet connection.
(function () {
  const dlg = document.getElementById('aboutDlg'), frame = document.getElementById('aboutFrame');
  function open(e) {
    if (e) e.preventDefault();
    if (!frame.srcdoc) frame.srcdoc = document.getElementById('aboutSrc').textContent.replace(/<\\\\\\/script/g, '</script');
    dlg.showModal();
    frame.focus();
  }
  document.querySelectorAll('#aboutBtn,[data-about]').forEach((a) => a.addEventListener('click', open));
  // The About page as a PDF, kept inside this file
  function aboutPdf(e) {
    if (e) e.preventDefault();
    const bin = atob(document.getElementById('aboutPdf').textContent.trim()), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    a.download = 'About KnockLock.pdf';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  document.querySelectorAll('[data-about-pdf]').forEach((a) => a.addEventListener('click', aboutPdf));
  addEventListener('message', (e) => { if (e.data === 'knocklock-close-about') dlg.close(); if (e.data === 'knocklock-about-pdf') aboutPdf(); });
})();
</script>
</body>'''
app = sub_once(r'</body>', lambda m: panel, app)

out = dist / 'KnockLock.html'
out.write_text(app)
visible = re.sub(r'/\*.*?\*/', '', app, flags=re.S)  # library licence comments keep their credits
print(out.relative_to(root), len(app), 'bytes;', 'github links left outside licence notices:', len(re.findall(r'https?://[^"\'\s]*github', visible)))
