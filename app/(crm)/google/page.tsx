import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function GoogleIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="google"
      title="Google Lead Settings"
      description="Receive Google Search, YouTube, Discovery & Performance Max Lead Form Asset submissions instantaneously via Google's native Lead Form Webhook (`user_column_data` + `google_key` validation), with optional Google Ads API credentials for historical backfill."
      setupSteps={[
        "In Google Ads, open Campaigns → Assets → Lead forms and create or edit your Lead Form Asset.",
        "Expand 'Export leads from Google Ads' → 'Other data integration options' → 'Webhook integration'.",
        "Paste the Public Webhook Callback URL above into 'Webhook URL', generate/copy your 'Webhook Key (google_key)' on the right, and paste it into Google's 'Key' field.",
        "Save settings here first, then click 'Send test data' inside Google Ads (or 'Simulate Live GOOGLE Lead' on the left) to verify HTTP 200 lead ingestion.",
      ]}
      fields={[
        {
          key: "google_key",
          label: "Webhook Secret Key (`google_key`)",
          type: "password",
          placeholder: "gads_key_...",
          helperText:
            "Primary required credential for real-time Google Ads Lead Form Webhooks. Every incoming POST payload's `google_key` is verified against this key.",
          required: true,
          canGenerateToken: true,
        },
        {
          key: "customer_id",
          label: "Google Ads Customer ID",
          placeholder: "e.g., 123-456-7890",
          helperText:
            "10-digit Google Ads account ID for campaign attribution & API sync.",
        },
        {
          key: "developer_token",
          label: "Google Ads Developer Token (API Backfill)",
          type: "password",
          placeholder: "Optional — for GAQL lead_form_submission_data polling",
          helperText:
            "Used only if pulling historical leads via `POST /v17/customers/{customerId}/googleAds:search`.",
          advanced: true,
        },
        {
          key: "client_id",
          label: "Google Cloud OAuth Client ID (API Backfill)",
          placeholder: "xxxx.apps.googleusercontent.com",
          helperText:
            "Optional OAuth 2.0 Client ID (backward-compatible with legacy Google API setup).",
          advanced: true,
        },
        {
          key: "client_secret",
          label: "Google Cloud OAuth Client Secret (API Backfill)",
          type: "password",
          placeholder: "GOCSPX-...",
          helperText:
            "Optional OAuth 2.0 Client Secret for Google Ads REST API token refresh.",
          advanced: true,
        },
      ]}
    />
  )
}
