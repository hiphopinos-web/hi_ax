/* AXF CONTROL v2 · 명단 도우미(261016 2단계) · 화면은 people.js(사람) · stage.js(무대) · notify.js(알림) · setting.js(기록 · 설정)
 * 모든 명단은 공통 표(table.js XG) 한 장 · 화면 전체 폭 · 줄을 누르면 오른쪽 서랍(core.js drwOpen) */
var TEN_N={ fld:"A 영업 · 보상", ta:"B 통계 리포팅", tb:"C 리서치 자동화", aws:"D 바이브 코딩", ms1:"E MS Copilot 1회", ms2:"E MS Copilot 2회" };
function yes(v){ return v?"예":""; }
function subsOf(list, def){ var s=S.sub[S.tab]; return list.some(function(x){ return x[0]===s; })?s:def; }
function chipsH(list, cur){ return '<div class="chips" role="tablist">'+list.map(function(x){ return '<button type="button" role="tab" aria-selected="'+(x[0]===cur)+'" class="chip'+(x[0]===cur?" on":"")+'" onclick="goSub(\''+x[0]+'\')">'+esc(x[1])+'</button>'; }).join("")+'</div>'; }
/* 명단 표 한 장을 데이터 키에 붙인다 */
var MG={};
function gridOf(id, spec){ if(!MG[id]) MG[id]=XG.make(Object.assign({ id:id }, spec)); return MG[id]; }
function gridPaint(id, k, label, rowsOf){ var g=MG[id], gt=dataGate(k,label); g.gate=gt||""; XG.set(g, gt?null:rowsOf(S.data[k]), el("mg_"+id)); }
/* list_get 줄로 구분 칩 만들기 · col = 값마다 칩(세션 · 강연) · flags = [[열, 이름]] 빈칸 아님 = 예 */
function lgChipsOf(col, flags){
  return function(rows){
    var a=[["all","전체",null]];
    if(col){ var vs=[]; rows.forEach(function(r){ var v=String(r[col]==null?"":r[col]); if(v&&vs.indexOf(v)<0) vs.push(v); });
      vs.sort(function(x,y){ return x.localeCompare(y,"ko",{ numeric:true }); }).forEach(function(v){ a.push(["v:"+jq(v), v, function(r){ return String(r[col]==null?"":r[col])===v; }]); }); }
    (flags||[]).forEach(function(f){ a.push(["f:"+f[0], f[1], function(r){ var v=r[f[0]]; return v!=null&&v!==""&&v!==0&&v!=="0"; }]); });
    return a;
  };
}
