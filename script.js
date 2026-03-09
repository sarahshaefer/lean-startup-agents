// Stores the AI-generated response for each agent (by index)
let responses = ["", "", "", "", "", "", ""];

// Stores follow-up conversation history per agent
let chatHistories = [[], [], [], [], [], [], []];

// ─── Show / hide agents ───────────────────────────────────────────────────────

function showAgent(index) {
  document.querySelectorAll(".agent-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  document.getElementById("agent-" + index).classList.add("active");
  document.querySelectorAll(".nav-btn")[index].classList.add("active");
}

// ─── Build the prompt for each agent ─────────────────────────────────────────

function buildPrompt(index) {
  const idea = document.getElementById("startupIdea").value || "not specified";

  const notes = [];
  document.querySelectorAll("#agent-" + index + " textarea").forEach(function (ta) {
    if (ta.value.trim()) notes.push(ta.value.trim());
  });
  const userNotes = notes.length ? "\n\nUser's own notes:\n" + notes.join("\n") : "";

  const pain      = responses[0] ? "\n\nPain Analyst output:\n" + responses[0] : "";
  const ideation  = responses[1] ? "\n\nMaverick Ideator output:\n" + responses[1] : "";
  const hypotheses = responses[2] ? "\n\nHypothesis Engineer output:\n" + responses[2] : "";
  const mvp       = responses[3] ? "\n\nMVP Architect output:\n" + responses[3] : "";
  const vcCritic  = responses[4] ? "\n\nVC Critic output:\n" + responses[4] : "";
  const research  = responses[5] ? "\n\nResearch Scout output:\n" + responses[5] : "";

  const prompts = [
    `You are a customer research expert embedded in the startup world.
Startup idea: "${idea}"${userNotes}

Conduct a deep analysis of the pain point. Identify 2–3 customer segments, rank them by intensity of pain, describe what they're doing today to cope and why it's failing. Think beyond the obvious — look for the hidden frustration beneath the surface problem. Be specific and concrete.`,

    `You are a maverick startup ideator who thinks like a first-principles disruptor.
Startup idea: "${idea}"${pain}${userNotes}

Generate 5 value proposition ideas. At least 3 must challenge a core assumption of this industry. Rank them by originality, not feasibility. Then pick the boldest one and write a single-sentence value proposition. Do not suggest anything that already exists.`,

    `You are a lean startup hypothesis engineer.
Startup idea: "${idea}"${pain}${ideation}${userNotes}

Identify the 5 most critical assumptions that must be true for this to succeed. Write each as a testable hypothesis: "We believe that X will do Y because Z." Rank by risk. Identify the single most dangerous assumption and propose the cheapest way to test it within 2 weeks.`,

    `You are an MVP architect obsessed with speed and validated learning.
Startup idea: "${idea}"${pain}${ideation}${hypotheses}${userNotes}

Design the most minimal experiment to test the riskiest hypothesis within 2 weeks for under £500. It does not need to be software. Define: what you'll build, what you'll fake manually, and what success looks like in one measurable metric. Ruthlessly cut anything that doesn't directly test the hypothesis.`,

    `You are a senior VC partner who has seen thousands of pitches. You are not here to be nice.
Startup idea: "${idea}"${pain}${ideation}${hypotheses}${mvp}${userNotes}

Ask the 5 hardest questions a founder would least want to hear. Identify the most likely reason this startup fails. Then — only if the idea survives your critique — state what would need to be true for you to write a cheque. Be direct, harsh, and specific.`,

    `You are a rigorous market research analyst.
Startup idea: "${idea}"${userNotes}

Provide: (1) a bottom-up estimate of the total addressable market with numbers, (2) the top 3–5 direct and indirect competitors with their strengths and weaknesses, (3) an honest assessment of technical feasibility, (4) 3 macro trends that make this timing good or bad. Be neutral — neither cheerleader nor pessimist.`,

    `You are a product strategist who specialises in turning founder insights into scalable software products.
Startup idea: "${idea}"${pain}${vcCritic}${userNotes}

The VC Critic has likely flagged that this looks like a consulting business, not a scalable product. Your job is to fix that.

Generate 5 concrete product ideas rooted in the pain points above. Be concise — 3-4 sentences per idea. Each must: (1) work without the founder personally doing the work, (2) be buildable today, (3) scale. For each, state: what it does, who pays and roughly how much, and what the moat is. Then pick the strongest one and give a 5-step, 30-day action plan to get a first paying customer.`
  ];

  return prompts[index];
}

// ─── Append a chat bubble ─────────────────────────────────────────────────────

function appendChatBubble(chatArea, role, text) {
  const msg = document.createElement("div");
  msg.className = "chat-message " + role;
  msg.textContent = text;
  chatArea.insertBefore(msg, chatArea.lastChild);
}

// ─── Display a response with a copy button and follow-up chat ────────────────

function showResponse(index, text) {
  const area = document.getElementById("response-" + index);
  area.className = "response-area visible";
  area.innerHTML = "";

  const p = document.createElement("p");
  p.style.whiteSpace = "pre-wrap";
  p.textContent = text;
  area.appendChild(p);

  const btn = document.createElement("button");
  btn.className = "copy-response-btn";
  btn.textContent = "Copy response";
  btn.onclick = function () {
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = "Copied!";
      setTimeout(function () { btn.textContent = "Copy response"; }, 2000);
    });
  };
  area.appendChild(btn);

  const chatArea = document.createElement("div");
  chatArea.className = "chat-area";

  if (chatHistories[index] && chatHistories[index].length > 0) {
    chatHistories[index].forEach(function (msg) {
      appendChatBubble(chatArea, msg.role, msg.content);
    });
  }

  const inputRow = document.createElement("div");
  inputRow.className = "chat-input-row";

  const input = document.createElement("textarea");
  input.className = "followup-input";
  input.placeholder = "Ask a follow-up question... (Enter to send, Shift+Enter for new line)";
  input.rows = 2;

  const askBtn = document.createElement("button");
  askBtn.className = "followup-btn";
  askBtn.textContent = "Ask →";
  askBtn.onclick = function () {
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    followUp(index, question, chatArea, askBtn);
  };

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askBtn.click();
    }
  });

  inputRow.appendChild(input);
  inputRow.appendChild(askBtn);
  chatArea.appendChild(inputRow);
  area.appendChild(chatArea);
}

