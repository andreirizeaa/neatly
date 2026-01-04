import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UploadForm } from "@/components/upload-form"


export default async function AnalyzePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 overflow-hidden">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analyze Email Thread</h1>
        <p className="text-muted-foreground">
          Paste your email thread below and we&apos;ll extract key insights and generate a contextual reply.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <UploadForm userId={user.id} />
      </div>
    </div>
  )
}
