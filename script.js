// The AI prompt for each agent (used by the copy button)
const prompts = [
  // Agent 0: Pain Analyst
  'You are a customer research expert embedded in the startup world. My startup idea is: "[YOUR IDEA]". Conduct a deep analysis of the pain point. Identify 2–3 customer segments, rank them by intensity of pain, describe what they\'re doing today to cope and why it\'s failing. Think beyond the obvious. Look for the hidden frustration beneath the surface problem.',

  // Agent 1: Maverick Ideator
  'You are a maverick startup ideator who thinks like a first-principles disruptor. The customer pain is: "[PASTE PAIN ANALYST OUTPUT]". Generate 5 value proposition ideas. At least 3 must challenge a core assumption of this industry. Rank them by originality, not feasibility. Then pick the boldest one and write a single-sentence value proposition. Do not suggest anything that already exists.',

  // Agent 2: Hypothesis Engineer
  'You are a lean startup hypothesis engineer. My value proposition is: "[PASTE MAVERICK IDEATOR OUTPUT]". Identify the 5 most critical assumptions that must be true for this to succeed. For each, write it as a testable hypothesis (e.g. "We believe that X will do Y because Z"). Rank them by risk. Identify the single most dangerous assumption and propose the cheapest way to test it within 2 weeks.',

  // Agent 3: MVP Architect
  'You are an MVP architect obsessed with speed and validated learning. My core hypothesis is: "[PASTE HYPOTHESIS ENGINEER OUTPUT]". Design the most minimal experiment that could test this hypothesis within 2 weeks with under £500. It does not need to be software. Define what you\'ll build, what you\'ll fake or do manually, and what success looks like in a single measurable metric. Ruthlessly cut anything that doesn\'t directly test the hypothesis.',

  // Agent 4: VC Critic
  'You are a senior VC partner who has seen thousands of pitches. You are not here to be nice. Review this startup concept: "[PASTE ALL PREVIOUS AGENT OUTPUTS]". Ask the 5 hardest questions a founder would least want to hear. Identify the most likely reason this startup fails. Then — only if the idea survives your critique — tell me what would need to be true for you to write a cheque. Be direct, be harsh, be specific.',

  // Agent 5: Research Scout
  'You are a rigorous market research analyst. Research the following startup idea: "[YOUR IDEA]". Provide: (1) a bottom-up estimate of the total addressable market, (2) the top 3–5 direct and indirect competitors with their strengths and weaknesses, (3) an honest assessment of technical feasibility, (4) 3 macro trends that make this timing good or bad. Cite specific numbers where possible. Be neutral — neither a cheerleader nor a pessimist.'
];

// Switch to a different agent panel
function showAgent(index) {
  // Hide all panels and deactivate all nav buttons
  document.querySelectorAll(".agent-panel").forEach(function (p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach(function (b) {
    b.classList.remove("active");
  });

  // Show the selected panel and highlight its nav button
  document.getElementById("agent-" + index).classList.add("active");
  document.querySelectorAll(".nav-btn")[index].classList.add("active");
}

// Copy the agent's AI prompt to the clipboard
function copyPrompt(index) {
  const idea = document.getElementById("startupIdea").value || "[your startup idea]";
  const prompt = prompts[index].replace("[YOUR IDEA]", idea);

  navigator.clipboard.writeText(prompt).then(function () {
    showToast();
  });
}

// Show the "Copied!" toast message briefly
function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2000);
}

// Save all text area content and the startup idea to localStorage
function save() {
  const data = {};

  // Save the startup idea
  data["startupIdea"] = document.getElementById("startupIdea").value;

  // Save every textarea by its id
  document.querySelectorAll("textarea").forEach(function (ta) {
    data[ta.id] = ta.value;
  });

  localStorage.setItem("agentWorkflow", JSON.stringify(data));
}

// Load saved content when the page opens
function load() {
  const saved = localStorage.getItem("agentWorkflow");
  if (!saved) return;

  const data = JSON.parse(saved);

  if (data["startupIdea"]) {
    document.getElementById("startupIdea").value = data["startupIdea"];
  }

  document.querySelectorAll("textarea").forEach(function (ta) {
    if (data[ta.id]) {
      ta.value = data[ta.id];
    }
  });
}

// Wipe everything after confirmation
function clearAll() {
  if (confirm("Clear all your notes and start fresh?")) {
    localStorage.removeItem("agentWorkflow");
    document.getElementById("startupIdea").value = "";
    document.querySelectorAll("textarea").forEach(function (ta) {
      ta.value = "";
    });
  }
}

// Start
load();
