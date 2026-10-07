/**
 * seedMockData.js
 *
 * Populates the MongoDB database with realistic mock data for demoing
 * the NoteGraph project. Uses the real Mongoose models so all pre-save
 * hooks (password hashing, slug generation, expiry calculation) run
 * exactly the way they would through the real app.
 *
 * Usage:  npm run seed   (from the server/ folder)
 *    or:  node seedMockData.js
 */

// Load environment variables from .env so we can read MONGO_URI
require('dotenv').config();

var mongoose = require('mongoose');
var User = require('./models/User');
var Note = require('./models/Note');

// nanoid v3 CommonJS import — same as the real notes route
var nanoidModule = require('nanoid');
var nanoid = nanoidModule.nanoid;

// Helper: generate an 8-character nanoid (same as the app)
function generateNanoid() {
  return nanoid(8);
}


// ============================================================
//  USER ACCOUNTS
// ============================================================
var usersToCreate = [
  { username: 'testuser',       email: 'testuser@example.com',       password: 'testpass', role: 'user' },
  { username: 'testadmin',      email: 'testadmin@example.com',      password: 'testpass', role: 'admin' },
  { username: 'testsuperadmin', email: 'testsuperadmin@example.com', password: 'testpass', role: 'superadmin' }
];


// ============================================================
//  ADMIN NOTES  (20 total — authored by testadmin, permanent)
// ============================================================
var adminNotes = [

  // ── CLUSTER 1: Discrete Mathematics (2 notes) ───────────

  {
    title: 'Propositional Logic Fundamentals',
    tags: ['discrete-math', 'logic'],
    visibility: 'public',
    body:
      '## Propositional Logic Fundamentals\n\n' +
      'Propositional logic is the foundation of **mathematical reasoning** and *formal proof*. ' +
      'It deals with propositions — statements that are either *true* or *false* — and the ' +
      'connectives that combine them.\n\n' +
      '> "Logic is the beginning of wisdom, not the end of it." — Leonard Nimoy\n\n' +
      '---\n\n' +
      '### Logical Connectives\n\n' +
      'The five core connectives are:\n\n' +
      '- **Negation** (`NOT`, $\\lnot P$)\n' +
      '- **Conjunction** (`AND`, $P \\land Q$)\n' +
      '- **Disjunction** (`OR`, $P \\lor Q$)\n' +
      '- **Implication** (`IF…THEN`, $P \\implies Q$)\n' +
      '- **Biconditional** (`IF AND ONLY IF`, $P \\iff Q$)\n\n' +
      '### A Key Tautology\n\n' +
      'One of the most important logical equivalences is:\n\n' +
      '$$(P \\land Q) \\implies R \\;\\equiv\\; P \\implies (Q \\implies R)$$\n\n' +
      'This is known as *exportation* and is used heavily in proof writing.\n\n' +
      '---\n\n' +
      '### Truth Table for Implication\n\n' +
      '| $P$ | $Q$ | $P \\implies Q$ |\n' +
      '|-----|-----|-----------------|\n' +
      '| T   | T   | T               |\n' +
      '| T   | F   | F               |\n' +
      '| F   | T   | T               |\n' +
      '| F   | F   | T               |\n\n' +
      'Notice that an implication is **only false** when the premise is true and the conclusion is false.\n\n' +
      '### Evaluating Compound Propositions in Python\n\n' +
      '```python\n' +
      'def implies(p, q):\n' +
      '    """Logical implication: p -> q"""\n' +
      '    return (not p) or q\n\n' +
      'print(implies(True, False))   # False\n' +
      'print(implies(False, True))   # True\n' +
      '```\n\n' +
      'For more details, see the [Stanford Logic Course](https://web.stanford.edu/class/cs103/).\n'
  },

  {
    title: 'Set Theory and Proof Techniques',
    tags: ['discrete-math', 'proofs'],
    visibility: 'public',
    body:
      '## Set Theory and Proof Techniques\n\n' +
      'Set theory provides the *language* of modern mathematics. Combined with rigorous ' +
      '**proof techniques**, it lets us establish truths that hold universally.\n\n' +
      '---\n\n' +
      '### Core Set Operations\n\n' +
      'The union of two sets is defined as:\n\n' +
      '$$A \\cup B = \\{x : x \\in A \\text{ or } x \\in B\\}$$\n\n' +
      'And the intersection:\n\n' +
      '$$A \\cap B = \\{x : x \\in A \\text{ and } x \\in B\\}$$\n\n' +
      '> **De Morgan\'s Law for Sets:** $\\overline{A \\cup B} = \\overline{A} \\cap \\overline{B}$\n\n' +
      '---\n\n' +
      '### Common Proof Techniques\n\n' +
      '1. **Direct Proof** — assume the hypothesis, derive the conclusion step by step\n' +
      '2. **Proof by Contradiction** — assume the negation, derive a contradiction\n' +
      '3. **Proof by Contrapositive** — prove $\\lnot Q \\implies \\lnot P$ instead of $P \\implies Q$\n' +
      '4. **Mathematical Induction** — base case + inductive step for statements over $\\mathbb{N}$\n' +
      '5. **Proof by Cases** — split into exhaustive cases and prove each\n\n' +
      '### Example: Direct Proof\n\n' +
      '> **Claim:** If $n$ is even, then $n^2$ is even.\n' +
      '>\n' +
      '> *Proof.* Let $n = 2k$ for some integer $k$. Then $n^2 = (2k)^2 = 4k^2 = 2(2k^2)$. ' +
      'Since $2k^2$ is an integer, $n^2$ is even. $\\blacksquare$\n\n' +
      '### Checking Set Membership in Python\n\n' +
      '```python\n' +
      'A = {1, 2, 3, 4}\n' +
      'B = {3, 4, 5, 6}\n\n' +
      'union = A | B          # {1, 2, 3, 4, 5, 6}\n' +
      'intersection = A & B   # {3, 4}\n' +
      'difference = A - B     # {1, 2}\n' +
      '```\n\n' +
      'A great reference is [MIT OpenCourseWare — Mathematics for CS](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/).\n'
  },

  // ── CLUSTER 2: Theory of Computation (2 notes) ──────────

  {
    title: 'Deterministic Finite Automata',
    tags: ['toc', 'automata'],
    visibility: 'public',
    body:
      '## Deterministic Finite Automata (DFA)\n\n' +
      'A **DFA** is the simplest model of computation. It reads an input string ' +
      '*one symbol at a time* and either **accepts** or **rejects** the string ' +
      'based on the state it ends up in.\n\n' +
      '> A DFA is formally defined as a 5-tuple $(Q, \\Sigma, \\delta, q_0, F)$.\n\n' +
      '---\n\n' +
      '### Components\n\n' +
      '- $Q$ — finite set of **states**\n' +
      '- $\\Sigma$ — input **alphabet**\n' +
      '- $\\delta: Q \\times \\Sigma \\to Q$ — **transition function**\n' +
      '- $q_0 \\in Q$ — **start state**\n' +
      '- $F \\subseteq Q$ — set of **accept states**\n\n' +
      '### Example DFA: Accepts strings ending in `01`\n\n' +
      'The following state diagram shows a DFA over $\\Sigma = \\{0, 1\\}$ ' +
      'that accepts any binary string ending with `01`:\n\n' +
      '```mermaid\n' +
      'stateDiagram-v2\n' +
      '    direction LR\n' +
      '    [*] --> S0\n' +
      '    S0 --> S0 : 1\n' +
      '    S0 --> S1 : 0\n' +
      '    S1 --> S1 : 0\n' +
      '    S1 --> S2 : 1\n' +
      '    S2 --> S0 : 1\n' +
      '    S2 --> S1 : 0\n' +
      '    S2 --> [*]\n' +
      '```\n\n' +
      '---\n\n' +
      '### Simulating a DFA in Python\n\n' +
      '```python\n' +
      'def run_dfa(input_string):\n' +
      '    state = "S0"\n' +
      '    for symbol in input_string:\n' +
      '        if state == "S0":\n' +
      '            state = "S1" if symbol == "0" else "S0"\n' +
      '        elif state == "S1":\n' +
      '            state = "S2" if symbol == "1" else "S1"\n' +
      '        elif state == "S2":\n' +
      '            state = "S1" if symbol == "0" else "S0"\n' +
      '    return state == "S2"\n\n' +
      'print(run_dfa("1101"))  # True\n' +
      'print(run_dfa("1100"))  # False\n' +
      '```\n\n' +
      'For a comprehensive treatment, see [Sipser — Introduction to the Theory of Computation](https://math.mit.edu/~sipser/book.html).\n'
  },

  {
    title: 'Regular Expressions and Regular Languages',
    tags: ['toc', 'automata'],
    visibility: 'public',
    body:
      '## Regular Expressions and Regular Languages\n\n' +
      'A **regular language** is any language that can be recognized by a DFA (or NFA). ' +
      '*Regular expressions* provide a compact, algebraic notation for describing these languages.\n\n' +
      '> **Kleene\'s Theorem:** A language is regular if and only if it can be described by a regular expression.\n\n' +
      '---\n\n' +
      '### Regex Operators\n\n' +
      '| Operator | Meaning | Example |\n' +
      '|----------|---------|---------|\n' +
      '| `ab`     | Concatenation | `01` matches `"01"` |\n' +
      '| `a\\|b`   | Union | `0\\|1` matches `"0"` or `"1"` |\n' +
      '| `a*`     | Kleene star (zero or more) | `0*` matches `""`, `"0"`, `"00"`, … |\n' +
      '| `a+`     | One or more | `1+` matches `"1"`, `"11"`, … |\n\n' +
      '### NFA to DFA Conversion (Subset Construction)\n\n' +
      'An NFA with $\\varepsilon$-transitions can be converted to an equivalent DFA ' +
      'using the *subset construction* algorithm:\n\n' +
      '```mermaid\n' +
      'flowchart LR\n' +
      '    A["{q0}"] -->|a| B["{q0, q1}"]\n' +
      '    A -->|b| A\n' +
      '    B -->|a| B\n' +
      '    B -->|b| C["{q1, q2}"]\n' +
      '    C -->|a| B\n' +
      '    C -->|b| A\n' +
      '    style C fill:#34C759,color:#fff\n' +
      '```\n\n' +
      '---\n\n' +
      '### Common Regex Patterns\n\n' +
      '```javascript\n' +
      '// Email validation (simplified)\n' +
      'var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\n\n' +
      '// Phone number (US format)\n' +
      'var phonePattern = /^\\(\\d{3}\\)\\s?\\d{3}-\\d{4}$/;\n\n' +
      '// IPv4 address\n' +
      'var ipPattern = /^(\\d{1,3}\\.){3}\\d{1,3}$/;\n' +
      '```\n\n' +
      'Regular expressions are **closed** under union, concatenation, and Kleene star, ' +
      'but *not* under complementation when using practical regex engines with back-references.\n\n' +
      'See [regex101.com](https://regex101.com/) for interactive testing.\n'
  },

  // ── CLUSTER 3: Computer Organization & Architecture (1 note) ─

  {
    title: 'The CPU Instruction Cycle',
    tags: ['coa'],
    visibility: 'public',
    body:
      '## The CPU Instruction Cycle\n\n' +
      'Every instruction a CPU executes follows a repeating cycle called the ' +
      '**instruction cycle** (also known as the *fetch-decode-execute* cycle). ' +
      'Understanding this cycle is fundamental to computer architecture.\n\n' +
      '> "The stored-program concept is the single most important idea in computer science." — John von Neumann\n\n' +
      '---\n\n' +
      '### The Four Phases\n\n' +
      '1. **Fetch** — the CPU reads the next instruction from memory using the `Program Counter` (PC)\n' +
      '2. **Decode** — the control unit interprets the *opcode* and identifies operands\n' +
      '3. **Execute** — the ALU performs the operation (arithmetic, logic, or data transfer)\n' +
      '4. **Store** — results are written back to a register or memory location\n\n' +
      '```mermaid\n' +
      'flowchart LR\n' +
      '    F["Fetch"] --> D["Decode"]\n' +
      '    D --> E["Execute"]\n' +
      '    E --> S["Store"]\n' +
      '    S --> F\n' +
      '```\n\n' +
      '---\n\n' +
      '### RISC vs CISC Architectures\n\n' +
      '| Feature | RISC | CISC |\n' +
      '|---------|------|------|\n' +
      '| Instruction length | Fixed (32-bit) | Variable |\n' +
      '| Instructions per cycle | Usually 1 | Often multi-cycle |\n' +
      '| Number of instructions | Small set (~100) | Large set (~1000) |\n' +
      '| Addressing modes | Few, simple | Many, complex |\n' +
      '| Examples | ARM, MIPS, RISC-V | x86, VAX |\n' +
      '| Design philosophy | *Simple hardware, smart compiler* | *Complex hardware, simple compiler* |\n\n' +
      '### Instruction Representation\n\n' +
      '```\n' +
      'MIPS R-type instruction format (32 bits):\n' +
      '┌────────┬───────┬───────┬───────┬───────┬────────┐\n' +
      '│ opcode │  rs   │  rt   │  rd   │ shamt │ funct  │\n' +
      '│ 6 bits │ 5 bits│ 5 bits│ 5 bits│ 5 bits│ 6 bits │\n' +
      '└────────┴───────┴───────┴───────┴───────┴────────┘\n' +
      '```\n\n' +
      'Modern CPUs also use **pipelining** to overlap multiple instruction cycles, ' +
      'achieving *instruction-level parallelism* (ILP).\n\n' +
      'Read more at [RISC-V Foundation](https://riscv.org/).\n'
  },

  // ── CLUSTER 4: Full Stack Development (3 notes) ─────────

  {
    title: 'MongoDB and Mongoose Fundamentals',
    tags: ['fsd', 'mongodb'],
    visibility: 'public',
    body:
      '## MongoDB and Mongoose Fundamentals\n\n' +
      'MongoDB is a **document-oriented** NoSQL database that stores data in flexible, ' +
      'JSON-like documents called *BSON*. **Mongoose** is an ODM (Object Data Modeling) library ' +
      'for Node.js that provides schema validation and a clean API.\n\n' +
      '> MongoDB is ideal for applications with rapidly evolving schemas and horizontal scaling needs.\n\n' +
      '---\n\n' +
      '### Defining a Mongoose Schema\n\n' +
      '```javascript\n' +
      'var mongoose = require("mongoose");\n\n' +
      'var noteSchema = new mongoose.Schema({\n' +
      '  title:      { type: String, required: true, trim: true },\n' +
      '  body:       { type: String, default: "" },\n' +
      '  tags:       { type: [String], default: [] },\n' +
      '  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },\n' +
      '  createdAt:  { type: Date, default: Date.now },\n' +
      '  isDeleted:  { type: Boolean, default: false }\n' +
      '});\n\n' +
      'module.exports = mongoose.model("Note", noteSchema);\n' +
      '```\n\n' +
      '### CRUD Operations\n\n' +
      '- **Create** — `Note.create({ title: "Hello" })` or `new Note({...}).save()`\n' +
      '- **Read** — `Note.find({})`, `Note.findById(id)`, `Note.findOne({ title: "Hello" })`\n' +
      '- **Update** — `Note.findByIdAndUpdate(id, { title: "Updated" })`\n' +
      '- **Delete** — `Note.findByIdAndDelete(id)` or soft-delete by setting `isDeleted: true`\n\n' +
      '---\n\n' +
      '### Indexing for Performance\n\n' +
      'Always add indexes on fields you frequently query or sort by:\n\n' +
      '```javascript\n' +
      'noteSchema.index({ visibility: 1, isDeleted: 1 });\n' +
      'noteSchema.index({ authorId: 1, createdAt: -1 });\n' +
      '```\n\n' +
      '*Compound indexes* can cover multiple query patterns in a single index.\n\n' +
      'Official docs: [mongoosejs.com](https://mongoosejs.com/docs/guide.html).\n'
  },

  {
    title: 'React State Management with Hooks',
    tags: ['fsd', 'react'],
    visibility: 'public',
    body:
      '## React State Management with Hooks\n\n' +
      'React **Hooks** let you use state and lifecycle features inside *function components*. ' +
      'The two most commonly used hooks are `useState` and `useEffect`.\n\n' +
      '> Hooks were introduced in React 16.8 and have become the standard for managing component logic.\n\n' +
      '---\n\n' +
      '### useState and useEffect Example\n\n' +
      '```javascript\n' +
      'import React from "react";\n\n' +
      'function NotesCounter() {\n' +
      '  var countState = React.useState(0);\n' +
      '  var count = countState[0];\n' +
      '  var setCount = countState[1];\n\n' +
      '  React.useEffect(function () {\n' +
      '    document.title = "Notes: " + count;\n' +
      '  }, [count]);\n\n' +
      '  return (\n' +
      '    <div>\n' +
      '      <p>You have {count} notes</p>\n' +
      '      <button onClick={function () { setCount(count + 1); }}>\n' +
      '        Add Note\n' +
      '      </button>\n' +
      '    </div>\n' +
      '  );\n' +
      '}\n' +
      '```\n\n' +
      '### Component Data Flow\n\n' +
      'React follows **one-way data flow** — data flows down from parent to child via *props*, ' +
      'and events flow up from child to parent via *callback functions*:\n\n' +
      '```mermaid\n' +
      'flowchart TD\n' +
      '    P["Parent Component"] -->|props| C["Child Component"]\n' +
      '    C -->|event callback| P\n' +
      '    P -->|state update| P\n' +
      '    P -->|re-render| C\n' +
      '```\n\n' +
      '---\n\n' +
      '### Rules of Hooks\n\n' +
      '1. Only call hooks at the **top level** — never inside loops, conditions, or nested functions\n' +
      '2. Only call hooks from **React function components** or custom hooks\n' +
      '3. Custom hooks must start with the word `use` (e.g., `useAuth`, `useFetch`)\n\n' +
      'Read the full docs at [react.dev/reference/react](https://react.dev/reference/react).\n'
  },

  {
    title: 'Express.js Routing and Middleware',
    tags: ['fsd', 'express'],
    visibility: 'public',
    body:
      '## Express.js Routing and Middleware\n\n' +
      'Express is a **minimal, unopinionated** web framework for Node.js. Its core concepts ' +
      'are *routing* (mapping URLs to handlers) and *middleware* (functions that process requests ' +
      'in sequence before sending a response).\n\n' +
      '> Express is the "E" in the MERN stack (MongoDB, Express, React, Node).\n\n' +
      '---\n\n' +
      '### A Simple Route Handler\n\n' +
      '```javascript\n' +
      'var express = require("express");\n' +
      'var router = express.Router();\n\n' +
      '// GET /api/notes — return all notes\n' +
      'router.get("/notes", function (req, res) {\n' +
      '  var notes = [{ id: 1, title: "Hello World" }];\n' +
      '  return res.status(200).json({ notes: notes });\n' +
      '});\n\n' +
      '// POST /api/notes — create a new note\n' +
      'router.post("/notes", function (req, res) {\n' +
      '  var title = req.body.title;\n' +
      '  if (!title) {\n' +
      '    return res.status(400).json({ message: "Title is required" });\n' +
      '  }\n' +
      '  return res.status(201).json({ message: "Note created" });\n' +
      '});\n\n' +
      'module.exports = router;\n' +
      '```\n\n' +
      '### Middleware Execution Order\n\n' +
      'Middleware functions execute **in the order they are registered**. Each one can:\n\n' +
      '1. **Execute code** (e.g., logging, parsing)\n' +
      '2. **Modify** the `req` or `res` objects\n' +
      '3. **End** the request-response cycle by calling `res.send()` or `res.json()`\n' +
      '4. **Pass control** to the next middleware by calling `next()`\n\n' +
      '---\n\n' +
      '### Common Middleware Stack\n\n' +
      '- `helmet()` — sets security-related HTTP headers\n' +
      '- `cors()` — enables Cross-Origin Resource Sharing\n' +
      '- `express.json()` — parses incoming JSON request bodies\n' +
      '- `protect` (custom) — verifies JWT tokens and attaches `req.user`\n' +
      '- `requireAdmin` (custom) — checks that `req.user.role` is `admin` or `superadmin`\n\n' +
      'Learn more at [expressjs.com](https://expressjs.com/en/guide/using-middleware.html).\n'
  },

  // ── CLUSTER 5: Python (3 notes) ─────────────────────────

  {
    title: 'Introduction to Machine Learning with Python',
    tags: ['python', 'ml'],
    visibility: 'public',
    body:
      '## Introduction to Machine Learning with Python\n\n' +
      'Machine learning is a branch of **artificial intelligence** where models *learn patterns* ' +
      'from data instead of being explicitly programmed. Python\'s ecosystem — `scikit-learn`, ' +
      '`NumPy`, `pandas` — makes it the dominant language for ML.\n\n' +
      '> "All models are wrong, but some are useful." — George Box\n\n' +
      '---\n\n' +
      '### Linear Regression\n\n' +
      'The simplest ML model fits a straight line to the data:\n\n' +
      '$$y = mx + b$$\n\n' +
      'where $m$ is the **slope** (weight) and $b$ is the **intercept** (bias). ' +
      'The model learns $m$ and $b$ by minimizing the *mean squared error*:\n\n' +
      '$$\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$$\n\n' +
      '### scikit-learn Example\n\n' +
      '```python\n' +
      'from sklearn.linear_model import LinearRegression\n' +
      'from sklearn.model_selection import train_test_split\n' +
      'import numpy as np\n\n' +
      '# Generate sample data\n' +
      'X = np.array([[1], [2], [3], [4], [5]])\n' +
      'y = np.array([2, 4, 5, 4, 5])\n\n' +
      '# Split into train and test sets\n' +
      'X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n\n' +
      '# Train the model\n' +
      'model = LinearRegression()\n' +
      'model.fit(X_train, y_train)\n\n' +
      '# Predict and evaluate\n' +
      'predictions = model.predict(X_test)\n' +
      'print("Score:", model.score(X_test, y_test))\n' +
      '```\n\n' +
      '---\n\n' +
      '### Types of ML Problems\n\n' +
      '- **Supervised Learning** — labeled data (classification, regression)\n' +
      '- **Unsupervised Learning** — no labels (clustering, dimensionality reduction)\n' +
      '- **Reinforcement Learning** — learn through rewards and penalties\n\n' +
      'Explore more at [scikit-learn.org](https://scikit-learn.org/stable/user_guide.html).\n'
  },

  {
    title: 'Building Web Apps with Django',
    tags: ['python', 'django'],
    visibility: 'public',
    body:
      '## Building Web Apps with Django\n\n' +
      'Django is a **high-level Python web framework** that follows the ' +
      '*Model-View-Template* (MVT) architecture. It emphasizes rapid development, ' +
      'clean design, and the principle of **"Don\'t Repeat Yourself"** (DRY).\n\n' +
      '> Django was named after the jazz guitarist *Django Reinhardt*.\n\n' +
      '---\n\n' +
      '### Django Model Definition\n\n' +
      '```python\n' +
      'from django.db import models\n\n' +
      'class Article(models.Model):\n' +
      '    title = models.CharField(max_length=200)\n' +
      '    body = models.TextField()\n' +
      '    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)\n' +
      '    published_at = models.DateTimeField(auto_now_add=True)\n' +
      '    is_draft = models.BooleanField(default=True)\n\n' +
      '    def __str__(self):\n' +
      '        return self.title\n' +
      '```\n\n' +
      '### Request / Response Flow\n\n' +
      'Django processes each HTTP request through a well-defined pipeline:\n\n' +
      '```mermaid\n' +
      'flowchart LR\n' +
      '    Client --> URLs["urls.py"]\n' +
      '    URLs --> View["views.py"]\n' +
      '    View --> Model["models.py"]\n' +
      '    Model --> DB["Database"]\n' +
      '    DB --> Model\n' +
      '    Model --> View\n' +
      '    View --> Template["template.html"]\n' +
      '    Template --> Client\n' +
      '```\n\n' +
      '---\n\n' +
      '### Key Django Commands\n\n' +
      '- `python manage.py runserver` — start the development server\n' +
      '- `python manage.py makemigrations` — generate migration files from model changes\n' +
      '- `python manage.py migrate` — apply migrations to the database\n' +
      '- `python manage.py createsuperuser` — create an admin account\n' +
      '- `python manage.py shell` — open an interactive Python shell with Django context\n\n' +
      'Official docs: [djangoproject.com](https://docs.djangoproject.com/en/5.0/).\n'
  },

  {
    title: 'REST API Design with Django REST Framework',
    tags: ['python', 'restapi'],
    visibility: 'public',
    body:
      '## REST API Design with Django REST Framework\n\n' +
      'Django REST Framework (**DRF**) is a powerful toolkit for building *Web APIs* in Python. ' +
      'It provides **serializers**, viewsets, authentication, and a browsable API out of the box.\n\n' +
      '> REST stands for *Representational State Transfer* — an architectural style for distributed systems.\n\n' +
      '---\n\n' +
      '### Serializer Example\n\n' +
      '```python\n' +
      'from rest_framework import serializers\n\n' +
      'class ArticleSerializer(serializers.ModelSerializer):\n' +
      '    class Meta:\n' +
      '        model = Article\n' +
      '        fields = ["id", "title", "body", "author", "published_at"]\n' +
      '        read_only_fields = ["id", "published_at"]\n' +
      '```\n\n' +
      '### Common HTTP Status Codes\n\n' +
      '| Code | Name | Meaning |\n' +
      '|------|------|---------|\n' +
      '| `200` | OK | Successful GET or PUT |\n' +
      '| `201` | Created | Successful POST (resource created) |\n' +
      '| `204` | No Content | Successful DELETE |\n' +
      '| `400` | Bad Request | Validation errors or malformed input |\n' +
      '| `401` | Unauthorized | Missing or invalid authentication |\n' +
      '| `403` | Forbidden | Authenticated but insufficient permissions |\n' +
      '| `404` | Not Found | Resource does not exist |\n' +
      '| `500` | Internal Server Error | Unhandled server-side exception |\n\n' +
      '---\n\n' +
      '### RESTful URL Design\n\n' +
      '1. Use **nouns** for resources: `/api/articles/`, not `/api/getArticles/`\n' +
      '2. Use **HTTP verbs** for actions: `GET`, `POST`, `PUT`, `DELETE`\n' +
      '3. Use **plural names**: `/api/users/`, not `/api/user/`\n' +
      '4. **Nest** related resources: `/api/users/5/articles/`\n' +
      '5. **Version** your API: `/api/v1/articles/`\n\n' +
      'Learn more at [django-rest-framework.org](https://www.django-rest-framework.org/).\n'
  },

  // ── CLUSTER 6: Operating Systems (2 notes) ──────────────

  {
    title: 'Process Scheduling Algorithms',
    tags: ['os', 'scheduling'],
    visibility: 'public',
    body:
      '## Process Scheduling Algorithms\n\n' +
      'The **CPU scheduler** decides which process in the *ready queue* gets the CPU next. ' +
      'Choosing the right algorithm balances **throughput**, *response time*, and **fairness**.\n\n' +
      '> The goal of scheduling is to maximize CPU utilization while minimizing wait time.\n\n' +
      '---\n\n' +
      '### Common Algorithms\n\n' +
      '| Algorithm | Preemptive? | Key Idea |\n' +
      '|-----------|-------------|----------|\n' +
      '| FCFS (First Come First Served) | No | Process in arrival order |\n' +
      '| SJF (Shortest Job First) | No | Pick the shortest burst time |\n' +
      '| SRTF (Shortest Remaining Time) | Yes | Preempt if a shorter job arrives |\n' +
      '| Round Robin | Yes | Fixed time quantum, rotate |\n' +
      '| Priority Scheduling | Both | Highest priority runs first |\n' +
      '| Multilevel Feedback Queue | Yes | Multiple queues, aging mechanism |\n\n' +
      '### Round Robin Example\n\n' +
      'With a time quantum of **4 ms** and three processes:\n\n' +
      '```\n' +
      'Time:  0   4   8  12  14  18  20\n' +
      '       |P1-|P2-|P3-|P1-|P2-|P3-|\n' +
      '```\n\n' +
      '---\n\n' +
      '### Scheduling Flow\n\n' +
      '```mermaid\n' +
      'flowchart TD\n' +
      '    New["New Process"] --> Ready["Ready Queue"]\n' +
      '    Ready --> CPU["Running on CPU"]\n' +
      '    CPU -->|"time quantum expired"| Ready\n' +
      '    CPU -->|"I/O request"| Waiting["Waiting Queue"]\n' +
      '    Waiting -->|"I/O complete"| Ready\n' +
      '    CPU -->|"process complete"| Terminated["Terminated"]\n' +
      '```\n\n' +
      '### Key Metrics\n\n' +
      '- **Turnaround Time** = Completion Time $-$ Arrival Time\n' +
      '- **Waiting Time** = Turnaround Time $-$ Burst Time\n' +
      '- **Response Time** = First Run Time $-$ Arrival Time\n\n' +
      'See [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) for a free textbook.\n'
  },

  {
    title: 'Memory Management and Virtual Memory',
    tags: ['os', 'memory'],
    visibility: 'public',
    body:
      '## Memory Management and Virtual Memory\n\n' +
      'The OS must allocate *physical memory* efficiently among competing processes. ' +
      '**Virtual memory** solves this by giving each process its own private, ' +
      'contiguous **address space** that maps to physical RAM (or disk) behind the scenes.\n\n' +
      '> Virtual memory lets programs use more memory than physically available by swapping pages to disk.\n\n' +
      '---\n\n' +
      '### Paging\n\n' +
      'Memory is divided into fixed-size **pages** (typically 4 KB). The *page table* maps ' +
      'virtual page numbers to physical frame numbers:\n\n' +
      '$$\\text{Physical Address} = \\text{Frame Number} \\times \\text{Page Size} + \\text{Offset}$$\n\n' +
      '### Page Replacement Algorithms\n\n' +
      '1. **FIFO** — replace the oldest page in memory\n' +
      '2. **LRU** (Least Recently Used) — replace the page that hasn\'t been used the longest\n' +
      '3. **Optimal** — replace the page that won\'t be used for the longest time (theoretical)\n' +
      '4. **Clock** — a practical approximation of LRU using a *reference bit*\n\n' +
      '---\n\n' +
      '### Address Translation\n\n' +
      '```mermaid\n' +
      'flowchart LR\n' +
      '    VA["Virtual Address"] --> TLB["TLB Lookup"]\n' +
      '    TLB -->|"hit"| PA["Physical Address"]\n' +
      '    TLB -->|"miss"| PT["Page Table"]\n' +
      '    PT -->|"in memory"| PA\n' +
      '    PT -->|"page fault"| Disk["Swap from Disk"]\n' +
      '    Disk --> PA\n' +
      '```\n\n' +
      '### Calculating Page Table Size\n\n' +
      '```python\n' +
      '# Example: 32-bit address space, 4 KB pages\n' +
      'address_bits = 32\n' +
      'page_size = 4 * 1024   # 4 KB = 4096 bytes\n' +
      'offset_bits = 12       # log2(4096)\n' +
      'page_number_bits = address_bits - offset_bits   # 20\n' +
      'num_pages = 2 ** page_number_bits               # 1,048,576 entries\n' +
      'print("Page table entries:", num_pages)\n' +
      '```\n\n' +
      'Free textbook: [OSTEP — Virtual Memory](https://pages.cs.wisc.edu/~remzi/OSTEP/).\n'
  },

  // ── CLUSTER 7: Data Structures & Algorithms (3 notes) ───

  {
    title: 'Sorting Algorithms Compared',
    tags: ['dsa', 'sorting'],
    visibility: 'public',
    body:
      '## Sorting Algorithms Compared\n\n' +
      'Sorting is one of the most studied problems in computer science. Choosing the right ' +
      'algorithm depends on **data size**, *memory constraints*, and whether the data is ' +
      'nearly sorted already.\n\n' +
      '> "If you can\'t sort it, you can\'t solve it." — common CS wisdom\n\n' +
      '---\n\n' +
      '### Complexity Comparison\n\n' +
      '| Algorithm | Best | Average | Worst | Space | Stable? |\n' +
      '|-----------|------|---------|-------|-------|---------|\n' +
      '| Bubble Sort | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Yes |\n' +
      '| Selection Sort | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | No |\n' +
      '| Insertion Sort | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Yes |\n' +
      '| Merge Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(n)$ | Yes |\n' +
      '| Quick Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n^2)$ | $O(\\log n)$ | No |\n' +
      '| Heap Sort | $O(n \\log n)$ | $O(n \\log n)$ | $O(n \\log n)$ | $O(1)$ | No |\n\n' +
      '### Merge Sort Implementation\n\n' +
      '```python\n' +
      'def merge_sort(arr):\n' +
      '    if len(arr) <= 1:\n' +
      '        return arr\n' +
      '    mid = len(arr) // 2\n' +
      '    left = merge_sort(arr[:mid])\n' +
      '    right = merge_sort(arr[mid:])\n' +
      '    return merge(left, right)\n\n' +
      'def merge(left, right):\n' +
      '    result = []\n' +
      '    i = 0\n' +
      '    j = 0\n' +
      '    while i < len(left) and j < len(right):\n' +
      '        if left[i] <= right[j]:\n' +
      '            result.append(left[i])\n' +
      '            i = i + 1\n' +
      '        else:\n' +
      '            result.append(right[j])\n' +
      '            j = j + 1\n' +
      '    result.extend(left[i:])\n' +
      '    result.extend(right[j:])\n' +
      '    return result\n' +
      '```\n\n' +
      '---\n\n' +
      'Visualize sorting at [visualgo.net/en/sorting](https://visualgo.net/en/sorting).\n'
  },

  {
    title: 'Binary Trees and Traversals',
    tags: ['dsa', 'trees'],
    visibility: 'public',
    body:
      '## Binary Trees and Traversals\n\n' +
      'A **binary tree** is a hierarchical data structure where each node has at most ' +
      '*two children* — called the **left** and **right** child. Trees are used in ' +
      'everything from databases (B-trees) to compilers (syntax trees).\n\n' +
      '> A binary tree with $n$ nodes has exactly $n - 1$ edges.\n\n' +
      '---\n\n' +
      '### Example Tree Structure\n\n' +
      '```mermaid\n' +
      'flowchart TD\n' +
      '    A["10"] --> B["5"]\n' +
      '    A --> C["15"]\n' +
      '    B --> D["3"]\n' +
      '    B --> E["7"]\n' +
      '    C --> F["12"]\n' +
      '    C --> G["20"]\n' +
      '```\n\n' +
      '### Three Traversal Orders\n\n' +
      '| Traversal | Order | Result (above tree) |\n' +
      '|-----------|-------|---------------------|\n' +
      '| **In-order** | Left → Root → Right | 3, 5, 7, 10, 12, 15, 20 |\n' +
      '| **Pre-order** | Root → Left → Right | 10, 5, 3, 7, 15, 12, 20 |\n' +
      '| **Post-order** | Left → Right → Root | 3, 7, 5, 12, 20, 15, 10 |\n\n' +
      '### Python Implementation\n\n' +
      '```python\n' +
      'class TreeNode:\n' +
      '    def __init__(self, value):\n' +
      '        self.value = value\n' +
      '        self.left = None\n' +
      '        self.right = None\n\n' +
      'def inorder(node):\n' +
      '    if node is None:\n' +
      '        return []\n' +
      '    return inorder(node.left) + [node.value] + inorder(node.right)\n' +
      '```\n\n' +
      '---\n\n' +
      'A **Binary Search Tree** (BST) maintains the invariant: ' +
      '*left child < parent < right child*, enabling $O(\\log n)$ search on average.\n\n' +
      'Practice problems at [leetcode.com/tag/tree](https://leetcode.com/tag/tree/).\n'
  },

  {
    title: 'Graph Algorithms: BFS and DFS',
    tags: ['dsa', 'graphs'],
    visibility: 'public',
    body:
      '## Graph Algorithms: BFS and DFS\n\n' +
      '**Breadth-First Search** (BFS) and **Depth-First Search** (DFS) are the two ' +
      'fundamental graph traversal strategies. Almost every graph algorithm — shortest paths, ' +
      'cycle detection, topological sort — builds on one of these.\n\n' +
      '> Graphs are defined as $G = (V, E)$ where $V$ is the set of *vertices* and $E$ is the set of *edges*.\n\n' +
      '---\n\n' +
      '### Example Graph\n\n' +
      '```mermaid\n' +
      'flowchart LR\n' +
      '    A --- B\n' +
      '    A --- C\n' +
      '    B --- D\n' +
      '    C --- D\n' +
      '    C --- E\n' +
      '    D --- E\n' +
      '```\n\n' +
      '### BFS vs DFS\n\n' +
      '| Feature | BFS | DFS |\n' +
      '|---------|-----|-----|\n' +
      '| Data structure | Queue | Stack (or recursion) |\n' +
      '| Traversal order | Level by level | Go deep, then backtrack |\n' +
      '| Shortest path? | Yes (unweighted) | No |\n' +
      '| Time complexity | $O(V + E)$ | $O(V + E)$ |\n' +
      '| Use cases | Shortest path, level-order | Cycle detection, topological sort |\n\n' +
      '### BFS in Python\n\n' +
      '```python\n' +
      'from collections import deque\n\n' +
      'def bfs(graph, start):\n' +
      '    visited = set()\n' +
      '    queue = deque([start])\n' +
      '    visited.add(start)\n' +
      '    order = []\n\n' +
      '    while len(queue) > 0:\n' +
      '        node = queue.popleft()\n' +
      '        order.append(node)\n' +
      '        for neighbor in graph[node]:\n' +
      '            if neighbor not in visited:\n' +
      '                visited.add(neighbor)\n' +
      '                queue.append(neighbor)\n' +
      '    return order\n' +
      '```\n\n' +
      '---\n\n' +
      'For weighted graphs, use **Dijkstra\'s algorithm** ($O((V + E) \\log V)$) instead of BFS.\n\n' +
      'Interactive visualizations at [visualgo.net/en/dfsbfs](https://visualgo.net/en/dfsbfs).\n'
  },

  // ── CLUSTER 8: Database Management Systems (2 notes) ────

  {
    title: 'SQL Fundamentals and Query Writing',
    tags: ['dbms', 'sql'],
    visibility: 'public',
    body:
      '## SQL Fundamentals and Query Writing\n\n' +
      '**SQL** (Structured Query Language) is the standard language for interacting with ' +
      '*relational databases*. It lets you **create**, **read**, **update**, and **delete** ' +
      'data using declarative statements.\n\n' +
      '> SQL was developed at IBM in the 1970s and remains the dominant database query language today.\n\n' +
      '---\n\n' +
      '### Core SQL Commands\n\n' +
      '```sql\n' +
      '-- Create a table\n' +
      'CREATE TABLE students (\n' +
      '    id       INT PRIMARY KEY AUTO_INCREMENT,\n' +
      '    name     VARCHAR(100) NOT NULL,\n' +
      '    email    VARCHAR(150) UNIQUE,\n' +
      '    gpa      DECIMAL(3, 2) DEFAULT 0.00\n' +
      ');\n\n' +
      '-- Insert data\n' +
      'INSERT INTO students (name, email, gpa)\n' +
      'VALUES ("Alice", "alice@example.com", 3.85);\n\n' +
      '-- Query with filtering and sorting\n' +
      'SELECT name, gpa\n' +
      'FROM students\n' +
      'WHERE gpa > 3.5\n' +
      'ORDER BY gpa DESC;\n\n' +
      '-- Join two tables\n' +
      'SELECT s.name, c.course_name\n' +
      'FROM students s\n' +
      'INNER JOIN enrollments e ON s.id = e.student_id\n' +
      'INNER JOIN courses c ON e.course_id = c.id;\n' +
      '```\n\n' +
      '### Types of JOINs\n\n' +
      '- **INNER JOIN** — only matching rows from both tables\n' +
      '- **LEFT JOIN** — all rows from the left table + matching rows from the right\n' +
      '- **RIGHT JOIN** — all rows from the right table + matching rows from the left\n' +
      '- **FULL OUTER JOIN** — all rows from both tables\n\n' +
      '---\n\n' +
      '### Aggregate Functions\n\n' +
      '| Function | Description |\n' +
      '|----------|-------------|\n' +
      '| `COUNT()` | Number of rows |\n' +
      '| `SUM()` | Total of numeric column |\n' +
      '| `AVG()` | Average value |\n' +
      '| `MAX()` | Largest value |\n' +
      '| `MIN()` | Smallest value |\n\n' +
      'Practice at [sqlzoo.net](https://sqlzoo.net/).\n'
  },

  {
    title: 'Database Normalization',
    tags: ['dbms', 'normalization'],
    visibility: 'public',
    body:
      '## Database Normalization\n\n' +
      'Normalization is the process of organizing a relational database to **reduce redundancy** ' +
      'and **prevent anomalies** (insertion, update, deletion anomalies). Each *normal form* ' +
      'builds on the previous one.\n\n' +
      '> "Normalize until it hurts, denormalize until it works." — common DBA saying\n\n' +
      '---\n\n' +
      '### Normal Forms at a Glance\n\n' +
      '| Normal Form | Rule |\n' +
      '|-------------|------|\n' +
      '| **1NF** | All columns contain *atomic* (indivisible) values; no repeating groups |\n' +
      '| **2NF** | 1NF + no *partial dependencies* (every non-key column depends on the **whole** primary key) |\n' +
      '| **3NF** | 2NF + no *transitive dependencies* (non-key columns depend **only** on the primary key) |\n' +
      '| **BCNF** | For every functional dependency $X \\to Y$, $X$ must be a *superkey* |\n\n' +
      '### Example: Violating 2NF\n\n' +
      '```\n' +
      'OrderItems(OrderID, ProductID, ProductName, Quantity)\n' +
      '           ^^^^^^^^  ^^^^^^^^^  ^^^^^^^^^^^  ^^^^^^^^\n' +
      '           PK (composite)       depends on   depends on\n' +
      '                                ProductID    full PK\n' +
      '                                only (partial dependency!)\n' +
      '```\n\n' +
      '**Fix:** split into `OrderItems(OrderID, ProductID, Quantity)` ' +
      'and `Products(ProductID, ProductName)`.\n\n' +
      '---\n\n' +
      '### Functional Dependencies\n\n' +
      'A functional dependency $A \\to B$ means: *if two rows agree on $A$, ' +
      'they must agree on $B$*. For example:\n\n' +
      '- `StudentID` $\\to$ `StudentName` (a student ID determines the name)\n' +
      '- `{CourseID, Semester}` $\\to$ `Instructor` (a course in a specific semester has one instructor)\n\n' +
      '### Denormalization Trade-offs\n\n' +
      '- **Pro:** faster reads (fewer JOINs)\n' +
      '- **Con:** data redundancy, risk of update anomalies\n' +
      '- Common in *read-heavy* workloads like analytics dashboards\n\n' +
      'See [Database Normalization Explained](https://www.guru99.com/database-normalization.html) for more examples.\n'
  },

  // ── CLUSTER 9: Computer Networks (2 notes) ──────────────

  {
    title: 'The TCP/IP Model Explained',
    tags: ['networks', 'protocols'],
    visibility: 'public',
    body:
      '## The TCP/IP Model Explained\n\n' +
      'The **TCP/IP model** is the four-layer architecture that powers the modern internet. ' +
      'Every packet you send — whether it\'s a web request, an email, or a video stream — ' +
      'travels through these layers.\n\n' +
      '> The TCP/IP model was developed by *Vint Cerf* and *Bob Kahn* in the 1970s.\n\n' +
      '---\n\n' +
      '### The Four Layers\n\n' +
      '| Layer | Name | Protocols | Responsibility |\n' +
      '|-------|------|-----------|----------------|\n' +
      '| 4 | **Application** | HTTP, FTP, DNS, SMTP | User-facing data exchange |\n' +
      '| 3 | **Transport** | TCP, UDP | End-to-end delivery, flow control |\n' +
      '| 2 | **Internet** | IP, ICMP, ARP | Addressing and routing across networks |\n' +
      '| 1 | **Network Access** | Ethernet, Wi-Fi | Physical transmission of bits |\n\n' +
      '### Encapsulation Flow\n\n' +
      '```mermaid\n' +
      'flowchart TD\n' +
      '    App["Application Layer\\n(HTTP Data)"] --> Transport["Transport Layer\\n(+ TCP Header)"]\n' +
      '    Transport --> Internet["Internet Layer\\n(+ IP Header)"]\n' +
      '    Internet --> Network["Network Access Layer\\n(+ Ethernet Frame)"]\n' +
      '    Network --> Wire["Physical Medium\\n(bits on the wire)"]\n' +
      '```\n\n' +
      '---\n\n' +
      '### TCP vs UDP\n\n' +
      '- **TCP** — *reliable*, connection-oriented, guarantees delivery and order\n' +
      '- **UDP** — *fast*, connectionless, no delivery guarantee (used for video, gaming, DNS)\n\n' +
      '### The Three-Way Handshake (TCP)\n\n' +
      '```\n' +
      'Client          Server\n' +
      '  |--- SYN ------->|\n' +
      '  |<-- SYN+ACK ----|  \n' +
      '  |--- ACK ------->|\n' +
      '  |   (connected)  |\n' +
      '```\n\n' +
      'Learn more at [Cloudflare Learning Center](https://www.cloudflare.com/learning/ddos/glossary/tcp-ip/).\n'
  },

  {
    title: 'HTTP and Web Communication',
    tags: ['networks', 'http'],
    visibility: 'public',
    body:
      '## HTTP and Web Communication\n\n' +
      '**HTTP** (HyperText Transfer Protocol) is the *application-layer* protocol that powers ' +
      'the World Wide Web. Every time you open a webpage, your browser sends an HTTP request ' +
      'and receives an HTTP response.\n\n' +
      '> HTTP/1.1 was standardized in 1997. HTTP/2 (2015) and HTTP/3 (2022) brought major performance improvements.\n\n' +
      '---\n\n' +
      '### HTTP Request Structure\n\n' +
      '```\n' +
      'GET /api/notes HTTP/1.1\n' +
      'Host: localhost:5000\n' +
      'Authorization: Bearer eyJhbGciOi...\n' +
      'Accept: application/json\n' +
      '```\n\n' +
      '### HTTP Methods\n\n' +
      '| Method | Purpose | Idempotent? |\n' +
      '|--------|---------|-------------|\n' +
      '| `GET` | Retrieve a resource | Yes |\n' +
      '| `POST` | Create a resource | No |\n' +
      '| `PUT` | Replace a resource entirely | Yes |\n' +
      '| `PATCH` | Partially update a resource | No |\n' +
      '| `DELETE` | Remove a resource | Yes |\n\n' +
      '### Request / Response Cycle\n\n' +
      '```mermaid\n' +
      'sequenceDiagram\n' +
      '    participant Browser\n' +
      '    participant Server\n' +
      '    Browser->>Server: GET /api/notes\n' +
      '    Server-->>Browser: 200 OK + JSON body\n' +
      '    Browser->>Server: POST /api/notes (new note)\n' +
      '    Server-->>Browser: 201 Created\n' +
      '```\n\n' +
      '---\n\n' +
      '### HTTPS and TLS\n\n' +
      'HTTPS wraps HTTP inside a **TLS** (Transport Layer Security) tunnel, providing:\n\n' +
      '- **Encryption** — data can\'t be read in transit\n' +
      '- **Integrity** — data can\'t be tampered with\n' +
      '- **Authentication** — the server proves its identity via a certificate\n\n' +
      'Every production API should be served over HTTPS. ' +
      'See [MDN Web Docs — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) for the full reference.\n'
  }
];


