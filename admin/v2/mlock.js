/* AXF CONTROL v2 · 미팅 잠금(확정) · 261022 (사용자 확정 261021 밤 「옮기고 저장하는 순간 메시지가 날아가서 불안」 · 「확정된 칸은 색깔을 조금 다르게」)
 * 라운지 · 커피챗 같은 방식 · 옮기기 · 저장 = 참가자에게 아무것도 안 감 · 잠그는 순간에만 확정 알림(처음) · 변경 알림(마지막 확정과 다를 때) · 같으면 알림 없음 · 풀기 = 알림 없음
 * 서버 meet_lock(prog ln | cc · ids · on 1 | 0) · 잠긴 칸 = 끌어 옮기지 않음(콘솔이 막고 서버도 reason locked)
 * 칸 하나 = 카드 오른쪽 자물쇠 단추 · 사람 상세 「잠그기 · 풀기」 · 여러 칸 = 「여러 칸 고르기」 → 카드 누르기 → 「잠그기 n」 · 확인 창 「n명에게 확정 알림이 나갑니다」
 * 옛 서버(lk 없음) = 잠금 화면을 그리지 않는다(옛 흐름 그대로) */
var MLK={ mode:0, sel:{}, p:"" };
var MLK_SVG='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
var MLK_SVG_OPEN='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.4-1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
var MLK_WHY0=why;
why=function(r){ if(r&&r.reason==="locked"&&r.retry==null) return "잠긴 칸입니다 · 풀고 옮깁니다"; if(r&&r.reason==="noslot") return "칸에 놓인 뒤 잠급니다"; if(r&&r.reason==="over") return "칸 밖이라 잠그지 못합니다"; return MLK_WHY0(r); };
/* 서버가 잠금을 아는가(행에 lk 칸이 있다) */
function mlkSrv(p){
  if(p==="cc"){ var d=S.data.cc; return !!(d&&d.ok&&Array.isArray(d.rows)&&d.rows.some(function(r){ return "lk" in r; })); }
  var L=typeof mtLnM==="function"?mtLnM():null; if(!L) return false;
  for(var k in L.by) if(L.by[k]&&("lk" in L.by[k])) return true; return false;
}
function mlkKey(p, x){ return p==="cc"?jq(x.emp):String(x.id); }
function mlkLk(x){ return !!(x&&+x.lk===1); }
function mlkCur(p, x){ return p==="cc"?(hm(x.round)&&x.table?hm(x.round)+"|"+x.table:""):String(x.ck||""); }
/* 잠글 수 있는 줄 · 커피챗 = 서버 매칭 + 초안 바뀜 없음 · 라운지 = 진행 중 + 칸에 놓임 */
function mlkCan(p, x){ if(!x||mlkLk(x)) return false; if(p==="cc") return x.status==="매칭"&&!!x._s&&x._k===x._s; return RV_ON.indexOf(x.st)>=0&&!!x._k&&!!x.ck; }
function mlkWhyNot(p, x){ if(p==="cc") return x.status!=="매칭"?"칸에 놓은 사람만 잠급니다":x._k!==x._s?"초안을 저장한 뒤 잠급니다":"칸에 놓은 뒤 잠급니다"; return !x._k?"칸에 놓은 뒤 잠급니다":"진행 중인 상담만 잠급니다"; }
/* 잠그면 나갈 알림 · ok 처음 확정 · chg 마지막 확정과 다름 · '' 없음 */
function mlkEv(p, x){ if(p==="ln"&&x.st==="체크인") return ""; var l=String(x.lkk||""); if(!l) return "ok"; return l===mlkCur(p, x)?"":"chg"; }
function mlkRow(p, k){ if(p==="cc") return typeof ccRow==="function"?ccRow(k):null; var L=mtLnM(); return L?L.by[k]:null; }
/* 카드에 붙일 것 · cls(잠김 lkd · 고름 mlk-sel) · 자물쇠 단추 */
function mlkCard(M, x, key){
  if(!x._k||!mlkSrv(M.p)) return { cls:"", btn:"" };
  var on=mlkLk(x), can=mlkCan(M.p, x), sel=MLK.mode&&MLK.sel[M.p+":"+key];
  var lab=on?"잠김 · 누르면 풀기":can?"잠그기 · 확정 알림":mlkWhyNot(M.p, x);
  var btn=on||can?'<button type="button" class="mtg-lk'+(on?" on":"")+'" aria-label="'+esc((personLine(x))+" · "+lab)+'" title="'+esc(lab)+'">'+(on?MLK_SVG:MLK_SVG_OPEN)+'</button>':"";
  return { cls:(on?" lkd":"")+(sel?" mlk-sel":""), btn:btn };
}
/* 시간표 위 띠 · 확정 수 · 여러 칸 고르기 */
function mlkPlaced(M){ var out=[]; Object.keys(M.at).forEach(function(k){ (M.p==="cc"?(M.at[k]||[]):[M.at[k]]).forEach(function(x){ if(x) out.push(x); }); }); return out; }
function mlkBar(M){
  if(!mlkSrv(M.p)) return "";
  var all=mlkPlaced(M), on=all.filter(mlkLk).length, can=all.filter(function(x){ return mlkCan(M.p, x); }).length;
  if(MLK.mode&&MLK.p!==M.p){ MLK.mode=0; MLK.sel={}; }
  var lab=M.p==="cc"?"선정":(M.dl?M.dl+" ":"")+"배정";
  if(!MLK.mode) return '<div class="mtg-bar mlk-bar"><span class="mlk-ic">'+MLK_SVG+'</span><b>'+esc(lab)+' 확정 '+on+' / '+all.length+'명</b><span class="cap">잠근 칸만 참가자 앱에 시간이 보이고 그때 알림이 나갑니다 · 옮기기 · 저장은 알림 없음</span><span class="sp"></span>'+
    '<button class="btn sm" type="button" onclick="mlkModeOn(\''+M.p+'\')"'+(all.length?'':' aria-disabled="true"')+'>여러 칸 고르기</button></div>';
  var ks=Object.keys(MLK.sel).filter(function(k){ return MLK.sel[k]; }), xs=ks.map(function(k){ return mlkRow(M.p, k.slice(3)); }).filter(Boolean);
  var nOn=xs.filter(function(x){ return mlkCan(M.p, x); }).length, nOff=xs.filter(mlkLk).length;
  return '<div class="mtg-bar mlk-bar pick"><b>고른 '+xs.length+'명</b><span class="cap">카드를 눌러 고르고 풉니다</span><span class="sp"></span>'+
    '<button class="btn sm" type="button" onclick="mlkSelAll()"'+(can?'':' aria-disabled="true"')+'>확정 전 모두 고르기 '+can+'</button>'+
    '<button class="btn sm" type="button" onclick="mlkAskSel(0)"'+(nOff?'':' aria-disabled="true"')+'>풀기 '+nOff+'</button>'+
    '<button class="btn sm pri" type="button" onclick="mlkAskSel(1)"'+(nOn?'':' aria-disabled="true"')+'>잠그기 '+nOn+'</button>'+
    '<button class="btn sm" type="button" onclick="mlkModeOff()">그만</button></div>';
}
function mlkRe(){ var b=el("mtgB"); if(b) b._h=""; paint(); }
function mlkModeOn(p){ MLK.mode=1; MLK.p=p; MLK.sel={}; MT.pick=null; mlkRe(); }
function mlkModeOff(){ MLK.mode=0; MLK.sel={}; mlkRe(); }
function mlkSelAll(){ var s=mtSub(), M=s.p==="cc"?mtCcM():mtLnM(); if(!M) return; mlkPlaced(M).forEach(function(x){ if(mlkCan(M.p, x)) MLK.sel[M.p+":"+mlkKey(M.p, x)]=1; }); mlkRe(); }
/* 고르기 모드에서 카드 누름 · true = 처리함 */
function mlkTog(c){
  if(!MLK.mode) return false; var p=c.getAttribute("data-p"), k=c.getAttribute("data-k"), x=mlkRow(p, k);
  if(!x||!x._k){ toast("칸에 놓인 사람만 고릅니다"); return true; }
  if(!mlkLk(x)&&!mlkCan(p, x)){ toast(mlkWhyNot(p, x)); return true; }
  var id=p+":"+k; if(MLK.sel[id]) delete MLK.sel[id]; else MLK.sel[id]=1; mlkRe(); return true;
}
function mlkAskSel(on){ var s=mtSub(), xs=Object.keys(MLK.sel).filter(function(k){ return MLK.sel[k]&&k.indexOf(s.p+":")===0; }).map(function(k){ return mlkRow(s.p, k.slice(3)); }).filter(Boolean);
  mlkAsk(s.p, on, xs.filter(function(x){ return on?mlkCan(s.p, x):mlkLk(x); })); }
