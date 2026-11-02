"use client"

import { useParams } from "next/navigation"
import { WebFormStudio } from "@/components/crm/webform-studio"

export default function EditWebFormPage() {
  const params = useParams<{ id: string }>()
  return <WebFormStudio editId={params.id} />
}
