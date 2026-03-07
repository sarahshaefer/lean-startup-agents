// This is the serverless function that sits between your app and Claude's API.
// It keeps your API key secret — the browser never sees it directly.

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Get the prompt sent from the browser
  const { prompt } = JSON.parse(event.body);

  // Call Claude's API using the secret key stored in Netlify
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();

  // Send the response back to the browser
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result: data.content[0].text })
  };
};
