import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();

  const [logs, setLogs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLogs(safeArray(await adminAPI.auditLogs()));
      } catch (error) {
        showToast(error.message || "Failed to load audit logs", "error");
        setLogs([]);
      }
    };

    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return logs.filter((log) =>
      [
        log.module,
        log.action,
        log.actor_type,
        log.target_type,
        log.ip_address
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, keyword]);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <ClipboardList size={25} />
        </div>

        <div>
          <h2>Audit Logs</h2>
          <p>Track important platform actions by admins, vendors, customers and system processes.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search audit logs..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Activity Logs</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Actor</th>
                <th>Module</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP Address</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <b>LOG-{log.id}</b>
                  </td>

                  <td>{log.actor_type} #{log.actor_id}</td>
                  <td>{log.module || "—"}</td>
                  <td>{log.action || "—"}</td>
                  <td>{log.target_type || "—"} #{log.target_id || "—"}</td>
                  <td>{log.ip_address || "—"}</td>
                  <td>{formatDate(log.created_at)}</td>

                  <td>
                    <button className="tiny-btn" onClick={() => setSelectedLog(log)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No audit logs found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedLog} title="Audit Log Details" onClose={() => setSelectedLog(null)} size="lg">
        <div className="details-clean-grid">
          <b>Log ID</b>
          <span>LOG-{selectedLog?.id}</span>

          <b>Actor Type</b>
          <span>{selectedLog?.actor_type || "—"}</span>

          <b>Actor ID</b>
          <span>{selectedLog?.actor_id || "—"}</span>

          <b>Module</b>
          <span>{selectedLog?.module || "—"}</span>

          <b>Action</b>
          <span>{selectedLog?.action || "—"}</span>

          <b>Target Type</b>
          <span>{selectedLog?.target_type || "—"}</span>

          <b>Target ID</b>
          <span>{selectedLog?.target_id || "—"}</span>

          <b>IP Address</b>
          <span>{selectedLog?.ip_address || "—"}</span>

          <b>User Agent</b>
          <span>{selectedLog?.user_agent || "—"}</span>

          <b>Date</b>
          <span>{formatDate(selectedLog?.created_at)}</span>
        </div>
      </Modal>
    </div>
  );
}