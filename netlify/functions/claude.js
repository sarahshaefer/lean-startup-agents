exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    console.log("Function called, prompt length:", prompt.length);
    console.log("API key present:", !!process.env.ANTHROPIC_API_KEY);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }]
      })
    });

    console.log("Anthropic status:", response.status);
    const data = await response.json();
    console.log("Anthropic response:", JSON.stringify(data).slice(0, 200));

    if (data.content && data.content[0]) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: data.content[0].text })
      };
    } else {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data.error?.message || "Unknown error" })
      };
    }
  } catch (err) {
    console.log("Caught error:", err.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
