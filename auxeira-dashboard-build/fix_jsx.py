import re
import glob

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix 1: Remove duplicate Radar import
    # Find the import line and remove duplicate Radar
    content = re.sub(
        r'(RadarChart[^}]*?PolarRadiusAxis,)\s*Radar,\s*(.*?Radar)',
        r'\1 \2',
        content
    )
    
    # Fix 2: Escape < and > in JSX text content (option values, spans, etc)
    # Only in specific contexts where they appear as text
    
    # Fix <18mo and >30% in option text
    content = re.sub(r'Runway <(\d+)mo\)', r'Runway &lt;\1mo)', content)
    content = re.sub(r'IRR >(\d+)%\)', r'IRR &gt;\1%)', content)
    content = re.sub(r'\(>(\$\d+[MBK])\)', r'(&gt;\1)', content)
    
    # Fix in span text content
    content = re.sub(r'<span>(\d+)%</span>\s*<span>(\d+)%</span>', 
                     lambda m: f'<span>{m.group(1)}%</span>\n                    <span>&gt;{m.group(2)}%</span>' 
                     if int(m.group(2)) > int(m.group(1)) else m.group(0),
                     content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Fixed {filepath}")
        return True
    return False

# Fix all JSX files
files_fixed = 0
for filepath in glob.glob('src/dashboards/*.jsx'):
    if fix_file(filepath):
        files_fixed += 1

print(f"\n✓ Fixed {files_fixed} files")
