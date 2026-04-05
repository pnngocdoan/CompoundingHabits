const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateHabitGoalOptions(name: string, why: string): Promise<string[]> {
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `Habit: "${name}". Why: "${why}". Write 3 different completions of "I will ___ every day to ___". Keep the language close to how the person actually said it — raw, personal, not polished. Especially the second blank, it should echo their real words and feeling, not rewrite it into something formal. Output exactly 3 lines, one sentence per line, no numbering, no quotes, no period. Example — habit: "run", why: "I want my kids to see me as someone strong"\nI will run every day to be the strong parent my kids see me as\nI will run every day to show my kids what strength looks like\nI will run every day to become the version of myself my kids believe in`,
          },
        ],
        max_tokens: 120,
        temperature: 0.9,
      }),
    });
    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content?.trim() ?? '';
    const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean).slice(0, 3);
    return lines.length === 3 ? lines : [why, why, why];
  } catch {
    return [why, why, why];
  }
}

export async function generateHabitGoal(name: string, why: string): Promise<string> {
  const options = await generateHabitGoalOptions(name, why);
  return options[0];
}
