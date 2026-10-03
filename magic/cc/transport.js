// 전송 계층 · 계수 화면과 집계 화면이 주고받는 것은 숫자뿐이다(영상·이미지 없음).
//
// 1) BroadcastChannel: 같은 PC · 같은 브라우저의 탭끼리(집계 화면 dashboard.html). 늘 켜져 있다.
// 2) 서버 전송(261003): 계수 화면만 10초마다 가장 최근 숫자 한 묶음을 서버 crowd_cam 으로 보낸다.
//    받는 곳 = 관리 콘솔 AXF CONTROL 「현장 처리 › 혼잡 제보」의 「카메라 계수」 카드.
//    보내는 것 = 카메라 이름 · 구역별 [이름, 인원, 상태] · 화면 전체 인원 · 기기 시각 · 탭 id. 영상 · 이미지 · 사람 정보는 없다.
//    인증 = 등급코드(스태프 혼잡 제보와 같은 코드 · 새 비밀값 없음). 코드는 이 브라우저 localStorage 에만 두고
//    화면 · 콘솔 로그 · 파일 어디에도 내지 않는다. 주소가 아니라 POST 본문으로 보낸다.
//    실패해도 계수는 그대로 돈다(보내기는 따로 돈다 · 다음 10초에 그때의 최신 값을 다시 보낸다 · 쌓아 두지 않는다).
//    코드가 틀리면(auth) 바로 멈춘다. 계속 틀린 코드로 보내면 서버가 이 연결(와이파이 주소) 전체를 잠근다.
//
// 메시지 형식 (v1 · BroadcastChannel)
//   { v:1, type:"count", camId, camName, ts, intervalMs, model, res,
//     total, zones:[{ id, name, count, state, warn, crowd }] }
//   { v:1, type:"bye", camId, ts }

const CHANNEL = "axf-crowd-v1";

export const SERVERS = {
  qa: { name: "QA 서버(hi-qa)", url: "https://hi-qa.axf2026.workers.dev/exec" },
  prod: { name: "운영 서버(hi)", url: "https://hi.axf2026.workers.dev/exec" },
};
const SEND_MS = 10000, TIMEOUT_MS = 8000, FRESH_MS = 30000, ZONE_MAX = 12, NAME_MAX = 20;
const LS_T = "axf-crowd-srv-target", LS_C = "axf-crowd-srv-code:";

