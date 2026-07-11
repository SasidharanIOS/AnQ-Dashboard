import React, { useEffect, useMemo, useState } from "react";
import { FileText, Search, UploadCloud } from "lucide-react";
import { customerAPI, formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { CardPanel, PageHeader, StatusPill } from "../../components/ui/PortalUI.jsx";
import { SelectInput, TextArea, TextInput } from "../../components/ui/Form.jsx";

export default function CustomerDocumentsPage() {
  const { showToast } = useToast();
  const [moves, setMoves] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState({ move_request_id: "", file_type: "inventory", inventory_notes: "", inventory_square_feet: "", inventory_rooms: "", files: null });
  const load = async () => { try { setMoves(safeArray(await customerAPI.moves())); } catch (e) { showToast(e.message, "error"); } };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => moves.filter((m) => [m.job_id, m.status].filter(Boolean).join(" ").toLowerCase().includes(keyword.toLowerCase())), [moves, keyword]);
  const upload = async (e) => { e.preventDefault(); try { const fd = new FormData(); fd.append("file_type", form.file_type); fd.append("inventory_notes", form.inventory_notes); fd.append("inventory_square_feet", form.inventory_square_feet); fd.append("inventory_rooms", form.inventory_rooms); Array.from(form.files || []).forEach((f) => fd.append("files", f)); await customerAPI.uploadMedia(form.move_request_id, fd); showToast("Inventory and documents uploaded"); await load(); } catch (err) { showToast(err.message, "error"); } };
  return (
    <div className="page-wrap">
      <PageHeader icon={FileText} title="Inventory Details" subtitle="Help us understand what you're moving. Upload notes, sq.ft and photos." search={keyword} onSearch={setKeyword} placeholder="Search documents..." />
      <div className="content-grid-wide">
        <CardPanel title="Inventory Details" subtitle="Additional notes and media upload.">
          <form className="workflow-form" onSubmit={upload}>
            <div className="workflow-body">
              <section className="form-section"><div className="form-section-head"><UploadCloud size={19} /><div><h3>Upload Inventory</h3><p>Supported: PDF, JPG, PNG, MP4.</p></div></div>
                <SelectInput label="Move Request" value={form.move_request_id} onChange={(v) => setForm({ ...form, move_request_id: v })} options={[{ value: "", label: "Choose move" }, ...moves.map((m) => ({ value: m.id, label: m.job_id }))]} />
                <TextArea label="Additional Notes" value={form.inventory_notes} onChange={(v) => setForm({ ...form, inventory_notes: v })} placeholder="Any special instructions or additional information..." />
                <TextInput label="Approx. Size / Sq.Ft" value={form.inventory_square_feet} onChange={(v) => setForm({ ...form, inventory_square_feet: v })} placeholder="1200 sq.ft" />
                <TextInput label="Rooms / Boxes" value={form.inventory_rooms} onChange={(v) => setForm({ ...form, inventory_rooms: v })} placeholder="3 rooms, 25 boxes" />
                <label className="upload-drop"><UploadCloud size={30} /><span>Drag & drop files here or<br />Browse Files</span><small>Supported formats: PDF, JPG, PNG, MP4</small><input type="file" multiple onChange={(e) => setForm({ ...form, files: e.target.files })} /></label>
              </section>
            </div>
            <div className="fixed-form-footer"><button type="button" className="outline-btn">Back</button><button className="red-btn">Save & Continue</button></div>
          </form>
        </CardPanel>
        <CardPanel title="Uploaded Documents" subtitle="Move related files by job.">
          <div className="table-scroll"><table style={{ minWidth: 520 }}><thead><tr><th>Job</th><th>Route</th><th>Move Date</th><th>Status</th></tr></thead><tbody>{filtered.map((m) => <tr key={m.id}><td><b>{m.job_id}</b></td><td>{m.pickup_postcode} → {m.delivery_postcode}</td><td>{formatDate(m.moving_date)}</td><td><StatusPill value={m.status} /></td></tr>)}</tbody></table>{!filtered.length ? <div className="empty-state">No documents found.</div> : null}</div>
        </CardPanel>
      </div>
    </div>
  );
}
