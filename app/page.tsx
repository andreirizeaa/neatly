import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Users, Calendar, CheckCircle2, MessageSquare, FileText, ArrowRight, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/upload")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Neatly</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Evidence-Backed Email Analysis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            Turn Email Threads into Actionable Insights
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Neatly analyzes your email conversations and generates research briefs with stakeholders, action items,
            deadlines, and contextual replies—all backed by evidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                Start Analyzing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Stay Organized</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Neatly extracts key information from your emails and presents it in a structured, easy-to-digest format.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Identify Stakeholders</h3>
                <p className="text-muted-foreground">
                  Automatically extract names, roles, and contact information of everyone involved in the conversation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Action Items</h3>
                <p className="text-muted-foreground">
                  Never miss a task. Neatly identifies action items, assignees, and priority levels from your emails.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Spot Deadlines</h3>
                <p className="text-muted-foreground">
                  Extract important dates and deadlines so you can plan ahead and meet every commitment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Key Decisions</h3>
                <p className="text-muted-foreground">
                  Capture important decisions made during the conversation with supporting context and rationale.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Open Questions</h3>
                <p className="text-muted-foreground">
                  Identify unanswered questions and topics that need follow-up to keep conversations moving forward.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contextual Replies</h3>
                <p className="text-muted-foreground">
                  Generate smart, context-aware email replies that address all the key points from the thread.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Get insights from your emails in three simple steps</p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="rounded-full bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Paste Your Email Thread</h3>
                <p className="text-muted-foreground">
                  Copy and paste your entire email conversation into Neatly. We support any format and length.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="rounded-full bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Analyzes the Content</h3>
                <p className="text-muted-foreground">
                  Our AI processes the thread and extracts stakeholders, action items, deadlines, decisions, and
                  questions—all with evidence citations.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="rounded-full bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Your Research Brief</h3>
                <p className="text-muted-foreground">
                  Review your organized insights and use the generated contextual reply to respond quickly and
                  professionally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Organized?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join professionals who trust Neatly to make sense of their email conversations.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              Start Analyzing for Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <span className="font-semibold">Neatly</span>
            </div>
            <p className="text-sm text-muted-foreground">Transform your email threads into actionable insights.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
