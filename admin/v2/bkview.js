/* AXF CONTROL v2 · 일괄 저장 「열어 보기.html」 만들기 (261021 사용자 「서버가 다운되면 그때까지의 정보를 들고 있고 싶다 · HTML 로 받아 두면 거기서 똑같이 출력」)
 * 파일 한 장 · 데이터를 파일 안에 넣는다(file:// 에서는 바깥 파일을 못 읽는다) · 바깥 주소 · 글꼴 · 스크립트 없음 · 서버 없이 더블클릭으로 열림
 *   맨 위 = 기준 시각 · 서버 지문 · 그 시각까지의 기록 · 찾기(사번 · 이름 · 행운권 번호 → 사람 카드) · 탭 9개 · 탭마다 거르기 칸 · 인쇄(A4 · 머리 줄 반복 · 줄 가르지 않음)
 *   데이터 = 서버 bk_dump 의 views(기존 읽기 액션과 같은 함수 · bkup.js 가 넘긴다) · 같은 폴더의 엑셀 · 종이 추첨 키트를 링크한다 · 복구용 JSON 은 담당자 전용 안내 한 줄
 * 모양 = 콘솔 토큰(연회색 바탕 · 흰 카드 12px · 네이비 하나 · 주황은 주의 표시만 · 글자 28/22/16/14/13/12 · 숫자 tabular-nums) */
