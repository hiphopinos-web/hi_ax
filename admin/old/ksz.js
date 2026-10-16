/* ── 261012 스태프 의류 사이즈 일괄 입력(명단 › 스태프 · 서버 kit_staff_size_preview · apply · undo · 슈퍼 + 본인 확인 · POST) ──
 * 붙여 넣기 → 서버가 명부와 대조한 미리보기(본문 표) → 동명이인 고르기 → 확인 문구 → 적용 → 7초 토스트 · 패널에서 그날 되돌리기
 * 따로 둔 파일 · admin/index.html 이 <script src="ksz.js?v=..."> 로 불러 쓴다(index.html 400KB 상한 · 검사 330 · 335) · 안의 함수는 index.html 의 전역(rosSt · callPost · dialog · toast · tag · band)을 쓴다 */
var KSZ_WORD="사이즈적용";
var KSZ_ST={ set:["바꿈","pri"], "new":["처음 정함","pri"], same:["같음",""], add:["옷 명단에 없음","warn"], multi:["동명이인 고르기","warn"], none:["못 찾음","bad"], size:["사이즈 확인","bad"], dup:["앞 줄과 같은 사람",""], hum:["옷 없음(라운지 초과)",""] };
function kszSt(){ var u=rosSt(); return u.sz||(u.sz={ text:"", addw:true, adda:false, pv:null, pick:{}, seq:0, err:"", last:null }); }
function kszOpen(){ var u=rosSt(); u.chk={}; u.cur=""; u.mode=u.mode==="size"?"":"size"; rosPanel(); rosList(); if(u.mode==="size") kszTotLoad(); if(u.mode==="size") setTimeout(function(){ var t=el("kszText"); if(t) t.focus(); },30); }
function kszCan(){ var a=kszSt(), v=a.pv; return !!(v&&(v.n||(a.adda&&v.appNew))); }
function kszGoLbl(){ var a=kszSt(), v=a.pv||{}; return v.n?n0(v.n)+"명 적용":a.adda&&v.appNew?"폰 권한 "+n0(v.appNew)+"명 넣기":"0명 적용"; }
function kszPick(){ var a=kszSt(), o=[]; for(var i in a.pick) o.push(i+":"+a.pick[i]); return o.join(";"); }
var _kszT=0;
function kszQ(){ var a=kszSt(); a.pv=null; a.err=""; clearTimeout(_kszT); _kszT=setTimeout(kszPreview,600); var b=el("kszSum"); if(b) b.innerHTML=String(a.text).trim()?'<p class="cap mt8"><span class="spin"></span>명부와 대조하는 중</p>':''; }
function kszPreview(){
  var a=kszSt(), s=++a.seq; if(!String(a.text).trim()){ a.pv=null; a.err=""; kszSumPut(); rosList(); return; }
  callPost("kit_staff_size_preview",{ rows:a.text, addw:a.addw?"1":"", pick:kszPick() },function(r){ if(s!==a.seq) return; if(r&&r.ok){ a.pv=r; a.err=""; } else { a.pv=null; a.err=unknownSrv(r)?"이 서버는 아직 사이즈 일괄 입력을 모릅니다 · 서버 배포 뒤 씁니다":why(r); } kszSumPut(); rosList(); },
    function(e){ if(s!==a.seq) return; a.pv=null; a.err=why(e); kszSumPut(); rosList(); });
}
function kszSel(i, v){ var a=kszSt(); a.pick[i]=v; kszPreview(); }
function kszWho(x){ return '<b>'+esc(x.name||"-")+'</b><div class="cap">'+esc(x.dept||"-")+' · '+esc(x.emp)+(x.pool==="kit"?' · 사전 신청 키트':'')+'</div>'; }
function kszTag(r, x){ var t=KSZ_ST[x.st]||[x.st,""], a=kszSt(); if(x.st==="add") t=a.addw?["옷 명단에 넣고 정함","warn"]:["옷 명단에 없음 · 건너뜀","warn"]; return tag(t[0],t[1]); }
function kszChg(x, sz){ return x.st==="same"?tag(esc(sz),""):(x.cur?'<span class="cap">'+esc(x.cur)+'</span> → ':'<span class="cap">없음</span> → ')+tag(esc(sz),"pri"); }
function kszList(box){
  var a=kszSt(), v=a.pv, bar='<div class="bar"><b>사이즈 일괄 입력 미리보기</b><span class="sp"></span><button class="btn sm" data-qa="ksz.close" onclick="kszOpen()">명단으로 돌아가기</button>'+(kszCan()?'<button class="btn sm pri" data-qa="ksz.go.top" onclick="kszAsk()">'+kszGoLbl()+'</button>':'')+'</div>', rest;
  if(!v) rest='<div class="empty"><b>'+(a.err?esc(a.err):"오른쪽 칸에 붙여 넣으면 여기에 미리보기가 나옵니다")+'</b><p class="mt8 cap">줄마다 「이름 사이즈」 또는 「사번 사이즈」 · 서버가 명부와 대조합니다(쓰지 않음).</p></div>';
  else rest='<div class="scrl"><table class="tb"><colgroup><col style="width:44px"><col style="width:150px"><col><col style="width:132px"><col style="width:150px"></colgroup><thead><tr><th class="r">줄</th><th>입력</th><th>사람</th><th>지금 → 새 값</th><th>상태</th></tr></thead><tbody>'+
    v.rows.map(function(r){
      var x=r, who, chg='<span class="cap">-</span>';
      if(r.st==="multi"){
        var cur=a.pick.hasOwnProperty(String(r.i))?a.pick[r.i]:r.def; x=(r.cands||[]).filter(function(c){ return c.emp===cur; })[0]||{ st:"multi" };
        who='<select class="in" style="width:100%" data-qa="ksz.pick" aria-label="'+esc(r.inName||"")+' 동명이인 고르기" onchange="kszSel('+r.i+',this.value)"><option value="">고르지 않음(건너뜀)</option>'+(r.cands||[]).map(function(c){ return '<option value="'+esc(c.emp)+'"'+(c.emp===cur?" selected":"")+'>'+esc(c.name+" · "+(c.dept||"-")+" · "+c.emp+(c.wear?" · 옷 명단":""))+'</option>'; }).join("")+'</select>';
        if(x.emp) chg=kszChg(x, r.sz);
      } else if(r.emp){ who=kszWho(r)+(r.nameDiff?'<div class="cap">입력 이름 '+esc(r.nameDiff)+'와 다름</div>':''); if(r.st!=="size"&&r.st!=="dup"&&r.st!=="hum") chg=kszChg(r, r.sz); }
      else who='<span class="cap">명부에 없음'+(r.inEmp?" · "+esc(r.inEmp):"")+'</span>';
      return '<tr class="'+(x.st==="none"||r.st==="size"?"fail":"")+'"><td class="r n cap">'+(r.i+1)+'</td><td class="wrap">'+esc(r.raw)+'</td><td class="nm">'+who+'</td><td>'+chg+'</td><td>'+kszTag(r, r.st==="multi"&&x.emp?x:r)+'</td></tr>';
    }).join("")+'</tbody></table></div><div class="foot"><span class="n">'+n0(v.rows.length)+'줄</span><span class="sp"></span><span class="cap">사이즈 적용 '+n0(v.n)+'명</span></div>';
  listPut(box, "bksz", bar, rest);
}
function kszOverTxt(o){ var m=String(o).split(":"); return (m[0]==="all"?"총수량 ":m[0]==="staff"?"스태프 옷 ":"사전 신청 키트 ")+m[1]+" "+m[2]+"벌"; }
/* 261012 기념품 옷 총수량 한 표(사용자 「총수량 하나로 바꿈」 · 서버 kit_size_state.all) · 사이즈 · 총수량 · 스태프 · 사전 신청 · (지급) · 남음 · 0 아래 = 모자람 배지
 * 남음 = 총수량 − 스태프 − 사전 신청 · 스태프가 먼저 · 옛 서버(all 없음)는 qty · st.taken · taken 으로 같은 셈 · 체크인존 「사이즈별 남음」 카드와 사이즈 일괄 입력 패널이 같이 쓴다 */
