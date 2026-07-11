import React, { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  Truck,
  UserRound
} from "lucide-react";

import api, { formatDate, safeArray } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { PageHeader } from "../../components/ui/PortalUI.jsx";

const getVendorName = (conversation) => {
  return (
    conversation?.vendor?.company_name ||
    conversation?.vendor_name ||
    conversation?.move?.job_id ||
    "Mover"
  );
};

const getVendorInitial = (conversation) => {
  return getVendorName(conversation).slice(0, 1).toUpperCase();
};

const getLastMessageText = (conversation) => {
  const last = conversation?.last_message;

  if (!last) return "No message yet";

  if (typeof last === "string") return last;

  if (typeof last === "object") {
    if (last.message) return last.message;
    if (last.file_url) return "File attachment";
  }

  return "No message yet";
};

const getLastMessageDate = (conversation) => {
  return (
    conversation?.last_message_at ||
    conversation?.last_message?.created_at ||
    conversation?.updated_at ||
    conversation?.created_at
  );
};

const getConversationJobId = (conversation) => {
  return conversation?.move?.job_id || `MOVE-${conversation?.move_request_id || "—"}`;
};

function EmptyConversation() {
  return (
    <div className="customer-message-empty">
      <div className="customer-message-empty-icon">
        <MessageSquare size={28} />
      </div>

      <h3>No conversations yet</h3>

      <p>
        Once a vendor is assigned or a quote conversation starts, your real
        backend messages will appear here.
      </p>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="customer-message-empty chat-empty">
      <div className="customer-message-empty-icon">
        <Truck size={28} />
      </div>

      <h3>Select a conversation</h3>

      <p>Choose a vendor conversation to view real backend messages.</p>
    </div>
  );
}

function MessageBubble({ item }) {
  const isCustomer = item?.sender_type === "customer";

  return (
    <div className={`customer-message-bubble ${isCustomer ? "me" : ""}`}>
      <div className="customer-message-bubble-meta">
        <b>{isCustomer ? "You" : "Vendor"}</b>
        <span>{formatDate(item?.created_at)}</span>
      </div>

      {item?.message ? <p>{item.message}</p> : null}

      {item?.file_url ? (
        <a href={item.file_url} target="_blank" rel="noreferrer">
          View attachment
        </a>
      ) : null}
    </div>
  );
}

