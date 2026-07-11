import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Search, UploadCloud } from "lucide-react";
import { adminAPI, authAPI, customerAPI, formatDate, money, publicAPI, safeArray, vendorAPI } from "../../services/api.js";
import { moveTypeLabel, routeLabel } from "../../utils/mappers.js";
import Modal from "../../components/ui/Modal.jsx";
import { FormGrid, SelectInput, TextArea, TextInput } from "../../components/ui/Form.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

const sampleRows = [
  { id: 1, reference: "ANQ-260014", name: "James Carter", status: "Confirmed", date: "17 Jun 2025", priority: "High" },
  { id: 2, reference: "ANQ-260015", name: "Sarah Johnson", status: "In Progress", date: "18 Jun 2025", priority: "Normal" },
  { id: 3, reference: "ANQ-260016", name: "Michael Taylor", status: "Pending", date: "19 Jun 2025", priority: "Normal" },
  { id: 4, reference: "ANQ-260017", name: "Emily Brown", status: "Completed", date: "20 Jun 2025", priority: "Normal" },
];

const moduleCopy = {
  "My Move": "Create and manage move requests connected to /api/customer/moves.",
  Quotes: "Compare, select and manage quotes from verified movers.",
  Messages: "View conversations and send messages without exposing contact details.",
  Payments: "Track Stripe deposits and payment confirmation status.",
  Documents: "Upload inventory, photos, videos and documents for a move profile.",
  Profile: "Update account profile information from backend auth APIs.",
  "New Leads": "Assigned lead pipeline for vendor quoting.",
  "Assigned Jobs": "Vendor jobs and quote opportunities assigned by admin.",
  Vendors: "Create, verify, suspend and manage moving companies.",
  Jobs: "Search, filter and manage all move requests.",
  Customers: "Admin customer support and suspension management.",
  Assignments: "Manual vendor assignment workflow for pending leads.",
  Analytics: "Platform analytics from the admin analytics API.",
  "Audit Logs": "Super-admin audit trail for important platform actions.",
};

function rowFromAny(item, role, module) {
  if (item?.job_id || item?.move?.job_id) {
    const move = item.move || item;
    return { raw: item, id: move.id || item.id, reference: move.job_id, name: move.customer?.full_name || item.customer?.full_name || move.property_size || move.property_type || "Move Request", status: item.assignment?.status || move.status || item.status || "pending", date: formatDate(move.moving_date || item.created_at), priority: item.assignment?.priority ? "High" : "Normal", route: routeLabel(move.pickup_postcode, move.delivery_postcode) };
  }
  if (item?.company_name) return { raw: item, id: item.id, reference: `VEN-${item.id}`, name: item.company_name, status: item.status || item.verification_status, date: formatDate(item.created_at), priority: item.verification_status || "Normal" };
  if (item?.full_name) return { raw: item, id: item.id, reference: `CUS-${item.id}`, name: item.full_name, status: item.status, date: formatDate(item.created_at), priority: item.mobile || "Normal" };
  if (item?.quote_amount) return { raw: item, id: item.id, reference: item.move?.job_id || `QUOTE-${item.id}`, name: money(item.quote_amount), status: item.status, date: formatDate(item.submitted_at || item.created_at), priority: item.currency || "GBP" };
  if (item?.amount) return { raw: item, id: item.id, reference: item.move?.job_id || `PAY-${item.id}`, name: money(item.amount), status: item.status, date: formatDate(item.paid_at || item.created_at), priority: item.payment_gateway || "Stripe" };
  if (item?.title || item?.message) return { raw: item, id: item.id, reference: item.title || `MSG-${item.id}`, name: item.message || item.module || "Message", status: item.is_read ? "read" : item.status || "new", date: formatDate(item.created_at), priority: item.type || item.action || "Normal" };
  return { raw: item, id: item?.id || Math.random(), reference: item?.reference || `${role}-${module}`, name: item?.name || module, status: item?.status || "Active", date: formatDate(item?.created_at), priority: "Normal" };
}

