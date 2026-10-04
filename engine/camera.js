// AX magic 공용 엔진 · 카메라 (261004)
// 카메라 열기 · 고른 장치 기억 · 다음 장치로 전환(V) · 끊김 알림 · 오류 문구를 한 곳에 둔다.
// 화면에 무엇을 띄울지는 각 프로그램이 정한다(매지션 = 큰 오류 화면, 계수기 = 영상 자리 한 줄).
// 영상은 이 탭 메모리에서만 쓴다. 저장 · 전송하지 않는다.

export const hasCamera = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

// 카메라 오류 → { title, msg } · 정적 호스팅(https) 기준 문구
export function cameraError(e) {
  if (e === "nomedia") return { title: "카메라를 쓸 수 없습니다", msg: "주소가 https:// 로 시작하는지 확인해 주세요." };
  const n = e && e.name;
  if (n === "NotAllowedError" || n === "SecurityError") return { title: "카메라 권한이 거부되었습니다", msg: "주소창 왼쪽 자물쇠 아이콘에서 카메라를 허용한 뒤 새로고침해 주세요." };
  if (n === "NotFoundError" || n === "OverconstrainedError") return { title: "카메라를 찾을 수 없습니다", msg: "웹캠이 연결되어 있는지 확인해 주세요." };
  if (n === "NotReadableError" || n === "AbortError") return { title: "카메라를 쓸 수 없습니다", msg: "다른 프로그램(화상회의 등)이 카메라를 쓰고 있을 수 있습니다. 닫고 새로고침해 주세요." };
  return { title: "카메라를 시작하지 못했습니다", msg: String((e && e.message) || e) };
}

export async function listCameras() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
  return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
}

function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }

// 스트림 열기 · deviceId 가 있으면 그 장치(없어졌으면 fallback 일 때 기본 카메라로)
// size = { width, height, frameRate } 의 ideal 값
export async function openStream({ deviceId = "", width = 1280, height = 720, frameRate = 0, facingMode = "user", fallback = true } = {}) {
  if (!hasCamera()) throw "nomedia";
  const base = { width: { ideal: width }, height: { ideal: height } };
  if (frameRate) base.frameRate = { ideal: frameRate };
  const byFace = () => navigator.mediaDevices.getUserMedia({ video: Object.assign(facingMode ? { facingMode } : {}, base), audio: false });
  if (!deviceId) return byFace();
  try { return await navigator.mediaDevices.getUserMedia({ video: Object.assign({ deviceId: { exact: deviceId } }, base), audio: false }); }
  catch (e) { if (!fallback) throw e; return byFace(); }
}

export const trackDevice = (stream) => {
  const t = stream && stream.getVideoTracks()[0];
  return (t && t.getSettings && t.getSettings().deviceId) || "";
};

// 영상 요소에 붙이고 재생 · onEnded = 카메라가 끊겼을 때(USB 빠짐 등)
export async function attach(video, stream, onEnded) {
  video.srcObject = stream;
  await video.play();
  if (onEnded) stream.getVideoTracks().forEach((t) => t.addEventListener("ended", () => onEnded()));
  return { vw: video.videoWidth, vh: video.videoHeight };
}

export function stopVideo(video) {
  try { const o = video.srcObject; if (o) o.getTracks().forEach((t) => t.stop()); } catch (e) { /* 무시 */ }
}

// 기억한 장치(storageKey)로 열고 붙인다 · 실패하면 { error:{title,msg} }
export async function openCamera(video, { storageKey = "", width = 1280, height = 720, onEnded = null } = {}) {
  let stream;
  try { stream = await openStream({ deviceId: storageKey ? lsGet(storageKey) : "", width, height }); }
  catch (e) { return { error: cameraError(e), raw: e }; }
  const size = await attach(video, stream, onEnded);
  return Object.assign({ stream }, size);
}

// 다음 장치로 바꾼다(선택은 storageKey 에 기억) · { ok, text, vw, vh }
export async function cycleCamera(video, { storageKey = "", width = 1280, height = 720 } = {}) {
  if (!navigator.mediaDevices) return { ok: false, text: "" };
  const ds = await listCameras();
  if (ds.length < 2) return { ok: false, text: "연결된 카메라가 1대뿐입니다" };
  const old = video.srcObject, cur = trackDevice(old);
  const i = ds.findIndex((d) => d.deviceId === cur), next = ds[(i + 1) % ds.length];
  try {
    const s = await openStream({ deviceId: next.deviceId, width, height, fallback: false });
    if (old) old.getTracks().forEach((t) => t.stop());
    video.srcObject = s; await video.play();
    if (storageKey) lsSet(storageKey, next.deviceId);
    return { ok: true, text: "카메라: " + (next.label || "카메라 " + ((i + 1) % ds.length + 1)), vw: video.videoWidth, vh: video.videoHeight };
  } catch (e) {
    return { ok: false, text: "그 카메라를 열지 못했습니다" };
  }
}