/* 칸 하나(카드 자물쇠 · 사람 상세) */
function mlkOne(p, k){
  var x=mlkRow(p, k); if(!x) return;
  if(mlkLk(x)) return mlkAsk(p, 0, [x]);
  if(!mlkCan(p, x)){ toast(mlkWhyNot(p, x),{ bad:1 }); return; }
  mlkAsk(p, 1, [x]);
}
function mlkWhen(p, x){ if(p==="cc") return hm(x.round)+" · 테이블 "+x.table; var a=String(x.ck||"").split("|"); return (a[0]?mtDl(a[0])+" ":"")+(a[1]||"")+" · 미팅룸 "+(a[2]||""); }
function mlkAsk(p, on, xs){
  if(!xs.length) return;
  var ids=xs.map(function(x){ return p==="cc"?x.emp:x.id; }), one=xs.length===1, nm=one?personLine(xs[0])+" · "+mlkWhen(p, xs[0]):"";
  if(on){
    var c={ ok:0, chg:0, none:0 }; xs.forEach(function(x){ c[mlkEv(p, x)||"none"]++; }); var n=c.ok+c.chg;
    confirmBox({ t:(one?"이 칸을":xs.length+"명을")+" 잠글까요?", who:n+"명에게 확정 알림이 나갑니다", sub:(nm?nm+" · ":"")+"처음 확정 "+c.ok+"명 · 시간 바뀜 "+c.chg+"명 · 알림 없음 "+c.none+"명(마지막 확정과 같음) · 앱에 시간이 보입니다 · 푸시는 설정 푸시 ON 일 때만", ok:"잠그기 · 알림 "+n+"명",
      run:function(){ return call("meet_lock",{ prog:p, ids:ids.join(","), on:"1" }); },
      done:function(r){ mlkAfter(p, 1, r, xs); } });
  } else {
    confirmBox({ t:(one?"이 칸 잠금을":xs.length+"명 잠금을")+" 풀까요?", who:"알림 없음", sub:(nm?nm+" · ":"")+"앱에서 시간 · 자리가 사라집니다(시간 확정 전) · 옮긴 뒤 다시 잠그면 그때 알림", ok:"풀기",
      run:function(){ return call("meet_lock",{ prog:p, ids:ids.join(","), on:"0" }); },
      done:function(r){ mlkAfter(p, 0, r, xs); } });
  }
}
function mlkAfter(p, on, r, xs){
  var done={}; (r.rows||[]).forEach(function(o){ if(o.ok) done[p==="cc"?jq(o.emp||o.id):String(o.id)]=o; });
  var at=String(r.t||"");
  xs.forEach(function(x){ var o=done[mlkKey(p, x)]; if(!o) return; x.lk=on?1:0; if(on){ x.lkk=o.key||mlkCur(p, x); x.lkAt=at; } });
  if(p==="ln"){ var d=S.data.lgb; if(d){ var put=function(y){ if(y&&done[String(y.id)]){ y.lk=on?1:0; if(on) y.lkk=done[String(y.id)].key||y.ck; } };
    [d.cells].concat(Object.keys(d.by||{}).map(function(k){ return (d.by[k]||{}).cells||[]; })).forEach(function(cs){ (cs||[]).forEach(function(c){ (c.seats||[]).forEach(put); }); }); } }
  MLK.sel={}; MLK.mode=0; mlkRe(); if(typeof mtDetRe==="function") mtDetRe();
  reload(p==="cc"?["cc","nb"]:["lgb","resv","nb"]);
  var bad=(r.rows||[]).filter(function(o){ return !o.ok; }), ev=r.ev||{}, ids=Object.keys(done).filter(function(k){ return !done[k].same; });
  var msg=on?"잠갔습니다 · "+r.done+"명 · 확정 알림 "+n0(ev.ok||0)+" · 변경 알림 "+n0(ev.chg||0)+(r.pushOn?"":" · 푸시 꺼짐(앱 안 안내만)"):"풀었습니다 · "+r.done+"명 · 알림 없음";
  if(bad.length) msg+=" · 못 함 "+bad.length+"명("+bad.map(function(o){ return why(o); }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(" · ")+")";
  var back=ids.map(function(k){ var x=xs.filter(function(y){ return mlkKey(p, y)===k; })[0]; return x?(p==="cc"?x.emp:x.id):k; });
  toast(msg,{ bad:bad.length?1:0, undo:back.length?function(){ call("meet_lock",{ prog:p, ids:back.join(","), on:on?"0":"1" }).then(function(y){ reload(p==="cc"?["cc"]:["lgb","resv"]); toast(y&&y.ok?(on?"잠금을 풀었습니다 · 알림 없음":"다시 잠갔습니다 · 마지막 확정과 같아 알림 없음"):"되돌리지 못했습니다 · "+why(y),{ bad:!(y&&y.ok) }); }); }:null });
}
/* 옮기기를 막는다 · true = 잠김(안내 띄움) */
function mlkBlock(p, k){ var x=mlkRow(p, k); if(x&&mlkLk(x)){ toast("잠긴 칸입니다 · 자물쇠를 눌러 푼 뒤 옮깁니다",{ bad:1 }); return true; } return false; }
/* 사람 상세 단추 */
function mlkDetBtn(p, k){ var x=mlkRow(p, k); if(!x||!mlkSrv(p)) return "";
  if(mlkLk(x)) return '<button class="btn" type="button" onclick="mlkOne(\''+p+'\',\''+esc(jq(k))+'\')">'+MLK_SVG_OPEN+' 잠금 풀기</button>';
  if(mlkCan(p, x)) return '<button class="btn pri" type="button" onclick="mlkOne(\''+p+'\',\''+esc(jq(k))+'\')">'+MLK_SVG+' 잠그기 · 확정 알림</button>';
  return ""; }
