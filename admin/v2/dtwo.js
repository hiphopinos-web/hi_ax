/* AXF CONTROL v2 · 럭키드로우 체크인 2통 콘솔 표시 (261021)
 * 6 · 5 · 4등 = 행운권 전체 통 · 3 · 2 · 1등 = 17F 체크인 통. 서버 필드 이름은 기획 문서 「럭키드로우 체크인 2통 인터페이스_261021」 그대로.
 * 읽기 전용 · 새 쓰기 0.
 *   draw_stats = pool.n · balls · inN · inBalls (전체 통 · 체크인 통) · withT · balls (체크인 통 · 다른 길) · lock { n, balls, inN, inBalls, at } | null · total · recs[].warn 'in' · recs[].fb 1
 *   dset_list(슈퍼관리자) = pool 에도 inN · inBalls 가 실림
 * 쓰는 곳 = dset.js 카드 줄(dtKpi) · drawset.js 당일 점검 칸(dtChkH) · stage.js 무대 머리 · 당첨 기록 표(dtRec*) */
var DT_DAY="2026-10-26", DT_CUT="2026-10-26 17:00";
function dtPool(d,L){ var p=(d&&d.pool)||(L&&L.pool)||null; return p&&p.inN!=null?p:null; }
/* 고정 숫자와 지금 서버 숫자가 다른 항목 이름 */
function dtLockDiff(d){
  var k=d&&d.lock, p=dtPool(d); if(!k||!p) return [];
  var out=[]; [["n","전체 명수"],["balls","전체 장수"],["inN","체크인 명수"],["inBalls","체크인 장수"]].forEach(function(x){ if(num(k[x[0]])!==num(p[x[0]])) out.push(x[1]); });
  return out;
}
function dtLockTxt(k){ return "전체 "+n0(k.n)+"명 · "+n0(k.balls)+"장 · 체크인 "+n0(k.inN)+"명 · "+n0(k.inBalls)+"장"+(k.at?" · "+hm(String(k.at).slice(11,16))+" 고정":""); }
function dtToday(d){ return String(S.srvT||(d&&d.t)||"").slice(0,10); }
/* dset.js 카드 줄 · 체크인 통 */
function dtKpi(L){
  var d=S.data.draw, p=(L&&L.pool)||dtPool(d); if(!p||p.inN==null) return kpi({ l:"체크인 통", v:"-", s:"서버 갱신 뒤" });
  var diff=dtLockDiff(d), k=d&&d.lock, s;
  if(d&&"lock" in d) s=k?(diff.length?"고정 숫자와 다름 · "+diff.join(" · "):"고정 숫자와 같음 · "+hm(String(k.at||"").slice(11,16))):"공 넣기 전 · 고정 없음";
  else s="고정 숫자는 서버 갱신 뒤";
  return kpi({ l:"체크인 통", v:n0(p.inN), u:"명 · "+n0(p.inBalls)+"장", st:diff.length?"warn":"ok", s:s });
}
/* 추첨 설정 › 당일 점검 칸(읽기 전용) */
function dtChkH(d){
  var rows=[], pre=dtToday(d)&&dtToday(d)<DT_DAY, p=dtPool(d), mk=function(t,sub,tg){ rows.push('<div class="row"><div class="t"><b>'+esc(t)+'</b><span>'+esc(sub)+'</span></div>'+tg+'</div>'); };
  var si=typeof dsInfo==="function"?dsInfo(d,null):null;   /* 261022 시작 승인 · 시작 전이면 경고 · 16:40 전에 슈퍼관리자가 「체크인 시작」 */
  if(si) mk("체크인 시작",si.at?"시작됨 · 승인 "+hm(si.at)+(si.recv?" · 지금 받는 중":""):"시작 전 · "+si.st+" 전에 슈퍼관리자가 「체크인 시작」",si.at?tag("시작됨","ok"):tag("시작 전","warn"));
  else mk("체크인 시작","서버 갱신 뒤",tag("확인 중",""));
  if(p){ var inc=num(p.inN)!==num(d.withT)||num(p.inBalls)!==num(d.balls);
    mk("통 숫자","전체 "+n0(p.n)+"명 · "+n0(p.balls)+"장 · 체크인 "+n0(p.inN)+"명 · "+n0(p.inBalls)+"장"+(inc?" · 다른 집계 길 "+n0(d.withT)+"명 · "+n0(d.balls)+"장":""),inc?tag("집계 다름","warn"):tag("일치","ok")); }
  else mk("통 숫자","체크인 통 숫자는 서버 갱신 뒤",tag("확인 중",""));
  if("lock" in d){ var k=d.lock, df=dtLockDiff(d);
    mk("추첨_고정",k?dtLockTxt(k)+(df.length?" · 지금과 다름 "+df.join(" · "):""):"비어 있음",k?(df.length?tag("지금과 다름","warn"):pre?tag("행사 전 값 있음","warn"):tag("고정됨","ok")):tag("비어 있음","ok")); }
  else mk("추첨_고정","서버 갱신 뒤",tag("확인 중",""));
  var tt=num(d.total); mk("추첨기록",n0(tt)+"건",tt?(pre?tag("행사 전 기록 있음","warn"):tag("기록 있음","")):tag("0건","ok"));
  var cu=dwsCfg("행운권_마감"), cv=cu?String(cu.v).trim():null;
  if(cu) mk("행운권_마감",cv||"비어 있음 · 17:00 뒤에도 새 번호가 나옴",cv===DT_CUT?tag("정상","ok"):tag(cv?"다른 값":"비어 있음","warn"));
  else mk("행운권_마감","확인 중",tag("확인 중",""));
  var og=dwsCfg("오픈_범위"), ov=og?String(og.v).trim():null;
  if(og) mk("오픈_범위",ov==="종료"?"행사 종료":ov||"-",ov==="자동"?tag("자동","ok"):tag("자동이어야 함","warn"));
  else mk("오픈_범위","확인 중",tag("확인 중",""));
  return '<h2>추첨 당일 점검 <span class="cap">읽기 전용</span></h2>'+rows.join("");
}
/* 261022 추첨 설정 › 리허설 주소 칸(읽기 전용) · 시험 서버 주소 4줄 · 지금 화면이 ?srv=qa 면 1 · 2번 줄에 「지금 이 화면」 */
var DT_RH=[["무대 리허설(시험 서버)","https://hiax.app/draw/?srv=qa",1],["콘솔(시험 서버)","https://hiax.app/admin/?srv=qa",1],["계산 보기 · 확률 실험실","https://hiax.app/draw/lab.html",0],["무대 자동 시험","https://hiax.app/draw/test.html",0]];
function dtRhH(){
  return '<h2>리허설 주소 <span class="cap">읽기 전용</span></h2>'+DT_RH.map(function(x,i){
    return '<div class="row"><div class="t"><b>'+esc(x[0])+(x[2]&&BE_QA?' '+tag("지금 이 화면","ok"):'')+'</b><span style="word-break:break-all;user-select:all">'+esc(x[1])+'</span></div><span class="btns"><a class="btn sm" href="'+esc(x[1])+'" target="_blank" rel="noopener">열기</a><button class="btn sm" type="button" onclick="copyTx(DT_RH['+i+'][1])">복사</button></span></div>';
  }).join("")+'<p class="cap mt4">시험 서버 기록은 운영과 무관 · 10/26 당일 무대는 운영 서버만</p>';
}
/* 261022 추첨 설정 › 체크인 QR 칸(읽기 전용) · 서버 추첨 코드(draw_stats.code)로 QR 을 그림 · 장식 없는 일반 QR(검정 정사각 · 흰 바탕 · ECC Q · 여백 4칸)
 * 내용 = DQ_BASE + "#s=" + 코드 (인쇄물 QR코드/6_럭키드로우 체크인/ 과 같은 주소) · 코드 글자는 화면에 쓰지 않고 QR 그림만 · 새 쓰기 0 */
