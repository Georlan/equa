import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

class FakeElement {
  constructor(tag = "div") {
    this.tagName = tag.toLowerCase();
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.style = {};
    this.attrs = {};
    this.handlers = {};
    this.textContent = "";
    this.disabled = false;
    this.value = "";
    this.classList = {
      add: name => { this.className += " " + name; }
    };
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, callback) { this.handlers[name] = callback; }
  click() { if (!this.disabled) this.handlers.click?.(); }
  querySelectorAll(selector) {
    const matches = [];
    const visit = element => {
      for (const child of element.children) {
        if (selector === "button" && child.tagName === "button") matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }
  querySelector(selector) {
    const className = selector.slice(1);
    const visit = element => {
      for (const child of element.children) {
        if (child.className.split(/\s+/).includes(className)) return child;
        const nested = visit(child);
        if (nested) return nested;
      }
      return null;
    };
    return selector.startsWith(".") ? visit(this) : null;
  }
}

function startGame() {
  const elements = new Map();
  const handlers = {};
  const timers = new Map();
  let timerId = 0;
  const get = id => {
    if (!elements.has(id)) elements.set(id, new FakeElement());
    return elements.get(id);
  };
  get("difficulty").value = "easy";
  const document = {
    getElementById: get,
    createElement: tag => new FakeElement(tag),
    addEventListener: (name, cb) => { handlers[name] = cb; }
  };
  const window = {
    setTimeout: callback => {
      const id = ++timerId;
      timers.set(id, callback);
      return id;
    },
    clearTimeout: id => timers.delete(id)
  };
  assert.ok(script, "O index.html deve conter o JavaScript do jogo");
  runInNewContext(script, { document, window });
  return {
    get,
    handlers,
    buttons: () => get("answers").querySelectorAll("button"),
    runTimers: () => {
      const pending = [...timers.values()];
      timers.clear();
      for (const fn of pending) fn();
    },
    pendingTimers: () => timers.size
  };
}

function expectedAnswer(game) {
  const expression = game.get("equation").children[0].textContent;
  const match = expression.match(/^(-?\d+) ([+−×÷]) (-?\d+)$/u);
  assert.ok(match, "Expressão válida: " + expression);
  const a = Number(match[1]);
  const b = Number(match[3]);
  if (match[2] === "+") return a + b;
  if (match[2] === "−") return a - b;
  if (match[2] === "×") return a * b;
  assert.equal(a % b, 0, "A divisão não deve ter resto");
  return a / b;
}

function choices(game) {
  return game.buttons().map(button => Number(button.querySelector(".answer-number").textContent));
}

test("cada questão tem quatro alternativas diferentes e só uma correta, em todos os níveis", () => {
  for (const level of ["easy", "medium", "hard"]) {
    const game = startGame();
    const difficulty = game.get("difficulty");
    difficulty.value = level;
    difficulty.handlers.change();
    for (let round = 1; round <= 40; round++) {
      const answer = expectedAnswer(game);
      const options = choices(game);
      assert.equal(options.length, 4);
      assert.equal(new Set(options).size, 4);
      assert.equal(options.filter(n => n === answer).length, 1);
      if (level !== "hard") assert.ok(answer >= 0);
      const button = game.buttons()[options.indexOf(answer)];
      button.click();
      assert.equal(Number(game.get("solved").textContent), round);
      assert.equal(game.pendingTimers(), 1);
      game.runTimers();
      assert.equal(game.get("number").textContent, "QUESTÃO " + String(round + 1).padStart(2, "0"));
    }
  }
});

test("erro permite nova tentativa; acerto avança e pontuação é atualizada", () => {
  const game = startGame();
  const answer = expectedAnswer(game);
  const options = choices(game);
  const incorrect = game.buttons()[options.findIndex(value => value !== answer)];
  incorrect.click();
  assert.equal(incorrect.disabled, true);
  assert.equal(game.get("feedback").dataset.state, "wrong");
  assert.equal(Number(game.get("solved").textContent), 0);
  assert.equal(game.pendingTimers(), 0);
  const correct = game.buttons()[options.indexOf(answer)];
  correct.click();
  assert.equal(game.get("feedback").dataset.state, "correct");
  assert.equal(Number(game.get("solved").textContent), 1);
  assert.equal(Number(game.get("score").textContent), 5);
  assert.equal(game.pendingTimers(), 1);
  game.runTimers();
  assert.equal(game.get("number").textContent, "QUESTÃO 02");
  const nextAnswer = expectedAnswer(game);
  const nextOptions = choices(game);
  game.buttons()[nextOptions.indexOf(nextAnswer)].click();
  assert.equal(Number(game.get("streak").textContent), 2);
  assert.equal(Number(game.get("score").textContent), 15);
});

test("reiniciar cancela o avanço pendente e reinicia os marcadores", () => {
  const game = startGame();
  const answer = expectedAnswer(game);
  const options = choices(game);
  game.buttons()[options.indexOf(answer)].click();
  assert.equal(game.pendingTimers(), 1);
  game.get("restart").handlers.click();
  assert.equal(game.pendingTimers(), 0);
  assert.equal(Number(game.get("score").textContent), 0);
  assert.equal(Number(game.get("solved").textContent), 0);
  assert.equal(game.get("number").textContent, "QUESTÃO 01");
});

test("teclas 1 a 4 podem escolher alternativas", () => {
  const game = startGame();
  const answer = expectedAnswer(game);
  const options = choices(game);
  const index = options.indexOf(answer);
  game.handlers.keydown({
    key: String(index + 1),
    altKey: false, ctrlKey: false, metaKey: false, repeat: false, target: null
  });
  assert.equal(Number(game.get("solved").textContent), 1);
});
