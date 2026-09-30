"""
AI generation layer for StudyFlow AI.

Works with ZERO configuration out of the box using a rule-based generator,
so you can run and demo the whole app before wiring up a real LLM.

To use a real model, set AI_PROVIDER=openai (or anthropic) and the matching
API key in .env — call_llm() below is the single place that changes.
"""
import os
import json
import random
import re
import httpx
from pathlib import Path

AI_PROVIDER = os.getenv("AI_PROVIDER", "").strip().lower()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


async def call_llm(prompt: str) -> str:
    """Calls a real LLM if configured; raises if not configured so callers fall back."""
    if AI_PROVIDER == "openai" and OPENAI_API_KEY:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    if AI_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    raise RuntimeError("No AI provider configured")


# ---------------------------------------------------------------------------
# Offline fallback generator (no API key needed). Deterministic-ish topic
# curricula keyed by keyword matching on the goal text, so demos always work.
# ---------------------------------------------------------------------------

TOPIC_BANKS = {
    "python": ["Python syntax & variables", "Control flow", "Functions", "OOP in Python",
               "Error handling", "File I/O", "Modules & packages", "List/dict comprehensions",
               "Decorators & generators", "NumPy basics", "Pandas basics", "Data structures & algorithms",
               "Working with APIs", "Testing with pytest", "Coding problems practice",
               "System design basics", "Mock interview", "Resume review", "Weak-area revision",
               "Final mock interview"],
    "dbms": ["ER modeling", "Relational model", "SQL basics (SELECT/WHERE)", "Joins",
             "Aggregation & GROUP BY", "Normalization (1NF-3NF)", "Indexes", "Transactions & ACID",
             "Concurrency control", "Query optimization", "Views & triggers", "Backup & recovery",
             "NoSQL vs SQL", "Practice problem set", "Mock exam"],
    "javascript": ["JS fundamentals", "DOM manipulation", "ES6+ features", "Async/await & Promises",
                   "Closures & scope", "Array methods", "Fetch & APIs", "Node.js basics",
                   "Express basics", "React fundamentals", "State management", "Debugging practice",
                   "Coding problems practice", "Mock interview", "Resume review"],
    "java": ["Java syntax & OOP", "Collections framework", "Exception handling", "Multithreading",
             "Streams & Lambdas", "JDBC basics", "Spring Boot basics", "REST APIs in Spring",
             "Design patterns", "Coding problems practice", "System design basics", "Mock interview"],
    "web development": ["HTML & semantic markup", "CSS layout & Flexbox/Grid", "Responsive design",
                         "JavaScript fundamentals", "React components", "State & props", "Routing",
                         "REST API integration", "Forms & validation", "Deployment basics",
                         "Portfolio project work", "Final project polish"],
    "machine learning": ["Python for ML", "NumPy & Pandas", "Data cleaning", "EDA & visualization",
                          "Linear & logistic regression", "Decision trees & random forests",
                          "Model evaluation metrics", "Feature engineering", "Cross-validation",
                          "Intro to neural networks", "Capstone mini-project", "Mock interview"],
    "interview": ["Data structures refresher", "Arrays & strings problems", "Linked lists & stacks/queues",
                  "Trees & graphs", "Sorting & searching", "Dynamic programming basics",
                  "Behavioral question prep", "System design basics", "Mock coding round",
                  "Resume & LinkedIn review", "Company research", "Final mock interview"],
}

DEFAULT_BANK = ["Foundations & core concepts", "Key terminology", "Core principles deep-dive",
                "Applied examples", "Hands-on practice", "Common pitfalls", "Intermediate concepts",
                "Practice problem set", "Real-world case study", "Review & self-test",
                "Advanced topics", "Mini project work", "Weak-area revision", "Mock assessment",
                "Final review"]


def _pick_bank(goal_text: str):
    g = goal_text.lower()
    for key, bank in TOPIC_BANKS.items():
        if key in g:
            return bank
    return DEFAULT_BANK


def generate_roadmap_offline(goal_text: str, duration_days: int):
    bank = _pick_bank(goal_text)
    days = []
    for i in range(1, duration_days + 1):
        if i <= len(bank):
            title = bank[i - 1]
        else:
            # Cycle through revision/practice once the curated bank is exhausted
            title = f"Deep practice: {bank[(i - 1) % len(bank)]}"
        days.append({
            "day_number": i,
            "title": title,
            "summary": f"Day {i} focuses on '{title}', building toward: {goal_text}.",
        })
    return days


def generate_quiz_offline(topic: str, num_questions: int):
    """Generates plausible, clearly-labeled practice MCQs for demo purposes.

    IMPORTANT: earlier versions literally wrote "correct concept" into the
    right answer's text, which gave the answer away. This version instead
    builds every option from the same style of template so the correct one
    isn't textually distinguishable — the person still has to actually think
    about it, even though this offline generator has no real subject-matter
    knowledge to grade against.
    """
    correct_templates = [
        "{topic} is a core building block you build on step by step",
        "Understanding {topic} well makes related problems much easier",
        "{topic} follows a consistent, learnable pattern once practiced",
        "Getting comfortable with {topic} strengthens your fundamentals",
        "{topic} is something you'll use again and again as you progress",
    ]
    wrong_templates = [
        "{topic} is a legacy idea that modern approaches have replaced",
        "{topic} only matters for one narrow, uncommon use case",
        "{topic} has little practical value outside of exams",
        "{topic} is unrelated to the skill you're actually building",
        "{topic} requires expensive tools most learners can't access",
        "{topic} was deprecated and isn't taught anymore",
        "{topic} only works in one specific programming language",
        "{topic} can safely be skipped without affecting your progress",
    ]

    questions = []
    for i in range(num_questions):
        correct_text = random.choice(correct_templates).format(topic=topic)
        wrong_texts = random.sample(wrong_templates, 3)
        options = [w.format(topic=topic) for w in wrong_texts]
        correct_index = random.randint(0, 3)
        options.insert(correct_index, correct_text)

        questions.append({
            "question": f"Which statement about '{topic}' is most accurate? (Q{i + 1})",
            "options": options,
            "correct_index": correct_index,
            "topic": topic,
        })
    return questions