// ============================================================
//  USER NOTES  (5 total — authored by testuser, normal expiry)
//  Tags are intentionally DIFFERENT from admin tags so they
//  never appear in the admin knowledge graph.
// ============================================================
var userNotes = [
  {
    title: 'Weekly Study Planner',
    tags: ['personal'],
    visibility: 'public',
    body:
      '## Weekly Study Planner\n\n' +
      '### Monday\n- Discrete Math revision (Ch. 3)\n- Submit COA assignment\n\n' +
      '### Tuesday\n- FSD lab: finish React component\n- Read TOC notes on DFA\n\n' +
      '### Wednesday\n- Python ML homework\n- Study group at 4 PM\n\n' +
      '### Thursday\n- OS scheduling algorithms practice\n- DSA: solve 3 LeetCode problems\n\n' +
      '### Friday\n- Review week\'s notes\n- Prepare for Monday quiz\n\n' +
      '> *Consistency beats intensity — study a little every day.*\n'
  },
  {
    title: 'Grocery List and Errands',
    tags: ['reminders'],
    visibility: 'private',
    body:
      '## Grocery List\n\n' +
      '- Milk (2 liters)\n- Eggs (1 dozen)\n- Rice (5 kg)\n- Bread (whole wheat)\n' +
      '- Coffee beans\n- Bananas\n\n---\n\n' +
      '### Errands\n\n1. Pick up laundry by 5 PM\n2. Return library books\n' +
      '3. Buy printer ink (HP 680)\n4. Pay electricity bill online\n\n' +
      '> Don\'t forget: *pharmacy closes at 8 PM*.\n'
  },
  {
    title: 'Movie Watchlist',
    tags: ['misc'],
    visibility: 'public',
    body:
      '## Movies to Watch\n\n' +
      '| Movie | Genre | Year | Watched? |\n' +
      '|-------|-------|------|----------|\n' +
      '| Interstellar | Sci-Fi | 2014 | Yes |\n' +
      '| The Social Network | Drama | 2010 | No |\n' +
      '| Arrival | Sci-Fi | 2016 | No |\n' +
      '| The Imitation Game | Biography | 2014 | Yes |\n' +
      '| Ex Machina | Sci-Fi/Thriller | 2014 | No |\n\n' +
      '---\n\n' +
      '> *Next movie night: Saturday 8 PM*\n'
  },
  {
    title: 'Semester Goals and Resolutions',
    tags: ['journal'],
    visibility: 'public',
    body:
      '## Semester 4 Goals\n\n' +
      '1. Maintain **8.5+ SGPA**\n' +
      '2. Build and deploy the *NoteGraph* project end-to-end\n' +
      '3. Solve **100 DSA problems** on LeetCode\n' +
      '4. Learn `Docker` basics and containerize at least one project\n' +
      '5. Read one technical book per month\n\n---\n\n' +
      '### Progress Tracker\n\n' +
      '- [x] Set up project repository\n' +
      '- [x] Complete Express + MongoDB backend\n' +
      '- [ ] Add Django graph service\n' +
      '- [ ] Deploy to production\n\n' +
      '> *"The secret of getting ahead is getting started."* — Mark Twain\n'
  },
  {
    title: 'Quick Exam Reminder',
    tags: ['todo'],
    visibility: 'public',
    // expiresAt will be overridden to 90 minutes from now (renewal window demo)
    body:
      '## Exam Reminder\n\n' +
      '**Discrete Math mid-term** is coming up!\n\n' +
      '- Date: next Monday\n- Time: 10:00 AM\n- Room: LH-302\n- Topics: propositional logic, set theory, proof techniques\n\n' +
      '> *Bring your ID card and a pen. No calculators allowed.*\n'
  }
];