async function loadModule(role, module) {
  if (role === "customer") {
    if (module === "My Move") return safeArray(await customerAPI.moves());
    if (module === "Quotes") { const moves = safeArray(await customerAPI.moves()); return moves.length ? safeArray(await customerAPI.quotes(moves[0].id)) : []; }
    if (module === "Messages") return safeArray(await customerAPI.conversations());
    if (module === "Payments") return safeArray(await customerAPI.payments());
    if (module === "Profile") return [await authAPI.profile("customer")];
    if (module === "Documents") return safeArray(await customerAPI.moves());
  }
  if (role === "vendor") {
    if (["New Leads", "Assigned Jobs", "Completed Jobs"].includes(module)) return safeArray(await vendorAPI.leads(module === "New Leads" ? { status: "assigned" } : {}));
    if (module === "Quotes") return safeArray(await vendorAPI.quotes());
    if (module === "Messages") return safeArray(await vendorAPI.conversations());
    if (["Company Profile", "Documents"].includes(module)) return [await authAPI.profile("vendor")];
  }
  if (role === "admin") {
    if (module === "Jobs" || module === "Assignments") return safeArray(await adminAPI.jobs({ limit: 30 }));
    if (module === "Customers") return safeArray(await adminAPI.customers({ limit: 30 }));
    if (module === "Vendors") return safeArray(await adminAPI.vendors({ limit: 30 }));
    if (module === "Messages") return safeArray(await adminAPI.conversations());
    if (module === "Payments") return safeArray(await adminAPI.payments());
    if (module === "Analytics") return [await adminAPI.analytics()];
    if (module === "Audit Logs") return safeArray(await adminAPI.auditLogs());
    if (module === "Settings") return [await adminAPI.homeContent()];
  }
  return [];
}

