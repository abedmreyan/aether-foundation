import { GoogleGenAI, Type } from "@google/genai";
import { Message, PipelineRecommendation, TableSchema } from "../types";

// Ideally, this is environment variable, but for the sandbox environment we use process.env.API_KEY
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateConsultantResponse = async (
  history: Message[],
  userMessage: string
): Promise<string> => {
  try {
    // Construct a chat-like prompt
    const systemInstruction = `
      Act as "The Architect", a senior systems engineer for Aether: Foundation.
      
      GOAL:
      Conduct a rapid, high-level structural audit of the user's business to build a custom data schema.
      
      RULES:
      1. DO NOT use conversational filler (e.g., "That's interesting", "Hello", "I understand").
      2. Ask DIRECT, SPECIFIC questions about their operations, data flow, and volume.
      3. Each response must be a SINGLE question designed to extract specific operational metadata.
      4. Maximize information gain per question.
      5. Limit the interview to 4-5 crucial questions.
      
      SEQUENCE:
      - If this is the start, ask about their Core Value Proposition and Operational Model (B2B/B2C, Service/Product).
      - Then, drill down into how they currently store data (Excel, paper, SaaS).
      - Then, identify the specific bottleneck (Time, Accuracy, Scale).
      - Finally, ask for the specific metric they want to improve (Revenue, Churn, Hours Saved).
      
      TERMINATION:
      - Once you have a clear picture of the "Before" state, append exactly "[ANALYSIS_COMPLETE]" to your final output.
    `;

    const conversationLog = history.map(h => `${h.role === 'user' ? 'User' : 'Architect'}: ${h.text}`).join('\n');
    const prompt = `${systemInstruction}\n\nSession Log:\n${conversationLog}\n\nUser Input: ${userMessage}\n\nArchitect's Next Question:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could you elaborate on your data structure?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System connection interrupted. Please describe your core business process.";
  }
};

export const generatePipelineRecommendations = async (
  businessDescription: string,
  schemas: TableSchema[]
): Promise<PipelineRecommendation[]> => {
  try {
    // Convert schemas to a string representation for the prompt
    const schemaContext = schemas.map(table => {
      const cols = table.columns.map(c => `${c.name} (${c.type}) ${c.isPrimaryKey ? '[PK]' : ''} ${c.isForeignKey ? `[FK -> ${c.references?.table}]` : ''}`).join(', ');
      return `Table: ${table.tableName} \nColumns: ${cols}`;
    }).join('\n\n');

    const prompt = `
      Act as "The Architect", an advanced AI systems engineer for Aether.
      Based on the user's business description and the actual data schema we have reverse-engineered from their files, propose 3 custom operational pipelines.
      
      Business Context: ${businessDescription}
      
      Recovered Data Schema:
      ${schemaContext}

      GOAL: 
      Suggest automation pipelines that connect these tables to solve business problems. 
      For example, if you see 'Lessons' and 'Payments', suggest a 'Revenue Reconciliation Pipeline'.

      Return ONLY a JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              steps: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              efficiencyGain: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PipelineRecommendation[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Pipeline Error", error);
    return [
        {
            title: "Data Structure Analysis Failed",
            description: "We couldn't generate specific pipelines. However, your data has been successfully modeled in the Scaffold.",
            steps: ["Check Scaffold Tab", "Review Data Types", "Manually Configure Automations"],
            efficiencyGain: "N/A"
        }
    ];
  }
};

export const analyzeDataSchemas = async (
  schemas: TableSchema[]
): Promise<TableSchema[]> => {
  try {
    const schemaDescription = schemas.map(s => ({
      tableName: s.tableName,
      columns: s.columns.map(c => ({ name: c.name, type: c.type, sample: c.sampleValue }))
    }));

    const prompt = `
      Act as a Senior Database Architect.
      Review the following database schema definitions inferred from CSV imports.
      
      TASKS:
      1. Standardize column names to snake_case.
      2. Correct data types if the sample value suggests a better fit. Allowed types: 'UUID', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'VARCHAR', 'TEXT'.
      3. Identify potential Primary Keys (isPrimaryKey) and Foreign Keys (isForeignKey).
      4. If a Foreign Key is detected, specify the 'references' object with 'table' and 'column'.
      
      INPUT SCHEMAS:
      ${JSON.stringify(schemaDescription, null, 2)}

      Return the improved schemas.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tableName: { type: Type.STRING },
              columns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    isPrimaryKey: { type: Type.BOOLEAN },
                    isForeignKey: { type: Type.BOOLEAN },
                    references: {
                      type: Type.OBJECT,
                      properties: {
                        table: { type: Type.STRING },
                        column: { type: Type.STRING }
                      },
                      nullable: true
                    },
                    sampleValue: { type: Type.STRING }
                  },
                  required: ['name', 'type', 'isPrimaryKey', 'isForeignKey', 'sampleValue']
                }
              }
            },
            required: ['tableName', 'columns']
          }
        }
      }
    });

    if (response.text) {
      const improvedSchemas = JSON.parse(response.text);
      
      // Merge with original data (rowCount, rawData) which AI doesn't handle
      return schemas.map(original => {
        const improved = improvedSchemas.find((s: any) => s.tableName === original.tableName);
        if (improved) {
          return {
            ...original,
            columns: improved.columns.map((col: any) => ({
                ...col,
                type: col.type // Trusting AI returns valid ColumnType string
            })),
          };
        }
        return original;
      });
    }
    
    return schemas;

  } catch (error) {
    console.error("Gemini Schema Analysis Error:", error);
    return schemas;
  }
};