import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function InstagramIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="instagram"
      title="Instagram Lead Integration"
      description="Capture Instagram Lead Form inquiries via Meta Graph API webhooks directly into your organization's lead queue."
      fields={[
        { key: "verify_token", label: "Verify Token" },
        { key: "ig_business_id", label: "Instagram Business Account ID" },
        { key: "page_access_token", label: "Access Token", type: "password" },
      ]}
    />
  )
}
