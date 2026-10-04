// AX magic 공용 엔진 · 사람 인식 · MediaPipe Tasks Vision ObjectDetector (COCO person)
// 혼잡도 계수기(crowd/)와 AX 매지션(magic/)이 함께 쓴다 · 로컬 시제품 원본은 혼잡도 계수기/js/detector.js
// 라이브러리 · wasm · 모델 주소와 GPU→CPU 전환은 models.js 한 곳에 있다(저장소에 wasm · 모델 바이너리를 두지 않는다).
import { MODEL_URL, createObjectDetector } from "./models.js";

export const MODELS = {
  lite2: { label: "정확도 우선 · EfficientDet-Lite2", path: MODEL_URL.person_lite2 },
  lite0: { label: "속도 우선 · EfficientDet-Lite0", path: MODEL_URL.person_lite0, cpuOnly: true }, // int8은 GPU 위임에서 결과가 비어 CPU 고정
};

export class PersonDetector {
  constructor() {
    this.det = null;
    this.modelKey = null;
    this.delegate = null;
    this.score = 0.35;
    this.tileCanvas = document.createElement("canvas");
    this.tileCtx = this.tileCanvas.getContext("2d", { willReadFrequently: false });
  }

  async load(modelKey, score, wantGpu = true) {
    const m = MODELS[modelKey] || MODELS.lite2;
    if (this.det) {
      try { this.det.close(); } catch (e) { /* 무시 */ }
      this.det = null;
    }
    this.score = score;
    const r = await createObjectDetector(m.path, { runningMode: "IMAGE", scoreThreshold: score, categoryAllowlist: ["person"], maxResults: -1 }, wantGpu && !m.cpuOnly);
    this.det = r.task;
    this.delegate = r.delegate;
    this.modelKey = modelKey;
  }

  close() {
    if (this.det) { try { this.det.close(); } catch (e) { /* 무시 */ } }
    this.det = null;
  }

  async setScore(score) {
    this.score = score;
    if (this.det) await this.det.setOptions({ scoreThreshold: score });
  }

  // src: video | image | canvas, w/h: 원본 픽셀 크기, tiles: 1(끔) | 2 | 3
  // 반환: [{x,y,w,h,score}] (원본 픽셀 좌표)
  detect(src, w, h, tiles) {
    if (!this.det) return [];
    let out = this._run(src, 0, 0);
    if (tiles > 1) {
      const ov = 0.12; // 타일 겹침 비율(경계에 걸친 사람 대비)
      const tw = Math.ceil(w / tiles), th = Math.ceil(h / tiles);
      const ow = Math.round(tw * ov), oh = Math.round(th * ov);
      for (let r = 0; r < tiles; r++) {
        for (let c = 0; c < tiles; c++) {
          const sx = Math.max(0, c * tw - ow), sy = Math.max(0, r * th - oh);
          const ex = Math.min(w, (c + 1) * tw + ow), ey = Math.min(h, (r + 1) * th + oh);
          const sw = ex - sx, sh = ey - sy;
          if (this.tileCanvas.width !== sw || this.tileCanvas.height !== sh) {
            this.tileCanvas.width = sw;
            this.tileCanvas.height = sh;
          }
          this.tileCtx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
          out = out.concat(this._run(this.tileCanvas, sx, sy));
        }
      }
      out = nms(out);
    }
    return out;
  }

  _run(src, ox, oy) {
    const res = this.det.detect(src);
    const list = [];
    for (const d of res.detections || []) {
      const b = d.boundingBox;
      const s = d.categories && d.categories[0] ? d.categories[0].score : 0;
      list.push({ x: b.originX + ox, y: b.originY + oy, w: b.width, h: b.height, score: s });
    }
    return list;
  }
}

function iou(a, b) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (!inter) return { iou: 0, contain: 0 };
  const aa = a.w * a.h, bb = b.w * b.h;
  return { iou: inter / (aa + bb - inter), contain: inter / Math.min(aa, bb) };
}

// 전체 화면 1회 + 타일 결과를 합친다. 같은 사람(겹침 큼)과 타일 경계에서 잘린 조각(거의 포함됨)을 지운다.
function nms(list) {
  list.sort((p, q) => q.score - p.score);
  const keep = [];
  for (const d of list) {
    let dup = false;
    for (const k of keep) {
      const r = iou(d, k);
      if (r.iou > 0.45 || r.contain > 0.6) { dup = true; break; }
    }
    if (!dup) keep.push(d);
  }
  return keep;
}
