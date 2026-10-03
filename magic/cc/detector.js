// 사람 인식 · MediaPipe Tasks Vision ObjectDetector (COCO person)
// AX 매지션 정적 호스팅본(웹배포용/magic/cc/) · 원본은 혼잡도 계수기/js/detector.js
// 라이브러리·wasm은 jsDelivr(npm @mediapipe/tasks-vision 1.0.1, 원본 vendor/와 같은 판), 모델은 Google 공식 저장소에서 읽는다.
import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";

export const MODELS = {
  lite2: { label: "정확도 우선 · EfficientDet-Lite2", path: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite" },
  lite0: { label: "속도 우선 · EfficientDet-Lite0", path: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/int8/latest/efficientdet_lite0.tflite", cpuOnly: true }, // int8은 GPU 위임에서 결과가 비어 CPU 고정
};

// 공식 FilesetResolver가 SIMD 지원을 판별해 둘 중 하나(vision_wasm_internal / _nosimd_)를 고른다.
function fileset() {
  const base = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
  return FilesetResolver.forVisionTasks(base);
}

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
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: m.path, delegate },
      runningMode: "IMAGE",
      scoreThreshold: score,
      categoryAllowlist: ["person"],
      maxResults: -1,
    });
    try {
      if (!wantGpu || m.cpuOnly) throw new Error("CPU 지정");
      this.det = await ObjectDetector.createFromOptions(await fileset(), opts("GPU"));
      this.delegate = "GPU";
    } catch (e) {
      if (wantGpu && !m.cpuOnly) console.warn("GPU 위임 실패, CPU로 전환", e);
      this.det = await ObjectDetector.createFromOptions(await fileset(), opts("CPU"));
      this.delegate = "CPU";
    }
    this.modelKey = modelKey;
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
