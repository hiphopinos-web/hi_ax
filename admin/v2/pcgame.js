/* AXF CONTROL v2 · 한 사람 카드의 게임 · 닉네임 · 초기화 칸 (261017 사용자 요청 · 옛 콘솔 「게임 기록 · 닉네임 · 대상자별 초기화」를 v2 서랍으로)
 * 게임 = usr_info(관리코드 · 읽기) games · type · 3종 완주 = 미니 게임 세 종목(pang · jump · tetris) 기록 수 · 스탬프 03 = p4 · AX 퀴즈 = ox · 스탬프 02 = qz
 *   서버가 아직 usr_info 를 모르면 person_card usr.games(판 수만)로 보인다
 * 닉네임 = usr_nick(op set · clear · hide · show) · 타자왕 · 게임 순위판 같은 이름 하나(타자닉네임 탭) · 되돌리기 = 반대 동작
 * 초기화 = test_reset(dry 1 = 지울 줄 수 · 확인 문구 「처음상태」 · 실행은 콘솔 사람 로그인 · POST) · 행사일에는 실제 사번 eventday 거절 · 테스트 사번은 언제든
 *   지우는 탭 = 서버 TEST_RESET_TABS(게임 · 타자 · 대전 · 닉네임 · 참여 · 응모권 · 출석 · 접속 · 추첨 체크인 · 아이디어 · 계단 · 상담 · 커피챗 · 분실 요청 · 담당 표시) + PIN
 *   남는 것 = 계정 · 설문 응답 · 선착순 · 참여상 · 럭키드로우 · 재고 장부 · 옷 사이즈 · 번호표 · 체크인 번호 · 명단 · 알림 기기 · 운영로그 */
