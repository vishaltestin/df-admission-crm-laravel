import { TemplateManagerPanel } from "@/components/crm/template-manager-panel"

export default function EmailTemplatesPage() {
  return (
    <TemplateManagerPanel
      resource="email_templates"
      title="Email Templates"
      hasSubject
    />
  )
}
