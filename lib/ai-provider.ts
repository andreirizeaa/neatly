import { createOpenAI } from "@ai-sdk/openai"

/**
 * Custom OpenAI provider configuration
 * Uses the OPEN_AI environment variable for the API key
 */
export const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Models for research and analysis
 */
export const researchModel = openai("gpt-4o")
export const topicModel = openai("gpt-4o") // More capable for topic extraction
