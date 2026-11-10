import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function FacebookIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="facebook"
      title="Facebook Lead Settings"
      description="Connect Meta Facebook Instant Forms in real time. Meta sends a signed `leadgen` webhook pointer (`leadgen_id`), and LMS CRM verifies `X-Hub-Signature-256` + fetches full student details from Graph API v20.0."
      setupSteps={[
        "In Meta Developer Console → App → Webhooks → Page, paste the Callback URL above and your Webhook Verify Token, then subscribe to the `leadgen` field.",
        "Generate a non-expiring Long-Lived Page Access Token with `leads_retrieval`, `pages_show_list`, and `pages_manage_ads` permissions.",
        "Subscribe your Facebook Page to the app via `POST /{page_id}/subscribed_apps?subscribed_fields=leadgen` and grant CRM Lead Access in Meta Business Suite.",
        "Save settings on the right, click 'Test GET Handshake', and then click 'Simulate Live FACEBOOK Lead' (or Meta's Lead Ads Testing Tool) to verify end-to-end ingestion.",
      ]}
      fields={[
        {
          key: "app_id",
          label: "Meta App ID",
          placeholder: "e.g., 104928374651920",
          helperText:
            "Found in Meta Developer Console → App Settings → Basic.",
          required: true,
        },
        {
          key: "app_secret",
          label: "Meta App Secret",
          type: "password",
          placeholder: "32-char Meta App Secret",
          helperText:
            "Used to cryptographically verify incoming `X-Hub-Signature-256` (`sha256=...`) webhook payloads.",
          required: true,
        },
        {
          key: "page_id",
          label: "Facebook Page ID",
          placeholder: "e.g., 102938475610293",
          helperText:
            "Routes multi-tenant `entry[].id` webhook events to this organization and subscribes the Page to `leadgen`.",
          required: true,
        },
        {
          key: "page_access_token",
          label: "Long-Lived Page Access Token",
          type: "password",
          placeholder: "EAAGm0PX4ZCpsBA...",
          helperText:
            "Required to exchange Meta's `leadgen_id` webhook pointer for full student `field_data` via `GET /v20.0/{leadgen_id}`.",
          required: true,
        },
        {
          key: "verify_token",
          label: "Webhook Verify Token",
          placeholder: "facebook_verify_...",
          helperText:
            "Custom secret string echoed back during Meta's `GET ?hub.mode=subscribe&hub.verify_token=...` verification handshake.",
          required: true,
          canGenerateToken: true,
        },
        {
          key: "form_id",
          label: "Lead Form ID Filter (Optional)",
          placeholder: "Leave blank to capture all forms on this Page",
          helperText:
            "Optional Instant Form ID if you want to document or filter a specific admission campaign form.",
          advanced: true,
        },
      ]}
    />
  )
}