(function(){ try{ var st=document.createElement("style"); st.textContent=".tb.kszt{table-layout:auto}.tb.kszt td:first-child{white-space:nowrap}.tb.kszt th,.tb.kszt td{padding-left:6px;padding-right:6px}.tb.kszt td{height:36px}.tb.kszt th:first-child,.tb.kszt td:first-child{padding-left:12px}.tb.kszt th:last-child,.tb.kszt td:last-child{padding-right:12px}"; document.head.appendChild(st); }catch(e){} })();
function kszTotHtml(d, gv){
  if(!d) return skel();
  if(!d.ok) return '<p class="cap">'+esc(unknownSrv(d)?"서버 배포 뒤":why(d))+'</p>';
  var a=d.all||{ qty:d.qty||{}, st:(d.st||{}).taken||{}, kit:d.taken||{} }, t=[0,0,0,0], c=function(v){ return '<td class="n r">'+n0(v)+'</td>'; };
  var row=function(z){ var q=(a.qty||{})[z]||0, s=(a.st||{})[z]||0, k=(a.kit||{})[z]||0, g=(d.got||{})[z]||0, r=q-s-k; t[0]+=q; t[1]+=s; t[2]+=k; t[3]+=g;
    return '<tr><td><b>'+esc(ksLbl(z))+'</b></td>'+c(q)+c(s)+c(k)+(gv?c(g):"")+'<td class="n r">'+(r<0?tag("모자람 "+n0(-r),"warn"):"<b>"+n0(r)+"</b>")+'</td></tr>'; };
  var body=KS_SZ.map(row).join(""), tr=t[0]-t[1]-t[2];
  return '<table class="tb kszt" data-qa="ksz.tot"><thead><tr><th>사이즈</th><th class="r">총수량</th><th class="r">스태프</th><th class="r">사전 신청자</th>'+(gv?'<th class="r">지급</th>':"")+'<th class="r">남음</th></tr></thead><tbody>'+body+
    '<tr><td class="cap">합계</td>'+c(t[0])+c(t[1])+c(t[2])+(gv?c(t[3]):"")+'<td class="n r"><b>'+n0(tr)+'</b></td></tr></tbody></table>';
}
function kszTotPut(){ var b=el("kszTot"); if(b) b.innerHTML=kszTotHtml(S.data.kss); }
function kszTotLoad(){ call("kit_size_state",{},function(r){ if(r&&r.ok) S.data.kss=r; kszTotPut(); },function(){ kszTotPut(); }); }
function kszPanel(){
  var a=kszSt();
  var h='<textarea class="in" id="kszText" data-qa="ksz.text" rows="6" aria-label="이름 사이즈 줄" placeholder="줄마다 이름 사이즈 · 예) 홍길동 L" oninput="kszSt().text=this.value;kszQ()">'+esc(a.text)+'</textarea>'+
    '<p class="cap mt8">사이즈 SS · L · 2XL(XXL) · 3XL(XXXL)<br>「임원:」 머리말 · 한 줄에 여러 명도 됩니다</p>'+
    '<label class="fx mt12" style="gap:6px;font-size:var(--fs-nav)"><input type="checkbox" data-qa="ksz.addw" '+(a.addw?"checked":"")+' onchange="kszSt().addw=this.checked;kszPreview()">옷 명단에 없는 사람은 명단에 넣고 정하기</label>'+
    '<label class="fx mt8" style="gap:6px;font-size:var(--fs-nav)"><input type="checkbox" data-qa="ksz.adda" '+(a.adda?"checked":"")+' onchange="kszSt().adda=this.checked;kszSumPut();rosList()">폰 권한(앱 스태프 명단)에도 넣기</label>';
  return h+'<div id="kszSum">'+kszSumHtml()+'</div><h3 class="mt12" style="font-size:var(--fs-nav)">기념품 옷 총수량</h3><div id="kszTot" class="mt8">'+kszTotHtml(S.data.kss)+'</div><p class="cap mt12">본인이 나중에 앱에서 바꾸면 그 값이 남습니다. 적용 기록은 기록 › 활동 기록에 남고 그날 안에 되돌립니다.</p>';
}
function kszSumPut(){ var b=el("kszSum"); if(b) b.innerHTML=kszSumHtml(); }
function kszSumHtml(){
  var a=kszSt(), v=a.pv, c=(v&&v.cnt)||{}, h='';
  if(a.err) h+=band("bad",esc(a.err));
  if(v){
    var addN=(c.add||0), appN=v.appNew||0;
    h+='<div class="pv"><div><span>사이즈 적용</span><span class="g n">'+n0(v.n)+'명</span></div><div><span>바꿈 · 처음 정함</span><span class="n">'+n0(c.set||0)+' · '+n0(c["new"]||0)+'</span></div>'+(c.same?'<div><span>같음(쓰지 않음)</span><span class="n">'+c.same+'</span></div>':'')+
      (addN?'<div><span>옷 명단에 없음</span><span class="w n">'+addN+'명'+(a.addw?' · 넣음':' · 건너뜀')+'</span></div>':'')+
      (appN?'<div><span>폰 권한 없음</span><span class="w n">'+appN+'명'+(a.adda?' · 넣음':' · 넣지 않음')+'</span></div>':'')+
      (c.multi?'<div><span>동명이인</span><span class="w n">'+c.multi+'줄 · 표에서 고름</span></div>':'')+
      (c.none?'<div><span>못 찾음</span><span class="r n">'+c.none+'줄</span></div>':'')+(c.size?'<div><span>사이즈 확인</span><span class="r n">'+c.size+'줄</span></div>':'')+(c.dup?'<div><span>앞 줄과 같은 사람</span><span class="n">'+c.dup+'줄</span></div>':'')+(c.hum?'<div><span>옷 없음(라운지 초과)</span><span class="n">'+c.hum+'줄</span></div>':'')+'</div>';
    if(v.over&&v.over.length) h+=band("warn","총수량을 넘습니다 · "+esc(v.over.map(kszOverTxt).join(", "))+" 모자람. 스태프가 먼저라 그래도 적용됩니다 <span style=\"white-space:nowrap\">(설정 의류_총수량)</span>.");
    if(a.adda&&appN&&!v.appSet) h+=band("warn","폰 권한 명단이 아직 저장 전입니다. 넣으면 그때부터 이 명단에 있는 사람만 스태프 폰을 씁니다.");
    h+='<div class="acts"><button class="btn pri" data-qa="ksz.go" '+(kszCan()?"":"disabled")+' onclick="kszAsk()">'+kszGoLbl()+'</button><button class="btn ghost" data-qa="ksz.clear" onclick="var a=kszSt();a.text=\'\';a.pv=null;a.pick={};a.err=&quot;&quot;;rosPanel();rosList()">지우기</button></div>';
  }
  if(a.last) h+='<div class="mt12">'+band("pri","방금 적용 · 사이즈 "+a.last.n+"명"+(a.last.app?" · 폰 권한 "+a.last.app+"명":"")+" · "+esc(short(a.last.at)),a.last.undone?'<span class="cap">되돌림</span>':'<button class="btn sm" data-qa="ksz.undo" onclick="kszUndoAsk()">되돌리기</button>')+'</div>';
  return h;
}
function kszAsk(){
  var a=kszSt(), v=a.pv; if(!kszCan()) return;
  var c=v.cnt||{}, appN=a.adda?v.appNew||0:0, rows=[["사이즈 적용",v.n+"명","chg"],["지금 값을 바꿈",(c.set||0)+"명",c.set?"loss":""]];
  if(c.add&&a.addw) rows.push(["옷 명단에 새로",c.add+"명"]);
  if(appN) rows.push(["폰 권한에 새로",appN+"명"]);
  if(v.over&&v.over.length) rows.push(["수량 모자람",esc(v.over.map(kszOverTxt).join(", ")),"loss"]);
  dialog({ t:v.n?"스태프 옷 사이즈 "+v.n+"명을 적용할까요?":"폰 권한에 "+appN+"명을 넣을까요?", x:imp(rows), s:"이전 값은 되돌리기 기록에 남습니다. 그날 안에 되돌립니다.", ok:KSZ_WORD, x2:1,
    onOk:function(){ callPost("kit_staff_size_apply",{ rows:a.text, sig:v.sig, pick:kszPick(), addw:a.addw?"1":"", adda:a.adda?"1":"", confirm:KSZ_WORD },function(r){ dlgForce();
      if(!(r&&r.ok)){ if(r&&r.reason==="state") kszPreview(); toast("적용하지 못했습니다 · "+(r&&r.reason==="wear"?"옷 명단에 넣지 못했습니다("+esc(r.why||"")+")":r&&r.reason==="none"?"적용할 사람이 없습니다":why(r))); return; }
      a.last={ batch:r.batch, n:r.n, app:r.app&&r.app.ok?r.app.n:0, at:r.t };
      changed(["kit_size_list","kit_size_state"]); rosAfter(); kszPreview(); kszTotLoad();
      toast((r.n?"사이즈 "+r.n+"명을 적용했습니다":"사이즈는 그대로입니다")+(r.wear&&r.wear.n?" · 옷 명단 새로 "+r.wear.n+"명":"")+(r.app?(r.app.ok?" · 폰 권한 새로 "+r.app.n+"명":" · 폰 권한 넣기 실패"):"")+(r.gone&&r.gone.length?" · 그 사이 빠진 "+r.gone.length+"명":""),{ undo:function(){ kszUndo(r.batch); } });
    },function(e){ dlgForce(); toast(why(e)); }); } });
}
function kszUndoAsk(){ var a=kszSt(); if(!a.last) return; dialog({ t:"방금 적용한 일을 되돌릴까요?", s:"그 뒤 본인이 앱에서 바꾼 사람은 건너뜁니다. 이번에 옷 명단 · 폰 권한에 넣은 사람은 다시 뺍니다. 신청번호는 남습니다.", ok:"되돌리기", onOk:function(){ kszUndo(a.last.batch, true); } }); }
function kszUndo(batch, inDlg){
  var a=kszSt();
  callPost("kit_staff_size_undo",{ batch:batch },function(r){ if(inDlg) dlgForce();
    if(!(r&&r.ok)){ toast("되돌리지 못했습니다 · "+why(r)); return; }
    if(a.last&&a.last.batch===batch) a.last.undone=1;
    kszSumPut();
    changed(["kit_size_list","kit_size_state"]); rosAfter(); kszPreview(); kszTotLoad();
    toast("되돌렸습니다 · "+r.n+"명"+(r.skip&&r.skip.length?" · 그 뒤 바뀐 "+r.skip.length+"명은 건너뜀":""));
  },function(e){ if(inDlg) dlgForce(); toast(why(e)); });
}
/* ── 261012 옷 재고현황 내려받기(카카오톡 공유 · 사용자 261012) · 명단 › 옷 신청 툴바 [재고현황 이미지 저장] [글로 복사]
 * 저장 직전 kit_size_state 를 새로 받아 그린다 · 이름 · 사번 없음(사이즈별 수만) · 세로 PNG 400 × 배율 2 · 파일 이름 옷재고_YYMMDD_HHMM.png */
