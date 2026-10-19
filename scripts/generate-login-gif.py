#!/usr/bin/env python3
"""Genera public/assets/images/login-chef-animated.gif desde login-chef.jpg.

GIF de fondo de login: 24 frames @ 15 FPS (bucle perfecto de 1.6 s).
Solo se anima el fuego (mapa de desplazamiento Perlin con advección vertical),
las reflexiones doradas de la mesada (sincronizadas con el parpadeo) y
chispas con easing exponencial. Chef, wok y fondo quedan estáticos.

Bucle deliver-and-verify: render determinista -> codificar -> verificar
(tamaño <2MB, 24 frames, 1600 ms, frame 24 == frame 0, salto de bucle en
los rangos) -> contact sheet visual.

Uso:  python scripts/generate-login-gif.py
"""

import math
import os
import sys
import time

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "assets", "images", "login-chef.jpg")
DST = os.path.join(ROOT, "public", "assets", "images", "login-chef-animated.gif")
TMP = os.environ.get("TEMP", r"C:\Users\jadies\AppData\Local\Temp\opencode")

N_FRAMES = 24
LOOP_MS = 1600  # 24 frames / 15 fps
# GIF solo admite centisegundos: 16 frames de 70 ms + 8 de 60 ms = 1600 ms
DURATIONS = [60 if i % 3 == 0 else 70 for i in range(N_FRAMES)]

# --- regiones (coords. en la imagen 1408x768) -------------------------------
ZONE_A = (655, 56, 1030, 510)    # llama principal (pluma)
ZONE_B = (690, 450, 900, 545)    # llama del quemador bajo el wok
FEATHER_A = (46, 42, 42, 44)     # feather (izq, arr, der, abajo) de ZONE_A
FEATHER_B = (30, 26, 36, 30)
# cajas congeladas: chef, utensilios y utensilios de la mesada
FREEZE = [
    (624, 280, 768, 472, 14),    # manos + mango del wok
    (748, 348, 822, 420, 12),    # cabeza de la espátula
    (628, 392, 966, 498, 14),    # wok + comida dentro del wok
    (958, 412, 1062, 566, 14),   # botellas
    (878, 484, 974, 568, 12),    # olla/tapa junto al quemador
]
REFL_BAND = (596, 532, 1074, 610, 26)  # mesada (reflexiones doradas)
REFL_SRC = (818.0, 556.0)              # centro de luz (quemador)

# --- ruido Perlin 4D con bucle perfecto -------------------------------------
L_PERIOD = 512.0                       # período vertical en px (advección)
V_SCROLL = L_PERIOD / N_FRAMES         # px por frame -> 24*V = L_PERIOD
CELLS = (128.0, 64.0, 32.0)            # octavas
OCT_W = (0.55, 0.30, 0.15)
R_TIME = 1.9                           # radio del círculo temporal (lattice)

SPARKS = 44
SEED = 1234


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def feather_rect(shape, box, feather):
    """Perfil 0..1 con bordes suavizados. feather=(f_izq,f_arr,f_der,f_abjo)."""
    x0, y0, x1, y1 = box
    fi, fa, fd, fb = feather
    h, w = shape
    yy = np.arange(h, dtype=np.float32)[:, None]
    xx = np.arange(w, dtype=np.float32)[None, :]
    mx = smoothstep(x0, x0 + fi, xx) * (1.0 - smoothstep(x1 - fd, x1, xx))
    my = smoothstep(y0, y0 + fa, yy) * (1.0 - smoothstep(y1 - fb, y1, yy))
    return mx * my


