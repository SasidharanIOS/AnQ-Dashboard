import React, { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarDays, Search } from "lucide-react";
import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { moveTypeLabel, routeLabel } from "../../utils/mappers.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminJobsPage() {
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const loadJobs = async () => {
    try {
      setJobs(safeArray(await adminAPI.jobs({ limit: 50 })));
    } catch (error) {
      showToast(error.message || "Failed to load jobs", "error");
      setJobs([]);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return jobs.filter((job) =>
      [
        job.job_id,
        job.customer?.full_name,
        job.move_type,
        job.pickup_postcode,
        job.delivery_postcode,
        job.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, keyword]);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <BriefcaseBusiness size={25} />
        </div>

        <div>
          <h2>Jobs</h2>
          <p>Search, filter and manage all move requests.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search job, customer, postcode..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Job Management</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Move Type</th>
                <th>Route</th>
                <th>Move Date</th>
                <th>Status</th>
                <th>Assigned Vendor</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((job) => (
                <tr key={job.id}>
                  <td>
                    <b>{job.job_id}</b>
                    <small>CUS-{job.customer_id}</small>
                  </td>

                  <td>{job.customer?.full_name || "Customer"}</td>
                  <td>{moveTypeLabel(job.move_type)}</td>
                  <td>{routeLabel(job.pickup_postcode, job.delivery_postcode)}</td>

                  <td>
                    <CalendarDays size={13} />
                    {formatDate(job.moving_date)}
                  </td>

                  <td>
                    <em className={`status-chip ${String(job.status).replaceAll("_", "-")}`}>
                      {String(job.status || "pending").replaceAll("_", " ")}
                    </em>
                  </td>

                  <td>{job.selected_vendor?.company_name || job.assigned_vendor_name || "—"}</td>

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

      <Modal open={!!selectedJob} title="Job Details" onClose={() => setSelectedJob(null)} size="lg">
        <div className="details-clean-grid">
          <b>Job ID</b>
          <span>{selectedJob?.job_id}</span>

          <b>Customer</b>
          <span>{selectedJob?.customer?.full_name || "—"}</span>

          <b>Move Type</b>
          <span>{moveTypeLabel(selectedJob?.move_type)}</span>

          <b>Route</b>
          <span>{routeLabel(selectedJob?.pickup_postcode, selectedJob?.delivery_postcode)}</span>

          <b>Pickup Address</b>
          <span>{selectedJob?.pickup_address || "—"}</span>

          <b>Delivery Address</b>
          <span>{selectedJob?.delivery_address || "—"}</span>

          <b>Property</b>
          <span>{selectedJob?.property_size || "—"} / {selectedJob?.property_type || "—"}</span>

          <b>Status</b>
          <span>{String(selectedJob?.status || "pending").replaceAll("_", " ")}</span>

          <b>Deposit Paid</b>
          <span>{selectedJob?.deposit_paid ? "Yes" : "No"}</span>

          <b>Contact Released</b>
          <span>{selectedJob?.contact_released ? "Yes" : "No"}</span>
        </div>
      </Modal>
    </div>
  );
}