// ============================================================
//  MAIN SEED FUNCTION
// ============================================================
async function seedDatabase() {

  // ── Connect to MongoDB ──
  var mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/notegraph';
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.\n');

  // ── Step A: Delete all existing users and notes ──
  var deletedUsers = await User.deleteMany({});
  var deletedNotes = await Note.deleteMany({});
  console.log('Cleaned up old data:');
  console.log('  Users deleted:', deletedUsers.deletedCount);
  console.log('  Notes deleted:', deletedNotes.deletedCount);
  console.log('');

  // ── Step B: Create user accounts ──
  console.log('--- Creating Users ---');
  var savedUsers = [];

  for (var i = 0; i < usersToCreate.length; i = i + 1) {
    var userData = usersToCreate[i];
    var user = new User({
      username: userData.username,
      email: userData.email,
      passwordHash: userData.password,   // pre-save hook will bcrypt-hash this
      role: userData.role
    });
    await user.save();
    savedUsers.push(user);
    console.log('  Created user:', user.username, '(' + user.role + ')');
  }
  console.log('');

  // ── Step C: Find the admin and regular user objects ──
  var adminUser = null;
  var regularUser = null;
  for (var j = 0; j < savedUsers.length; j = j + 1) {
    if (savedUsers[j].username === 'testadmin') {
      adminUser = savedUsers[j];
    }
    if (savedUsers[j].username === 'testuser') {
      regularUser = savedUsers[j];
    }
  }

  // ── Step D: Create admin notes (permanent) ──
  console.log('--- Creating Admin Notes (permanent, ' + adminNotes.length + ' total) ---');
  var savedAdminNotes = [];

  for (var k = 0; k < adminNotes.length; k = k + 1) {
    var noteData = adminNotes[k];
    var note = new Note({
      title: noteData.title,
      body: noteData.body,
      visibility: noteData.visibility,
      tags: noteData.tags,
      nanoid: generateNanoid(),
      authorId: adminUser._id,
      authorName: adminUser.username,
      authorRole: adminUser.role
    });
    await note.save();
    savedAdminNotes.push(note);

    // Build tags string for display
    var tagsDisplay = '';
    for (var t = 0; t < note.tags.length; t = t + 1) {
      if (t > 0) { tagsDisplay = tagsDisplay + ', '; }
      tagsDisplay = tagsDisplay + note.tags[t];
    }
    console.log('  [' + (k + 1) + '] "' + note.title + '"  tags: [' + tagsDisplay + ']  permanent: ' + note.isPermanent);
  }
  console.log('');

  // ── Step E: Create user notes (expiring) ──
  console.log('--- Creating User Notes (expiring, ' + userNotes.length + ' total) ---');
  var savedUserNotes = [];

  for (var m = 0; m < userNotes.length; m = m + 1) {
    var userNoteData = userNotes[m];
    var userNote = new Note({
      title: userNoteData.title,
      body: userNoteData.body,
      visibility: userNoteData.visibility,
      tags: userNoteData.tags,
      nanoid: generateNanoid(),
      authorId: regularUser._id,
      authorName: regularUser.username,
      authorRole: regularUser.role
    });
    await userNote.save();
    savedUserNotes.push(userNote);
    console.log('  [' + (m + 1) + '] "' + userNote.title + '"  visibility: ' + userNote.visibility + '  permanent: ' + userNote.isPermanent);
  }
  console.log('');

  // ── Step F: Override expiresAt on "Quick Exam Reminder" ──
  var ninetyMinutesFromNow = new Date(Date.now() + 90 * 60 * 1000);
  await Note.updateOne(
    { title: 'Quick Exam Reminder' },
    { $set: { expiresAt: ninetyMinutesFromNow } }
  );
  console.log('  Updated "Quick Exam Reminder" expiresAt to:', ninetyMinutesFromNow.toISOString());
  console.log('  (90 minutes from now — inside the renewal window)\n');

  // ── Step G: Print summary ──
  console.log('========================================');
  console.log('         SEED COMPLETE — SUMMARY');
  console.log('========================================\n');

  console.log('USERS CREATED (' + savedUsers.length + '):');
  for (var u = 0; u < savedUsers.length; u = u + 1) {
    var su = savedUsers[u];
    console.log('  ' + su.username + '  |  ' + su.role + '  |  ' + su.email);
  }
  console.log('');

  console.log('ADMIN NOTES (' + savedAdminNotes.length + ' — all permanent):');
  for (var a = 0; a < savedAdminNotes.length; a = a + 1) {
    var an = savedAdminNotes[a];
    var aTags = '';
    for (var at = 0; at < an.tags.length; at = at + 1) {
      if (at > 0) { aTags = aTags + ', '; }
      aTags = aTags + an.tags[at];
    }
    console.log('  ' + (a + 1) + '. "' + an.title + '"  [' + aTags + ']');
  }
  console.log('');

  console.log('USER NOTES (' + savedUserNotes.length + ' — normal expiry):');
  for (var un = 0; un < savedUserNotes.length; un = un + 1) {
    var sn = savedUserNotes[un];
    var unTags = '';
    for (var ut = 0; ut < sn.tags.length; ut = ut + 1) {
      if (ut > 0) { unTags = unTags + ', '; }
      unTags = unTags + sn.tags[ut];
    }
    console.log('  ' + (un + 1) + '. "' + sn.title + '"  [' + unTags + ']  ' + sn.visibility);
  }

  console.log('\nTotal: ' + savedUsers.length + ' users, ' + (savedAdminNotes.length + savedUserNotes.length) + ' notes.');

  // ── Disconnect ──
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Done!');
}


// ============================================================
//  RUN
// ============================================================
seedDatabase().catch(function (error) {
  console.error('Seed script failed:', error);
  process.exit(1);
});
