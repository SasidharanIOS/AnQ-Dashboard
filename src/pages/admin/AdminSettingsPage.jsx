import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { adminAPI } from "../../services/api.js";
import { useToast } from "../../components/ui/Toast.jsx";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [content, setContent] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setContent(await adminAPI.homeContent());
      } catch (error) {
        showToast(error.message || "Failed to load settings", "error");
      }
    };

    loadContent();
  }, []);

  return (
    <div className="module-page">
      <section className="card module-hero">
        <div className="stat-icon blue">
          <Settings size={25} />
        </div>

        <div>
          <h2>Settings</h2>
          <p>Manage homepage content, platform settings and admin configuration.</p>
        </div>
      </section>

      <section className="card module-table">
        <div className="panel-head">
          <h2>Homepage Content</h2>
        </div>

        <div className="details-clean-grid">
          <b>Hero Title</b>
          <span>{content?.hero_title || "Compare Quotes from Trusted UK Moving Companies"}</span>

          <b>Hero Subtitle</b>
          <span>
            {content?.hero_subtitle ||
              "Get competitive quotes from verified removal companies."}
          </span>

          <b>Primary CTA</b>
          <span>{content?.primary_cta || "Get Free Quotes"}</span>

          <b>Secondary CTA</b>
          <span>{content?.secondary_cta || "How It Works"}</span>

          <b>Status</b>
          <span>{content?.status || "active"}</span>
        </div>
      </section>
    </div>
  );
}