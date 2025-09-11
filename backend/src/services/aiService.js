const OpenAI = require('openai');
const BudgetEngine = require('./budgetEngine');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

class AIService {
  static async processQuery(userId, query) {
    // Check if external AI is enabled
    if (!process.env.OPENAI_API_KEY) {
      return {
        response: "AI features require an OpenAI API key. You can enable this in settings if you want conversational AI, or use the basic budget calculator without AI.",
        functionUsed: null,
        data: null,
        privacy_note: "No external AI configured - your data stays completely private"
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a helpful financial assistant for a privacy-focused budgeting app. 
            IMPORTANT: All financial data is stored locally on the user's device for privacy. 
            You have access to their budget calculations but no data is sent to external servers except for this conversation.
            Always emphasize the privacy-first approach when relevant.`
          },
          {
            role: "user",
            content: query
          }
        ],
        functions: [
          {
            name: "check_affordability",
            description: "Check if the user can afford a specific purchase",
            parameters: {
              type: "object",
              properties: {
                amount: {
                  type: "number",
                  description: "The amount the user wants to spend"
                },
                category: {
                  type: "string",
                  description: "The category of the purchase (optional)"
                }
              },
              required: ["amount"]
            }
          },
          {
            name: "get_budget_status",
            description: "Get the current budget status and safe to spend amount",
            parameters: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "simulate_spending",
            description: "Simulate the impact of a potential purchase",
            parameters: {
              type: "object",
              properties: {
                amount: {
                  type: "number",
                  description: "The amount to simulate spending"
                }
              },
              required: ["amount"]
            }
          }
        ],
        function_call: "auto"
      });

      const message = response.choices[0].message;

      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        let functionResult;
        switch (functionName) {
          case 'check_affordability':
            functionResult = await this.checkAffordability(userId, functionArgs.amount, functionArgs.category);
            break;
          case 'get_budget_status':
            functionResult = await BudgetEngine.calculateSafeToSpend(userId);
            break;
          case 'simulate_spending':
            functionResult = await BudgetEngine.simulateSpend(userId, functionArgs.amount);
            break;
        }

        // Get final response with function result
        const finalResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a helpful financial assistant. Provide a clear, friendly response based on the budget data.`
            },
            {
              role: "user",
              content: query
            },
            {
              role: "function",
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ]
        });

        return {
          response: finalResponse.choices[0].message.content,
          functionUsed: functionName,
          data: functionResult,
          privacy_note: "AI response generated externally, but your financial data stays local"
        };
      }

      return {
        response: message.content,
        functionUsed: null,
        data: null
      };
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        response: "I'm having trouble connecting to AI services right now. Your budget calculator is still available and your data remains private on your device.",
        functionUsed: null,
        data: null,
        privacy_note: "AI temporarily unavailable - all data remains local"
      };
    }
  }

  static async checkAffordability(userId, amount, category) {
    const budget = await BudgetEngine.calculateSafeToSpend(userId);
    const canAfford = budget.safeToSpend >= amount;
    
    return {
      canAfford,
      safeToSpend: budget.safeToSpend,
      requestedAmount: amount,
      remainingAfter: budget.safeToSpend - amount,
      confidence: budget.confidence,
      breakdown: budget.breakdown
    };
  }
}

module.exports = AIService;
