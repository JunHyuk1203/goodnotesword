import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Insert closing div before LIBRARY SECTION
if '</div> <!-- /EXTRACT SECTION -->' not in html:
    html = html.replace('<!-- LIBRARY SECTION -->', '</div> <!-- /EXTRACT SECTION -->\n\n    <!-- LIBRARY SECTION -->')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("done")
