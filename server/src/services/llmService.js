// src/services/llmService.js
import groqLLM from '../adapters/groq.js';
import geminiLLM from '../adapters/gemini.js';

export default {
  // Try Groq first, fallback to Gemini if it fails
  async generateQuestion(state, category, difficulty, count = 10) {
    // Try Groq first (primary)
    try {
      console.log('Attempting Groq API...');
      const questions = await groqLLM.generateQuestion(
        state,
        category,
        difficulty,
        count
      );

      if (questions && questions.length > 0) {
        console.log('Groq API successful, generated', questions.length, 'questions');
        return { questions, source: 'groq' };
      }

      throw new Error('Groq returned empty questions');
    } catch (groqError) {
      console.error('Groq API failed, trying Gemini as fallback:', groqError.message);

      // Fallback to Gemini
      try {
        console.log('Attempting Gemini API...');
        const questions = await geminiLLM.generateQuestion(
          state,
          category,
          difficulty,
          count
        );

        if (questions && questions.length > 0) {
          console.log('Gemini API successful, generated', questions.length, 'questions');
          return { questions, source: 'gemini' };
        }

        throw new Error('Gemini returned empty questions');
      } catch (geminiError) {
        console.error('Gemini API also failed:', geminiError.message);
        throw new Error('Both LLM APIs failed');
      }
    }
  },

  // Force use specific LLM (for testing or preference)
  async generateWithProvider(
    provider,
    state,
    category,
    difficulty,
    count = 10
  ) {
    if (provider === 'groq') {
      const questions = await groqLLM.generateQuestion(
        state,
        category,
        difficulty,
        count
      );
      return { questions, source: 'groq' };
    } else if (provider === 'gemini') {
      const questions = await geminiLLM.generateQuestion(
        state,
        category,
        difficulty,
        count
      );
      return { questions, source: 'gemini' };
    } else {
      throw new Error('Invalid provider. Use "groq" or "gemini"');
    }
  }
};