var GAME_NM=[["pang","AX 팡"],["jump","점프"],["tetris","테트리스"],["ox","AX 퀴즈"]];
var MINI3=["pang","jump","tetris"];
function pcUsrLoad(e, s){ call("usr_info",{ emp:e }).then(function(r){ if(s!==PC.seq) return; PC.u=r||{ ok:false }; pcDraw(); }); }
function pcGameHtml(d){
  var u=PC.u, by={}; pcStamps(d).forEach(function(x){ by[x.id]=1; });
  if(!u) return pcSec("게임", skel())+pcSec("닉네임", skel());
  var old=!u.ok, G=old?{}:u.games||{}, T=old?{}:u.type||{}, cnt=(d.usr&&d.usr.games)||{};
  if(old&&!unknownSrv(u)) return pcSec("게임", band("bad","게임 기록을 받지 못했습니다 · "+esc(why(u)),'<button class="btn sm" type="button" onclick="pcLoad()">다시 시도</button>'))+pcNickSec(d, null);
  var n=function(g){ return old?num(cnt[g]):num(G[g]&&G[g].n); };
  var done=MINI3.filter(function(g){ return old?n(g)>0:G[g]&&G[g].best!=null; }).length;
  var rows=[], none=[];
  GAME_NM.forEach(function(x){ var g=x[0], o=G[g]||{}, k=n(g);
    if(!k){ none.push(x[1]); return; }
    var best=old?"-":g==="ox"?(o.of?"정답 "+n0(o.right)+" / "+n0(o.of):"-"):o.best!=null?n0(o.best)+"점"+(o.rank?" · "+n0(o.rank)+"위":""):"-";
    rows.push([x[1], best, k, o.last]); });
  var ts=T.site||{}, tr=T.race||{}, tk=old?num(cnt.type):num(ts.n);
  if(tk) rows.push(["타자왕 현장", old?"-":ts.best!=null?n0(ts.best)+"점":"-", tk, ts.last]); else none.push("타자왕 현장");
  if(!old&&num(tr.n)) rows.push(["타자 대전", "-", num(tr.n), tr.last]);
  var head='게임 · 미니 게임 3종 <b class="n">'+done+' / 3</b>'+(by.p4?" "+tag("03 받음","ok"):"")+' · AX 퀴즈 '+(n("ox")?"완주":"아직")+(by.qz?" "+tag("02 받음","ok"):"");
  var body=(old?band("warn","이 서버는 아직 게임 상세(usr_info)를 모릅니다 · 판 수만 보입니다"):"")+
    (rows.length?'<table class="tb"><thead><tr><th>게임</th><th class="n">최고</th><th class="n">판</th><th class="n">마지막</th></tr></thead><tbody>'+rows.map(function(r){ return '<tr><td>'+esc(r[0])+'</td><td class="n">'+esc(r[1])+'</td><td class="n">'+n0(r[2])+'</td><td class="n">'+esc(fmtD(r[3])||"-")+'</td></tr>'; }).join("")+'</tbody></table>':'<p class="cap">게임 기록이 없습니다</p>')+
    (rows.length&&none.length?'<div class="cap mt4">기록 없음 · '+esc(none.join(" · "))+'</div>':'');
  return pcSec(head, body, 1)+pcNickSec(d, old?(d.usr&&d.usr.nick)||null:u.nick||null);
}
function pcNickSec(d, nk){
  var J=jq(d.emp), b='';
  if(nk&&nk.nick){
    b+='<button class="btn sm" type="button" onclick="nkSetAsk(\''+J+'\')">바꾸기</button><button class="btn sm" type="button" onclick="nkOpAsk(\''+J+'\',\''+(nk.hidden?"show":"hide")+'\')">'+(nk.hidden?"숨김 풀기":"숨기기")+'</button><button class="btn sm dng" type="button" onclick="nkOpAsk(\''+J+'\',\'clear\')">지우기</button>';
    return pcSec("닉네임", rowH(nk.nick, nk.hidden?"순위판에 「이름 숨김」으로 보임":"타자왕 · 게임 순위판에 보이는 이름", (nk.hidden?tag("숨김","warn")+" ":"")+b));
  }
  return pcSec("닉네임", rowH("없음", "순위판에 「익명 참가자」로 보임", b+'<button class="btn sm" type="button" onclick="nkSetAsk(\''+J+'\')">정하기</button>'));
}
var NK_WHY={ format:"한글 · 영문 · 숫자 2~8자입니다", ban:"쓸 수 없는 말이 들어 있습니다", realname:"명부의 실명과 같은 닉네임은 쓸 수 없습니다", dup:"다른 사람이 쓰는 닉네임입니다", same:"지금 닉네임과 같습니다", nonick:"닉네임이 없습니다" };
var NK_OP={ set:"바꿨습니다", clear:"지웠습니다", hide:"숨겼습니다", show:"숨김을 풀었습니다" };
function pcNick(){ var u=PC.u; return u&&u.ok&&u.nick?u.nick:PC.d&&PC.d.usr&&PC.d.usr.nick||null; }
function nkSetAsk(emp){
  var cur=pcNick(), was=cur?cur.nick:"";
  confirmBox({ t:was?"닉네임을 바꿀까요?":"닉네임을 정할까요?", who:pcWho(emp), sub:"지금 "+(was||"없음")+" · 타자왕 · 게임 순위판에 바로 보임",
    body:'<label class="fld">새 닉네임 · 한글 · 영문 · 숫자 2~8자<input class="in" id="nkQ" maxlength="8" autocomplete="off" oninput="gateUpd()"></label>',
    focus:"nkQ", ok:was?"바꾸기":"정하기", gate:function(){ var i=el("nkQ"); return !!i&&/^[0-9A-Za-z가-힣]{2,8}$/.test(i.value.trim())&&i.value.trim()!==was; },
    run:function(){ return call("usr_nick",{ emp:emp, op:"set", nick:el("nkQ").value.trim() }); },
    fail:function(r){ return r&&NK_WHY[r.reason]||""; },
    done:function(r){ pcAfter(); toast("닉네임을 "+NK_OP.set+" · "+(r.was||"없음")+" → "+r.nick,{ undo:function(){ nkGo(emp, was?"set":"clear", was); } }); } });
}
function nkOpAsk(emp, op){
  var cur=pcNick()||{}, nm=cur.nick||"", hid=!!cur.hidden;   /* 261017 지우기는 숨김도 풀므로 되돌릴 때 숨김까지 다시 */
  var T={ clear:["닉네임을 지울까요?","순위판에 「익명 참가자」로 보임 · 같은 닉네임으로 되돌릴 수 있음"+(hid?"(숨김 그대로)":""),"지우기"], hide:["닉네임을 숨길까요?","순위판에 「이름 숨김」으로 보임","숨기기"], show:["닉네임 숨김을 풀까요?","순위판에 닉네임이 다시 보임","숨김 풀기"] }[op];
  confirmBox({ t:T[0], who:pcWho(emp), sub:"닉네임 "+nm+" · "+T[1], ok:T[2], danger:op==="clear",
    run:function(){ return call("usr_nick",{ emp:emp, op:op }); },
    fail:function(r){ return r&&NK_WHY[r.reason]||""; },
    done:function(){ pcAfter(); toast("닉네임을 "+NK_OP[op]+" · "+nm,{ undo:function(){ nkGo(emp, op==="clear"?"set":op==="hide"?"show":"hide", nm, op==="clear"&&hid); } }); } });
}
function nkGo(emp, op, nick, rehide){ call("usr_nick",op==="set"?{ emp:emp, op:op, nick:nick }:{ emp:emp, op:op }).then(function(r){
  var fin=function(r2){ pcAfter(); toast(r&&r.ok?"되돌렸습니다 · 닉네임 "+(r.nick||"없음")+(rehide?(r2&&r2.ok?" · 숨김":" · 숨김은 다시 못 함"):""):"되돌리지 못했습니다 · "+(r&&NK_WHY[r.reason]||why(r)),{ bad:!(r&&r.ok)||(rehide&&!(r2&&r2.ok)) }); };
  if(r&&r.ok&&rehide&&!r.hidden) call("usr_nick",{ emp:emp, op:"hide" }).then(fin); else fin(null); }); }
/* ── 초기화 ── */
function pcResetHtml(d){
  return pcSec("초기화", '<div class="row"><div class="t"><b>이 사람을 처음 상태로</b><span style="display:block">스탬프 · 행운권 · 게임 · 닉네임 · 출석 · 신청 · PIN 을 지움 · 되돌릴 수 없음</span><span style="display:block">'+esc(RS_DAY)+'</span></div><button class="btn dng" type="button" onclick="pcResetAsk(\''+jq(d.emp)+'\')">초기화</button></div>');
}
