# Add initSpiral export to spiral.js — anchor on exact closing line

with open('js/app/views/spiral.js','r',encoding='utf-8') as f:
    content = f.read()

if 'export function initSpiral' in content:
    print('already has initSpiral export')
else:
    # Append to end of file
    content = content.rstrip() + (
        "\n\nexport function initSpiral() {\n"
        "  const container = document.getElementById('view-spiral');\n"
        "  if (!container) return;\n"
        "  SpiralView.mount(container);\n"
        "}\n"
    )
    with open('js/app/views/spiral.js','w',encoding='utf-8') as f:
        f.write(content)
    print('appended initSpiral export')
