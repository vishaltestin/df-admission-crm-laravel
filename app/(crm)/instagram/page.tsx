import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function InstagramIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="instagram"
      title="Instagram Lead Settings"
      description="Capture Instagram Lead Ads (Feed, Stories & Reels Instant Forms) automatically. Instagram Lead Forms deliver via your linked Facebook Page's Meta `leadgen` webhook (`platform: ig`) + Graph API v20.0."
      setupSteps={[
        "Link your Instagram Professional / Business Account to your Facebook Page inside Meta Business Suite → Accounts → Instagram Accounts.",
        "In Meta Developer Console → Webhooks → Page, configure the Instagram Callback URL above + Verify Token and subscribe to `leadgen`.",
        "Enter the Connected Facebook Page ID, Instagram Business Account ID, Long-Lived Page Access Token (`leads_retrieval`, `pages_manage_ads`), and App Secret.",
        "Save settings, verify with 'Test GET Handshake', and test lead creation with 'Simulate Live INSTAGRAM Lead'.",
      ]}
      fields={[
        {
          key: "page_id",
          label: "Connected Facebook Page ID",
          placeholder: "e.g., 102938475610293",
          helperText:
            "Meta dispatches Instagram Lead Form `leadgen` webhooks through the linked Facebook Page ID.",
          required: true,
        },
        {
          key: "ig_business_id",
          label: "Instagram Business Account ID",
          placeholder: "e.g., 17841405822304914",
          helperText:
            "Your Instagram Professional (`ig_user_id`) account linked to the Page.",
          required: true,
        },
        {
          key: "page_access_token",
          label: "Long-Lived Page Access Token",
          type: "password",
          placeholder: "EAAGm0PX4ZCpsBA...",
          helperText:
            "Used to fetch full student `field_data` from `GET https://graph.facebook.com/v20.0/{leadgen_id}`.",
          required: true,
        },
        {
          key: "verify_token",
          label: "Webhook Verify Token",
          placeholder: "instagram_verify_...",
          helperText:
            "Matches `hub.verify_token` when registering the Callback URL in Meta Developer Console.",
          required: true,
          canGenerateToken: true,
        },
        {
          key: "app_secret",
          label: "Meta App Secret",
          type: "password",
          placeholder: "32-char Meta App Secret",
          helperText:
            "Validates `X-Hub-Signature-256` HMAC signatures on incoming POST requests.",
          required: true,
        },
        {
          key: "app_id",
          label: "Meta App ID (Optional)",
          placeholder: "e.g., 104928374651920",
          helperText: "Meta App ID managing the webhook subscription.",
          advanced: true,
        },
      ]}
    />
  )
}