export default function CustomerMessagesPage() {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    setLoadingConversations(true);

    try {
      const response = await api.get("/customer/messages");
      const list = safeArray(response);

      setConversations(list);

      setActive((current) => {
        if (!list.length) return null;

        if (current?.id) {
          const existing = list.find((item) => item.id === current.id);
          if (existing) return existing;
        }

        return list[0];
      });
    } catch (error) {
      showToast(error.message || "Failed to load conversations", "error");
      setConversations([]);
      setActive(null);
      setMessages([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversation) => {
    if (!conversation?.move_request_id || !conversation?.vendor_id) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    try {
      const response = await api.get(
        `/customer/messages/${conversation.move_request_id}/${conversation.vendor_id}`
      );

      const payload = response?.data?.data || {};
      setMessages(safeArray(payload.messages));
    } catch (error) {
      showToast(error.message || "Failed to load messages", "error");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (active) {
      loadMessages(active);
    } else {
      setMessages([]);
    }
  }, [active?.id]);

  const filtered = useMemo(() => {
    const q = keyword.toLowerCase();

    return conversations.filter((conversation) =>
      [
        conversation?.vendor?.company_name,
        conversation?.move?.job_id,
        conversation?.status,
        getLastMessageText(conversation)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [conversations, keyword]);

  const sendMessage = async () => {
    if (!message.trim()) {
      showToast("Message is required", "error");
      return;
    }

    if (!active?.id) {
      showToast("Choose a conversation first", "error");
      return;
    }

    setSending(true);

    try {
      await api.post(`/customer/messages/${active.id}`, {
        message: message.trim()
      });

      showToast("Message sent");

      setMessage("");

      await loadMessages(active);
      await loadConversations();
    } catch (error) {
      showToast(error.message || "Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleEnterSend = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-wrap customer-messages-page">
      <style>
        {`
          .customer-messages-page {
            width: 100%;
            height: calc(100vh - 92px);
            max-height: calc(100vh - 92px);
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 8px 34px 0;
          }

          .customer-messages-page::-webkit-scrollbar {
            width: 8px;
          }

          .customer-messages-page::-webkit-scrollbar-track {
            background: #f2f6fc;
            border-radius: 999px;
          }

          .customer-messages-page::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .customer-messages-page .customer-message-layout {
            height: calc(100vh - 230px);
            min-height: 560px;
            display: grid;
            grid-template-columns: 360px minmax(0, 1fr);
            gap: 18px;
          }

          .customer-messages-page .customer-message-list-panel,
          .customer-messages-page .customer-message-chat-panel {
            border: 1px solid #dbe5f4;
            border-radius: 20px;
            background: #ffffff;
            box-shadow: 0 14px 34px rgba(7, 25, 79, 0.045);
            overflow: hidden;
            min-height: 0;
          }

          .customer-messages-page .customer-message-list-panel {
            display: flex;
            flex-direction: column;
          }

          .customer-messages-page .customer-message-list-head {
            padding: 18px;
            border-bottom: 1px solid #e6edf7;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .customer-messages-page .customer-message-list-head h2 {
            margin: 0;
            color: #07194f;
            font-size: 18px;
            font-weight: 950;
          }

          .customer-messages-page .customer-message-refresh {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            border: 1px solid #dbe5f4;
            background: #ffffff;
            color: #07194f;
            display: grid;
            place-items: center;
            cursor: pointer;
          }

          .customer-messages-page .customer-message-refresh:hover {
            background: #eef5ff;
            color: #005eff;
          }

          .customer-messages-page .customer-message-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .customer-messages-page .customer-message-list::-webkit-scrollbar,
          .customer-messages-page .customer-message-body::-webkit-scrollbar {
            width: 6px;
          }

          .customer-messages-page .customer-message-list::-webkit-scrollbar-thumb,
          .customer-messages-page .customer-message-body::-webkit-scrollbar-thumb {
            background: #c7d4e8;
            border-radius: 999px;
          }

          .customer-messages-page .customer-message-item {
            width: 100%;
            min-height: 86px;
            padding: 13px;
            border-radius: 16px;
            border: 1px solid #e6edf7;
            background: #ffffff;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            text-align: left;
            cursor: pointer;
            transition: 0.18s ease;
          }

          .customer-messages-page .customer-message-item:hover {
            background: #f8fbff;
            border-color: #c9d6ea;
          }

          .customer-messages-page .customer-message-item.active {
            background: #eef5ff;
            border-color: #005eff;
            box-shadow: 0 10px 24px rgba(0, 94, 255, 0.12);
          }

          .customer-messages-page .customer-message-avatar {
            width: 42px;
            height: 42px;
            border-radius: 14px;
            background: #07194f;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 15px;
            font-weight: 950;
            flex: 0 0 auto;
          }

          .customer-messages-page .customer-message-item-copy {
            min-width: 0;
            flex: 1;
          }

          .customer-messages-page .customer-message-item-copy b {
            display: block;
            color: #07194f;
            font-size: 13px;
            font-weight: 950;
            line-height: 1.25;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .customer-messages-page .customer-message-item-copy p {
            margin: 5px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .customer-messages-page .customer-message-item-copy small {
            display: block;
            margin-top: 5px;
            color: #9aa5ba;
            font-size: 11px;
            font-weight: 800;
          }

          .customer-messages-page .customer-message-unread {
            min-width: 24px;
            height: 24px;
            padding: 0 7px;
            border-radius: 999px;
            background: #f20f18;
            color: #ffffff;
            display: grid;
            place-items: center;
            font-size: 12px;
            font-weight: 950;
          }

          .customer-messages-page .customer-message-chat-panel {
            display: flex;
            flex-direction: column;
          }

          .customer-messages-page .customer-message-chat-head {
            min-height: 76px;
            padding: 18px 20px;
            border-bottom: 1px solid #e6edf7;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .customer-messages-page .customer-message-chat-title {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .customer-messages-page .customer-message-chat-title h2 {
            margin: 0;
            color: #07194f;
            font-size: 18px;
            font-weight: 950;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .customer-messages-page .customer-message-chat-title p {
            margin: 4px 0 0;
            color: #667297;
            font-size: 12px;
            font-weight: 750;
          }

          .customer-messages-page .customer-message-status {
            min-height: 30px;
            padding: 0 11px;
            border-radius: 999px;
            background: #e9fff4;
            color: #079b58;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 12px;
            font-weight: 900;
            white-space: nowrap;
          }

          .customer-messages-page .customer-message-status i {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #0aae68;
          }

          .customer-messages-page .customer-message-body {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 20px;
            background:
              radial-gradient(circle at top left, rgba(0, 94, 255, 0.05), transparent 34%),
              #f8fbff;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .customer-messages-page .customer-message-bubble {
            max-width: 68%;
            padding: 13px 14px;
            border-radius: 16px 16px 16px 5px;
            background: #ffffff;
            border: 1px solid #dbe5f4;
            box-shadow: 0 8px 22px rgba(7, 25, 79, 0.04);
            align-self: flex-start;
          }

          .customer-messages-page .customer-message-bubble.me {
            background: #07194f;
            border-color: #07194f;
            color: #ffffff;
            border-radius: 16px 16px 5px 16px;
            align-self: flex-end;
          }

          .customer-messages-page .customer-message-bubble-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 6px;
          }

          .customer-messages-page .customer-message-bubble-meta b {
            color: inherit;
            font-size: 11px;
            font-weight: 950;
          }

          .customer-messages-page .customer-message-bubble-meta span {
            color: inherit;
            opacity: 0.7;
            font-size: 10px;
            font-weight: 750;
          }

          .customer-messages-page .customer-message-bubble p {
            margin: 0;
            color: inherit;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.5;
            word-break: break-word;
          }

          .customer-messages-page .customer-message-bubble a {
            color: inherit;
            font-size: 13px;
            font-weight: 900;
            text-decoration: underline;
          }

          .customer-messages-page .customer-message-compose {
            min-height: 76px;
            padding: 14px;
            border-top: 1px solid #e6edf7;
            background: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .customer-messages-page .customer-message-compose input {
            flex: 1;
            min-width: 0;
            height: 46px;
            border-radius: 14px;
            border: 1px solid #dbe5f4;
            background: #ffffff;
            color: #07194f;
            font-size: 14px;
            font-weight: 750;
            outline: 0;
            padding: 0 15px;
          }

          .customer-messages-page .customer-message-compose input:focus {
            border-color: #005eff;
            box-shadow: 0 0 0 4px rgba(0, 94, 255, 0.08);
          }

          .customer-messages-page .customer-message-compose .red-btn {
            width: 46px;
            height: 46px;
            min-height: 46px;
            padding: 0;
            border-radius: 14px;
            display: grid;
            place-items: center;
          }

          .customer-message-empty {
            flex: 1;
            min-height: 320px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-align: center;
            padding: 26px;
            color: #667297;
          }

          .customer-message-empty.chat-empty {
            min-height: 100%;
          }

          .customer-message-empty-icon {
            width: 60px;
            height: 60px;
            border-radius: 20px;
            background: #eef5ff;
            color: #005eff;
            display: grid;
            place-items: center;
          }

          .customer-message-empty h3 {
            margin: 0;
            color: #07194f;
            font-size: 18px;
            font-weight: 950;
          }

          .customer-message-empty p {
            margin: 0;
            max-width: 360px;
            color: #667297;
            font-size: 13px;
            font-weight: 750;
            line-height: 1.5;
          }

          @media (max-width: 1180px) {
            .customer-messages-page {
              height: calc(100vh - 76px);
              max-height: calc(100vh - 76px);
            }

            .customer-messages-page .customer-message-layout {
              height: auto;
              min-height: 0;
              grid-template-columns: 1fr;
            }

            .customer-messages-page .customer-message-list-panel {
              min-height: 360px;
            }

            .customer-messages-page .customer-message-chat-panel {
              min-height: 560px;
            }
          }

          @media (max-width: 720px) {
            .customer-messages-page {
              height: calc(100vh - 68px);
              max-height: calc(100vh - 68px);
              padding-right: 4px;
            }

            .customer-messages-page .customer-message-chat-head {
              align-items: flex-start;
              flex-direction: column;
            }

            .customer-messages-page .customer-message-bubble {
              max-width: 86%;
            }
          }
        `}
      </style>

      <PageHeader
        icon={MessageSquare}
        title="Messages with Vendors"
        subtitle="Confirm availability, pricing and move details privately."
        search={keyword}
        onSearch={setKeyword}
        placeholder="Search conversations..."
      />

      <section className="customer-message-layout">
        <aside className="customer-message-list-panel">
          <div className="customer-message-list-head">
            <h2>Conversations</h2>

            <button
              type="button"
              className="customer-message-refresh"
              onClick={loadConversations}
              disabled={loadingConversations}
              title="Refresh"
            >
              <RefreshCcw size={17} />
            </button>
          </div>

          <div className="customer-message-list">
            {loadingConversations ? (
              <div className="customer-message-empty">
                <div className="customer-message-empty-icon">
                  <RefreshCcw size={26} />
                </div>
                <h3>Loading conversations</h3>
                <p>Please wait while we fetch your backend messages.</p>
              </div>
            ) : null}

            {!loadingConversations && filtered.length
              ? filtered.map((conversation) => (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`customer-message-item ${
                      active?.id === conversation.id ? "active" : ""
                    }`}
                    onClick={() => setActive(conversation)}
                  >
                    <div className="customer-message-avatar">
                      {getVendorInitial(conversation)}
                    </div>

                    <div className="customer-message-item-copy">
                      <b>{getVendorName(conversation)}</b>
                      <p>{getLastMessageText(conversation)}</p>
                      <small>
                        {getConversationJobId(conversation)} •{" "}
                        {formatDate(getLastMessageDate(conversation))}
                      </small>
                    </div>

                    {conversation.unread_count ? (
                      <span className="customer-message-unread">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </button>
                ))
              : null}

            {!loadingConversations && !filtered.length ? (
              <EmptyConversation />
            ) : null}
          </div>
        </aside>

        <main className="customer-message-chat-panel">
          {active ? (
            <>
              <div className="customer-message-chat-head">
                <div className="customer-message-chat-title">
                  <div className="customer-message-avatar">
                    {getVendorInitial(active)}
                  </div>

                  <div>
                    <h2>{getVendorName(active)}</h2>
                    <p>{getConversationJobId(active)}</p>
                  </div>
                </div>

                <span className="customer-message-status">
                  <i />
                  Active conversation
                </span>
              </div>

              <div className="customer-message-body">
                {loadingMessages ? (
                  <div className="customer-message-empty chat-empty">
                    <div className="customer-message-empty-icon">
                      <RefreshCcw size={26} />
                    </div>
                    <h3>Loading messages</h3>
                    <p>Please wait while we fetch this conversation.</p>
                  </div>
                ) : null}

                {!loadingMessages && messages.length
                  ? messages.map((item) => (
                      <MessageBubble key={item.id} item={item} />
                    ))
                  : null}

                {!loadingMessages && !messages.length ? (
                  <div className="customer-message-empty chat-empty">
                    <div className="customer-message-empty-icon">
                      <MessageSquare size={28} />
                    </div>
                    <h3>No messages yet</h3>
                    <p>
                      Start the conversation with this mover to confirm
                      availability and pricing.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="customer-message-compose">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleEnterSend}
                  placeholder="Type your message..."
                  disabled={sending}
                />

                <button
                  type="button"
                  className="red-btn"
                  onClick={sendMessage}
                  disabled={sending}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <EmptyChat />
          )}
        </main>
      </section>
    </div>
  );
}