def build_masks(base):
    lum = 0.299 * base[..., 0] + 0.587 * base[..., 1] + 0.114 * base[..., 2]
    warm = base[..., 0] - base[..., 2]
    content = smoothstep(85.0, 145.0, lum) * np.clip(warm / 35.0, 0.0, 1.0)

    zone_a = feather_rect(base.shape[:2], ZONE_A, FEATHER_A)
    zone_b = feather_rect(base.shape[:2], ZONE_B, FEATHER_B)
    fire = content * np.clip(zone_a + zone_b, 0.0, 1.0)
    for bx0, by0, bx1, by1, bf in FREEZE:
        fire *= 1.0 - feather_rect(base.shape[:2], (bx0, by0, bx1, by1), (bf, bf, bf, bf))
    fire = np.clip(fire, 0.0, 1.0)

    rx0, ry0, rx1, ry1, rf = REFL_BAND
    refl_c = smoothstep(40.0, 90.0, lum) * np.clip(warm / 30.0, 0.0, 1.0)
    refl = refl_c * feather_rect(base.shape[:2], (rx0, ry0, rx1, ry1), (rf, rf, rf, rf))

    gx = (np.arange(base.shape[1], dtype=np.float32) - REFL_SRC[0]) / 235.0
    gy = (np.arange(base.shape[0], dtype=np.float32) - REFL_SRC[1]) / 115.0
    glow = np.exp(-(gx[None, :] ** 2 + gy[:, None] ** 2))
    return fire.astype(np.float32), refl.astype(np.float32), glow.astype(np.float32)


def _hash(i, j, k, l, seed):
    h = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791) ^ (l * 2971215073)
    h = h ^ (seed * 374761393)
    return np.mod(h, 1024).astype(np.float32) * (1.0 / 1024.0)


def _fade(t):
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


def value_noise4(X, Y, C, S, wx, wy, seed):
    """Ruido de valor 4D; eje Y con módulo wy => bucle vertical exacto."""
    x0, y0, c0, s0 = (np.floor(v) for v in (X, Y, C, S))
    ux, uy, uc, us = (_fade(v - np.floor(v)) for v in (X, Y, C, S))
    xi = np.mod(x0.astype(np.int64), wx)
    yi = np.mod(y0.astype(np.int64), wy)
    ci = np.mod(c0.astype(np.int64), 64)
    si = np.mod(s0.astype(np.int64), 64)

    def corner(di, dj, dk, dl):
        return _hash(np.mod(xi + di, wx), np.mod(yi + dj, wy),
                     np.mod(ci + dk, 64), np.mod(si + dl, 64), seed)

    def lerp(a, b, t):
        return a + (b - a) * t

    v000 = corner(0, 0, 0, 0); v100 = corner(1, 0, 0, 0)
    v010 = corner(0, 1, 0, 0); v110 = corner(1, 1, 0, 0)
    v001 = corner(0, 0, 1, 0); v101 = corner(1, 0, 1, 0)
    v011 = corner(0, 1, 1, 0); v111 = corner(1, 1, 1, 0)
    v000_ = corner(0, 0, 0, 1); v100_ = corner(1, 0, 0, 1)
    v010_ = corner(0, 1, 0, 1); v110_ = corner(1, 1, 0, 1)
    v001_ = corner(0, 0, 1, 1); v101_ = corner(1, 0, 1, 1)
    v011_ = corner(0, 1, 1, 1); v111_ = corner(1, 1, 1, 1)

    c00 = lerp(lerp(v000, v100, ux), lerp(v010, v110, ux), uy)
    c10 = lerp(lerp(v001, v101, ux), lerp(v011, v111, ux), uy)
    c01 = lerp(lerp(v000_, v100_, ux), lerp(v010_, v110_, ux), uy)
    c11 = lerp(lerp(v001_, v101_, ux), lerp(v011_, v111_, ux), uy)
    c0 = lerp(c00, c10, uc)
    c1 = lerp(c01, c11, uc)
    return lerp(c0, c1, us) * 2.0 - 1.0