var BKV_CSS=[
  ":root{--bg:#F2F4F7;--sf:#FFFFFF;--soft:#F9FAFB;--line:#E5E7EB;--line2:#EFF0F3;--line3:#D1D5DB;--tx:#14171F;--tx2:#4B5060;--tx3:#6B7080;--navy:#00205B;--navy05:#EEF0F7;--warn:#B84A00;--warn-bg:#FFF3EA;--warn-ln:#FFD6B8}",
  "*{box-sizing:border-box;margin:0;padding:0}",
  "body{background:var(--bg);color:var(--tx);font-family:-apple-system,\"Segoe UI\",\"Malgun Gothic\",\"Apple SD Gothic Neo\",sans-serif;font-size:14px;line-height:1.5;word-break:keep-all}",
  "button,input{font:inherit;color:inherit}",
  ".n,td.n,th.n{font-variant-numeric:tabular-nums}",
  ".wrap{max-width:1200px;margin:0 auto;padding:16px}",
  ".hd{background:var(--navy);color:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px}",
  ".hd h1{font-size:22px;line-height:1.3}.hd p{font-size:13px;opacity:.9;margin-top:2px}.hd .w{font-size:12px;opacity:.75}",
  ".hd .files{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.hd .files a{color:#fff;font-size:12px;border:1px solid rgba(255,255,255,.4);border-radius:99px;padding:2px 10px;text-decoration:none}",
  ".find{display:flex;gap:8px;align-items:center;margin-bottom:12px}",
  ".in{height:44px;border:1px solid var(--line3);border-radius:8px;padding:0 12px;background:#fff;min-width:0}",
  ".find .in{flex:1;font-size:16px}",
  ".btn{height:40px;padding:0 14px;border-radius:8px;border:1px solid var(--line3);background:#fff;font-weight:600;cursor:pointer;white-space:nowrap}",
  ".btn.pri{background:var(--navy);border-color:var(--navy);color:#fff}",
  ".nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}",
  ".nav button{height:40px;padding:0 14px;border-radius:99px;border:1px solid var(--line3);background:#fff;font-size:13px;font-weight:600;cursor:pointer}",
  ".nav button.on{background:var(--navy);border-color:var(--navy);color:#fff}",
  ".card{background:var(--sf);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:12px;min-width:0}",
  ".card h2{font-size:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.card h2 .r{margin-left:auto;display:flex;gap:8px}",
  ".card h3{font-size:14px;margin:12px 0 6px}",
  ".card h2 .in{height:40px;width:180px;font-size:13px}",
  ".cap{font-size:12px;color:var(--tx3)}",
  ".tag{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:99px;font-size:12px;font-weight:700;background:var(--navy05);color:var(--navy);white-space:nowrap}",
  ".tag.warn{background:var(--warn-bg);color:var(--warn)}",
  ".tw{overflow:auto;border:1px solid var(--line);border-radius:8px;max-height:70vh}",
  "table{border-collapse:collapse;width:100%;font-size:13px}",
  "th{position:sticky;top:0;background:var(--soft);color:var(--tx2);font-weight:600;font-size:12px;text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}",
  "td{padding:6px 8px;border-bottom:1px solid var(--line2);vertical-align:top}",
  "td.n,th.n{text-align:right}td.c{white-space:nowrap}",
  "td.big{font-weight:700;font-variant-numeric:tabular-nums}",
  ".tt td{min-width:110px}.tt td.h{font-weight:600;white-space:nowrap;background:var(--soft)}",
  ".tt .p{display:block}.tt .p+.p{margin-top:4px}.tt .s{font-size:12px;color:var(--tx3)}",
  ".sec{display:none}.sec.on{display:block}",
  ".pc{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:12px}",
  ".pc .card{margin:0}.pc h2 b{font-size:16px}",
  ".kv{display:grid;grid-template-columns:96px 1fr;gap:4px 10px;font-size:13px}.kv dt{color:var(--tx3)}.kv dd{min-width:0}",
  ".nos{font-variant-numeric:tabular-nums;font-weight:700}",
  ".hit{background:var(--navy05)}",
  ".pr-h{display:none}",
  "@page{size:A4;margin:10mm}",
  "@media print{body{background:#fff;font-size:11px}.wrap{max-width:none;padding:0}.hd,.find,.nav,#pc,.card h2 .r,.fl,.np{display:none!important}",
  "body[data-pr] .sec{display:none!important}body[data-pr=raffle] #s_raffle,body[data-pr=fcfs] #s_fcfs,body[data-pr=cchat] #s_cchat,body[data-pr=lng] #s_lng,body[data-pr=f10] #s_f10,body[data-pr=stamp] #s_stamp,body[data-pr=prize] #s_prize,body[data-pr=typing] #s_typing,body[data-pr=survey] #s_survey{display:block!important}",
  ".card{border:0;padding:0;margin:0 0 6mm}.tw{overflow:visible;max-height:none;border:0}th{position:static}table{font-size:10px}th,td{padding:3px 5px;border:1px solid #999}",
  "thead{display:table-header-group}tr,.tt td{break-inside:avoid;page-break-inside:avoid}.pr-h{display:block;font-size:12px;margin-bottom:4px}}",
  "@media (max-width:600px){.wrap{padding:12px 16px}.hd h1{font-size:16px}.kv{grid-template-columns:80px 1fr}.pc{grid-template-columns:1fr}}"
].join("\n");

