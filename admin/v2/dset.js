/* AXF CONTROL v2 · 무대 › 추첨 설정 보조 칸 (261020)
 * 화면 글은 모두 서버 응답(dset_list 의 tx)에서 받는다 · tx 가 없거나 입장이 맞지 않으면 칸을 그리지 않는다
 * 서버 = dset_list · dset_set · dset_del · dset_grp · dset_sim(POST · 서버가 입장을 본다)
 * 바꾸기 = 확인 창 · 7초 되돌리기(바꾸기 전 줄로 덮어쓰기) */
var DS={ L:null, busy:"", sim:null, simN:30, simBusy:"", simLog:"" };
function dsTop(){ return typeof adrTop==="function"?adrTop():!!(S.me&&S.me.top); }
function dsTx(){ return DS.L&&DS.L.ok&&DS.L.tx&&typeof DS.L.tx==="object"?DS.L.tx:null; }
/* 문구 · {a} {b} {c} {d} 를 순서대로 채운다 */
function dsT(k){ var t=dsTx(), s=t&&t[k]!=null?String(t[k]):"", a=arguments; return s.replace(/\{([a-d])\}/g,function(m,c){ var i="abcd".indexOf(c)+1; return a[i]!=null?String(a[i]):""; }); }
function dsStg(){ var s=dsT("stg"); return s?" · "+s:""; }
function dsTA(k){ var t=dsTx(); return t&&Array.isArray(t[k])?t[k]:[]; }
function dsLoad(){
  if(!dsTop()) return;
  call("dset_list",{},30000).then(function(r){ DS.L=r; dsPaint(); if(r&&r.ok&&r.sim&&!DS.sim) dsSimView(); });
}
function dsCard(){
  var L=DS.L; if(!dsTx()) return "";
  var h='<div class="card mt" id="dsCard"><h2>'+esc(dsT("h"))+' <span class="cap">'+esc(dsT("cap"))+'</span></h2><p class="cap">'+esc(dsT("desc"))+'</p>'+
    '<div class="grid g3 mt">'+
      kpi({ l:dsT("kN"), v:n0(L.n), u:dsT("kNu"), s:dsT("kNs",n0(L.grp&&L.grp.n),n0(L.grp&&L.grp.add)) })+
      kpi({ l:dsT("kP"), v:n0(L.pool&&L.pool.balls), u:dsT("kPu"), s:dsT("kPs",n0(L.pool0&&L.pool0.balls),n0(L.pool0&&L.pool0.n)), st:"ok" })+
      kpi({ l:dsT("kC"), v:L.cond?"ON":"OFF", s:L.cond?dsT("cOn"):dsT("cOff") })+
    '</div>';
  if(L.bad&&L.bad.length) h+='<div class="mt">'+band("warn",esc(dsT("bad",n0(L.bad.length),L.bad.map(function(b){ return (b.rk||"?")+" · "+b.no+" · "+b.emp+(b.at?" · "+b.at:""); }).join(" / "))))+'</div>';
  var dis=DS.busy?" disabled":"", th=dsTA("th");
  h+='<div class="grid g2 mt"><label class="up-f">'+esc(dsT("paste"))+'<textarea id="dsTx" rows="4" placeholder="123456&#10;234567"></textarea></label>'+
    '<div><label class="up-f">'+esc(dsT("file"))+'<input type="file" id="dsF" accept=".xlsx,.xls,.csv,.txt" onchange="dsFile(this)" style="display:block;margin-top:6px"></label><p class="cap mt4" id="dsFn"></p></div></div>'+
    '<div class="btns mt"><button class="btn pri" type="button" onclick="dsSet(\'add\')"'+dis+'>'+esc(dsT("bAdd"))+'</button>'+
    '<button class="btn" type="button" onclick="dsSet(\'replace\')"'+dis+'>'+esc(dsT("bRep"))+'</button>'+
    '<button class="btn" type="button" onclick="dsGrp()"'+dis+'>'+esc(dsT("bGrp"))+'</button>'+
    '<span class="sp"></span><button class="btn dng" type="button" onclick="dsClear()"'+(DS.busy||!L.n?" disabled":"")+'>'+esc(dsT("bClr"))+'</button></div>';
  h+='<div class="mt" style="overflow-x:auto"><table class="tb"><thead><tr>'+th.map(function(x,i){ return '<th'+(i===3?' class="n"':'')+'>'+esc(x)+'</th>'; }).join("")+'<th></th></tr></thead><tbody>'+
    ((L.rows||[]).length?(L.rows||[]).map(function(r){ return '<tr><td>'+esc(r.emp)+'</td><td>'+esc(r.name||"-")+'</td><td>'+esc(r.dept||"-")+'</td><td class="n">'+n0(r.tk)+'</td><td>'+esc(r.memo||"")+'</td><td>'+esc(r.at||"")+'</td>'+
      '<td><button class="btn sm" type="button" onclick="dsDel(\''+esc(r.emp)+'\')"'+dis+'>'+esc(dsT("bDel"))+'</button></td></tr>'; }).join(""):'<tr><td colspan="7" class="cap">'+esc(dsT("empty"))+'</td></tr>')+
    '</tbody></table></div></div>';
  if(L.sim&&dsTx().sH) h+=dsSimCard();
  return h;
}
function dsPaint(){ var x=el("dsBox"); if(!x) return; if(!dsTop()||!dsTx()){ x.innerHTML=""; return; } var tx=el("dsTx"), keep=tx?tx.value:""; x.innerHTML=dsCard(); if(keep&&el("dsTx")) el("dsTx").value=keep; }
(function(){ var sc=window.SCREENS&&SCREENS.stage; if(!sc||sc.ds) return; var m0=sc.mount; sc.ds=1;
  sc.mount=function(vb){ var r=m0.apply(this,arguments);
    try{ if(sgSub()==="set"&&dsTop()){ var b=el("dwsB"); if(b&&!el("dsBox")){ var d=document.createElement("div"); d.id="dsBox"; b.parentNode.insertBefore(d,b.nextSibling); } dsPaint(); dsLoad(); } }catch(e){}
    return r; }; })();