def noise_fields(f, region):
    """dx, dy (px) a resolución media sobre la región; advección vertical."""
    rx0, ry0, rx1, ry1 = region
    w, h = rx1 - rx0, ry1 - ry0
    cw, ch = (w + 1) // 2, (h + 1) // 2
    xs = (rx0 + 0.5 + 2.0 * np.arange(cw, dtype=np.float32))[None, :]
    ys = (ry0 + 0.5 + 2.0 * np.arange(ch, dtype=np.float32))[:, None]
    theta = 2.0 * math.pi * f / N_FRAMES
    adv = f * V_SCROLL
    dx = np.zeros((ch, cw), np.float32)
    dy = np.zeros((ch, cw), np.float32)
    for o, (cell, weight) in enumerate(zip(CELLS, OCT_W)):
        ph = theta + 0.9 * o
        C = R_TIME * math.cos(ph)
        S = R_TIME * math.sin(ph)
        wx = 64
        wy = int(round(L_PERIOD / cell))
        X = xs / cell + 17.0 * o
        Y = (ys + adv) / cell + 31.0 * o
        dx += weight * value_noise4(X + 0.0, Y, C, S, wx, wy, SEED + o)
        dy += weight * value_noise4(X + 53.7, Y, C, S, wx, wy, SEED + 101 + o)
    dx = np.asarray(Image.fromarray(dx, "F").resize((w, h), Image.BICUBIC))
    dy = np.asarray(Image.fromarray(dy, "F").resize((w, h), Image.BICUBIC))
    return dx, dy


def bilinear(img, xs, ys):
    h, w = img.shape[:2]
    xs = np.clip(xs, 0.0, w - 1.0001)
    ys = np.clip(ys, 0.0, h - 1.0001)
    x0 = np.floor(xs).astype(np.int64)
    y0 = np.floor(ys).astype(np.int64)
    tx = (xs - x0).astype(np.float32)[..., None]
    ty = (ys - y0).astype(np.float32)[..., None]
    x1 = np.minimum(x0 + 1, w - 1)
    y1 = np.minimum(y0 + 1, h - 1)
    return (img[y0, x0] * ((1 - tx) * (1 - ty)) + img[y0, x1] * (tx * (1 - ty))
            + img[y1, x0] * ((1 - tx) * ty) + img[y1, x1] * (tx * ty))


def init_sparks():
    rng = np.random.default_rng(SEED)
    return {
        "x0": rng.uniform(748, 952, SPARKS),
        "y0": rng.uniform(430, 515, SPARKS),
        "H": rng.uniform(150, 370, SPARKS),
        "drift": rng.normal(0, 30, SPARKS),
        "sway": rng.uniform(6, 26, SPARKS),
        "sfreq": rng.integers(1, 4, SPARKS),
        "k": rng.uniform(2.4, 4.2, SPARKS),
        "amp": rng.uniform(0.55, 1.0, SPARKS),
        "ffreq": rng.integers(1, 4, SPARKS),
        "phi": rng.uniform(0, 1, SPARKS),
        "phi2": rng.uniform(0, 2 * math.pi, SPARKS),
        "sigma": rng.uniform(2.6, 4.4, SPARKS),
        "gold": (rng.random(SPARKS) < 0.55),
    }


def draw_sparks(out, f, sp):
    if sp["phi"].size == 0:
        return out
    gold1 = np.array([255, 159, 28], np.float32)   # #FF9F1C
    gold2 = np.array([255, 209, 102], np.float32)  # #FFD166
    t = f / N_FRAMES
    H, W = out.shape[:2]
    for i in range(SPARKS):
        a = (t + sp["phi"][i]) % 1.0
        k = sp["k"][i]
        e = (1.0 - math.exp(-k * a)) / (1.0 - math.exp(-k))  # easing exponencial
        rise = smoothstep(0.0, 0.05, a)
        decay = (1.0 - e) ** 1.3
        tw = 0.72 + 0.28 * math.sin(2 * math.pi * sp["ffreq"][i] * a + sp["phi2"][i])
        alpha = sp["amp"][i] * rise * decay * tw
        if alpha <= 0.004:
            continue
        y = sp["y0"][i] - min(sp["H"][i], sp["y0"][i] - 92.0) * e
        x = (sp["x0"][i] + sp["drift"][i] * a
             + sp["sway"][i] * math.sin(2 * math.pi * sp["sfreq"][i] * a + sp["phi2"][i]) * e)
        sg = sp["sigma"][i]
        r = int(3.2 * sg) + 1
        x0, x1 = int(x) - r, int(x) + r + 1
        y0, y1 = int(y) - r, int(y) + r + 1
        if x1 <= 0 or y1 <= 0 or x0 >= W or y0 >= H:
            continue
        gx0, gy0 = max(x0, 0), max(y0, 0)
        gx1, gy1 = min(x1, W), min(y1, H)
        yy, xx = np.mgrid[gy0:gy1, gx0:gx1].astype(np.float32)
        d2 = (xx - x) ** 2 + (yy - y) ** 2
        glow = np.exp(-d2 / (2 * sg * sg))
        core = np.exp(-d2 / (2 * (0.45 * sg) ** 2))
        field = (0.50 * glow + 0.85 * core) * alpha
        color = gold1 if sp["gold"][i] else gold2
        out[gy0:gy1, gx0:gx1] += field[..., None] * color
    return out