// ─── Follow-up conversation ───────────────────────────────────────────────────

async function followUp(index, question, chatArea, askBtn) {
  askBtn.disabled = true;
  askBtn.textContent = "Thinking...";

  appendChatBubble(chatArea, "user", question);

  const thinking = document.createElement("div");
  thinking.className = "chat-message assistant chat-thinking";
  thinking.textContent = "Claude is thinking...";
  chatArea.insertBefore(thinking, chatArea.lastChild);

  const messages = [
    { role: "user", content: buildPrompt(index) },
    { role: "assistant", content: responses[index] }
  ];
  chatHistories[index].forEach(function (msg) {
    messages.push(msg);
  });
  messages.push({ role: "user", content: question });

  chatHistories[index].push({ role: "user", content: question });

  const jobId = "job-" + Date.now() + "-" + Math.random().toString(36).slice(2);

  try {
    await fetch("/.netlify/functions/claude-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages, jobId: jobId, agentIndex: index })
    });

    const result = await pollForResult(jobId, thinking);
    chatHistories[index].push({ role: "assistant", content: result });
    saveChatHistories();

    thinking.className = "chat-message assistant";
    thinking.textContent = result;

  } catch (error) {
    thinking.className = "chat-message assistant error";
    thinking.textContent = "Error: " + error.message;
    chatHistories[index].pop();
  }

  askBtn.disabled = false;
  askBtn.textContent = "Ask →";
}

// ─── Call Claude via background function + polling ────────────────────────────

