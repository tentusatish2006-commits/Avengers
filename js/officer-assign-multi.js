/* Multi-location assign for field officers */
(function(){
  var NER_LOCATIONS = [
    { id: 'loc-ghy', name: 'Guwahati \u2014 Brahmaputra Corridor', state: 'Assam' },
    { id: 'loc-shl', name: 'Shillong \u2014 GS-1 / Nongpoh', state: 'Meghalaya' },
    { id: 'loc-taw', name: 'Tawang Pass \u2014 NH-13 KM62', state: 'Arunachal Pradesh' },
    { id: 'loc-koh', name: 'Kohima Pass \u2014 NH-2', state: 'Nagaland' },
    { id: 'loc-imp', name: 'Imphal Valley Causeway', state: 'Manipur' },
    { id: 'loc-aiz', name: 'Aizawl Approach \u2014 NH-306', state: 'Mizoram' },
    { id: 'loc-agt', name: 'Agartala Corridor \u2014 NH-8', state: 'Tripura' },
    { id: 'loc-gtk', name: 'Gangtok \u2014 Teesta Bridge', state: 'Sikkim' },
    { id: 'loc-sil', name: 'Silchar \u2014 Barak River', state: 'Assam' },
    { id: 'loc-jor', name: 'Jorhat \u2014 Brahmaputra Bridge', state: 'Assam' }
  ];
  function toast(msg, type) {
    if (window.SmartRoute && SmartRoute.showToast) SmartRoute.showToast(msg, type || 'info');
    else alert(msg);
  }
  function enhance() {
    var input = document.getElementById('as-loc');
    if (!input || document.getElementById('as-locations')) return;
    var box = document.createElement('div');
    box.id = 'as-locations';
    box.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:220px;overflow:auto;margin:8px 0;';
    box.innerHTML = NER_LOCATIONS.map(function(loc){
      return '<label style="display:flex;gap:8px;padding:10px;border-radius:8px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);cursor:pointer;font-size:0.82rem;color:#e8f4ff;"><input type="checkbox" class="assign-loc-cb" data-name="'+loc.name+'"><span><strong>'+loc.name+'</strong><br><span style="color:#8fa3b8;font-size:0.75rem;">'+loc.state+'</span></span></label>';
    }).join('');
    var lab = input.previousElementSibling;
    if (lab && lab.tagName === 'LABEL') lab.textContent = 'Select one or more locations (NER)';
    input.style.display = 'none';
    input.parentNode.insertBefore(box, input);
    var h3 = document.querySelector('#assign-modal h3');
    if (h3) h3.textContent = 'Assign Incident \u2014 Multiple Locations';
    var btn = document.getElementById('btn-confirm-assign');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault(); e.stopImmediatePropagation();
        var checked = Array.prototype.slice.call(document.querySelectorAll('.assign-loc-cb:checked'));
        if (!checked.length) { toast('Select at least one location', 'warn'); return false; }
        var names = checked.map(function(c){ return c.getAttribute('data-name'); });
        var type = (document.getElementById('as-type')||{}).value || 'Incident';
        var pri = (document.getElementById('as-pri')||{}).value || 'High';
        var modal = document.getElementById('assign-modal');
        if (modal) modal.classList.remove('show');
        var name = (window.selectedOfficer && selectedOfficer.name) || 'Officer';
        toast(type+' ('+pri+') assigned to '+name+' at '+names.length+' location(s): '+names.join('; '), 'success');
        try {
          var prev = JSON.parse(localStorage.getItem('sr_officer_assignments')||'[]');
          prev.push({ type:type, priority:pri, locations:names, at:new Date().toISOString() });
          localStorage.setItem('sr_officer_assignments', JSON.stringify(prev));
        } catch(err) {}
        return false;
      }, true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
})();
