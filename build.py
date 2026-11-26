"""Build index.html from src/app.html by inlining fonts and libraries.

Needs: npm install (vexflow and jspdf are listed in package.json).
Run:   python3 build.py
"""
import pathlib

root = pathlib.Path(__file__).parent
src = (root / 'src' / 'app.html').read_text()
vexflow = (root / 'node_modules/vexflow/build/cjs/vexflow-bravura.js').read_text()
jspdf = (root / 'node_modules/jspdf/dist/jspdf.umd.min.js').read_text()
fonts = (root / 'src' / 'fonts.css').read_text()

out = src.replace('/*@@FONTS@@*/', fonts, 1)
out = out.replace('/*@@VEXFLOW@@*/', vexflow.replace('</script', '<\\/script'), 1)
out = out.replace('/*@@JSPDF@@*/', jspdf.replace('</script', '<\\/script'), 1)
(root / 'index.html').write_text(out)
print('index.html', len(out), 'bytes')
