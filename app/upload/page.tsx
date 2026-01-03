import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UploadForm } from "@/components/upload-form"
import { AppHeader } from "@/components/app-header"

export default async function UploadPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Analyze Email Thread</h1>
            <p className="text-muted-foreground">
              Paste your email thread below and we&apos;ll extract key insights and generate a contextual reply.
            </p>
          </div>
          <UploadForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
