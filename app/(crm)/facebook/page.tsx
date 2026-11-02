import { LeadIntegrationPanel } from "@/components/crm/lead-integration-panel"

export default function FacebookIntegrationPage() {
  return (
    <LeadIntegrationPanel
      provider="facebook"
      title="Facebook Lead Integration"
      description="Connect Facebook Lead Ads using Meta Graph API webhooks to automatically capture student leads in real time."
      fields={[
        { key: "verify_token", label: "Verify Token" },
        { key: "page_access_token", label: "Page Access Token" },
        { key: "app_secret", label: "App Secret", type: "password" },
      ]}
    />
  )
}
