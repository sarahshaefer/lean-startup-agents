// Background function — runs for up to 15 minutes, no timeout issues.
// Calls Claude with the prompt, then saves the result so the app can pick it up.
const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  const { prompt, messages: msgs, jobId } = JSON.parse(event.body);
  const messages = msgs || [{ role: "user", content: prompt }];
  const store = getStore({
    name: "jobs",
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_TOKEN
  });

  try {
    // Mark the job as in-progress
    await store.set(jobId, JSON.stringify({ status: "pending" }));

    // Call Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 6000,
        messages: messages
      })
    });

    const data = await response.json();
    console.log("Anthropic status:", response.status);

    if (data.content && data.content[0]) {
      // Save the result so the poll function can return it
      await store.set(jobId, JSON.stringify({
        status: "done",
        result: data.content[0].text
      }));
    } else {
      await store.set(jobId, JSON.stringify({
        status: "error",
        error: data.error?.message || "Unknown error from Claude"
      }));
    }
  } catch (err) {
    console.log("Background function error:", err.message);
    await store.set(jobId, JSON.stringify({
      status: "error",
      error: err.message
    }));
  }
};
