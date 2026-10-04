// 혼잡도 계수기 · 중앙 집계 화면
// 카메라 탭들이 보낸 숫자만 모은다. 전송 방식은 transport.js 한 곳에서 바뀐다.
import { createTransport } from "../../engine/transport.js";   // AX magic 공용 엔진

const WORD = { ok: "여유", mid: "보통", bad: "혼잡" };
const cams = new Map(); // camId -> { msg, at }
const transport = createTransport();
const $dash = document.getElementById("dash");

transport.onMessage((m) => {
  if (m.type === "bye") {
    const c = cams.get(m.camId);
    if (c) c.bye = true;
  } else if (m.type === "count" && m.camId) {
    cams.set(m.camId, { msg: m, at: Date.now(), bye: false });
  }
  render();
});

// 주기의 2.5배(최소 8초) 동안 소식이 없으면 「신호 없음」. 10분 넘게 끊긴 카메라는 목록에서 내린다.
function lost(c) {
  return c.bye || Date.now() - c.at > Math.max(8000, c.msg.intervalMs * 2.5);
}

function ago(ms) {
  const s = Math.round(ms / 1000);
  if (s < 2) return "방금";
  if (s < 60) return s + "초 전";
  return Math.floor(s / 60) + "분 " + (s % 60) + "초 전";
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function render() {
  const now = Date.now();
  for (const [id, c] of cams) if (now - c.at > 600000) cams.delete(id);
  if (!cams.size) {
    $dash.innerHTML = '<div class="dash-empty">아직 들어온 카메라가 없습니다.<br>같은 브라우저에서 계수 화면(index.html)이나 AX magic의 계수를 켜면 여기에 모입니다.</div>';
    return;
  }
  const list = [...cams.values()].sort((a, b) => a.msg.camName.localeCompare(b.msg.camName, "ko"));
  $dash.innerHTML = list
    .map((c) => {
      const m = c.msg;
      const off = lost(c);
      const rows = m.zones.length
        ? m.zones
            .map(
              (z) => `<tr>
          <td class="zn">${esc(z.name)}</td>
          <td class="zs">${off ? '<span class="lost-tag">신호 없음</span>' : `<span class="state s-${z.state}">${WORD[z.state]}</span>`}</td>
          <td class="zc num">${z.count}<small>명</small></td>
        </tr>`
            )
            .join("")
        : '<tr><td class="zn" colspan="3" style="color:var(--sub);font-weight:400;font-size:13.5px">구역 없음 · 화면 전체 인원만 보냅니다</td></tr>';
      return `<section class="cam ${off ? "lost" : ""}">
        <div class="cam-h">
          <div>
            <div class="cn">${esc(m.camName)}</div>
            <div class="cm num">${off ? "신호 없음 · " : ""}마지막 갱신 ${ago(now - c.at)} · ${esc(m.res)} · ${m.intervalMs / 1000}초 주기</div>
          </div>
          <span class="grow"></span>
          <span class="ct num">${m.total}<small>명</small></span>
        </div>
        <table>${rows}</table>
      </section>`;
    })
    .join("");
}

function tickClock() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  document.getElementById("clock").textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  render();
}
setInterval(tickClock, 1000);
tickClock();
