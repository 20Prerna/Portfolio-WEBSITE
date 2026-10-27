(() => {
  const $ = id => document.getElementById(id);
  let enquiries = [];
  let authorised = false;
  const statusLabels = {new:"New",contacted:"Contacted",converted:"Converted",archived:"Archived"};
  function setAlert(message, kind="") { $("alert").textContent = message; $("alert").className = "alert " + kind; }
  function safeText(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function fmtDate(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}); }
  async function load() {
    $("refresh").disabled = true; setAlert("Loading enquiries…");
    try {
      const response = await fetch("/api/admin/enquiries", {credentials:"same-origin"});
      if (response.status === 401 || response.status === 403) {
        authorised = false;
        setAlert("Admin access required. Sign in as the Hatchable project owner/admin, then reload this page. This dashboard does not use a shared hard-coded password.", "error");
        enquiries = []; render(); return;
      }
      if (!response.ok) throw new Error("Could not load enquiries (HTTP " + response.status + ").");
      const data = await response.json(); enquiries = Array.isArray(data.enquiries) ? data.enquiries : [];
      authorised = true; setAlert("Connected. Enquiries are loading from the project's database.", "ok"); render();
    } catch (err) { setAlert(err.message || "Unable to connect to the enquiry database.", "error"); }
    finally { $("refresh").disabled = false; }
  }
  function render() {
    const status = $("status-filter").value, goal = $("goal-filter").value, query = $("search").value.trim().toLowerCase();
    const filtered = enquiries.filter(e => (status==="all" || e.status===status) && (goal==="all" || e.goal===goal) && (!query || [e.name,e.email,e.goal,e.message].some(v => String(v||"").toLowerCase().includes(query))));
    $("total").textContent = enquiries.length;
    $("new-count").textContent = enquiries.filter(e=>e.status==="new").length;
    $("contacted-count").textContent = enquiries.filter(e=>e.status==="contacted").length;
    $("converted-count").textContent = enquiries.filter(e=>e.status==="converted").length;
    $("result-count").textContent = "Showing " + filtered.length + " of " + enquiries.length + " enquiries.";
    const tbody = $("rows");
    if (!authorised || !filtered.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">' + (authorised ? "No enquiries match these filters." : "Enquiries appear here after authorised admin access is available.") + '</td></tr>'; return; }
    tbody.innerHTML = filtered.map(e => '<tr><td>'+safeText(fmtDate(e.created_at))+'</td><td><strong>'+safeText(e.name)+'</strong><small>'+safeText(e.email)+'</small></td><td>'+safeText(e.goal)+'</td><td><div class="message">'+safeText(e.message || "—")+'</div></td><td><select class="status-select" data-status-id="'+safeText(e.id)+'">'+Object.entries(statusLabels).map(([k,v])=>'<option value="'+k+'" '+(e.status===k?'selected':'')+'>'+v+'</option>').join("")+'</select></td><td><div class="actions"><a href="mailto:'+encodeURIComponent(e.email)+'?subject='+encodeURIComponent("Your nutrition enquiry")+'">Email</a></div></td></tr>').join("");
    tbody.querySelectorAll("[data-status-id]").forEach(el=>el.addEventListener("change", async () => {
      const previous = enquiries.find(e=>e.id===el.dataset.statusId)?.status;
      el.disabled = true;
      try {
        const response = await fetch("/api/admin/enquiries",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:el.dataset.statusId,status:el.value})});
        if(!response.ok) throw new Error("Status update failed.");
        const item = enquiries.find(e=>e.id===el.dataset.statusId); if(item) item.status=el.value;
        setAlert("Enquiry status updated.","ok"); render();
      } catch { el.value=previous || "new"; setAlert("Could not update the status. Please refresh and try again.","error"); }
      finally { el.disabled=false; }
    }));
  }
  function csvCell(value) { return '"'+String(value??"").replace(/"/g,'""')+'"'; }
  $("export").addEventListener("click", () => {
    if (!authorised) { setAlert("Sign in with authorised admin access before exporting data.","error"); return; }
    const status=$("status-filter").value, goal=$("goal-filter").value, query=$("search").value.trim().toLowerCase();
    const rows=enquiries.filter(e=>(status==="all"||e.status===status)&&(goal==="all"||e.goal===goal)&&(!query||[e.name,e.email,e.goal,e.message].some(v=>String(v||"").toLowerCase().includes(query))));
    const csv=[["Received","Name","Email","Interest","Message","Status","Source"],...rows.map(e=>[e.created_at,e.name,e.email,e.goal,e.message,e.status,e.source])].map(row=>row.map(csvCell).join(",")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}), url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download="nutrition-enquiries.csv";a.click();URL.revokeObjectURL(url);
  });
  ["search","status-filter","goal-filter"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",render));
  $("refresh").addEventListener("click",load); load();
})();