export async function POST(request) {
  const { system, userMsg, maxTokens = 300 } = await request.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json({ error: data.error?.message ?? "API error" }, { status: res.status });
  }

  return Response.json({ text: data.content?.[0]?.text?.trim() ?? "" });
}
