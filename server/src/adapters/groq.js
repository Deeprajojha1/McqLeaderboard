// src/adapters/groq.js
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SYSTEM_PROMPT = `You are an AI Quiz Generation Engine.

Generate high-quality, factually correct multiple-choice questions.

Instructions:
1. Questions must be unique.
2. Questions must not repeat common textbook wording.
3. Cover different subtopics.
4. Keep language simple and clear.
5. Avoid ambiguous questions.
6. Ensure only one correct answer.
7. Incorrect options should be believable.
8. Add a concise explanation.
9. Shuffle correct answer positions randomly.
10. Return ONLY JSON.

Question Quality Rules:
Easy → Basic Facts
Medium → Conceptual
Hard → Competitive Exam Level (UPSC/SSC/State PSC)

Output Schema:
{
  "questions":[
    {
      "id":"",
      "question":"",
      "options":[],
      "correctAnswer":"",
      "explanation":"",
      "difficulty":"",
      "category":"",
      "state":"",
      "points":10
    }
  ]
}`;

export default {
  async generateQuestion(state, category, difficulty, count = 10) {
    try {
      const userPrompt = `Generate ${count} multiple-choice quiz questions.

Context:
- State: ${state}
- Category: ${category}
- Difficulty: ${difficulty}

Use state-specific knowledge wherever possible. Include history, geography, culture, politics, economy, famous personalities, festivals, tourism, current affairs, government schemes, sports, education, wildlife, rivers, monuments.

If category is "Mixed", distribute questions evenly across these topics.

Return ONLY valid JSON.`;

      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      return parsed.questions || [];
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error('Groq API failed');
    }
  }
};