function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
function lsSet(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { /* 저장 불가 환경 */ } }
function hms(ms) {
  const d = new Date(ms), p = (n) => String(n).padStart(2, "0");
  return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

class BroadcastTransport {
  constructor() {
    this.kind = "broadcast";
    this.ch = new BroadcastChannel(CHANNEL);
    this.handlers = [];
    this.ch.onmessage = (e) => {
      const m = e.data;
      if (!m || m.v !== 1) return;
      for (const h of this.handlers) h(m);
    };
  }
  send(msg) {
    this.ch.postMessage({ v: 1, ...msg });
  }
  onMessage(fn) {
    this.handlers.push(fn);
  }
  close() {
    this.ch.close();
  }
}

// 서버로 보내기 · 계수 화면만 켠다(createTransport({ server: true }))
class ServerSender {
  constructor() {
    const t = lsGet(LS_T);
    this.target = SERVERS[t] ? t : "off";
    this.latest = null;
    this.inflight = false;
    this.lastOk = 0;
    this.stop = null;     // { why, cam } · 멈춘 이유(코드 · 잠김 · 이름 · 대수)
    this.fail = "";       // 마지막 실패 문구(멈춤 아님 · 다음 10초에 다시 보낸다)
    this.listeners = [];
    this.timer = null;
    this.retry = null;
    this.restart(0);
  }
  // 보내는 박자 · 지금(또는 delay 뒤) 한 번 보내고 거기서부터 10초마다(설정을 바꾼 직후 보낸 것과 다음 차례가 9초 안에 겹치지 않게)
  restart(delay) {
    clearInterval(this.timer); clearTimeout(this.retry);
    this.retry = setTimeout(() => { this.flush(); this.timer = setInterval(() => this.flush(), SEND_MS); }, delay);
  }
  code() { return this.target === "off" ? "" : lsGet(LS_C + this.target); }
  hasCode() { return !!this.code(); }
  setTarget(t) {
    this.target = SERVERS[t] ? t : "off";
    lsSet(LS_T, this.target === "off" ? "" : this.target);
    this.stop = null; this.fail = ""; this.lastOk = 0;
    this.emit();
    this.restart(300);
  }
  setCode(v) {
    if (this.target === "off") return;
    lsSet(LS_C + this.target, String(v || "").trim());
    this.stop = null; this.fail = "";
    this.emit();
    this.restart(300);
  }
  offer(msg) {
    if (!msg || msg.type !== "count") return;
    this.latest = msg;
    if (this.stop && this.stop.why === "name" && msg.camName !== this.stop.cam) { this.stop = null; this.emit(); }
  }
  onStatus(fn) { this.listeners.push(fn); fn(this.status()); }
  emit() { const s = this.status(); for (const f of this.listeners) f(s); }
  // 화면 문구 · { k: off | wait | ok | fail | stop, text }
  status() {
    if (this.target === "off") return { k: "off", text: "서버 전송 꺼짐 · 이 PC 안 집계 화면만" };
    if (this.stop) return { k: "stop", text: "전송 멈춤 · " + this.stop.text };
    if (!this.hasCode()) return { k: "wait", text: "등급코드를 넣으면 보내기 시작" };
    const last = this.lastOk ? " · 마지막 성공 " + hms(this.lastOk) : "";
    if (this.fail) return { k: "fail", text: "전송 실패 · " + this.fail + last };
    if (this.lastOk) return { k: "ok", text: "서버 전송 중 · 마지막 " + hms(this.lastOk) };
    return { k: "wait", text: this.latest ? "보내는 중" : "카메라를 켜면 보내기 시작" };
  }
  async flush() {
    const code = this.code(), m = this.latest, srv = SERVERS[this.target];
    if (!srv || !code || this.stop || this.inflight || !m) return;
    if (Date.now() - m.ts > FRESH_MS) { this.fail = "보낼 새 숫자가 없습니다(인식이 멈춤)"; this.emit(); return; }
    const body = new URLSearchParams({
      action: "crowd_cam",
      key: code,
      cam: String(m.camName || "").slice(0, NAME_MAX),
      cid: String(m.camId || ""),
      tot: String(Math.max(0, Math.min(999, m.total | 0))),
      z: JSON.stringify((m.zones || []).slice(0, ZONE_MAX).map((z) => [String(z.name || "구역").slice(0, NAME_MAX), Math.max(0, Math.min(999, z.count | 0)), z.state])),
      dt: String(m.ts),
    });
    this.inflight = true;
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const to = setTimeout(() => { if (ac) ac.abort(); }, TIMEOUT_MS);
    let r = null;
    try {
      const res = await fetch(srv.url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), cache: "no-store", credentials: "omit", signal: ac ? ac.signal : undefined });
      r = await res.json();
    } catch (e) {
      r = null;
    }
    clearTimeout(to);
    this.inflight = false;
    this.take(r, m);
  }
  take(r, m) {
    if (!r) this.fail = "서버에 닿지 않습니다(네트워크 · 주소 허용 확인)";
    else if (r.ok) { this.lastOk = Date.now(); this.fail = ""; }
    else if (r.reason === "rate") this.restart((Math.max(1, Number(r.retry) || 1)) * 1000 + 300);   // 서버 기준 9초 안 두 번(네트워크 지연 차) · 남은 초 뒤로 박자를 옮긴다
    else if (r.reason === "auth") { lsSet(LS_C + this.target, ""); this.stop = { why: "auth", text: "등급코드가 맞지 않습니다. 코드를 다시 넣으세요" }; }   // 틀린 코드는 지워 입력칸을 다시 연다
    else if (r.reason === "locked") this.stop = { why: "locked", text: "코드를 여러 번 틀려 이 연결이 약 " + Math.max(1, Math.ceil((Number(r.retry) || 600) / 60)) + "분 잠겼습니다" };
    else if (r.reason === "name") this.stop = { why: "name", cam: m.camName, text: "같은 이름의 카메라가 이미 보내고 있습니다. 카메라 이름을 바꾸세요" };
    else if (r.reason === "max") this.stop = { why: "max", text: "서버에 카메라가 " + (r.max || 20) + "대 있어 더 받지 않습니다. 콘솔에서 안 쓰는 카메라를 빼세요" };
    else if (r.reason === "busy") this.fail = "서버가 바쁩니다. 다음 차례에 다시 보냅니다";
    else if (r.reason === "moved" || r.reason === "post" || /unknown action/.test(String(r.err || ""))) this.fail = "이 서버는 아직 카메라 계수를 받지 않습니다(서버 미배포)";
    else if (r.reason === "param") this.fail = "보낸 값의 형식이 맞지 않습니다";
    else this.fail = "서버 응답 " + String(r.reason || r.err || "").slice(0, 40);
    this.emit();
  }
}

export function createTransport(opts) {
  const t = new BroadcastTransport();
  if (opts && opts.server) {
    const s = new ServerSender();
    const send = t.send.bind(t);
    t.send = (msg) => { send(msg); s.offer(msg); };
    t.server = s;
  }
  return t;
}
