import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Truck } from "lucide-react";

import { customerAPI, formatDate, safeArray } from "../../services/api.js";
import { routeLabel, moveTypeLabel } from "../../utils/mappers.js";
import { useToast } from "../../components/ui/Toast.jsx";
import {
  CardPanel,
  PageHeader,
  StatusPill
} from "../../components/ui/PortalUI.jsx";
import {
  FormGrid,
  SelectInput,
  TextInput
} from "../../components/ui/Form.jsx";

const initialForm = {
  move_type: "house_move",
  pickup_postcode: "",
  delivery_postcode: "",
  moving_date: "",
  preferred_date_from: "",
  preferred_date_to: "",
  storage_required: "false",
  storage_from_date: "",
  storage_to_date: "",
  storage_location_from: "",
  storage_location_to: "",
  pickup_address: "",
  delivery_address: "",
  property_type: "House",
  property_size: "2 Bed Flat"
};

export default function CustomerMyMovePage() {
  const { showToast } = useToast();

  const [moves, setMoves] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setMoves(safeArray(await customerAPI.moves()));
    } catch (error) {
      showToast(error.message || "Failed to load move requests", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.pickup_postcode.trim()) {
      showToast("Collection postcode is required", "error");
      return;
    }

    if (!form.delivery_postcode.trim()) {
      showToast("Delivery postcode is required", "error");
      return;
    }

    if (!form.moving_date && !form.preferred_date_from) {
      showToast("Collection date is required", "error");
      return;
    }

    setSaving(true);

    try {
      await customerAPI.createMove({
        ...form,
        moving_date: form.moving_date || form.preferred_date_from,
        storage_required: form.storage_required === "true"
      });

      showToast("Move request saved");
      setForm(initialForm);
      await load();
    } catch (error) {
      showToast(error.message || "Failed to save move request", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap customer-my-move-page">
      <style>
        {`
          .customer-my-move-page {
            height: calc(100vh - 92px);
            max-height: calc(100vh - 92px);
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 8px 34px 0;
          }

          .customer-my-move-page::-webkit-scrollbar {
            width: 8px;
          }

          .customer-my-move-page::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .customer-my-move-page::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .customer-my-move-page .my-move-content {
            display: grid;
            grid-template-columns: minmax(520px, 1.2fr) minmax(360px, 0.8fr);
            gap: 18px;
            align-items: start;
          }

          .customer-my-move-page .workflow-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .customer-my-move-page .workflow-body {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .customer-my-move-page .form-section {
            border: 1px solid #dbe5f4;
            border-radius: 18px;
            background: #ffffff;
            padding: 18px;
          }

          .customer-my-move-page .form-section-head {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
          }

          .customer-my-move-page .form-section-head svg {
            color: #005eff;
            flex: 0 0 auto;
            margin-top: 2px;
          }

          .customer-my-move-page .form-section-head h3 {
            margin: 0;
            color: #07194f;
            font-size: 17px;
            font-weight: 950;
          }

          .customer-my-move-page .form-section-head p {
            margin: 5px 0 0;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
          }

          .customer-my-move-page .fixed-form-footer {
            position: sticky;
            bottom: 0;
            z-index: 5;
            background: #ffffff;
            border: 1px solid #dbe5f4;
            border-radius: 18px;
            padding: 14px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            box-shadow: 0 -10px 28px rgba(7, 25, 79, 0.06);
          }

          .customer-my-move-page .fixed-form-footer .outline-btn,
          .customer-my-move-page .fixed-form-footer .red-btn {
            min-height: 44px;
            padding-left: 24px;
            padding-right: 24px;
          }

          .customer-my-move-page .table-scroll table small {
            display: block;
            margin-top: 4px;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
          }

          @media (max-width: 1180px) {
            .customer-my-move-page {
              height: calc(100vh - 76px);
              max-height: calc(100vh - 76px);
            }

            .customer-my-move-page .my-move-content {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 720px) {
            .customer-my-move-page {
              height: calc(100vh - 68px);
              max-height: calc(100vh - 68px);
              padding-right: 4px;
            }

            .customer-my-move-page .fixed-form-footer {
              flex-direction: column;
            }

            .customer-my-move-page .fixed-form-footer .outline-btn,
            .customer-my-move-page .fixed-form-footer .red-btn {
              width: 100%;
            }
          }
        `}
      </style>

      <PageHeader
        icon={Truck}
        title="My Move"
        subtitle="Start with from / to details, moving dates and optional storage."
      />

      <div className="my-move-content">
        <CardPanel
          title="My Move — From / To Details"
          subtitle="Let's get started with your move details."
        >
          <form className="workflow-form" onSubmit={submit}>
            <div className="workflow-body">
              <section className="form-section">
                <div className="form-section-head">
                  <MapPin size={19} />

                  <div>
                    <h3>From / To Information</h3>
                    <p>Collection and delivery details.</p>
                  </div>
                </div>

                <FormGrid>
                  <TextInput
                    label="Collection Date"
                    type="date"
                    value={form.preferred_date_from || form.moving_date}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        preferred_date_from: value,
                        moving_date: value
                      })
                    }
                  />

                  <TextInput
                    label="Delivery Date"
                    type="date"
                    value={form.preferred_date_to}
                    onChange={(value) =>
                      setForm({ ...form, preferred_date_to: value })
                    }
                  />

                  <TextInput
                    label="Collection Postcode"
                    value={form.pickup_postcode}
                    onChange={(value) =>
                      setForm({ ...form, pickup_postcode: value })
                    }
                    placeholder="London, SW15 2AA"
                  />

                  <TextInput
                    label="Delivery Postcode"
                    value={form.delivery_postcode}
                    onChange={(value) =>
                      setForm({ ...form, delivery_postcode: value })
                    }
                    placeholder="Manchester, M14 5AB"
                  />

                  <TextInput
                    label="Collection Address"
                    value={form.pickup_address}
                    onChange={(value) =>
                      setForm({ ...form, pickup_address: value })
                    }
                    placeholder="Collection full address"
                  />

                  <TextInput
                    label="Delivery Address"
                    value={form.delivery_address}
                    onChange={(value) =>
                      setForm({ ...form, delivery_address: value })
                    }
                    placeholder="Delivery full address"
                  />

                  <SelectInput
                    label="Move Type"
                    value={form.move_type}
                    onChange={(value) => setForm({ ...form, move_type: value })}
                    options={[
                      { value: "house_move", label: "House Move" },
                      { value: "office_move", label: "Office Move" },
                      { value: "packing", label: "Packing" },
                      { value: "storage", label: "Storage" }
                    ]}
                  />

                  <TextInput
                    label="Property Type"
                    value={form.property_type}
                    onChange={(value) =>
                      setForm({ ...form, property_type: value })
                    }
                    placeholder="House / Flat / Office"
                  />

                  <TextInput
                    label="Property Size"
                    value={form.property_size}
                    onChange={(value) =>
                      setForm({ ...form, property_size: value })
                    }
                    placeholder="2 Bed Flat"
                  />
                </FormGrid>
              </section>

              <section className="form-section">
                <div className="form-section-head">
                  <CalendarDays size={19} />

                  <div>
                    <h3>Storage Details</h3>
                    <p>Only fill this if storage is needed.</p>
                  </div>
                </div>

                <FormGrid>
                  <SelectInput
                    label="Storage Needed?"
                    value={form.storage_required}
                    onChange={(value) =>
                      setForm({ ...form, storage_required: value })
                    }
                    options={[
                      { value: "false", label: "No" },
                      { value: "true", label: "Yes" }
                    ]}
                  />

                  <TextInput
                    label="Storage From Date"
                    type="date"
                    value={form.storage_from_date}
                    onChange={(value) =>
                      setForm({ ...form, storage_from_date: value })
                    }
                  />

                  <TextInput
                    label="Storage To Date"
                    type="date"
                    value={form.storage_to_date}
                    onChange={(value) =>
                      setForm({ ...form, storage_to_date: value })
                    }
                  />

                  <TextInput
                    label="Storage From Location"
                    value={form.storage_location_from}
                    onChange={(value) =>
                      setForm({ ...form, storage_location_from: value })
                    }
                    placeholder="Pickup storage location"
                  />

                  <TextInput
                    label="Storage To Location"
                    value={form.storage_location_to}
                    onChange={(value) =>
                      setForm({ ...form, storage_location_to: value })
                    }
                    placeholder="Delivery storage location"
                  />
                </FormGrid>
              </section>
            </div>

            <div className="fixed-form-footer">
              <button
                type="button"
                className="outline-btn"
                onClick={() => setForm(initialForm)}
                disabled={saving}
              >
                Reset
              </button>

              <button className="red-btn" disabled={saving}>
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </form>
        </CardPanel>

        <CardPanel
          title="Your Move Requests"
          subtitle="Real backend data from move_requests."
        >
          <div className="table-scroll">
            <table style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {moves.map((move) => (
                  <tr key={move.id}>
                    <td>
                      <b>{move.job_id || `MOVE-${move.id}`}</b>
                      <small>{moveTypeLabel(move.move_type)}</small>
                    </td>

                    <td>
                      {routeLabel(
                        move.pickup_postcode,
                        move.delivery_postcode
                      )}
                    </td>

                    <td>{formatDate(move.moving_date)}</td>

                    <td>
                      <StatusPill value={move.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!moves.length ? (
              <div className="empty-state">No move request found.</div>
            ) : null}
          </div>
        </CardPanel>
      </div>
    </div>
  );
}