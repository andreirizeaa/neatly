import { webSearchTool, Agent, AgentInputItem, Runner } from "@openai/agents";
import { z } from "zod";
import { formattedBriefSchema } from "../schemas";

// Tool definitions
const webSearchPreview = webSearchTool({
    filters: {
        allowedDomains: [
            "www.wikipedia.org",
            "google.com"
        ]
    },
    searchContextSize: "low",
    userLocation: {
        country: "GB",
        type: "approximate"
    }
})

const contentReserachAgent = new Agent({
    name: "Content reserach agent",
    instructions: `
        You are the Content Research Agent.
        Your job is to do light web research on a topic and 
        return a Research Notes document in plain text/Markdown (NOT JSON).

        Requirements
        - Use web search.
        - Summarize the most important facts, definitions, and key takeaways.
        - Keep it concise and skimmable.
        - Always include a “Sources” section at the end with link name + URL only.

        Output format (exact sections)
        Return in this order:
        1) Topic
        2) Scope (what you covered)
        3) Overview (4–6 sentences)
        4) Key facts (8–15 bullets)
        5) Definitions (5–12 bullets)
        6) Recent developments (0–8 bullets, include dates if relevant)
        7) Numbers (0–10 bullets, include context + date if relevant)
        8) Pros / Cons / Tradeoffs
        9) Risks (reliability + privacy/security) + mitigations
        10) Open questions
        11) Sources (required)

        Sources section rules (important)
        - Provide 5–12 sources when possible.
        - Format each source as one line:
        - {Link Name} — {https://...}
        - No extra fields (no publisher, no accessed date, no commentary here).
        - Don’t invent links. If you truly can’t find sources, write:
        - None found

        Failure handling (mandatory)
        If a web search tool call fails or returns weak results, do NOT output “Research could not be completed…”.
        Instead, return a partial Research Notes response using the required headings, with:
        - fewer bullets,
        - and a Sources section that includes whatever links were found (or - None found).
        Also add:

        Formatting contract
        You MUST include the headings exactly:
        Topic, Scope, Overview, Key facts, Definitions, Sources
        Even if some sections are short/empty.
    `,
    model: "gpt-4o",
    tools: [
        webSearchPreview
    ],
    modelSettings: {
        temperature: 1,
        topP: 1,
        maxTokens: 2048,
    }
});