export default function ModulePage({ module, role }){
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [moveForm, setMoveForm] = useState({ move_type: "house_move", moving_date: "", pickup_postcode: "", delivery_postcode: "", property_type: "House", property_size: "2 Bed Flat", pickup_address: "", delivery_address: "" });
  const [vendorForm, setVendorForm] = useState({ company_name: "", contact_person: "", email: "", mobile: "", password: "Vendor@12345", status: "active", verification_status: "verified" });
  const [supportForm, setSupportForm] = useState({ full_name: "", email: "", mobile: "", message: "" });
  const [fileData, setFileData] = useState({ move_request_id: "", file_type: "photo", files: null });

  const reload = async () => {
    setLoading(true); setError("");
    try { const data = await loadModule(role, module); setRows(safeArray(data).map((x) => rowFromAny(x, role, module))); }
    catch (err) { setError(err.message); setRows(sampleRows); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, [role, module]);

  const filtered = useMemo(() => rows.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const stats = useMemo(() => ({ total: rows.length, active: rows.filter(r => /active|confirmed|submitted|assigned/i.test(r.status)).length, pending: rows.filter(r => /pending|profile|new|assigned/i.test(r.status)).length, completed: rows.filter(r => /completed|succeeded|verified/i.test(r.status)).length }), [rows]);

  const createAction = () => {
    if (role === "customer" && module === "My Move") setModal({ type: "createMove" });
    else if (role === "admin" && module === "Vendors") setModal({ type: "createVendor" });
    else if (role === "customer" && module === "Documents") setModal({ type: "upload" });
    else if (module === "Help & Support") setModal({ type: "support" });
    else showToast(`${module} actions are loaded from backend. Open a row to manage it.`, "error");
  };

  const submitCreateMove = async (e) => { e.preventDefault(); try { await customerAPI.createMove(moveForm); showToast("Move request created"); setModal(null); reload(); } catch (err) { showToast(err.message, "error"); } };
  const submitVendor = async (e) => { e.preventDefault(); try { await adminAPI.createVendor(vendorForm); showToast("Vendor created"); setModal(null); reload(); } catch (err) { showToast(err.message, "error"); } };
  const submitSupport = async (e) => { e.preventDefault(); try { await publicAPI.contact(supportForm); showToast("Support message sent"); setModal(null); } catch (err) { showToast(err.message, "error"); } };
  const submitUpload = async (e) => { e.preventDefault(); try { const fd = new FormData(); fd.append("file_type", fileData.file_type); Array.from(fileData.files || []).forEach((f) => fd.append("files", f)); await customerAPI.uploadMedia(fileData.move_request_id, fd); showToast("Files uploaded"); setModal(null); reload(); } catch (err) { showToast(err.message, "error"); } };

  const rowAction = async (row, action) => {
    try {
      if (action === "suspend" && role === "admin" && module === "Vendors") { await adminAPI.updateVendorStatus(row.id, "suspended"); showToast("Vendor suspended"); reload(); return; }
      if (action === "verify" && role === "admin" && module === "Vendors") { await adminAPI.verifyVendor(row.id, "verified"); showToast("Vendor verified"); reload(); return; }
      if (action === "suspend" && role === "admin" && module === "Customers") { await adminAPI.updateCustomerStatus(row.id, "suspended"); showToast("Customer suspended"); reload(); return; }
      if (action === "cancel" && role === "customer" && module === "My Move") { await customerAPI.cancelMove(row.id); showToast("Move cancelled"); reload(); return; }
      if (action === "withdraw" && role === "vendor" && module === "Quotes") { await vendorAPI.withdrawQuote(row.id); showToast("Quote withdrawn"); reload(); return; }
      setModal({ type: "details", row });
    } catch (err) { showToast(err.message, "error"); }
  };

  return <div className="module-page">
    {error ? <div className="api-warning">Could not load live backend rows. Showing fallback structure. {error}</div> : null}
    <section className="card module-hero"><div className="stat-icon blue"><ClipboardList size={25}/></div><div><h2>{module}</h2><p>{moduleCopy[module] || "Connected module screen ready for backend API actions."}</p></div><div className="module-search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search Job ID, Customer ID or Vendor ID..."/><Search size={17}/></div></section>
    <div className="module-stats"><div className="card"><span>Total</span><b>{stats.total}</b><p>Live API</p></div><div className="card"><span>Active</span><b>{stats.active}</b><p>↑ Active</p></div><div className="card"><span>Pending</span><b>{stats.pending}</b><p>Needs action</p></div><div className="card"><span>Completed</span><b>{stats.completed}</b><p>Finished</p></div></div>
    <section className="card module-table"><div className="panel-head"><h2>{module} List</h2><button className="red-btn" onClick={createAction}>{module === "Documents" ? "Upload Files" : "Create New"}</button></div><div className="table-scroll module-table-scroll"><table><thead><tr><th>Reference</th><th>Name</th><th>Status</th><th>Date</th><th>Priority</th><th>Actions</th></tr></thead><tbody>{filtered.map(r=><tr key={`${r.reference}-${r.id}`}><td><b>{r.reference}</b>{r.route ? <small>{r.route}</small> : null}</td><td>{r.name}</td><td><em className={`status-chip ${String(r.status).toLowerCase().replaceAll('_','-').replaceAll(' ', '-')}`}>{String(r.status).replaceAll('_',' ')}</em></td><td><CalendarDays size={13}/>{r.date}</td><td><em className={r.priority==='High'?'priority-high':'priority-normal'}>{r.priority}</em></td><td className="row-actions"><button className="tiny-btn" onClick={() => rowAction(r, "view")}>View Details</button>{role === "admin" && module === "Vendors" ? <><button className="tiny-btn" onClick={() => rowAction(r, "verify")}>Verify</button><button className="tiny-btn red-text" onClick={() => rowAction(r, "suspend")}>Suspend</button></> : null}{role === "admin" && module === "Customers" ? <button className="tiny-btn red-text" onClick={() => rowAction(r, "suspend")}>Suspend</button> : null}{role === "customer" && module === "My Move" ? <button className="tiny-btn red-text" onClick={() => rowAction(r, "cancel")}>Cancel</button> : null}{role === "vendor" && module === "Quotes" ? <button className="tiny-btn red-text" onClick={() => rowAction(r, "withdraw")}>Withdraw</button> : null}</td></tr>)}</tbody></table></div>{loading ? <p className="table-loading">Loading...</p> : null}</section>

    <Modal open={modal?.type === "details"} title="Details" onClose={()=>setModal(null)} size="lg"><pre className="json-preview">{JSON.stringify(modal?.row?.raw || modal?.row, null, 2)}</pre></Modal>
    <Modal open={modal?.type === "createMove"} title="Create Move Request" onClose={()=>setModal(null)} size="lg"><form onSubmit={submitCreateMove}><FormGrid><SelectInput label="Move Type" value={moveForm.move_type} onChange={(v)=>setMoveForm({...moveForm,move_type:v})} options={["house_move","office_move","packing","storage"]}/><TextInput label="Moving Date" type="date" value={moveForm.moving_date} onChange={(v)=>setMoveForm({...moveForm,moving_date:v})}/><TextInput label="Pickup Postcode" value={moveForm.pickup_postcode} onChange={(v)=>setMoveForm({...moveForm,pickup_postcode:v})}/><TextInput label="Delivery Postcode" value={moveForm.delivery_postcode} onChange={(v)=>setMoveForm({...moveForm,delivery_postcode:v})}/><TextInput label="Property Type" value={moveForm.property_type} onChange={(v)=>setMoveForm({...moveForm,property_type:v})}/><TextInput label="Property Size" value={moveForm.property_size} onChange={(v)=>setMoveForm({...moveForm,property_size:v})}/></FormGrid><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>Cancel</button><button className="red-btn">Create Move</button></div></form></Modal>
    <Modal open={modal?.type === "createVendor"} title="Create Vendor" onClose={()=>setModal(null)} size="lg"><form onSubmit={submitVendor}><FormGrid>{["company_name","contact_person","email","mobile","password"].map(k=><TextInput key={k} label={k.replaceAll('_',' ')} value={vendorForm[k]} onChange={(v)=>setVendorForm({...vendorForm,[k]:v})} type={k==="password"?"password":"text"}/>)}</FormGrid><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>Cancel</button><button className="red-btn">Create Vendor</button></div></form></Modal>
    <Modal open={modal?.type === "upload"} title="Upload Move Documents" onClose={()=>setModal(null)}><form onSubmit={submitUpload}><SelectInput label="Move Request" value={fileData.move_request_id} onChange={(v)=>setFileData({...fileData, move_request_id:v})} options={[{value:"", label:"Choose move"}, ...rows.map(r=>({value:r.id,label:r.reference}))]}/><SelectInput label="File Type" value={fileData.file_type} onChange={(v)=>setFileData({...fileData,file_type:v})} options={["inventory","photo","video","document"]}/><label className="upload-drop"><UploadCloud size={24}/><span>Select files</span><input type="file" multiple onChange={(e)=>setFileData({...fileData, files:e.target.files})}/></label><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>Cancel</button><button className="red-btn">Upload</button></div></form></Modal>
    <Modal open={modal?.type === "support"} title="Contact Support" onClose={()=>setModal(null)}><form onSubmit={submitSupport}><TextInput label="Full Name" value={supportForm.full_name} onChange={(v)=>setSupportForm({...supportForm,full_name:v})}/><TextInput label="Email" value={supportForm.email} onChange={(v)=>setSupportForm({...supportForm,email:v})}/><TextInput label="Mobile" value={supportForm.mobile} onChange={(v)=>setSupportForm({...supportForm,mobile:v})}/><TextArea label="Message" value={supportForm.message} onChange={(v)=>setSupportForm({...supportForm,message:v})}/><div className="modal-actions"><button type="button" className="outline-btn" onClick={()=>setModal(null)}>Cancel</button><button className="red-btn">Send</button></div></form></Modal>
  </div>
}
