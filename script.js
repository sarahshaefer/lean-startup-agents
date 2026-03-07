// Stores the AI-generated response for each agent (by index)
let responses = ["", "", "", "", "", ""];

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

  // Collect any notes the user typed in the text boxes for this agent
  const notes = [];
  document.querySelectorAll("#agent-" + index + " textarea").forEach(function (ta) {
    if (ta.value.trim()) notes.push(ta.value.trim());
  });
  const userNotes = notes.length ? "\n\nUser's own notes:\n" + notes.join("\n") : "";

  // Previous agent outputs (used to pass context between agents)
  const pain      = responses[0] ? "\n\nPain Analyst output:\n" + responses[0] : "";
  const ideation  = responses[1] ? "\n\nMaverick Ideator output:\n" + responses[1] : "";
  const hypotheses = responses[2] ? "\n\nHypothesis Engineer output:\n" + responses[2] : "";
  const mvp       = responses[3] ? "\n\nMVP Architect output:\n" + responses[3] : "";

  const prompts = [
    // Agent 0: Pain Analyst
    `You are a customer research expert embedded in the startup world.
Startup idea: "${idea}"${userNotes}

Conduct a deep analysis of the pain point. Identify 2–3 customer segments, rank them by intensity of pain, describe what they're doing today to cope and why it's failing. Think beyond the obvious — look for the hidden frustration beneath the surface problem. Be specific and concrete.`,

    // Agent 1: Maverick Ideator
    `You are a maverick startup ideator who thinks like a first-principles disruptor.
Startup idea: "${idea}"${pain}${userNotes}

Generate 5 value proposition ideas. At least 3 must challenge a core assumption of this industry. Rank them by originality, not feasibility. Then pick the boldest one and write a single-sentence value proposition. Do not suggest anything that already exists.`,

    // Agent 2: Hypothesis Engineer
    `You are a lean startup hypothesis engineer.
Startup idea: "${idea}"${pain}${ideation}${userNotes}

Identify the 5 most critical assumptions that must be true for this to succeed. Write each as a testable hypothesis: "We believe that X will do Y because Z." Rank by risk. Identify the single most dangerous assumption and propose the cheapest way to test it within 2 weeks.`,

    // Agent 3: MVP Architect
    `You are an MVP architect obsessed with speed and validated learning.
Startup idea: "${idea}"${pain}${ideation}${hypotheses}${userNotes}

Design the most minimal experiment to test the riskiest hypothesis within 2 weeks for under £500. It does not need to be software. Define: what you'll build, what you'll fake manually, and what success looks like in one measurable metric. Ruthlessly cut anything that doesn't directly test the hypothesis.`,

    // Agent 4: VC Critic
    `You are a senior VC partner who has seen thousands of pitches. You are not here to be nice.
Startup idea: "${idea}"${pain}${ideation}${hypotheses}${mvp}${userNotes}

Ask the 5 hardest questions a founder would least want to hear. Identify the most likely reason this startup fails. Then — only if the idea survives your critique — state what would need to be true for you to write a cheque. Be direct, harsh, and specific.`,

    // Agent 5: Research Scout
    `You are a rigorous market research analyst.
Startup idea: "${idea}"${userNotes}

Provide: (1) a bottom-up estimate of the total addressable market with numbers, (2) the top 3–5 direct and indirect competitors with their strengths and weaknesses, (3) an honest assessment of technical feasibility, (4) 3 macro trends that make this timing good or bad. Be neutral — neither cheerleader nor pessimist.`
  ];

  return prompts[index];
}

// ─── Call Claude via the Netlify function ─────────────────────────────────────

async function generate(index) {
  const idea = document.getElementById("startupIdea").value.trim();
  if (!idea) {
    alert("Please enter your startup idea at the top first.");
    return;
  }

  const responseArea = document.getElementById("response-" + index);
  const btn = document.querySelector("#agent-" + index + " .generate-btn");

  // Show loading state
  btn.disabled = true;
  btn.textContent = "Thinking...";
  responseArea.className = "response-area loading";
  responseArea.textContent = "Claude is analysing your idea...";

  try {
    const result = await fetch("/.netlify/functions/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildPrompt(index) })
    });

    const data = await result.json();

    // Store the response so later agents can use it as context
    responses[index] = data.result;
    saveResponses();

    // Display the response
    responseArea.className = "response-area visible";
    responseArea.textContent = data.result;

  } catch (error) {
    responseArea.className = "response-area error";
    responseArea.textContent = "Something went wrong. Make sure your API key is set in Netlify.";
  }

  // Reset button
  btn.disabled = false;
  btn.textContent = "Regenerate →";
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

function load() {
  const saved = localStorage.getItem("agentWorkflow");
  if (saved) {
    const data = JSON.parse(saved);
    if (data.startupIdea) document.getElementById("startupIdea").value = data.startupIdea;
    document.querySelectorAll("textarea").forEach(function (ta) {
      if (data[ta.id]) ta.value = data[ta.id];
    });
  }

  // Restore previous AI responses
  const savedResponses = localStorage.getItem("agentResponses");
  if (savedResponses) {
    responses = JSON.parse(savedResponses);
    responses.forEach(function (text, index) {
      if (text) {
        const area = document.getElementById("response-" + index);
        area.className = "response-area visible";
        area.textContent = text;
        // Update the button to say Regenerate
        const btn = document.querySelector("#agent-" + index + " .generate-btn");
        if (btn) btn.textContent = "Regenerate →";
      }
    });
  }
}

function clearAll() {
  if (confirm("Clear all your notes and generated responses?")) {
    localStorage.removeItem("agentWorkflow");
    localStorage.removeItem("agentResponses");
    responses = ["", "", "", "", "", ""];
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