function dsFile(inp){
  var f=inp&&inp.files&&inp.files[0]; if(!f) return;
  var put=function(list){ el("dsTx").value=list.join("\n"); el("dsFn").textContent=dsT("fileN",f.name,n0(list.length)); };
  var rd=new FileReader();
  rd.onload=function(){
    var buf=rd.result, csv=function(){ put(new TextDecoder("utf-8").decode(buf).split(/\r?\n/).map(function(l){ return String(l.split(/[\t,]/)[0]||"").replace(/^["']+|["']+$/g,"").trim(); }).filter(Boolean)); };
    if(/\.(csv|txt)$/i.test(f.name)){ csv(); return; }
    xgLoadLib().then(function(X){ var wb=X.read(new Uint8Array(buf),{ type:"array" }), ws=wb.Sheets[wb.SheetNames[0]];
      put(X.utils.sheet_to_json(ws,{ header:1, raw:false, defval:"", blankrows:false }).map(function(r){ return String(r[0]==null?"":r[0]).trim(); }).filter(Boolean)); },
      function(){ el("dsFn").textContent=dsT("fileX"); });
  };
  rd.readAsArrayBuffer(f);
}
function dsPrev(){ return ((DS.L&&DS.L.rows)||[]).map(function(r){ return r.emp; }); }
function dsUndo(prev){ return function(){ call("dset_set",{ mode:"replace", rows:prev.join("\n"), clear:"1" }).then(function(x){ dsLoad(); toast(x&&x.ok?dsT("tUndo",n0(x.n)):dsT("tUndoX",why(x)),{ bad:!(x&&x.ok) }); }); }; }
function dsSet(mode){
  var tx=(el("dsTx")&&el("dsTx").value)||""; if(!tx.trim()){ toast(dsT("noTx"),{ bad:1 }); return; }
  DS.busy="set"; dsPaint();
  call("dset_set",{ mode:mode, rows:tx, dry:"1" }).then(function(d){
    DS.busy=""; dsPaint();
    if(!(d&&d.ok)){ toast(dsT("chkX",d&&d.reason==="empty"?dsT("noEmp"):why(d)),{ bad:1 }); return; }
    var prev=dsPrev();
    confirmBox({ t:mode==="add"?dsT("cAddT"):dsT("cRepT"), who:dsT("cWho",n0(d.add),mode==="replace"?dsT("cDelN",n0(d.del)):"",n0(d.keep),n0(d.n)),
      sub:dsT("cSub",(d.bad?dsT("cBad",n0(d.bad)):"")+(d.dup?dsT("cDup",n0(d.dup)):""))+(mode==="replace"&&d.del?dsStg():""), ok:mode==="add"?dsT("bAdd"):dsT("bRep"), danger:mode==="replace",
      run:function(){ return call("dset_set",{ mode:mode, rows:tx }); },
      done:function(r){ if(el("dsTx")) el("dsTx").value=""; dsLoad(); toast(dsT("tSet",n0(r.n),n0(r.add),r.del?dsT("tDelN",n0(r.del)):"")+(r.del?dsStg():""),{ undo:dsUndo(prev) }); } });
  });
}
function dsGrp(){
  DS.busy="grp"; dsPaint();
  call("dset_grp",{ dry:"1" }).then(function(d){
    DS.busy=""; dsPaint();
    if(!(d&&d.ok)){ toast(dsT("gCntX",why(d)),{ bad:1 }); return; }
    if(!d.add){ toast(dsT("gAll",n0(d.all))); return; }
    var prev=dsPrev();
    confirmBox({ t:dsT("gT"), who:dsT("gWho",n0(d.all),n0(d.add),n0(d.now+d.add)), sub:dsT("gSub"), ok:dsT("gOk"),
      run:function(){ return call("dset_grp",{}); },
      done:function(r){ dsLoad(); toast(dsT("tGrp",n0(r.add),n0(r.n)),{ undo:dsUndo(prev) }); } });
  });
}
function dsDel(emp){
  var prev=dsPrev(), r0=((DS.L&&DS.L.rows)||[]).filter(function(r){ return r.emp===emp; })[0]||{};
  confirmBox({ t:dsT("dT"), who:emp+(r0.name?" · "+r0.name:""), sub:dsT("dSub",n0(r0.tk))+dsStg(), ok:dsT("bDel"), danger:true,
    run:function(){ return call("dset_del",{ emp:emp }); },
    done:function(r){ dsLoad(); toast(dsT("tDel",n0(r.n))+dsStg(),{ undo:dsUndo(prev) }); } });
}
function dsClear(){
  var prev=dsPrev();
  confirmBox({ t:dsT("xT"), who:dsT("xWho",n0(prev.length)), sub:dsT("xSub")+dsStg(), ok:dsT("xOk"), danger:true,
    run:function(){ return call("dset_set",{ mode:"replace", rows:"", clear:"1" }); },
    done:function(){ dsLoad(); toast(dsT("tClr")+dsStg(),{ undo:dsUndo(prev) }); } });
}

/* ── 시험 서버 · 로컬 칸(서버가 sim 1 과 문구를 줄 때만) ── */
function dsSimCard(){
  var V=DS.sim, b=DS.simBusy, dis=b?" disabled":"";
  var h='<div class="card mt"><h2>'+esc(dsT("sH"))+' <span class="cap">'+esc(dsT("sCap",envName()))+'</span></h2>'+
    '<div class="btns"><label class="up-f" style="max-width:180px">'+esc(dsT("sN"))+'<input class="xg-q nt-in n" id="dsN" type="number" min="1" max="500" value="'+DS.simN+'"></label>'+
    '<button class="btn pri" type="button" onclick="dsSim(\'seed\')"'+dis+'>'+esc(b==="seed"?dsT("sSeedB"):dsT("sSeed"))+'</button>'+
    '<button class="btn pri" type="button" onclick="dsSimRun()"'+(b||!V||!V.rows||!V.rows.length?" disabled":"")+'>'+esc(b==="run"?dsT("sRunB",DS.simLog):dsT("sRun"))+'</button>'+
    '<button class="btn" type="button" onclick="dsSim(\'redo\')"'+dis+'>'+esc(dsT("sRedo"))+'</button>'+
    '<span class="sp"></span><button class="btn sm" type="button" onclick="dsSim(\'clear\')"'+dis+'>'+esc(dsT("sWipe"))+'</button></div>';
  if(!V) return h+'<p class="cap mt">'+esc(dsT("sLoad"))+'</p></div>';
  if(!V.ok) return h+band("warn",esc(V.reason==="env"?dsT("sEnv"):why(V)))+'</div>';
  var rows=V.rows||[], won=rows.filter(function(r){ return r.win&&r.win.length; }), lost=rows.filter(function(r){ return !(r.win&&r.win.length); });
  if(!rows.length) return h+'<p class="cap mt">'+esc(dsT("sNone"))+'</p></div>';
  var nWin=0; won.forEach(function(r){ nWin+=r.win.length; });
  var okv=!V.aw&&!V.ap&&!V.multi;
  h+='<div class="mt">'+(okv?band("info",dsT("sOk",n0(nWin),n0(V.a),n0(V.b))):band("bad",dsT("sBad",n0(V.aw),n0(V.ap),n0(V.multi))))+'</div>';
  var rkN=function(r){ var m=/^(\d)/.exec((r.win[0]||{}).rk||""); return m?+m[1]:9; };
  won.sort(function(a,c){ return rkN(a)-rkN(c)||(a.emp<c.emp?-1:1); });
  var g=function(r){ return r.g==="s"?"<b>"+esc(dsT("gS"))+"</b>":esc(dsT("gG")); }, tw=dsTA("sThW"), tl=dsTA("sThL");
  h+='<div class="grid g2 mt"><div><h2>'+esc(dsT("sW"))+' <span class="cap">'+esc(dsT("sCnt",n0(won.length)))+'</span></h2><div style="overflow-x:auto"><table class="tb"><thead><tr>'+tw.map(function(x){ return '<th>'+esc(x)+'</th>'; }).join("")+'</tr></thead><tbody>'+
    (won.length?won.map(function(r){ return '<tr><td>'+esc(r.win.map(function(w){ return w.rk||"?"; }).join(" · "))+'</td><td>'+esc(r.emp)+'</td><td>'+esc(r.name)+'</td><td>'+g(r)+'</td></tr>'; }).join(""):'<tr><td colspan="4" class="cap">'+esc(dsT("sPre"))+'</td></tr>')+
    '</tbody></table></div></div><div><h2>'+esc(dsT("sL"))+' <span class="cap">'+esc(dsT("sCnt",n0(lost.length)))+'</span></h2><div style="overflow-x:auto;max-height:520px;overflow-y:auto"><table class="tb"><thead><tr>'+tl.map(function(x,i){ return '<th'+(i===3?' class="n"':'')+'>'+esc(x)+'</th>'; }).join("")+'</tr></thead><tbody>'+
    lost.map(function(r){ return '<tr><td>'+esc(r.emp)+'</td><td>'+esc(r.name)+'</td><td>'+g(r)+'</td><td class="n">'+n0(r.tk)+'</td></tr>'; }).join("")+
    '</tbody></table></div></div></div></div>';
  return h;
}
function dsSimView(){ return call("dset_sim",{ op:"view" },60000).then(function(v){ DS.sim=v; dsPaint(); return v; }); }
function dsSim(op){
  var n=Math.floor(Number((el("dsN")||{}).value)||30); DS.simN=n;
  if(op==="seed"&&!(n>=1&&n<=500)){ toast(dsT("sNErr"),{ bad:1 }); return; }
  DS.simBusy=op; dsPaint();
  call("dset_sim",{ op:op, n:String(n) },60000).then(function(v){
    DS.simBusy=""; DS.sim=v; dsLoad();
    toast(v&&v.ok?(op==="seed"?dsT("tSeed",n0(v.a),n0(v.b)):op==="redo"?dsT("tRedo"):dsT("tWipe")):dsT("tFail",v&&v.reason==="env"?dsT("sEnv"):why(v)),{ bad:!(v&&v.ok) });
  });
}
/* 무대와 같은 서버 길 · draw_pool(since 없음) → 시험 판 사람 번호만 · 1인 1회 · 뽑힌 번호는 다시 뽑지 않음 · 암호 난수 → draw_log(id sim-) · 등수 = 서버 rd 차례 */
function dsRand(n){ var a=new Uint32Array(1); crypto.getRandomValues(a); return Math.floor(a[0]/4294967296*n); }
function dsSimRun(){
  var V=DS.sim, RD=dsTA("rd"); if(!V||!V.rows||!RD.length) return;
  var mine={}; V.rows.forEach(function(r){ mine[r.pk]=r; });
  DS.simBusy="run"; DS.simLog=""; dsPaint();
  call("draw_pool",{ since:"" },60000).then(function(P){
    if(!(P&&P.ok)){ DS.simBusy=""; dsPaint(); toast(dsT("tPoolX",why(P)),{ bad:1 }); return; }
    var tk=[], won={}, wonNo={}, q=[], tag0=Date.now().toString(36);
    (P.rows||[]).forEach(function(r){ if(mine[r.pk]&&!r.x) (r.no||[]).forEach(function(no){ tk.push([r.pk,no]); }); });
    (V.rows||[]).forEach(function(r){ (r.win||[]).forEach(function(w){ won[r.pk]=1; wonNo[w.no]=1; }); });
    RD.forEach(function(rd, ri){ for(var s=1;s<=rd[2];s++) q.push([ri,s,rd]); });
    var i=0, fail=0;
    var next=function(){
      if(i>=q.length){ DS.simBusy=""; DS.simLog=""; dsSimView().then(function(v){ var g=v&&v.ok&&!v.aw; toast(g?dsT("tDone"):dsT("tDoneX"),{ bad:!g||!!fail }); }); return; }
      var it=q[i++], c=tk.filter(function(t){ return !won[t[0]]&&!wonNo[t[1]]; });
      if(!c.length){ next(); return; }
      var x=c[dsRand(c.length)]; won[x[0]]=1; wonNo[x[1]]=1;
      DS.simLog=it[2][0]+" "+it[1]+"/"+it[2][2]; dsPaint();
      call("draw_log",{ id:"sim-"+tag0+"-"+it[0]+"-"+it[1], round:String(it[0]), slot:String(it[1]), no:x[1], pk:x[0], st:"win", prize:it[2][1], at:"" }).then(function(r){ if(!(r&&r.ok)) fail++; next(); });
    };
    next();
  });
}
