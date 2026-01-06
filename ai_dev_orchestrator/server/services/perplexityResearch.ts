/**
 * Perplexity Research Service
 * 
 * Integrates with Perplexity AI for research and information gathering
 */

export interface ResearchQuery {
    query: string;
    model?: string;
}

export interface ResearchResult {
    answer: string;
    citations: string[];
    model: string;
}

/**
 * Research using Perplexity AI
 */
export async function researchWithPerplexity(
    query: string,
    model: string = "llama-3.1-sonar-large-128k-online"
): Promise<ResearchResult> {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    const payload = {
        model,
        messages: [
            {
                role: "system",
                content: "You are a helpful research assistant. Provide comprehensive, well-sourced answers with citations.",
            },
            {
                role: "user",
                content: query,
            },
        ],
    };

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `Perplexity API failed: ${response.status} ${response.statusText} – ${errorText}`
        );
    }

    const data = await response.json();

    // Extract answer and citations
    const answer = data.choices[0]?.message?.content || "";
    const citations = data.citations || [];

    return {
        answer,
        citations,
        model,
    };
}

/**
 * Research a topic comprehensively
 */
export async function comprehensiveResearch(topic: string): Promise<ResearchResult> {
    const query = `Provide a comprehensive research summary about: ${topic}. Include key insights, current trends, best practices, and relevant examples.`;

    return await researchWithPerplexity(query);
}

/**
 * Research technical feasibility
 */
export async function researchTechnicalFeasibility(
    feature: string,
    context: string
): Promise<ResearchResult> {
    const query = `Analyze the technical feasibility of implementing: ${feature}. Context: ${context}. Provide insights on implementation approaches, potential challenges, required technologies, and best practices.`;

    return await researchWithPerplexity(query);
}

/**
 * Research best practices
 */
export async function researchBestPractices(
    domain: string,
    specificQuestion?: string
): Promise<ResearchResult> {
    const query = specificQuestion
        ? `What are the best practices for ${domain}? Specifically: ${specificQuestion}`
        : `What are the current best practices and industry standards for ${domain}?`;

    return await researchWithPerplexity(query);
}