def render_frame(f, base, fire, refl, glow, sp, region):
    theta = 2.0 * math.pi * f / N_FRAMES
    out = base.astype(np.float32)

    rx0, ry0, rx1, ry1 = region
    sub = out[ry0:ry1, rx0:rx1]
    dx, dy = noise_fields(f, region)
    amp = 0.82 + 0.18 * math.sin(theta + 1.2) + 0.10 * math.sin(2 * theta + 0.5)
    sx = dx * (7.0 * amp)
    sy = (dy * 9.0 + 2.6 * math.sin(theta + 2.4)) * amp
    m = fire[ry0:ry1, rx0:rx1]
    sx = sx * m
    sy = sy * m
    H, W = base.shape[:2]
    gy, gx = np.mgrid[ry0:ry1, rx0:rx1].astype(np.float32)
    warped = bilinear(base.astype(np.float32), gx + sx, gy + sy)
    sub += m[..., None] * (warped - sub)

    # reflexiones doradas sincronizadas con el parpadeo del fuego
    flick = (0.55 * math.sin(theta + 0.45) + 0.30 * math.sin(2 * theta + 1.75)
             + 0.15 * math.sin(3 * theta + 3.6))
    band = refl * (0.14 + 0.22 * glow)
    out += out * (band * flick)[..., None]
    out += (refl * max(flick, 0.0) * 0.10)[..., None] * np.array([255, 170, 70], np.float32)

    draw_sparks(out, f, sp)
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def build_palette(frames, colors):
    samp = np.concatenate([fr[::3, ::3].reshape(-1, 3) for fr in frames])
    width = 1024
    height = (len(samp) + width - 1) // width
    pad = width * height - len(samp)
    if pad:
        samp = np.vstack([samp, np.zeros((pad, 3), samp.dtype)])
    img = Image.fromarray(samp.reshape(height, width, 3), "RGB")
    return img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT)


def save_gif(quant, path):
    quant[0].save(
        path,
        save_all=True,
        append_images=quant[1:],
        duration=DURATIONS,
        loop=0,
        optimize=True,
    )


def verify(path):
    from PIL import ImageSequence

    report = {}
    size = os.path.getsize(path)
    report["size_mb"] = size / (1024 * 1024)
    with Image.open(path) as im:
        report["loop"] = im.info.get("loop")
        durs, decoded = [], []
        for i in ImageSequence.Iterator(im):
            durs.append(i.info.get("duration", 0))
            decoded.append(np.asarray(i.convert("RGB"), dtype=np.int16))
    report["frames"] = len(decoded)
    report["duration_ms"] = sum(durs)
    report["fps"] = len(decoded) / (sum(durs) / 1000.0)

    # zona estática intacta tras la decodificación (esquina superior izquierda)
    corner = (slice(0, 240), slice(0, 360))
    report["static_ok"] = all(
        np.array_equal(decoded[i][corner], decoded[0][corner]) for i in range(len(decoded))
    )

    # salto del bucle: MAE frame23 -> frame0 vs. el resto de transiciones
    diffs = []
    for i in range(len(decoded)):
        a, b = decoded[i], decoded[(i + 1) % len(decoded)]
        diffs.append(float(np.abs(a - b).mean()))
    report["diffs"] = diffs
    report["wrap_diff"] = diffs[-1]
    report["max_other_diff"] = max(diffs[:-1])
    report["seamless"] = report["wrap_diff"] <= report["max_other_diff"] * 1.25 + 0.02

    # exactitud pre-codificación: el frame 24 debe ser idéntico al frame 0
    return report


