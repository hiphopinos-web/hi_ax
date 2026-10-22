# AXF CONTROL(관리 콘솔) 홈 화면 아이콘 생성기 · 261022
#
#   python make_icons.py <01_Me_to_WE.svg 경로>
#     원본 = 홍보부 `AXF Design Data/03. app/02. graphic/01_Me_to_WE.svg`(참가자 앱 아이콘 build-icons.py 와 같은 원본)
#     원 좌표 · 반지름은 원본 그대로(다시 그리지 않는다 · design.md 「Me to We 심볼」) · 위에 단순 도형 왕관 하나를 얹는다.
#     바탕 = 콘솔 네이비 #00205B(참가자 앱 = 흰 바탕이라 한눈에 다르다)
#   시안 A(적용) = 심볼 원본 3색 + 흰 왕관 · 시안 B(보관) = 흰 심볼(바깥 원만) + 주황 왕관(O100 #FF7E31)
#   만드는 것: adm-a.svg · adm-b.svg · adm-192.png · adm-512.png · adm-maskable-512.png · adm-apple-180.png(시안 A) · adm-b-512.png(시안 B 비교용)
#   maskable = 가운데 80% 원(반지름 40%) 안에 왕관 + 심볼 전부.
import os
import re
import sys

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
NAVY = "#00205B"
O100 = "#FF7E31"
WHITE = "#FFFFFF"
SS = 4


def load(svg):
    s = open(svg, encoding="utf-8").read()
    groups = []
    for gid, fill, body in re.findall(r'<g id="(\w+)" fill="(#[0-9A-Fa-f]{6})">(.*?)</g>', s, re.S):
        cs = [(float(a), float(b), float(c)) for a, b, c in re.findall(r'cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', body)]
        groups.append((gid, fill, cs))
    outer = groups[0][2]
    bb = (min(c[0] - c[2] for c in outer), min(c[1] - c[2] for c in outer), max(c[0] + c[2] for c in outer), max(c[1] + c[2] for c in outer))
    return groups, bb


def crown(cx, top, w):
    """왕관 · 단순 도형 하나(뾰족 셋 + 띠) + 끝 구슬 셋 · 높이 = 폭 0.62"""
    h = w * 0.62
    x0, x1 = cx - w / 2, cx + w / 2
    yb = top + h                                   # 띠 아래
    yt = top + h * 0.16                            # 가운데 뾰족 끝
    ys = top + h * 0.30                            # 양쪽 뾰족 끝
    yv = top + h * 0.62                            # 골
    yband = top + h * 0.80                         # 띠 위
    poly = [(x0, ys), (x0 + w * 0.27, yv), (cx, yt), (x1 - w * 0.27, yv), (x1, ys), (x1 - w * 0.06, yband), (x1 - w * 0.06, yb), (x0 + w * 0.06, yb), (x0 + w * 0.06, yband)]
    r = w * 0.075
    balls = [(x0, ys - r * 0.55, r), (cx, yt - r * 0.55, r), (x1, ys - r * 0.55, r)]
    return poly, balls


def layout(bb, size, k_content):
    """캔버스 size 에서 왕관 + 간격 + 심볼 묶음의 높이가 size * k_content · 가운데"""
    bw, bh = bb[2] - bb[0], bb[3] - bb[1]
    cw = bw * 0.92                                  # 왕관 폭 = 심볼 폭의 92%(48px 에서도 읽히게)
    ch = cw * 0.62 + cw * 0.075 * 1.55              # 왕관 높이(구슬 포함)
    gap = bh * 0.035
    tot = ch + gap + bh                             # 원본 단위의 묶음 높이
    k = size * k_content / tot
    ox = size / 2 - (bb[0] + bw / 2) * k
    top = (size - tot * k) / 2                      # 묶음 위
    ctop = top + cw * 0.075 * 1.55 * k              # 왕관 몸체 위(구슬 위 여백 뺌)
    sy = top + (ch + gap) * k                       # 심볼 위
    oy = sy - bb[1] * k
    return k, ox, oy, size / 2, ctop, cw * k


def parts(groups, bb, size, kc, variant, px=1):
    k, ox, oy, ccx, ctop, cwk = layout(bb, size, kc)
    circles = []
    for gid, fill, cs in groups:
        if variant == "b":
            if gid != "outer":
                continue
            fill = WHITE
        for cx, cy, r in cs:
            rr = r * k
            if rr < 0.4 * px:                      # 원본에서 꺼진 핵(반지름 0.05 안팎)은 넣지 않는다(build-icons.py 와 같은 기준 · 0.4 화소)
                continue
            circles.append((cx * k + ox, cy * k + oy, rr, fill))
    poly, balls = crown(ccx, ctop, cwk)
    cfill = WHITE if variant == "a" else O100
    return circles, poly, balls, cfill


def svg(groups, bb, variant, size=512, kc=0.78):
    circles, poly, balls, cfill = parts(groups, bb, size, kc, variant)
    f = lambda v: ("%.2f" % v).rstrip("0").rstrip(".")
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" role="img" aria-label="AXF CONTROL">' % (size, size, size, size),
           '<rect width="%d" height="%d" fill="%s"/>' % (size, size, NAVY)]
    by = {}
    for x, y, r, c in circles:
        by.setdefault(c, []).append('<circle cx="%s" cy="%s" r="%s"/>' % (f(x), f(y), f(r)))
    for c, items in by.items():
        out.append('<g fill="%s">%s</g>' % (c, "".join(items)))
    out.append('<g fill="%s"><path d="M%s Z"/>%s</g>' % (cfill, " L".join("%s %s" % (f(x), f(y)) for x, y in poly), "".join('<circle cx="%s" cy="%s" r="%s"/>' % (f(x), f(y), f(r)) for x, y, r in balls)))
    out.append("</svg>")
    return "".join(out)


def png(groups, bb, variant, size, kc):
    S = size * SS
    circles, poly, balls, cfill = parts(groups, bb, S, kc, variant, SS)
    im = Image.new("RGB", (S, S), NAVY)
    d = ImageDraw.Draw(im)
    for x, y, r, c in circles:
        d.ellipse((x - r, y - r, x + r, y + r), fill=c)
    d.polygon(poly, fill=cfill)
    for x, y, r in balls:
        d.ellipse((x - r, y - r, x + r, y + r), fill=cfill)
    return im.resize((size, size), Image.LANCZOS)


def save_txt(p, s):
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="") as fh:
        fh.write(s)
    os.replace(tmp, p)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else ""
    assert src and os.path.exists(src), "원본 01_Me_to_WE.svg 경로를 주세요"
    groups, bb = load(src)
    save_txt(os.path.join(HERE, "adm-a.svg"), svg(groups, bb, "a"))
    save_txt(os.path.join(HERE, "adm-b.svg"), svg(groups, bb, "b"))
    specs = [("adm-512.png", "a", 512, 0.78), ("adm-192.png", "a", 192, 0.78), ("adm-apple-180.png", "a", 180, 0.78),
             ("adm-maskable-512.png", "a", 512, 0.62), ("adm-b-512.png", "b", 512, 0.78)]
    for name, v, size, kc in specs:
        p = os.path.join(HERE, name)
        png(groups, bb, v, size, kc).save(p + ".tmp.png", optimize=True)
        os.replace(p + ".tmp.png", p)
        print("생성: %s (%dpx · 묶음 높이 %d%%)" % (name, size, kc * 100))


if __name__ == "__main__":
    main()
