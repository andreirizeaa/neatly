# AgentKit Workflow Integration Guide

This document explains how to integrate your AgentKit workflow with the Neatly email analyzer.

## Overview

Your AgentKit workflow (`wf_69592369a8988190be2834ea983738020819276ee6688335`, version 2) is integrated into Neatly's research flow. When users analyze email threads, the research agent identifies topics and calls your workflow to generate comprehensive research summaries.

## How It Works

1. **Topic Identification**: AI analyzes the email thread and identifies 3-7 research topics
2. **Parallel Research**: Each topic triggers your AgentKit workflow in parallel
3. **Progressive Loading**: The UI shows loading states for each topic as research completes
4. **Structured Output**: Your workflow returns formatted research with overview, key points, and insights

## Integration Files

### Core Integration
- `lib/agentkit-workflow.ts` - Workflow client and trigger functions
- `app/api/workflows/[workflowId]/trigger/route.ts` - Proxy endpoint to call your workflow

### Research Flow
- `lib/research-agent.ts` - Updated to call workflow or fallback to local AI
- `app/api/research/topic/route.ts` - API endpoint that triggers workflow per topic
- `components/analysis-view.tsx` - Frontend component with progressive loading

## Setup Instructions

### 1. Deploy Your Workflow

Make sure your AgentKit workflow is deployed and accessible via an API endpoint.

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
AGENTKIT_WORKFLOW_URL=https://your-workflow-domain.vercel.app/api/workflow
# Optional: Add authentication if required
WORKFLOW_API_KEY=your-api-key-here
```

### 3. Workflow Input Schema

Your workflow receives:

```typescript
{
  version: "2",
  input: {
    emailContent: string,  // Full email thread text
    topic: string,         // Specific topic to research
    context: string        // Why this topic needs research
  }
}
```

### 4. Expected Output Schema

Your workflow should return:

```typescript
{
  topic: string,
  overview: string,        // 2-3 sentence overview
  keyPoints: Array<{
    heading: string,       // 3-6 words
    content: string        // 1-2 detailed sentences
  }>,
  actionableInsights: string  // Final takeaway
}
```

## Testing

1. Sign up and log in to Neatly
2. Paste an email thread on the upload page
3. Watch as topics are identified and research loads progressively
4. Check browser console for workflow logs: `Triggering AgentKit workflow`

## Fallback Behavior

If your workflow fails or is unavailable:
- The system automatically falls back to local AI research
- Users still get research results without errors
- Check logs for workflow errors: `Workflow failed, falling back to local AI`

## Customization

### Change Workflow Endpoint

Edit `app/api/workflows/[workflowId]/trigger/route.ts`:

```typescript
const workflowEndpoint = process.env.AGENTKIT_WORKFLOW_URL || 
  `https://your-custom-endpoint.com/api/workflow`
```

### Add Authentication

If your workflow requires authentication, update the fetch headers:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.WORKFLOW_API_KEY}`
}
```

### Disable Workflow (Use Local AI Only)

Edit `lib/research-agent.ts`:

```typescript
const result = await researchSingleTopic(
  topic,
  context,
  emailContent,
  false  // Set to false to disable workflow
)
```

## Monitoring

Check these logs to monitor workflow execution:

- `Using AgentKit workflow for research` - Workflow triggered
- `AgentKit workflow completed successfully` - Workflow succeeded
- `Workflow failed, falling back to local AI` - Workflow failed, using fallback
- `Using local AI research` - Skipped workflow or fallback active

## Troubleshooting

### Workflow not triggering

1. Check `AGENTKIT_WORKFLOW_URL` is set correctly
2. Verify workflow is deployed and accessible
3. Check browser console for error messages

### Workflow returns incorrect format

1. Verify your workflow returns the expected schema
2. Check the transformation logic in `lib/agentkit-workflow.ts`
3. Add custom mapping if needed

### Authentication errors

1. Ensure `WORKFLOW_API_KEY` is set if required
2. Update headers in trigger route
3. Check workflow authentication requirements

## Next Steps

1. Deploy your AgentKit workflow
2. Set the `AGENTKIT_WORKFLOW_URL` environment variable
3. Test with a sample email thread
4. Monitor logs to ensure proper integration
5. Customize output formatting if needed

For questions or issues, check the debug logs with `console.log("...")` statements.
