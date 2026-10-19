/* AXF CONTROL v2 · 한 사람 카드 「명단」 칸 · 옷 사이즈 대리 입력 (261019 사용자 「스태프 옷 한 사람 수정에 사이즈 입력 · 슈퍼관리자만」)
 * 서버 변경 없음 · 옛 콘솔 ksz.js(사이즈 일괄 입력)와 같은 액션을 한 사람 한 줄(「사번 사이즈」)로 부른다
 *   kit_staff_size_preview(읽기 · 현재 사이즈 · sig · 남는 수량) → 확인 창(확인 문구 「사이즈적용」) → kit_staff_size_apply(addw 0 · adda 0) → 되돌리기 = kit_staff_size_undo(그날 한 번)
 * 대상 = 스태프 옷 명단 · 사전 신청 키트 명단(서버 ksWho_ 순서 · 한 사람 한 벌) · 신청번호가 없으면 서버가 발급 · 수량을 넘어도 쓴다(확인 창에 모자람 표시)
 * 칸은 슈퍼관리자(S.me.top · adrTop)에게만 단추 · 다른 콘솔 사람은 지금 사이즈만 본다 */
var PSZ_SIZES=["SS","L","2XL","3XL"], PSZ_W="사이즈적용";
var PSZ_ST={ same:"지금 사이즈와 같습니다", hum:"옷 대상이 아닙니다 · 라운지 가습기", add:"옷 명단에 없습니다 · 스태프 옷에 먼저 넣습니다", none:"명부에 없는 사번입니다", size:"사이즈가 맞지 않습니다", multi:"사번을 확인합니다", dup:"같은 줄이 두 번입니다" };
function pszTop(){ return typeof adrTop==="function"?adrTop():!!(S.me&&S.me.top); }
function pszPool(k){ return k&&k.pool==="staff"?"스태프 옷":"사전 신청 키트"; }
function pcSzHtml(d){
  var k=d.kit, J=jq(d.emp), cur=k&&k.sz||"";
  var cap=k?(cur?"지금 "+cur+(k.how==="auto"?"(자동)":""):"아직 안 정함")+" · "+pszPool(k)+(k.no?" · "+k.no:""):"옷 명단에 없음 · 스태프 옷에 넣은 뒤 정함";
  var ctl="";
  if(k&&pszTop()) ctl='<select class="xg-q" id="pcSz" aria-label="옷 사이즈" style="width:auto">'+PSZ_SIZES.map(function(z){ return '<option value="'+z+'"'+(z===cur?" selected":"")+'>'+z+'</option>'; }).join("")+'</select><button class="btn sm" type="button" onclick="pcSzAsk(\''+J+'\')">'+(cur?"사이즈 바꾸기":"사이즈 넣기")+'</button>';
  else if(k) cap+=" · 넣기 · 바꾸기는 슈퍼관리자";
  return '<div class="pc-pr'+(cur?" got":"")+'"><span class="t"><b>옷 사이즈</b><span class="cap">'+esc(cap)+'</span></span>'+ctl+'</div>';
}
function pcSzAsk(emp){
  if(!pszTop()){ toast("슈퍼관리자만 합니다",{ bad:1 }); return; }
  var k=(PC.d||{}).kit||{}, sz=(el("pcSz")||{}).value, rows=emp+" "+sz; if(!sz) return;
  if(k.sz===sz){ toast(PSZ_ST.same); return; }
  call("kit_staff_size_preview",{ rows:rows, addw:"0" }).then(function(r){
    if(!(r&&r.ok)){ toast("확인하지 못했습니다 · "+why(r),{ bad:1 }); return; }
    var x=(r.rows||[])[0]||{};
    if(x.st!=="set"&&x.st!=="new"){ toast(PSZ_ST[x.st]||"넣지 못합니다 · "+(x.st||"-"),{ bad:x.st!=="same" }); return; }
    var left=r.left&&r.left.all?r.left.all[sz]:null, short=left!=null&&left<0;
    confirmBox({ t:x.cur?"옷 사이즈를 바꿀까요?":"옷 사이즈를 넣을까요?", who:pcWho(emp), sub:(x.cur?x.cur+" → ":"")+sz+" · "+(x.pool==="staff"?"스태프 옷":"사전 신청 키트")+" · 본인 앱에 바로 보임 · 되돌리기 7초 · 활동 기록에 남음",
      body:'<table class="tb"><tbody><tr><td>신청번호</td><td class="n">'+esc(x.no||"새로 발급")+'</td></tr><tr><td>적용 뒤 '+esc(sz)+' 남는 수</td><td class="n">'+(left==null?"-":short?tag("모자람 "+n0(-left)+"벌","warn"):n0(left)+"벌")+'</td></tr></tbody></table>'+
        '<label class="fld">확인 문구 「'+PSZ_W+'」를 그대로 넣습니다<input class="in" id="pszQ" autocomplete="off" oninput="gateUpd()"></label>',
      focus:"pszQ", ok:x.cur?"바꾸기":"넣기", gate:function(){ var i=el("pszQ"); return !!i&&i.value.trim()===PSZ_W; },
      run:function(){ return call("kit_staff_size_apply",{ rows:rows, sig:r.sig, confirm:PSZ_W, addw:"0", adda:"0" }); },
      fail:function(y){ return y&&y.reason==="state"?"그 사이 바뀌었습니다 · 닫고 다시 누릅니다":y&&y.reason==="none"?PSZ_ST.same:""; },
      done:function(y){ pcAfter(); toast((x.cur?"사이즈를 바꿨습니다 · ":"사이즈를 넣었습니다 · ")+sz+(y.nos?" · 신청번호 발급":""), y.batch?{ undo:function(){ pcSzUndo(y.batch); } }:{}); } });
  });
}
function pcSzUndo(b){
  call("kit_staff_size_undo",{ batch:b }).then(function(x){ pcAfter(); toast(x&&x.ok?(x.n?"되돌렸습니다 · 옷 사이즈":"되돌릴 것이 없습니다 · 그 뒤 바뀜"):"되돌리지 못했습니다 · "+why(x),{ bad:!(x&&x.ok&&x.n) }); });
}
