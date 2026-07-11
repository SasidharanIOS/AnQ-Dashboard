import React, { useEffect, useMemo, useState } from "react";
import { Link2, Search } from "lucide-react";
import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { routeLabel } from "../../utils/mappers.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { FormGrid, SelectInput, TextArea } from "../../components/ui/Form.jsx";

export default function AdminAssignmentsPage() {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showAssign, setShowAssign] = useState(false);

  const [form, setForm] = useState({
    move_request_id: "",
    vendor_id: "",
    priority: "normal",
    admin_notes: ""
  });

  const loadData = async () => {
    try {
      setJobs(safeArray(await adminAPI.jobs({ limit: 50 })));
      setVendors(safeArray(await adminAPI.vendors({ limit: 100 })));
    } catch (error) {
      showToast(error.message || "Failed to load assignments", "error");
      setJobs([]);
      setVendors([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return jobs.filter((job) =>
      [job.job_id, job.customer?.full_name, job.pickup_postcode, job.delivery_postcode, job.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, keyword]);

  const assignVendor = async (event) => {
    event.preventDefault();

    try {
      await adminAPI.createAssignment({
        move_request_id: form.move_request_id,
        vendor_id: form.vendor_id,
        priority: form.priority,
        admin_notes: form.admin_notes
      });

      showToast("Vendor assigned successfully");
      setShowAssign(false);
      loadData();
    } catch (error) {
      showToast(error.message || "Failed to assign vendor", "error");
    }
  };

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <Link2 size={25} />
        </div>

        <div>
          <h2>Assignments</h2>
          <p>Manually assign vendors to move requests.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search job..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Vendor Assignment Queue</h2>

          <button className="red-btn" onClick={() => setShowAssign(true)}>
            Assign Vendor
          </button>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Moving Date</th>
                <th>Status</th>
                <th>Selected Vendor</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td>
                    <b>{job.job_id}</b>
                  </td>

                  <td>{job.customer?.full_name || "Customer"}</td>
                  <td>{routeLabel(job.pickup_postcode, job.delivery_postcode)}</td>
                  <td>{formatDate(job.moving_date)}</td>

                  <td>
                    <em className={`status-chip ${String(job.status).replaceAll("_", "-")}`}>
                      {String(job.status || "pending").replaceAll("_", " ")}
                    </em>
                  </td>

                  <td>{job.selected_vendor?.company_name || "Not selected"}</td>

                  <td>
                    <button className="tiny-btn" onClick={() => setSelectedJob(job)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No jobs found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedJob} title="Assignment Details" onClose={() => setSelectedJob(null)} size="lg">
        <div className="details-clean-grid">
          <b>Job ID</b>
          <span>{selectedJob?.job_id}</span>

          <b>Customer</b>
          <span>{selectedJob?.customer?.full_name || "—"}</span>

          <b>Route</b>
          <span>{routeLabel(selectedJob?.pickup_postcode, selectedJob?.delivery_postcode)}</span>

          <b>Moving Date</b>
          <span>{formatDate(selectedJob?.moving_date)}</span>

          <b>Status</b>
          <span>{String(selectedJob?.status || "pending").replaceAll("_", " ")}</span>

          <b>Selected Vendor</b>
          <span>{selectedJob?.selected_vendor?.company_name || "—"}</span>
        </div>
      </Modal>

      <Modal open={showAssign} title="Assign Vendor" onClose={() => setShowAssign(false)} size="lg">
        <form onSubmit={assignVendor}>
          <FormGrid>
            <SelectInput
              label="Move Request"
              value={form.move_request_id}
              onChange={(value) => setForm({ ...form, move_request_id: value })}
              options={[
                { value: "", label: "Choose job" },
                ...jobs.map((job) => ({
                  value: job.id,
                  label: `${job.job_id} - ${job.pickup_postcode} to ${job.delivery_postcode}`
                }))
              ]}
            />

            <SelectInput
              label="Vendor"
              value={form.vendor_id}
              onChange={(value) => setForm({ ...form, vendor_id: value })}
              options={[
                { value: "", label: "Choose vendor" },
                ...vendors.map((vendor) => ({
                  value: vendor.id,
                  label: vendor.company_name
                }))
              ]}
            />

            <SelectInput
              label="Priority"
              value={form.priority}
              onChange={(value) => setForm({ ...form, priority: value })}
              options={[
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" }
              ]}
            />
          </FormGrid>

          <TextArea
            label="Admin Notes"
            value={form.admin_notes}
            onChange={(value) => setForm({ ...form, admin_notes: value })}
          />

          <div className="modal-actions">
            <button type="button" className="outline-btn" onClick={() => setShowAssign(false)}>
              Cancel
            </button>
            <button className="red-btn">Assign Vendor</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}