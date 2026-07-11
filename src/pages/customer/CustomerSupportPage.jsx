import React, { useState } from "react";
import { Headphones, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { publicAPI } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { TextArea, TextInput } from "../../components/ui/Form.jsx";
import { CardPanel, PageHeader } from "../../components/ui/PortalUI.jsx";

export default function CustomerSupportPage() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", mobile: "", message: "" });
  const send = async (e) => { e.preventDefault(); try { await publicAPI.contact(form); showToast("Support message sent"); setOpen(false); } catch (err) { showToast(err.message, "error"); } };
  const topics = ["How do I request a quote?", "Can I reschedule my move?", "How does the £50 deposit work?", "What if I need to cancel?", "Where will I be charged the remaining amount?", "How do I update documents?"];
  return <div className="page-wrap"><PageHeader icon={Headphones} title="Help & Support" subtitle="We are here to help you with your move." search={search} onSearch={setSearch} placeholder="Search for help articles..." /><div className="content-grid-wide"><CardPanel title="Popular Help Topics" subtitle="Quick support answers." action={<button className="red-btn" onClick={() => setOpen(true)}>Start Live Chat</button>}><div className="progress-list">{topics.filter((t) => t.toLowerCase().includes(search.toLowerCase())).map((topic) => <button className="chat-item" key={topic}><MessageCircle size={16} /><div><b>{topic}</b><p>View answer</p></div></button>)}</div></CardPanel><CardPanel title="Still need help?" subtitle="Our support team is available 24/7."><div className="details-clean-grid"><b>Phone</b><span><Phone size={14} /> 020 8064 1234</span><b>Email</b><span><Mail size={14} /> support@anqmovers.co.uk</span><b>Live Chat</b><span><Headphones size={14} /> Available anytime</span></div><div className="modal-actions"><button className="red-btn" onClick={() => setOpen(true)}>Contact Support</button></div></CardPanel></div><Modal open={open} title="Contact Support" onClose={() => setOpen(false)}><form onSubmit={send}><TextInput label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} /><TextInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} /><TextInput label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} /><TextArea label="Message" value={form.message} onChange={(v) => setForm({ ...form, message: v })} /><div className="modal-actions"><button type="button" className="outline-btn" onClick={() => setOpen(false)}>Cancel</button><button className="red-btn">Send</button></div></form></Modal></div>;
}