async def generate_roadmap(goal_text: str, duration_days: int):
    prompt = (
        f"Create a {duration_days}-day study roadmap for the goal: '{goal_text}'. "
        f"Return JSON: {{\"days\": [{{\"day_number\":1,\"title\":\"...\",\"summary\":\"...\"}}]}}"
    )
    try:
        raw = await call_llm(prompt)
        data = json.loads(raw)
        return data["days"]
    except Exception:
        return generate_roadmap_offline(goal_text, duration_days)


async def generate_quiz(topic: str, num_questions: int):
    prompt = (
        f"Create {num_questions} multiple-choice questions about '{topic}'. "
        f"Return JSON: {{\"questions\":[{{\"question\":\"...\",\"options\":[\"a\",\"b\",\"c\",\"d\"],"
        f"\"correct_index\":0,\"topic\":\"{topic}\"}}]}}"
    )
    try:
        raw = await call_llm(prompt)
        data = json.loads(raw)
        return data["questions"]
    except Exception:
        return generate_quiz_offline(topic, num_questions)


def _sentences(text: str):
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\\s+", re.sub(r"\\s+", " ", text))
        if len(sentence.strip()) > 35
    ]


def _offline_study_pack(filename: str, text: str):
    sentences = _sentences(text)
    summary_sentences = sentences[:5] or [text[:600]]
    candidates = re.findall(r"\\b[A-Z][A-Za-z0-9-]{2,}(?:\\s+[A-Z][A-Za-z0-9-]{2,}){0,2}", text)
    topics = []
    for candidate in candidates:
        cleaned = candidate.strip()
        if cleaned.lower() not in {topic.lower() for topic in topics}:
            topics.append(cleaned)
        if len(topics) == 6:
            break
    if not topics:
        topics = [Path(filename).stem.replace("_", " ").replace("-", " ")]

    flashcards = []
    for index, topic in enumerate(topics[:6]):
        answer = next((s for s in sentences if topic.lower() in s.lower()), summary_sentences[index % len(summary_sentences)])
        flashcards.append({"question": f"What should you remember about {topic}?", "answer": answer})
    return {
        "summary": " ".join(summary_sentences)[:1800],
        "important_topics": topics,
        "flashcards": flashcards,
    }


async def generate_study_pack(filename: str, text: str):
    fallback = _offline_study_pack(filename, text)
    prompt = (
        "Create a study pack from this material. Return JSON with summary (max 180 words), "
        "important_topics (3-6 strings), and flashcards (3-6 objects with question and answer). "
        f"Filename: {filename}. Material:\n{text[:12000]}"
    )
    try:
        data = json.loads(await call_llm(prompt))
        if not isinstance(data.get("summary"), str) or not data.get("important_topics") or not data.get("flashcards"):
            return fallback
        return {
            "summary": data["summary"][:1800],
            "important_topics": [str(topic) for topic in data["important_topics"][:6]],
            "flashcards": [
                {"question": str(card["question"]), "answer": str(card["answer"])}
                for card in data["flashcards"][:6]
                if isinstance(card, dict) and card.get("question") and card.get("answer")
            ] or fallback["flashcards"],
        }
    except Exception:
        return fallback


async def generate_quiz_from_material(filename: str, text: str, num_questions: int):
    prompt = (
        f"Create {num_questions} accurate MCQs only from this study material: {filename}. "
        "Return JSON with questions, each containing question, four options, correct_index, and topic. "
        f"Material:\n{text[:14000]}"
    )
    try:
        data = json.loads(await call_llm(prompt))
        questions = data.get("questions", [])
        if questions and all(len(question.get("options", [])) == 4 for question in questions):
            return questions[:num_questions]
    except Exception:
        pass
    pack = _offline_study_pack(filename, text)
    topic = pack["important_topics"][0]
    return generate_quiz_offline(topic, num_questions)


async def answer_from_material(message: str, material_text: str, material_name: str):
    terms = {word.lower() for word in re.findall(r"[A-Za-z]{4,}", message)}
    relevant = [
        sentence for sentence in _sentences(material_text)
        if terms.intersection(word.lower() for word in re.findall(r"[A-Za-z]{4,}", sentence))
    ][:5]
    context = " ".join(relevant) or material_text[:1600]
    prompt = (
        f"Answer the student's question using only this uploaded material ({material_name}). "
        "Use simple language and say when the material does not contain the answer. "
        f"Question: {message}\nMaterial context: {context}"
    )
    try:
        return await call_llm(prompt), "llm"
    except Exception:
        return f"From {material_name}: {context[:900]}", "offline"
