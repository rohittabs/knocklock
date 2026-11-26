"""Makes dist/KnockLock.html: one file to send to other teachers.

It is index.html with the About page built in (it opens inside the file, with its
pictures and fonts included), and without links to the website or to GitHub.
It works with no internet connection.

Run after python3 build.py:  python3 tools/make-team-copy.py   (needs: pip install pillow)
"""
import base64, io, pathlib, re
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
# "Open KnockLock" closes the About panel instead of going to the website
about = about.replace('href="./"', 'href="#" data-close')
about = sub_once(r'\s*<a class="ghost" href="https://github.com/[^"]*">[^<]*</a>', '', about)
about = about.replace('Save <code>index.html</code> and it works', 'This one file works')
about = about.replace('</body>', '''<script>
  document.querySelectorAll('[data-close]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); parent.postMessage('knocklock-close-about', '*'); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') parent.postMessage('knocklock-close-about', '*'); });
</script>
</body>''')
assert 'github' not in about.lower() and 'assets/' not in about, 'About page still has outside links'

# ---- the app ----
app = (root / 'index.html').read_text()
app = re.sub(r'<meta (?:property="og|name="twitter)[^>]*>\n', '', app)
app = sub_once(r'<a class="about" href="[^"]*"[^>]*>About</a>', '<a class="about" href="#about" id="aboutBtn">About</a>', app)
app = sub_once(r'<footer>.*?</footer>', '<footer><a href="#about" data-about>About KnockLock</a> · Free and open source (MIT licence). Notation by VexFlow, PDF by jsPDF.</footer>', app)
app = sub_once(r'<script>\n// Installable and offline.*?</script>\n', '', app)
panel = '''<dialog id="aboutDlg" aria-label="About KnockLock" style="width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#f4f5f7">
<iframe id="aboutFrame" title="About KnockLock" style="width:100%;height:100%;border:0;display:block"></iframe>
</dialog>
<script type="text/plain" id="aboutSrc">''' + about.replace('</script', '<\\/script') + '''</script>
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
  addEventListener('message', (e) => { if (e.data === 'knocklock-close-about') dlg.close(); });
})();
</script>
</body>'''
app = sub_once(r'</body>', lambda m: panel, app)

out = root / 'dist' / 'KnockLock.html'
out.parent.mkdir(exist_ok=True)
out.write_text(app)
visible = re.sub(r'/\*.*?\*/', '', app, flags=re.S)  # library licence comments keep their credits
print(out.relative_to(root), len(app), 'bytes;', 'github links left outside licence notices:', len(re.findall(r'https?://[^"\'\s]*github', visible)))