var KSZ_C={ bg:"#F2F4F7", card:"#FFFFFF", tx:"#14171F", tx3:"#80848F", line:"#E5E7EB", line2:"#EFF0F3", soft:"#F9FAFB", navy:"#00205B", navy05:"#EEF0F7", warn:"#8A5A12", warnBg:"#FFF6E3" };
function kszStock(d){
  var a=(d&&d.all)||{ qty:(d&&d.qty)||{}, st:((d&&d.st)||{}).taken||{}, kit:(d&&d.taken)||{} }, t={ q:0, s:0, k:0, r:0 };
  var rows=KS_SZ.map(function(z){ var q=(a.qty||{})[z]||0, s=(a.st||{})[z]||0, k=(a.kit||{})[z]||0; t.q+=q; t.s+=s; t.k+=k; return { lbl:ksLbl(z), q:q, s:s, k:k, r:q-s-k }; });
  t.r=t.q-t.s-t.k;
  var m=/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String((d&&d.t)||"")), n=new Date(), p=function(v){ return (v<10?"0":"")+v; };
  var Y=m?m[1]:String(n.getFullYear()), M=m?m[2]:p(n.getMonth()+1), D=m?m[3]:p(n.getDate()), h=m?m[4]:p(n.getHours()), i=m?m[5]:p(n.getMinutes());
  return { rows:rows, tot:t, at:Y+". "+M+". "+D+" "+h+":"+i, file:"옷재고_"+Y.slice(2)+M+D+"_"+h+i+".png" };
}
function kszRemTxt(r){ return r<0?"모자람 "+n0(-r):n0(r); }
function kszStockTxt(o){
  var L=["기념품 옷 재고현황","기준 "+o.at];
  o.rows.forEach(function(r){ L.push(r.lbl+" · 총수량 "+n0(r.q)+" · 스태프 "+n0(r.s)+" · 사전 신청자 "+n0(r.k)+" · 남음 "+kszRemTxt(r.r)); });
  L.push("합계 · 총수량 "+n0(o.tot.q)+" · 스태프 "+n0(o.tot.s)+" · 사전 신청자 "+n0(o.tot.k)+" · 남음 "+kszRemTxt(o.tot.r));
  return L.join("\n");
}
function kszCanvas(o){
  var S2=2, W=400, rowH=44, top=110, H=top+34+rowH*(o.rows.length+1)+64, cv=document.createElement("canvas");
  cv.width=W*S2; cv.height=H*S2;
  var g=cv.getContext("2d"), ff=getComputedStyle(document.body).fontFamily||"sans-serif", C=KSZ_C;
  g.scale(S2,S2);
  var font=function(w, px){ g.font=w+" "+px+"px "+ff; }, txt=function(s, x, y, al, col){ g.textAlign=al||"left"; g.fillStyle=col||C.tx; g.fillText(s, x, y); };
  var rr=function(x, y, w, h, r, col){ g.fillStyle=col; g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fill(); };
  var line=function(y, col){ g.fillStyle=col; g.fillRect(16, y, W-32, 1); };
  g.fillStyle=C.bg; g.fillRect(0,0,W,H);
  rr(16, 16, W-32, H-32, 12, C.card);
  g.textBaseline="alphabetic";
  font("700",22); txt("기념품 옷 재고현황", 36, 60);
  font("400",13); txt("기준 "+o.at, 36, 86, "left", C.tx3);
  var X=[36,170,222,296,364], hd=["사이즈","총수량","스태프","사전 신청자","남음"];
  g.fillStyle=C.soft; g.fillRect(16, top, W-32, 34); line(top+33, C.line);
  font("600",12); hd.forEach(function(s, j){ txt(s, X[j], top+22, j?"right":"left", C.tx3); });
  var y=top+34, cell=function(r, y, bold){
    font("700",15); txt(r.lbl, X[0], y+28, "left", C.tx);
    font(bold?"700":"400",15); txt(n0(r.q), X[1], y+28, "right"); txt(n0(r.s), X[2], y+28, "right"); txt(n0(r.k), X[3], y+28, "right");
    if(r.r<0){ var s="모자람 "+n0(-r.r); font("700",12); var w=g.measureText(s).width+12; rr(X[4]-w, y+11, w, 24, 12, C.warnBg); txt(s, X[4]-6, y+27, "right", C.warn); }
    else { font("700",15); txt(n0(r.r), X[4], y+28, "right", C.navy); }
  };
  o.rows.forEach(function(r){ cell(r, y); y+=rowH; line(y-1, C.line2); });
  g.fillStyle=C.navy05; g.fillRect(16, y, W-32, rowH);
  cell({ lbl:"합계", q:o.tot.q, s:o.tot.s, k:o.tot.k, r:o.tot.r }, y, 1); y+=rowH;
  font("400",12); txt("남음 = 총수량 − 스태프 − 사전 신청자", 36, y+30, "left", C.tx3);
  return cv;
}
function kszStockGet(done){ call("kit_size_state",{},function(r){ if(!(r&&r.ok)){ toast("재고현황을 받지 못했습니다 · "+why(r)); return; } S.data.kss=r; done(kszStock(r)); },function(e){ toast("재고현황을 받지 못했습니다 · "+why(e)); }); }
function kszImg(){
  kszStockGet(function(o){
    var go=function(){ var cv=kszCanvas(o); cv.toBlob(function(b){ if(!b){ toast("이미지를 만들지 못했습니다"); return; } var u=URL.createObjectURL(b), a=document.createElement("a"); a.href=u; a.download=o.file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); },4000); toast("저장했습니다 · "+o.file); },"image/png"); };
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(go,go); else go();
  });
}
function kszCopy(){
  kszStockGet(function(o){
    var s=kszStockTxt(o), ok=function(){ toast("글로 복사했습니다 · 카카오톡에 붙여 넣기"); }, fb=function(){ var t=document.createElement("textarea"); t.value=s; t.style.position="fixed"; t.style.opacity="0"; document.body.appendChild(t); t.select(); var r=false; try{ r=document.execCommand("copy"); }catch(e){} t.remove(); if(r) ok(); else prompt("재고현황 글", s); };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, fb); else fb();
  });
}