function BKV_MAIN(){
  var D=JSON.parse(document.getElementById("bd").textContent), V=D.v, M=D.m;
  var L=V.lists||{}, SEC={}, P={}, done={};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); }
  function nE(v){ return String(v==null?"":v).replace(/\s/g,"").toUpperCase().replace(/^0+(?=.)/,""); }
  function n0(v){ var n=Number(v); return isFinite(n)?n.toLocaleString("ko-KR"):"-"; }
  function hm(v){ var s=String(v==null?"":v), m=s.match(/(\d{4})-(\d\d)-(\d\d)[ T](\d\d:\d\d)/); return m?m[2]+"-"+m[3]+" "+m[4]:s; }
  function pad4(v){ return ("000"+String(v)).slice(-4); }
  function rowsOf(k){ return (L[k]&&L[k].rows)||[]; }
  /* 표 · head = [[글자, n(숫자 칸)]] · rows = 칸 글자 배열(이미 esc 한 html) */
  function tbl(head, rows, cls){
    return '<div class="tw"><table class="'+(cls||"")+'"><thead><tr>'+head.map(function(h){ return '<th'+(h[1]?' class="n"':'')+'>'+esc(h[0])+'</th>'; }).join("")+'</tr></thead><tbody>'+
      (rows.length?rows.map(function(r){ return '<tr>'+r.map(function(c,i){ var n=head[i]&&head[i][1]; return '<td class="'+(n?"n":"")+'">'+(c==null?"":c)+'</td>'; }).join("")+'</tr>'; }).join(""):'<tr><td colspan="'+head.length+'" class="cap">없음</td></tr>')+'</tbody></table></div>';
  }
  /* 명단(list_get 모양 cols · rows) → 표 */
  function listTbl(k){
    var x=L[k]; if(!x) return '<p class="cap">이 저장에 없음</p>';
    var cols=x.cols||[];
    return tbl(cols.map(function(c){ return [c.n, c.type==="num"]; }), (x.rows||[]).map(function(r){ return cols.map(function(c){ var v=r[c.k]; return esc(c.type==="time"?hm(v):v); }); }));
  }
  function secHead(k, title, sub){
    return '<p class="pr-h"><b>'+esc(title)+'</b> · 기준 시각 '+esc(M.t)+'</p><h2>'+esc(title)+(sub?' <span class="cap">'+esc(sub)+'</span>':'')+'<span class="r"><input class="in fl" type="search" placeholder="거르기" aria-label="'+esc(title)+' 거르기" oninput="bvFilter(\''+k+'\',this.value)"><button class="btn" type="button" onclick="bvPrint(\''+k+'\')">인쇄</button></span></h2>';
  }
  /* 사람 색인 · 사번(앞자리 0 뗀 대문자) → { emp 원래 글자 · name · dept } */
  function addP(e, name, dept){ var k=nE(e); if(!k) return; var o=P[k]||(P[k]={ emp:String(e), name:"", dept:"" }); if(!o.name&&name) o.name=String(name); if(!o.dept&&dept) o.dept=String(dept); }
  ((V.stamps&&V.stamps.rows)||[]).forEach(function(r){ addP(r.emp,r.name,r.dept); });
  ((V.raffle&&V.raffle.rows)||[]).forEach(function(r){ addP(r.emp,r.name,r.dept); });
  ((V.fcfs&&V.fcfs.rows)||[]).forEach(function(r){ addP(r.emp,r.name,r.dept); });
  Object.keys(L).forEach(function(k){ rowsOf(k).forEach(function(r){ if(r.emp) addP(r.emp,r.name,r.dept); }); });
  (V.typing||[]).forEach(function(r){ addP(r.emp,r.name,r.dept); });
  Object.keys(V.tix||{}).forEach(function(e){ addP(e,"",""); });
  var SN=(V.stamps&&V.stamps.names)||{};
  function lngOf(k){
    var out=[], lg=V.lng||{};
    (lg.days||[]).forEach(function(d){ var b=(lg.by||{})[d.d]; if(!b) return;
      (b.cells||[]).forEach(function(c){ (c.seats||[]).forEach(function(s,i){ if(s&&nE(s.emp)===k) out.push(d.l+" "+c.from+"~"+c.to+" · 상담석 "+(i+1)+" · "+(s.st||"")); }); });
      (b.over||[]).forEach(function(s){ if(nE(s.emp)===k) out.push(d.l+" "+(s.slot||"")+" · 칸 밖 · "+(s.st||"")); }); });
    (lg.none||[]).forEach(function(s){ if(nE(s.emp)===k) out.push("시간 미정 · "+(s.st||"")); });
    if(!out.length) rowsOf("lounge").forEach(function(r){ if(nE(r.emp)===k&&r.st!=="취소") out.push((r.slot||"시간 미정")+" · "+(r.st||"")); });
    return out;
  }
  function card(k){
    var p=P[k]||{ emp:k, name:"", dept:"" }, kv=[];
    var st=((V.stamps&&V.stamps.rows)||[]).filter(function(r){ return nE(r.emp)===k; })[0];
    kv.push(["스탬프", st?'<b class="n">'+n0(st.n)+'개</b> · '+esc(st.ids.map(function(i){ return SN[i]||i; }).join(" · ")):"없음"]);
    var tx=(V.tix||{})[k]||[];
    kv.push(["행운권", tx.length?'<b class="n">'+tx.length+'장</b> · <span class="nos">'+tx.map(esc).join(" · ")+'</span>':"없음"]);
    var fc=((V.fcfs&&V.fcfs.rows)||[]).filter(function(r){ return nE(r.emp)===k; })[0];
    kv.push(["선착순", fc?'<b class="n">'+n0(fc.rk)+'번</b>'+(V.fcfs.cap&&fc.rk>V.fcfs.cap?' <span class="tag warn">대기마감</span>':'')+(fc.got?' · 수령 '+esc(hm(fc.got)):' · 미수령'):"없음"]);
    if(st&&st.roul) kv.push(["룰렛","사용함"]);
    var cc=rowsOf("cchat").filter(function(r){ return nE(r.emp)===k; });
    kv.push(["커피챗", cc.length?cc.map(function(r){ return esc((r.round||"회차 미정")+(r.table?" · 테이블 "+r.table:"")+" · "+r.st); }).join("<br>"):"없음"]);
    var ln=lngOf(k);
    kv.push(["AX 라운지", ln.length?ln.map(esc).join("<br>"):"없음"]);
    var pr=rowsOf("pre10").filter(function(r){ return nE(r.emp)===k; });
    var a10=rowsOf("att10").filter(function(r){ return nE(r.emp)===k; }), a17=rowsOf("att17").filter(function(r){ return nE(r.emp)===k; });
    kv.push(["10F", pr.length?pr.map(function(r){ return esc(r.sn+(r.no?" · 번호 "+r.no:"")+(r.role?" · "+r.role:"")+(r.att?" · 출석":"")); }).join("<br>"):"사전 신청 없음"]);
    if(a10.length||a17.length) kv.push(["출석", a10.concat(a17).map(function(r){ return esc(r.pn+" · 입장 "+hm(r["in"])+(r.out?" · 종료 "+hm(r.out):"")); }).join("<br>")]);
    var pz=rowsOf("prize").filter(function(r){ return nE(r.emp)===k; });
    if(pz.length) kv.push(["경품", pz.map(function(r){ return esc(r.item+" · "+hm(r.t)); }).join("<br>")]);
    var ty=(V.typing||[]).filter(function(r){ return nE(r.emp)===k; })[0];
    if(ty) kv.push(["타자왕", esc(ty.rank+"위 · "+n0(ty.score)+"점")]);
    return '<div class="card"><h2><b>'+esc(p.name||"(이름 없음)")+'</b> <span class="cap n">'+esc(p.emp)+'</span> <span class="cap">'+esc(p.dept)+'</span></h2><dl class="kv">'+kv.map(function(x){ return '<dt>'+esc(x[0])+'</dt><dd>'+x[1]+'</dd>'; }).join("")+'</dl></div>';
  }
  window.bvFind=function(q){
    q=String(q||"").trim(); var box=$("pc");
    if(!q){ box.innerHTML=""; return; }
    var ks=[], head="", d=q.replace(/\s/g,"");
    if(/^\d{1,4}$/.test(d)){
      var no=pad4(d), own=((V.raffle&&V.raffle.rows)||[]).filter(function(r){ return r.no===no; })[0];
      if(own) ks.push(nE(own.emp)); else Object.keys(V.tix||{}).some(function(e){ if(V.tix[e].indexOf(no)>=0){ ks.push(e); return true; } return false; });
      head='<p class="cap">행운권 번호 '+esc(no)+(ks.length?'':' · 이 저장에 없는 번호')+'</p>';
    }
    var kq=nE(d);
    if(P[kq]&&ks.indexOf(kq)<0) ks.push(kq);
    if(d.length>=2) Object.keys(P).forEach(function(k){ if(ks.length<12&&ks.indexOf(k)<0&&P[k].name&&P[k].name.replace(/\s/g,"").indexOf(d)>=0) ks.push(k); });
    box.innerHTML=head+(ks.length?'<div class="pc">'+ks.slice(0,12).map(card).join("")+'</div>':'<p class="cap">찾지 못했습니다 · 사번 · 이름 · 행운권 번호</p>');
  };
  window.bvFilter=function(k, q){
    q=String(q||"").replace(/\s/g,"").toUpperCase(); var n=0;
    [].forEach.call($("s_"+k).querySelectorAll("tbody tr"),function(tr){ var on=!q||tr.textContent.replace(/\s/g,"").toUpperCase().indexOf(q)>=0; tr.style.display=on?"":"none"; if(on) n++; });
  };
  window.bvPrint=function(k){ document.body.setAttribute("data-pr",k); setTimeout(function(){ window.print(); },50); };
  window.addEventListener("afterprint",function(){ document.body.removeAttribute("data-pr"); });
  /* 탭 그리기(처음 열 때 한 번) */
  SEC.raffle=function(){
    var R=V.raffle||{}, rows=R.rows||[];
    return secHead("raffle","행운권 번호 명단","번호순 · "+n0(R.n)+"명 · "+n0(R.m)+"장"+(M.fp?" · 대조 코드 "+M.fp:""))+
      tbl([["번호"],["사번"],["소속"],["직위"],["성명"],["당첨"]], rows.map(function(r){ return ['<span class="nos">'+esc(r.no)+'</span>',esc(r.emp),esc(r.dept),esc(r.pos),esc(r.name),esc(r.win)]; }));
  };
  SEC.fcfs=function(){
    var F=V.fcfs||{}, rows=F.rows||[];
    return secHead("fcfs","선착순 명단",n0(F.m)+"명 · "+n0(F.cap)+"번까지 · 대기마감 "+n0(F.wait)+"명")+
      tbl([["순번",1],["사번"],["소속"],["직위"],["성명"],["구분"],["달성 시점"],["수령 시각"]], rows.map(function(r){ return [esc(r.rk)+(F.cap&&r.rk>F.cap?' <span class="tag warn">대기마감</span>':''),esc(r.emp),esc(r.dept),esc(r.pos),esc(r.name),esc(r.g),esc(hm(r.at)),esc(hm(r.got))]; }));
  };
  SEC.cchat=function(){
    var rows=rowsOf("cchat"), on=rows.filter(function(r){ return r.round&&r.st!=="취소"&&r.st!=="대기"; }), rs={}, ts={};
    (V.am||[]).forEach(function(x){ rs[x]=1; });
    on.forEach(function(r){ rs[r.round]=1; ts[r.table||"-"]=1; });
    var RS=Object.keys(rs).sort(), TS=Object.keys(ts).sort(function(a,b){ return String(a).localeCompare(String(b),"ko",{ numeric:true }); });
    var grid=TS.length?tbl([["회차"]].concat(TS.map(function(t){ return ["테이블 "+t]; })), RS.map(function(r){ return ['<b>'+esc(r)+'</b>'].concat(TS.map(function(t){ return on.filter(function(x){ return x.round===r&&(x.table||"-")===t; }).map(function(x){ return '<span class="p">'+esc(x.name)+' <span class="s">'+esc(x.dept)+' · '+esc(x.st)+'</span></span>'; }).join(""); })); }),"tt"):'<p class="cap">배정된 회차 없음</p>';
    return secHead("cchat","18F 커피챗","시간표 · 명단 "+n0(rows.length)+"줄")+'<h3>시간표</h3>'+grid+'<h3>명단</h3>'+listTbl("cchat")+'<h3>아이디어 한 줄</h3>'+listTbl("idea");
  };
  SEC.lng=function(){
    var lg=V.lng||{}, h="";
    (lg.days||[]).forEach(function(d){ var b=(lg.by||{})[d.d]; if(!b) return; var ns=lg.seats||1, hd=[["시간"]];
      for(var i=1;i<=ns;i++) hd.push(["상담석 "+i]);
      h+='<h3>'+esc(d.l)+' <span class="cap">'+n0(d.n)+'명</span></h3>'+tbl(hd,(b.cells||[]).map(function(c){ return ['<b>'+esc(c.from+"~"+c.to)+'</b>'].concat((c.seats||[]).map(function(s){ return s?'<span class="p">'+esc(s.name)+' <span class="s">'+esc(s.dept)+' · '+esc(s.st)+'</span></span>':''; })); }),"tt")+
        ((b.over||[]).length?'<p class="cap">칸 밖 · '+b.over.map(function(s){ return esc(s.name+" "+(s.slot||"")+" "+s.st); }).join(" · ")+'</p>':'');
    });
    if((lg.none||[]).length) h+='<p class="cap">시간 미정 · '+lg.none.map(function(s){ return esc(s.name+" "+s.st); }).join(" · ")+'</p>';
    return secHead("lng","1F AX 라운지","날짜별 시간표 · 명단")+(h||'<p class="cap">시간표 없음</p>')+'<h3>상담 명단</h3>'+listTbl("lounge")+'<h3>사전 명단</h3>'+listTbl("lounge_pre");
  };
  SEC.f10=function(){ return secHead("f10","10F 사전 신청 · 체크인",n0(rowsOf("pre10").length)+"명")+'<h3>사전 신청 명단</h3>'+listTbl("pre10")+'<h3>10F 출석</h3>'+listTbl("att10")+'<h3>17F 출석</h3>'+listTbl("att17"); };
  SEC.stamp=function(){
    var S=V.stamps||{ ids:[], rows:[] }, ids=S.ids||[];
    return secHead("stamp","스탬프 현황",n0((S.rows||[]).length)+"명 · 사번 · 이름으로 거르기")+
      tbl([["사번"],["이름"],["부서"],["개수",1]].concat(ids.map(function(i){ return [SN[i]||i]; })).concat([["행운권",1],["룰렛"],["최근"]]),
        (S.rows||[]).map(function(r){ return [esc(r.emp),esc(r.name),esc(r.dept),'<b>'+n0(r.n)+'</b>'].concat(ids.map(function(i){ return r.ids.indexOf(i)>=0?"Y":""; })).concat([n0(r.tk),r.roul?"Y":"",esc(hm(r.last))]); }));
  };
  SEC.prize=function(){
    var ro=((V.stamps&&V.stamps.rows)||[]).filter(function(r){ return r.roul; });
    return secHead("prize","경품 · 룰렛 지급",n0(rowsOf("prize").length)+"줄")+'<h3>지급 기록</h3>'+listTbl("prize")+'<h3>룰렛 사용 <span class="cap">'+n0(ro.length)+'명</span></h3>'+
      tbl([["사번"],["이름"],["부서"],["스탬프",1]], ro.map(function(r){ return [esc(r.emp),esc(r.name),esc(r.dept),n0(r.n)]; }))+'<h3>옷 · 키트</h3>'+listTbl("kit");
  };
  SEC.typing=function(){
    var T=V.typing||[];
    return secHead("typing","1F 타자왕 순위",n0(T.length)+"명 · 사람마다 최고 기록")+tbl([["순위",1],["사번"],["이름"],["부서"],["점수",1],["정확도",1],["타수",1],["최대 콤보",1],["기록 시각"]],
      T.map(function(r){ return [n0(r.rank),esc(r.emp),esc(r.name),esc(r.dept),'<b>'+n0(r.score)+'</b>',esc(r.acc),n0(r.hits),n0(r.combo),esc(hm(r.ts))]; }));
  };
  SEC.survey=function(){
    var S=V.survey||{}, qs=S.qs||[];
    var a=tbl([["문항"],["응답",1],["평균",1],["분포"]], qs.filter(function(q){ return q.t!=="text"; }).map(function(q){ return [esc(q.q),n0(q.n),q.avg==null?"":esc(q.avg),esc(Object.keys(q.counts||{}).map(function(c){ return c+" "+q.counts[c]; }).join(" · "))]; }));
    var b=tbl([["프로그램"],["고른 사람",1],["비율",1],["평균",1]], (S.progs||[]).map(function(p){ return [esc(p.fl+" "+p.nm),n0(p.n),esc(p.rate)+"%",p.avg==null?"":esc(p.avg)]; }));
    var tq=qs.filter(function(q){ return q.t==="text"; })[0], c=tq?tbl([["시각"],["답"]], (tq.lines||[]).map(function(x){ return [esc(hm(x.t)),esc(x.line)]; })):"";
    return secHead("survey","설문 집계 요약","응답 "+n0(S.n)+"명 · 시험 사번 제외")+'<h3>문항</h3>'+a+'<h3>프로그램별</h3>'+b+(tq?'<h3>'+esc(tq.q)+'</h3>'+c:'');
  };
  window.bvGo=function(k){
    [].forEach.call(document.querySelectorAll(".nav button"),function(b){ b.className=b.getAttribute("data-k")===k?"on":""; });
    [].forEach.call(document.querySelectorAll(".sec"),function(s){ s.className="sec"+(s.id==="s_"+k?" on":""); });
    if(!done[k]){ done[k]=1; try{ $("s_"+k).innerHTML='<div class="card">'+SEC[k]()+'</div>'; }catch(e){ $("s_"+k).innerHTML='<div class="card"><p class="cap">이 탭을 그리지 못했습니다 · 엑셀 파일을 여세요</p></div>'; } }
    try{ location.hash=k; }catch(e){}
  };
  var h0=String(location.hash||"").replace("#","");
  bvGo(SEC[h0]?h0:"raffle");
}

