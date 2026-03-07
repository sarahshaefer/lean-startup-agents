// Uses Node's built-in https module instead of fetch (works on all Node versions)
const https = require("https");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { prompt } = JSON.parse(event.body);

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }]
  });

  return new Promise(function (resolve) {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const req = https.request(options, function (res) {
      let data = "";
      res.on("data", function (chunk) { data += chunk; });
      res.on("end", function () {
        try {
          const parsed = JSON.parse(data);
          console.log("Anthropic response:", JSON.stringify(parsed).slice(0, 200));

          if (parsed.content && parsed.content[0]) {
            resolve({
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ result: parsed.content[0].text })
            });
          } else {
            resolve({
              statusCode: 502,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ error: parsed.error?.message || data })
            });
          }
        } catch (e) {
          console.log("Parse error:", e.message);
          resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
        }
      });
    });

    req.on("error", function (e) {
      console.log("Request error:", e.message);
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.write(body);
    req.end();
  });
};
