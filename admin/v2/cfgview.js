/* AXF CONTROL v2 · 기록 · 설정 › 운영 설정(읽기 전용 · 261016 4단계 · 결정 261014 「운영 설정 표 읽기 · 바꾸기 단추 없음 · 바꾸기는 대화로」)
 * 데이터 = cfg_list(k · n · d · v · def) · 공통 표 · 기본값과 다른 줄 칩 · 쓰지 않는 키 뺌 · 엑셀 = 화면 그대로 */
var CFV_DEAD={ "타자대전_목숨":1, "타자대전_상한초":1, "혼잡_포토초":1, "베타_폼":1, "완주추첨_사용":1, "키트_초과대체":1 };
LG_SUBS.splice(LG_SUBS.map(function(x){ return x[0]; }).indexOf("srv")+1,0,["cfg","운영 설정"]);
function cfvDiff(r){ return r.def!=null&&String(r.v)!==String(r.def); }
(function(){
  var sc=SCREENS.log, n0_=sc.need, m0=sc.mount, p0=sc.paint;
  sc.need=function(){ return lgSub()==="cfg"?[{ k:"cfgl", a:"cfg_list", ttl:60000 }]:n0_(); };
  sc.mount=function(vb){
    if(lgSub()!=="cfg") return m0(vb);
    el("phCap").textContent="서버 운영 설정 · 보기만 · 바꾸기는 대화로";
    gridOf("cfgv",{ file:"운영 설정", key:function(r){ return r.k; }, sort:{ k:"k", d:1 }, h:540, empty:"설정이 없습니다", ph:"설정 이름 · 설명 찾기", find:["n","d"], onRow:function(k){ rowDetail(MG.cfgv,k,{ title:function(r){ return r.k; } }); },
      chips:[["all","전체",null],["diff","기본값과 다름",cfvDiff]],
      cols:[{ k:"k", t:"설정", w:200, f:function(r){ return '<b>'+esc(r.k)+'</b>'; } },{ k:"v", t:"지금 값", w:150, f:function(r){ return cfvDiff(r)?'<b>'+esc(r.v)+'</b> '+tag("바뀜","warn"):esc(r.v); } },{ k:"def", t:"기본값", w:130 },{ k:"n", t:"이름", w:160 },{ k:"d", t:"설명", w:360 }] });
    vb.innerHTML=chipsH(LG_SUBS,"cfg")+'<div class="card"><div id="mg_cfgv"></div></div>';
  };
  sc.paint=function(vb){ if(lgSub()!=="cfg") return p0(vb); gridPaint("cfgv","cfgl","운영 설정",function(d){ return (d.rows||[]).filter(function(r){ return !CFV_DEAD[r.k]; }); }); };
})();