/* V = bk_dump views · m = { t 기준 시각 · sha 서버 지문 · host · fp 행운권 대조 코드 · files [[이름, 설명]] · kit 키트 파일 이름 } */
function bkViewHtml(V, m){
  var esc_=function(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]; }); };
  var json=JSON.stringify({ v:V, m:m }).replace(/</g,"\\u003c").split(String.fromCharCode(8232)).join("\\u2028").split(String.fromCharCode(8233)).join("\\u2029");
  var TABS=[["raffle","행운권"],["fcfs","선착순"],["cchat","커피챗"],["lng","AX 라운지"],["f10","10F"],["stamp","스탬프"],["prize","경품 · 룰렛"],["typing","타자왕"],["survey","설문"]];
  return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>AXF 비상 백업 '+esc_(m.t)+'</title><style>'+BKV_CSS+'</style></head><body><div class="wrap">'+
    '<div class="hd"><h1>AXF 비상 백업 · 열어 보기</h1><p class="n">기준 시각 '+esc_(m.t)+' · 서버 지문 '+esc_(m.sha||"-")+' · 이 파일은 그 시각까지의 기록</p>'+
    '<p class="w">인터넷 없이 열림 · 실명 · 소속 포함 · 같은 폴더 「복구용_서버데이터.json」은 서버 복구용 · 담당자 전용</p>'+
    '<div class="files">'+(m.files||[]).map(function(f){ return '<a href="'+encodeURI(f[0]).replace(/#/g,"%23")+'" title="'+esc_(f[1]||"")+'">'+esc_(f[0].replace(/\.(xlsx|html)$/,""))+'</a>'; }).join("")+'</div></div>'+
    '<div class="find"><input class="in" id="q" type="search" placeholder="사번 · 이름 · 행운권 번호" aria-label="사람 찾기" oninput="bvFind(this.value)" autocomplete="off"></div><div id="pc"></div>'+
    '<div class="nav" role="tablist">'+TABS.map(function(t){ return '<button type="button" data-k="'+t[0]+'" onclick="bvGo(\''+t[0]+'\')">'+esc_(t[1])+'</button>'; }).join("")+'</div>'+
    TABS.map(function(t){ return '<div class="sec" id="s_'+t[0]+'"></div>'; }).join("")+
    '</div><script type="application/json" id="bd">'+json+'</script><script>('+BKV_MAIN.toString()+')();</script></body></html>';
}
