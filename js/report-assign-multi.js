(function(){
  var NER = [
    {name:'Guwahati - Brahmaputra Corridor',state:'Assam'},
    {name:'Shillong - GS-1 / Nongpoh',state:'Meghalaya'},
    {name:'Tawang Pass - NH-13 KM62',state:'Arunachal Pradesh'},
    {name:'Kohima Pass - NH-2',state:'Nagaland'},
    {name:'Imphal Valley Causeway',state:'Manipur'},
    {name:'Aizawl Approach - NH-306',state:'Mizoram'},
    {name:'Agartala Corridor - NH-8',state:'Tripura'},
    {name:'Gangtok - Teesta Bridge',state:'Sikkim'},
    {name:'Silchar - Barak River',state:'Assam'},
    {name:'Jorhat - Brahmaputra Bridge',state:'Assam'}
  ];
  var currentReportId = null;
  function toast(m,t){ if(window.SmartRoute&&SmartRoute.showToast) SmartRoute.showToast(m,t||'info'); else alert(m); }
  function ensureModal(){
    if(document.getElementById('report-assign-modal')) return;
    var d=document.createElement('div');
    d.id='report-assign-modal';
    d.style.cssText='display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.72);align-items:center;justify-content:center;padding:16px';
    d.innerHTML='<div style="width:min(520px,100%);max-height:90vh;overflow:auto;background:#0a1628;border:1px solid rgba(0,212,255,0.4);border-radius:14px;padding:18px"><h3 style="margin:0 0 10px;color:#00d4ff">Assign Incident - Multiple Locations</h3><p id="ra-ctx" style="color:#8fa3b8;font-size:0.9rem"></p><label style="font-size:0.75rem;color:#8fa3b8">Assign to officer</label><select id="ra-officer" style="width:100%;padding:10px;margin:6px 0 10px;border-radius:8px;background:#061018;color:#fff;border:1px solid rgba(0,212,255,0.3)"><option value="FO-042">FO-042 Ravi Kumar</option><option value="FO-015">FO-015 Lakshmi Devi</option><option value="FO-028">FO-028 Suresh Rao</option><option value="FO-061">FO-061 Anand Babu</option><option value="FO-033">FO-033 Priya Singh</option><option value="FO-077">FO-077 Mohan Rao</option><option value="FO-089">FO-089 Kavitha Reddy</option><option value="FO-055">FO-055 Rajesh Varma</option></select><label style="font-size:0.75rem;color:#8fa3b8">Select one or more locations (NER)</label><div id="ra-locs" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:200px;overflow:auto;margin:8px 0"></div><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button type="button" id="ra-cancel" style="padding:10px 16px;border-radius:8px;border:none;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer">Cancel</button><button type="button" id="ra-ok" style="padding:10px 16px;border-radius:8px;border:none;background:linear-gradient(90deg,#00d4ff,#00ff88);color:#031018;font-weight:700;cursor:pointer">Confirm Assign</button></div></div>';
    document.body.appendChild(d);
    d.onclick=function(e){ if(e.target.id==='report-assign-modal') d.style.display='none'; };
    document.getElementById('ra-cancel').onclick=function(){ d.style.display='none'; };
    document.getElementById('ra-ok').onclick=function(){
      var checked=[].slice.call(document.querySelectorAll('.ra-loc-cb:checked'));
      if(!checked.length){ toast('Select at least one location','warn'); return; }
      var names=checked.map(function(c){ return c.getAttribute('data-name'); });
      var off=document.getElementById('ra-officer');
      var offText=off.options[off.selectedIndex].text;
      toast((currentReportId||'Incident')+' assigned to '+offText+' at '+names.length+' location(s): '+names.join('; '),'success');
      try{ var p=JSON.parse(localStorage.getItem('sr_report_assignments')||'[]'); p.push({reportId:currentReportId,officer:off.value,locations:names,at:new Date().toISOString()}); localStorage.setItem('sr_report_assignments',JSON.stringify(p)); }catch(e){}
      d.style.display='none';
    };
  }
  window.openAssignFromReport = function(id){
    ensureModal();
    currentReportId = id || null;
    document.getElementById('ra-ctx').textContent = id ? ('Report '+id+' - select officer and one or more locations') : 'Select officer and locations';
    document.getElementById('ra-locs').innerHTML = NER.map(function(loc){
      return '<label style="display:flex;gap:8px;padding:8px;border-radius:8px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);cursor:pointer;font-size:0.82rem;color:#e8f4ff"><input type="checkbox" class="ra-loc-cb" data-name="'+loc.name+'"><span><strong>'+loc.name+'</strong><br><span style="color:#8fa3b8;font-size:0.75rem">'+loc.state+'</span></span></label>';
    }).join('');
    document.getElementById('report-assign-modal').style.display='flex';
  };
  document.addEventListener('DOMContentLoaded', function(){
    ensureModal();
    function wireAssignButtons(){
      document.querySelectorAll('.btn-view').forEach(function(btn){
        if(btn.parentNode.querySelector('.btn-assign-multi')) return;
        var a=document.createElement('button');
        a.type='button'; a.className='btn-view btn-assign-multi';
        a.textContent='ASSIGN'; a.style.marginLeft='6px'; a.style.borderColor='#00ff88'; a.style.color='#00ff88';
        a.onclick=function(e){ e.stopPropagation(); openAssignFromReport(btn.getAttribute('data-id')); };
        btn.parentNode.appendChild(a);
      });
    }
    wireAssignButtons();
    var tb=document.getElementById('reports-tbody');
    if(tb){ var obs2=new MutationObserver(wireAssignButtons); obs2.observe(tb,{childList:true}); }
  });
})();