const contentFormattingAgent = new Agent({
    name: "Content formatting agent",
    instructions: `
        You are the Content Formatting Agent.

        Input is research text produced by the research agent. 
        Your job is to transform it into UI-ready JSON that is clean, structured, digestible, and designed to be read quickly.

        Output requirement
        - Output ONLY valid JSON that matches the FormattedBrief schema (below).
        - No Markdown. No code fences. No commentary. No extra keys.
        - NEVER use "/" as a placeholder value for empty fields. Use an empty string "" or omit the field if optional.

        Hard rules
        - No new facts.
        - Only rephrase, reorganize, deduplicate, and clarify what’s present in the research text.
        - If something is missing, add it only as a question in FAQ / Open questions style sections, not as a claim.

        Return sources
        - Extract the Sources section from the research text.
        - Output sources: [{ id, name, url }] with ids s1, s2, … in order.
        - Each source must have name + url only.
        - If a URL is missing scheme but clearly a domain, prepend https://.
        - Drop malformed lines if you can’t confidently fix them.
        - sources must exist even if empty.

        Make it quick to read (your main value)
        - Default to short bullets over paragraphs.
        - Prefer strong headings and chunking.
        - Avoid repetition and filler.

        Cleaning + structuring steps (do these in order)

        Step A — Parse & normalize
        - Identify the research sections (Topic, Overview, Key facts, Definitions, Recent developments, Numbers, Pros/Cons, Risks, Open questions, Sources).
        - Normalize casing, fix obvious typos, remove duplicated bullets, merge near-duplicates.
        - Convert long sentences into tight bullets.

        Step B — Extract “signal”
        - Choose the 10–15 highest-signal points as Key points.
        - Convert the overview into:
        - a short TL;DR (max 5 bullets),
        - and a short “What it is” paragraph if needed.

        Step C — Write for scanning (UI-first)
        - Keep most blocks to:
        - 3–7 bullets per block
        - 1 short paragraph max when necessary
        - Use simple language and concrete phrasing.
        - Avoid nested bullets deeper than 1 level (UI readability).

        Step D — Build sections
        - Create sections in this default order (skip if empty):
        1) why_it_matters
        2) what_it_is
        3) key_points (group into 3–6 subheadings using heading + bullets)
        4) whats_new (dated bullets)
        5) numbers (table if possible; else bullets)
        6) pros_cons (two bullets lists + tradeoffs)
        7) risks_mitigations (reliability + privacy/security + mitigations)
        8) recommendations (prioritized, action-oriented)
        9) faq (Q/A pairs)
            - IMPORTANT: for each question, you MUST provide a meaningful answer based on the research.
            - If the research doesn't answer it directly, synthesize an answer from related information or note it's unclear.
            - Empty answers are NOT allowed.

        Step E — Recommendations (must be actionable)
        - Produce 5–10 next steps.
        - Prefer verbs: “Define…”, “Measure…”, “Add…”, “Restrict…”
        - If the topic is technical, include “how to validate” and “rollout safety” bullets.

        Step F — Citations (optional)
        - If the research text clearly maps a point to a source, attach citations.
        - If not confident, omit citations; do not guess.

        Output fields to populate
        - schema_version: "1.0.0"
        - title: short, informative
        - subtitle: optional
        - topic: from input
        - tldr: 1–5 bullets
        - sections: array of sections with blocks
        - sources: extracted sources list

        Parsing + fallback rules (add verbatim)
        - If headings exist, parse by headings:
        Topic / Scope / Overview / Key facts / Definitions / Recent developments / Numbers / Pros / Cons / Risks / Open questions / Sources.
        - If headings are missing, fall back to heuristic extraction:
        - topic: first non-empty line (or “Untitled topic”)
        - tldr: summarize the first ~15 lines into 3–5 bullets
        - key_points: extract 8–12 bullets from anywhere in the text
        - sources: extract URLs from anywhere in the text (not only “Sources” section)
        - Never output a single “Status/error” section unless the input is empty or only contains an error message.
        - If the input contains an error message, still output a normal brief with:
        - a callout block warning that research was incomplete,
        - sources: [],
        - and reasonable placeholder sections (why_it_matters / recommendations / faq) based on the user’s topic.
        - Do not use section.id = "error" in normal operation.
        - Only use that if you truly cannot extract any content.
    `,
    model: "gpt-4o",
    outputType: formattedBriefSchema, // Using our app's defined schema
    modelSettings: {
        temperature: 1,
        topP: 1,
        maxTokens: 8192,
    }
});

type WorkflowInput = { input_as_text: string };

// Main code entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {

    const conversationHistory: AgentInputItem[] = [
        { role: "user", content: [{ type: "input_text", text: workflow.input_as_text }] }
    ];
    const runner = new Runner();

    const contentReserachAgentResultTemp = await runner.run(
        contentReserachAgent,
        [...conversationHistory]
    );

    conversationHistory.push(...contentReserachAgentResultTemp.newItems.map((item) => item.rawItem));

    if (!contentReserachAgentResultTemp.finalOutput) {
        throw new Error("Research Agent result is undefined");
    }

    // The formatting agent takes the research history + its instructions to formatted output
    const contentFormattingAgentResultTemp = await runner.run(
        contentFormattingAgent,
        [...conversationHistory]
    );

    conversationHistory.push(...contentFormattingAgentResultTemp.newItems.map((item) => item.rawItem));

    if (!contentFormattingAgentResultTemp.finalOutput) {
        throw new Error("Formatting Agent result is undefined");
    }

    // contentFormattingAgentResultTemp.finalOutput is already parsed by Zod/SDK if outputType is set!
    // It returns the structured object directly.
    return contentFormattingAgentResultTemp.finalOutput;
}
