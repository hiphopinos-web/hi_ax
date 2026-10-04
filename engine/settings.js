// AX magic 공용 엔진 · 공용 설정 (261004)
// 혼잡도 계수기(crowd/)와 AX 매지션(magic/)은 같은 주소(origin)라 이 브라우저 localStorage 를 함께 쓴다.
//   axf-cc-loc            위치 이름(예: 1F 로비) · 두 프로그램 공용
//   axf-cc-zones:<위치>   그 위치의 구역 · 카메라 영상 기준 0~1 좌표(좌우를 뒤집지 않은 원본 영상) · 사람 위치가 이 다각형 안이면 그 구역
//   axf-cc-excl:<위치>    그 위치의 제외 구역(261005) · 같은 좌표 · 상자 가운데가 이 안이면 세지 않는다(흉상 등)
//                         구역 키와 따로 둔다(옛 화면이 제외 구역을 보통 구역으로 세지 않게 · 구역 저장 형식은 그대로)
//   axf-crowd-srv-target  보낼 곳(끔 · qa · prod) · transport.js 가 읽고 쓴다
//   axf-crowd-srv-code:<곳> 등급코드 · transport.js 가 읽고 쓴다(화면 · 로그에 내지 않는다)
// 보내는 카메라 이름 = 「위치 이름 · 계수기」 / 「위치 이름 · magic」(프로그램이 접미사를 붙인다 · 게임 이름 AX magic, 사용자 261004)
//   서버는 같은 이름이 다른 기기에서 60초 안에 오면 거절한다. 그래서 위치 이름은 기기마다 달라야 하고,
//   같은 기기에서 두 프로그램을 함께 켜도 접미사가 달라 겹치지 않는다.
//   위치 이름이 비어 있으면 기본 이름(「카메라 1」 · 「AX magic 1」)으로 보낸다.
// 다른 프로그램에서 하는 설정은 다른 탭이어도 storage 이벤트로 바로 따라온다(onShared).
// 다른 Chrome 프로필(실행 바로가기마다 다름)이나 다른 기기와는 공유되지 않는다.

const K_LOC = "axf-cc-loc";
const K_ZONES = "axf-cc-zones:";
const K_EXCL = "axf-cc-excl:";
const K_ZONES_OLD = "axf-crowd-zones:";   // 로컬 시제품 계수기의 카메라 이름별 구역(같은 주소에 남아 있으면 옮겨 온다)
export const NAME_MAX = 20;                // 서버 카메라 이름 한도(CAM_NAME_MAX)
export const SUFFIX = { crowd: "계수기", magic: "magic" };
export const FALLBACK = { crowd: "카메라 1", magic: "AX magic 1" };
export const LOC_MAX = NAME_MAX - 8;       // 긴 접미사 「 · magic」 8자를 남긴다 → 12자

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v === null || v === "") localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }

// 서버 camName_ 과 같은 글자 정리 + 사용자가 접미사까지 쳤으면 떼어 낸다
export function cleanLoc(v) {
  let s = String(v || "").replace(/[\u0000-\u001f\u007f<>"'`\\]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/\s*·\s*(계수기|매지션|magic)$/i, "").trim();
  return s.slice(0, LOC_MAX).trim();
}

export function camName(loc, prog) {
  const l = cleanLoc(loc);
  return l ? l + " · " + SUFFIX[prog] : FALLBACK[prog];
}

export const getLoc = () => cleanLoc(lsGet(K_LOC) || "");
export function setLoc(v) { const l = cleanLoc(v); lsSet(K_LOC, l); return l; }

function parse(s, def) { try { const v = JSON.parse(s); return v === null || v === undefined ? def : v; } catch (e) { return def; } }
const validZones = (a) => (Array.isArray(a) ? a.filter((z) => z && Array.isArray(z.pts) && z.pts.length >= 3) : []);

export function loadZones(loc) {
  const l = cleanLoc(loc), cur = lsGet(K_ZONES + l);
  if (cur !== null) return validZones(parse(cur, []));
  const old = lsGet(K_ZONES_OLD + (l || FALLBACK.crowd));   // 이전 처리 · 시제품 계수기 키
  if (old !== null) { const z = validZones(parse(old, [])); saveZones(l, z); return z; }
  return [];
}
export function saveZones(loc, zones) { lsSet(K_ZONES + cleanLoc(loc), JSON.stringify(validZones(zones))); }
// 제외 구역 · [{ id, name, pts }] · 비면 키를 지운다
export const loadExcl = (loc) => validZones(parse(lsGet(K_EXCL + cleanLoc(loc)), []));
export function saveExcl(loc, list) { const v = validZones(list); lsSet(K_EXCL + cleanLoc(loc), v.length ? JSON.stringify(v) : ""); }

// 다른 탭에서 바뀐 공용 설정 · fn({ what: "loc" | "zones" | "excl", loc })
export function onShared(fn) {
  try {
    window.addEventListener("storage", (e) => {
      if (e.key === K_LOC) fn({ what: "loc", loc: cleanLoc(e.newValue || "") });
      else if (e.key && e.key.indexOf(K_ZONES) === 0) fn({ what: "zones", loc: e.key.slice(K_ZONES.length) });
      else if (e.key && e.key.indexOf(K_EXCL) === 0) fn({ what: "excl", loc: e.key.slice(K_EXCL.length) });
    });
  } catch (e) { /* storage 이벤트 없는 환경 */ }
}

// 이전 처리 · 매지션 옛 키(axf-magician-crowd-v1)의 카메라 이름 · 구역을 공용 키로 옮긴다(한 번만 · mig2 표시)
//   이름: 기본값(AX 매지션 1 · AX magic 1)이 아니고 공용 위치 이름이 비어 있으면 그 이름을 위치 이름으로
//   구역: 옛 매지션 구역은 거울 화면 좌표였다 → 카메라 영상 좌표로(좌우 뒤집기 · 16:9 카메라 기준) · 공용 구역이 비어 있을 때만
export function migrateMagician(key) {
  const o = parse(lsGet(key), null);
  if (!o || typeof o !== "object" || o.mig2) return false;
  const old = typeof o.camName === "string" ? o.camName.trim() : "";
  if (old && old !== FALLBACK.magic && old !== "AX 매지션 1" && !getLoc()) setLoc(old);
  if (Array.isArray(o.zones) && o.zones.length) {
    const loc = getLoc(), c = (v) => Math.min(1, Math.max(0, v));
    if (!loadZones(loc).length) saveZones(loc, o.zones.map((z) => Object.assign({}, z, { pts: (z.pts || []).map(([x, y]) => [c(1 - x), c(y)]) })));
  }
  delete o.camName; delete o.zones; o.mig2 = 1;
  lsSet(key, JSON.stringify(o));
  return true;
}