var DQ_BASE="https://hiphopinos-web.github.io/hi_ax/", DQ_PX=1600, DQ_CACHE={};
function dtQrData(code){ return DQ_BASE+"#s="+code; }
function dtQrCanvas(code, px){
  var q=qrcode(0,"Q"); q.addData(dtQrData(code)); q.make();
  var n=q.getModuleCount(), T=n+8, s=px/T, c=document.createElement("canvas"); c.width=px; c.height=px;
  var g=c.getContext("2d"); g.fillStyle="#FFFFFF"; g.fillRect(0,0,px,px); g.fillStyle="#000000";
  for(var r=0;r<n;r++) for(var k=0;k<n;k++) if(q.isDark(r,k)){ var x0=Math.round((k+4)*s), x1=Math.round((k+5)*s), y0=Math.round((r+4)*s), y1=Math.round((r+5)*s); g.fillRect(x0,y0,x1-x0,y1-y0); }
  return c;
}
function dtQrSrc(code){ if(!DQ_CACHE[code]) DQ_CACHE[code]=dtQrCanvas(code,480).toDataURL("image/png"); return DQ_CACHE[code]; }
function dtQrH(d){
  var h='<h2>체크인 QR <span class="cap">읽기 전용</span></h2>', code=d&&d.code?String(d.code):"";
  if(!code) return h+'<div class="row"><div class="t"><b>서버 추첨 코드 없음</b><span>위 「추첨 코드」를 저장하면 QR 이 나옵니다</span></div>'+tag("코드 없음","warn")+'</div>';
  if(typeof qrcode!=="function") return h+'<p class="cap">QR 그리기 파일(qrcode.js)을 받지 못했습니다</p>';
  return h+'<div class="row"><div class="t"><img alt="럭키드로우 체크인 QR" src="'+dtQrSrc(code)+'" style="display:block;width:220px;max-width:100%;height:auto;image-rendering:pixelated;background:#fff;border:1px solid #E5E7EB;border-radius:8px"></div></div>'+
    '<div class="btns mt"><button class="btn sm" type="button" onclick="dtQrDl()">PNG 내려받기</button></div><p class="cap mt4">서버 코드로 그림 · 인쇄물과 같은지 확인</p>';
}
function dtQrDl(){
  var d=S.data.draw||{}; if(!d.code||typeof qrcode!=="function"){ toast("서버 추첨 코드가 없습니다",{ bad:1 }); return; }
  dtQrCanvas(String(d.code),DQ_PX).toBlob(function(b){ if(!b){ toast("QR 그림을 만들지 못했습니다",{ bad:1 }); return; }
    var a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="lucky_checkin_qr.png"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },600);
    toast("내려받았습니다 · QR 만 "+DQ_PX+"px"); },"image/png");
}
/* 무대 머리 · 추첨 대상 칸 아래 글 */
function dtPoolSub(d,aOff){ var p=dtPool(d); return aOff?(p?"행운권 전체 "+n0(p.balls)+"장 · 17F 체크인 "+n0(p.inN)+"명 · "+n0(p.inBalls)+"장":"행운권 번호 전체"):"17F 체크인 "+n0(d["in"])+"명"+(d.closed?" · 마감":""); }
/* 당첨 기록 표 */
function dtRecTxt(r){ return (r.warn==="in"?" · 체크인 없음":"")+(r.fb?" · 전체 통 이어 뽑기":""); }
function dtRecCell(r,base){ return esc(base)+(r.warn==="in"?" "+tag("체크인 없음","warn"):"")+(r.fb?" "+tag("전체 통","off"):""); }
