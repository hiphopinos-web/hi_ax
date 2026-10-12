/* ── 261012 스태프 의류 사이즈 일괄 입력(명단 › 스태프 · 서버 kit_staff_size_preview · apply · undo · 슈퍼 + 본인 확인 · POST) ──
 * 붙여 넣기 → 서버가 명부와 대조한 미리보기(본문 표) → 동명이인 고르기 → 확인 문구 → 적용 → 7초 토스트 · 패널에서 그날 되돌리기
 * 따로 둔 파일 · admin/index.html 이 <script src="ksz.js?v=..."> 로 불러 쓴다(index.html 400KB 상한 · 검사 330 · 335) · 안의 함수는 index.html 의 전역(rosSt · callPost · dialog · toast · tag · band)을 쓴다 */
var KSZ_WORD="사이즈적용";
var KSZ_ST={ set:["바꿈","pri"], "new":["처음 정함","pri"], same:["같음",""], add:["옷 명단에 없음","warn"], multi:["동명이인 고르기","warn"], none:["못 찾음","bad"], size:["사이즈 확인","bad"], dup:["앞 줄과 같은 사람",""], hum:["옷 없음(라운지 초과)",""] };
function kszSt(){ var u=rosSt(); return u.sz||(u.sz={ text:"", addw:true, adda:false, pv:null, pick:{}, seq:0, err:"", last:null }); }
function kszOpen(){ var u=rosSt(); u.chk={}; u.cur=""; u.mode=u.mode==="size"?"":"size"; rosPanel(); rosList(); if(u.mode==="size") setTimeout(function(){ var t=el("kszText"); if(t) t.focus(); },30); }
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
function kszOverTxt(o){ var m=String(o).split(":"); return (m[0]==="staff"?"스태프 옷 ":"사전 신청 키트 ")+m[1]+" "+m[2]+"벌"; }
function kszPanel(){
  var a=kszSt();
  var h='<textarea class="in" id="kszText" data-qa="ksz.text" rows="6" aria-label="이름 사이즈 줄" placeholder="줄마다 이름 사이즈 · 예) 홍길동 L" oninput="kszSt().text=this.value;kszQ()">'+esc(a.text)+'</textarea>'+
    '<p class="cap mt8">사이즈 SS · L · 2XL(XXL) · 3XL(XXXL)<br>「임원:」 머리말 · 한 줄에 여러 명도 됩니다</p>'+
    '<label class="fx mt12" style="gap:6px;font-size:var(--fs-nav)"><input type="checkbox" data-qa="ksz.addw" '+(a.addw?"checked":"")+' onchange="kszSt().addw=this.checked;kszPreview()">옷 명단에 없는 사람은 명단에 넣고 정하기</label>'+
    '<label class="fx mt8" style="gap:6px;font-size:var(--fs-nav)"><input type="checkbox" data-qa="ksz.adda" '+(a.adda?"checked":"")+' onchange="kszSt().adda=this.checked;kszSumPut();rosList()">폰 권한(앱 스태프 명단)에도 넣기</label>';
  return h+'<div id="kszSum">'+kszSumHtml()+'</div><p class="cap mt12">본인이 나중에 앱에서 바꾸면 그 값이 남습니다. 적용 기록은 기록 › 활동 기록에 남고 그날 안에 되돌립니다.</p>';
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
    if(v.over&&v.over.length) h+=band("warn","수량을 넘습니다 · "+esc(v.over.map(kszOverTxt).join(", "))+" 모자람. 그래도 적용됩니다(설정 스태프의류_수량).");
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
      changed(["kit_size_list","kit_size_state"]); rosAfter(); kszPreview();
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
    changed(["kit_size_list","kit_size_state"]); rosAfter(); kszPreview();
    toast("되돌렸습니다 · "+r.n+"명"+(r.skip&&r.skip.length?" · 그 뒤 바뀐 "+r.skip.length+"명은 건너뜀":""));
  },function(e){ if(inDlg) dlgForce(); toast(why(e)); });
}
