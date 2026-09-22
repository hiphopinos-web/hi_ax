#!/usr/bin/env python3
"""Dependency-free guardrails. Not a complete CSS/JS parser or visual test."""
from pathlib import Path
import argparse, hashlib, json, re, sys
BASE=Path(__file__).resolve().parents[1]
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--ui-root',type=Path,required=True);args=ap.parse_args()
 errors=[];warnings=[]
 lock=json.loads((BASE/'lock.json').read_text())
 for name,wanted in lock['sha256'].items():
  f=BASE/name
  if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=wanted:errors.append('LOCK: '+name)
 root=args.ui_root.resolve()
 if not root.is_dir(): errors.append('UI root does not exist: '+str(root))
 allowed=set(json.loads((BASE/'design-system/allowed-classes.json').read_text()))
 count=0
 for f in root.rglob('*') if root.is_dir() else []:
  if not f.is_file() or any(x in f.parts for x in ['node_modules','.git','dist','build']):continue
  if f.suffix.lower() in ['.css','.scss','.sass','.less']:
   errors.append(str(f)+': page-local stylesheet is not allowed');continue
  if f.suffix.lower() not in ['.html','.jsx','.tsx','.js','.ts','.vue','.svelte']:continue
  count+=1;t=f.read_text(errors='replace')
  patterns=[(r'\bstyle\s*=','inline style'),(r'<style\b','style tag'),(r'\b(?:styled|css)\s*[.(<`]|styled-components|@emotion/','CSS-in-JS'),(r'#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(','raw color'),(r'\.style\b|setProperty\s*\(|insertRule\s*\(|adoptedStyleSheets','runtime style mutation')]
  for pat,label in patterns:
   for m in re.finditer(pat,t): errors.append(f'{f}:{t[:m.start()].count(chr(10))+1}: {label}')
  for m in re.finditer(r'\b(?:class|className)\s*=\s*(["\x27])([^"\x27]*)\1',t):
   for cl in m.group(2).split():
    if cl not in allowed:errors.append(f'{f}: unapproved class {cl}')
  if re.search(r'\b(?:className|class)\s*=\s*\{|:class\s*=|classList\b',t):warnings.append(str(f)+': dynamic class values need manual review')
  for m in re.finditer(r'(?:href|from)\s*=*\s*["\x27]([^"\x27]+\.css)["\x27]',t):
   if m.group(1).split('/')[-1] not in ['tokens.css','components.css']:errors.append(str(f)+': external CSS '+m.group(1))
 if count==0:errors.append('No UI source files were scanned; choose the actual UI directory.')
 for x in errors:print('FAIL',x)
 for x in warnings:print('REVIEW',x)
 print(f'{"FAIL" if errors else "PASS"}: {count} source files, {len(errors)} violations, {len(warnings)} review items')
 return 1 if errors else 0
if __name__=='__main__':sys.exit(main())
