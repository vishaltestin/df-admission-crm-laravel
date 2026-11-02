import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function GoogleIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="google"
      title="Google Ads Lead Form Integration"
      description="Receive Google Search, YouTube, and Performance Max Lead Form Extension submissions automatically via webhook."
      fields={[
        { key: "webhook_key", label: "Google Lead Form Secret Key" },
        { key: "customer_id", label: "Google Ads Customer ID" },
        { key: "developer_token", label: "Developer Token", type: "password" },
      ]}
    />
  )
}