def contact_sheets(rgb_frames):
    n = len(rgb_frames)
    tw, th = 352, 192
    grid = Image.new("RGB", (tw * 6, th * 4))
    for i, fr in enumerate(rgb_frames):
        t = Image.fromarray(fr).resize((tw, th), Image.LANCZOS)
        grid.paste(t, ((i % 6) * tw, (i // 6) * th))
    p1 = os.path.join(TMP, "login_gif_sheet.png")
    grid.save(p1)

    box = (600, 40, 1080, 640)
    zw, zh = 240, 300
    zgrid = Image.new("RGB", (zw * 8, zh * 3))
    for i, fr in enumerate(rgb_frames):
        t = Image.fromarray(fr).crop(box).resize((zw, zh), Image.LANCZOS)
        zgrid.paste(t, ((i % 8) * zw, (i // 8) * zh))
    p2 = os.path.join(TMP, "login_gif_fire_sheet.png")
    zgrid.save(p2)
    return p1, p2


def main():
    t0 = time.time()
    src = Image.open(SRC).convert("RGB")
    base_u8 = np.asarray(src, dtype=np.uint8)
    print(f"fuente: {SRC} {src.size}")

    fire, refl, glow = build_masks(base_u8)
    print(f"mascara fuego: {fire.mean() * 100:.1f}% de la imagen; "
          f"reflexion: {refl.mean() * 100:.1f}%")

    ys, xs = np.nonzero(fire > 0.02)
    region = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    print(f"region de desplazamiento: {region}")

    sp = init_sparks()
    frames = [render_frame(f, base_u8, fire, refl, glow, sp, region)
              for f in range(N_FRAMES)]

    # verificación pre-codificación: f24 == f0 (bucle exacto)
    f24 = render_frame(N_FRAMES, base_u8, fire, refl, glow, sp, region)
    d = int(np.abs(f24.astype(np.int16) - frames[0].astype(np.int16)).max())
    print(f"frame 24 vs frame 0: diff max = {d} (esperado 0)")
    if d > 1:
        print("ERROR: el bucle pre-codificación no cierra")
        sys.exit(1)

    dst_dir = os.path.dirname(DST)
    os.makedirs(dst_dir, exist_ok=True)
    path = None
    for colors in (96, 64, 48):
        pal = build_palette(frames, colors)
        quant = [fr_img.quantize(palette=pal, dither=Image.Dither.NONE)
                 for fr_img in (Image.fromarray(fr) for fr in frames)]
        save_gif(quant, DST)
        mb = os.path.getsize(DST) / (1024 * 1024)
        print(f"  codificado con {colors} colores -> {mb:.2f} MB")
        path = DST
        if mb < 1.95:
            break
    if os.path.getsize(DST) >= 2 * 1024 * 1024:
        print("ERROR: supera 2MB incluso con 48 colores")
        sys.exit(1)

    rep = verify(path)
    print("\n--- verificación ---")
    print(f"  size:        {rep['size_mb']:.2f} MB (<2MB: {rep['size_mb'] < 2})")
    print(f"  frames:      {rep['frames']} (esperado 24)")
    print(f"  duración:    {rep['duration_ms']} ms -> {rep['fps']:.2f} fps")
    print(f"  loop ext.:   {rep['loop']} (0 = infinito)")
    print(f"  estático:    {rep['static_ok']}")
    diffs = " ".join(f"{v:.3f}" for v in rep["diffs"])
    print(f"  difs (MAE):  {diffs}")
    print(f"  salto bucle: {rep['wrap_diff']:.3f} vs max {rep['max_other_diff']:.3f}"
          f" -> seamless={rep['seamless']}")

    p1, p2 = contact_sheets(frames)
    print(f"  contact sheets: {p1}\n                  {p2}")

    ok = (rep["size_mb"] < 2 and rep["frames"] == 24 and rep["duration_ms"] == LOOP_MS
          and rep["loop"] == 0 and rep["seamless"] and rep["static_ok"])
    print(f"\n{'OK' if ok else 'FALLO'} — {time.time() - t0:.1f}s")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
