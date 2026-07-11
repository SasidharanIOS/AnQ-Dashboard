import React, { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { adminAPI, formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";

export default function AdminMessagesPage() {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setConversations(safeArray(await adminAPI.conversations()));
      } catch (error) {
        showToast(error.message || "Failed to load conversations", "error");
        setConversations([]);
      }
    };

    loadConversations();
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return conversations.filter((item) =>
      [
        item.move?.job_id,
        item.customer?.full_name,
        item.vendor?.company_name,
        item.last_message,
        item.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [conversations, keyword]);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <MessageSquare size={25} />
        </div>

        <div>
          <h2>Messages</h2>
          <p>View platform conversations for support and dispute resolution.</p>
        </div>

        <div className="module-search">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search conversations..."
          />
          <Search size={17} />
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>All Conversations</h2>
        </div>

        <div className="table-scroll module-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Conversation ID</th>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Last Message</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((conversation) => (
                <tr key={conversation.id}>
                  <td>
                    <b>CONV-{conversation.id}</b>
                  </td>

                  <td>{conversation.move?.job_id || `ANQ-${conversation.move_request_id}`}</td>
                  <td>{conversation.customer?.full_name || "Customer"}</td>
                  <td>{conversation.vendor?.company_name || "Vendor"}</td>
                  <td>{conversation.last_message || "No message yet"}</td>

                  <td>
                    <em className={`status-chip ${conversation.status || "active"}`}>
                      {conversation.status || "active"}
                    </em>
                  </td>

                  <td>{formatDate(conversation.last_message_at || conversation.updated_at)}</td>

                  <td>
                    <button className="tiny-btn" onClick={() => setSelectedConversation(conversation)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? <div className="empty-state">No conversations found.</div> : null}
        </div>
      </section>

      <Modal open={!!selectedConversation} title="Conversation Details" onClose={() => setSelectedConversation(null)} size="lg">
        <div className="details-clean-grid">
          <b>Conversation ID</b>
          <span>CONV-{selectedConversation?.id}</span>

          <b>Job ID</b>
          <span>{selectedConversation?.move?.job_id || "—"}</span>

          <b>Customer</b>
          <span>{selectedConversation?.customer?.full_name || "—"}</span>

          <b>Vendor</b>
          <span>{selectedConversation?.vendor?.company_name || "—"}</span>

          <b>Last Message</b>
          <span>{selectedConversation?.last_message || "—"}</span>

          <b>Status</b>
          <span>{selectedConversation?.status || "active"}</span>

          <b>Updated</b>
          <span>{formatDate(selectedConversation?.last_message_at || selectedConversation?.updated_at)}</span>
        </div>
      </Modal>
    </div>
  );
}