async function generate(index) {
  const idea = document.getElementById("startupIdea").value.trim();
  if (!idea) {
    alert("Please enter your startup idea at the top first.");
    return;
  }

  const responseArea = document.getElementById("response-" + index);
  const btn = document.querySelector("#agent-" + index + " .generate-btn");

  const jobId = "job-" + Date.now() + "-" + Math.random().toString(36).slice(2);

  btn.disabled = true;
  btn.textContent = "Thinking...";
  responseArea.className = "response-area loading";
  responseArea.textContent = "Claude is thinking... this may take up to a minute for deep analysis.";

  try {
    await fetch("/.netlify/functions/claude-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildPrompt(index), jobId: jobId, agentIndex: index })
    });

    const result = await pollForResult(jobId, responseArea);

    responses[index] = result;
    saveResponses();
    showResponse(index, result);

  } catch (error) {
    responseArea.className = "response-area error";
    responseArea.textContent = "Something went wrong: " + error.message;
  }

  btn.disabled = false;
  btn.textContent = "Regenerate →";
}

// ─── Poll for result ──────────────────────────────────────────────────────────

function pollForResult(jobId, responseArea) {
  return new Promise(function (resolve, reject) {
    let attempts = 0;
    const maxAttempts = 150;

    const interval = setInterval(async function () {
      attempts++;

      if (attempts % 5 === 0) {
        const seconds = attempts * 2;
        responseArea.textContent = "Claude is thinking... (" + seconds + "s)";
      }

      if (attempts > maxAttempts) {
        clearInterval(interval);
        reject(new Error("Timed out waiting for Claude. Please try again."));
        return;
      }

      try {
        const res = await fetch("/.netlify/functions/poll?jobId=" + jobId);
        const data = await res.json();

        if (data.status === "done") {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === "error") {
          clearInterval(interval);
          reject(new Error(data.error || "Claude returned an error."));
        }
      } catch (err) {
        // Network blip — keep trying
      }
    }, 2000);
  });
}

// ─── Save & load ──────────────────────────────────────────────────────────────

function save() {
  const data = { startupIdea: document.getElementById("startupIdea").value };
  document.querySelectorAll("textarea").forEach(function (ta) {
    data[ta.id] = ta.value;
  });
  localStorage.setItem("agentWorkflow", JSON.stringify(data));
}

function saveResponses() {
  localStorage.setItem("agentResponses", JSON.stringify(responses));
}

function saveChatHistories() {
  localStorage.setItem("agentChatHistories", JSON.stringify(chatHistories));
}

function load() {
  const saved = localStorage.getItem("agentWorkflow");
  if (saved) {
    const data = JSON.parse(saved);
    if (data.startupIdea) document.getElementById("startupIdea").value = data.startupIdea;
    document.querySelectorAll("textarea").forEach(function (ta) {
      if (data[ta.id]) ta.value = data[ta.id];
    });
  }

  const savedResponses = localStorage.getItem("agentResponses");
  if (savedResponses) {
    responses = JSON.parse(savedResponses);
    while (responses.length < 7) responses.push("");
  }

  const savedChats = localStorage.getItem("agentChatHistories");
  if (savedChats) {
    chatHistories = JSON.parse(savedChats);
    while (chatHistories.length < 7) chatHistories.push([]);
  }

  responses.forEach(function (text, index) {
    if (text) {
      showResponse(index, text);
      const btn = document.querySelector("#agent-" + index + " .generate-btn");
      if (btn) btn.textContent = "Regenerate →";
    }
  });
}

function clearAll() {
  if (confirm("Clear all your notes and generated responses?")) {
    localStorage.removeItem("agentWorkflow");
    localStorage.removeItem("agentResponses");
    localStorage.removeItem("agentChatHistories");
    responses = ["", "", "", "", "", "", ""];
    chatHistories = [[], [], [], [], [], [], []];
    document.getElementById("startupIdea").value = "";
    document.querySelectorAll("textarea").forEach(function (ta) { ta.value = ""; });
    document.querySelectorAll(".response-area").forEach(function (r) {
      r.className = "response-area";
      r.textContent = "";
    });
    document.querySelectorAll(".generate-btn").forEach(function (b) {
      b.textContent = "Generate with Claude →";
    });
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
load();
