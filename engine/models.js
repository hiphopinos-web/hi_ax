// AX magic 공용 엔진 · 모델 로더 (261004)
// 혼잡도 계수기(crowd/)와 AX 매지션(magic/)이 같은 라이브러리 · 같은 모델 주소를 쓴다.
// - 라이브러리 · wasm = jsDelivr npm @mediapipe/tasks-vision 1.0.1 고정(로컬 시제품 vendor/와 같은 판)
// - 모델 = Google 공식 저장소(storage.googleapis.com/mediapipe-models) · 저장소에 바이너리를 두지 않는다
// - 라이브러리는 처음 쓸 때 한 번만 불러온다(동적 import). 인터넷이 막혀도 페이지 자체는 뜨고, 불러오기 실패만 오류로 돌려준다.
// - 만들기는 GPU 먼저, 실패하면 CPU(cpuOnly 모델은 바로 CPU).

export const VISION_VER = "1.0.1";
export const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@" + VISION_VER;
const GS = "https://storage.googleapis.com/mediapipe-models";

export const MODEL_URL = {
  person_lite2: GS + "/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite",
  person_lite0: GS + "/object_detector/efficientdet_lite0/int8/latest/efficientdet_lite0.tflite",
  hand: GS + "/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  face: GS + "/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
};

let libP = null, filesetP = null;
// 라이브러리(vision_bundle.mjs) · 실패하면 다음 호출에서 다시 시도한다
export function loadVision() {
  if (!libP) libP = import(CDN + "/vision_bundle.mjs").catch((e) => { libP = null; throw e; });
  return libP;
}
// wasm 묶음 · 공식 FilesetResolver가 SIMD 지원을 판별해 둘 중 하나(vision_wasm_internal / _nosimd_)를 고른다
export function loadFileset() {
  if (!filesetP) filesetP = loadVision().then((lib) => lib.FilesetResolver.forVisionTasks(CDN + "/wasm")).catch((e) => { filesetP = null; throw e; });
  return filesetP;
}

// make(delegate) 를 GPU 로 먼저, 실패하면 CPU 로. 반환 { task, delegate }
export async function withFallback(make, wantGpu = true, warn = "") {
  if (wantGpu) {
    try { return { task: await make("GPU"), delegate: "GPU" }; }
    catch (e) { if (warn) console.warn(warn, e); }
  }
  return { task: await make("CPU"), delegate: "CPU" };
}

// 손 · Hand Landmarker (VIDEO 모드) · opts 는 tasks-vision 옵션을 그대로 덮어쓴다
export async function createHandLandmarker(opts = {}, wantGpu = true) {
  const lib = await loadVision(), fs = await loadFileset();
  const make = (d) => lib.HandLandmarker.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: MODEL_URL.hand, delegate: d }, runningMode: "VIDEO" }, opts));
  return withFallback(make, wantGpu);
}

// 얼굴 · BlazeFace short range (VIDEO 모드)
export async function createFaceDetector(opts = {}, wantGpu = true) {
  const lib = await loadVision(), fs = await loadFileset();
  const make = (d) => lib.FaceDetector.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: MODEL_URL.face, delegate: d }, runningMode: "VIDEO" }, opts));
  return withFallback(make, wantGpu);
}

// 사람 · EfficientDet (IMAGE 모드 · COCO person 만) · detector.js 의 PersonDetector 가 쓴다
export async function createObjectDetector(modelPath, opts = {}, wantGpu = true) {
  const lib = await loadVision(), fs = await loadFileset();
  const make = (d) => lib.ObjectDetector.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: modelPath, delegate: d } }, opts));
  return withFallback(make, wantGpu, wantGpu ? "GPU 위임 실패, CPU로 전환" : "");
}
