// CSP-safe arithmetic expression evaluator.
// Supports +, -, *, /, %, **, parentheses, unary +/-, and decimal literals.

const TOKEN = {
  NUMBER: "NUMBER",
  OP: "OP",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
};

function tokenize(input) {
  const tokens = [];
  let i = 0;
  const src = input.replace(/\s+/g, "");
  if (!/^[\d+\-*/%().]+$/.test(src)) {
    throw new Error("expression contains illegal characters");
  }
  while (i < src.length) {
    const ch = src[i];
    if (ch >= "0" && ch <= "9" || ch === ".") {
      let num = "";
      while (i < src.length && (/[\d.]/.test(src[i]))) {
        num += src[i++];
      }
      if (!Number.isFinite(Number(num))) throw new Error("invalid number");
      tokens.push({ type: TOKEN.NUMBER, value: Number(num) });
      continue;
    }
    if (ch === "(") { tokens.push({ type: TOKEN.LPAREN }); i++; continue; }
    if (ch === ")") { tokens.push({ type: TOKEN.RPAREN }); i++; continue; }
    if ("+-*/%".includes(ch)) {
      // detect ** as exponent
      if (ch === "*" && src[i + 1] === "*") {
        tokens.push({ type: TOKEN.OP, value: "**" });
        i += 2;
        continue;
      }
      tokens.push({ type: TOKEN.OP, value: ch });
      i++;
      continue;
    }
    throw new Error(`unexpected char "${ch}"`);
  }
  return tokens;
}

// Recursive-descent parser:
// expr   := term (('+'|'-') term)*
// term   := factor (('*'|'/'|'%') factor)*
// factor := unary ('**' factor)?
// unary  := ('+'|'-') unary | primary
// primary:= NUMBER | '(' expr ')'
function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];

  const parseExpr = () => {
    let left = parseTerm();
    while (peek()?.type === TOKEN.OP && (peek().value === "+" || peek().value === "-")) {
      const op = eat().value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };
  const parseTerm = () => {
    let left = parseFactor();
    while (peek()?.type === TOKEN.OP && ["*", "/", "%"].includes(peek().value)) {
      const op = eat().value;
      const right = parseFactor();
      if (op === "*") left = left * right;
      else if (op === "/") left = left / right;
      else left = left % right;
    }
    return left;
  };
  const parseFactor = () => {
    const left = parseUnary();
    if (peek()?.type === TOKEN.OP && peek().value === "**") {
      eat();
      const right = parseFactor();
      return left ** right;
    }
    return left;
  };
  const parseUnary = () => {
    const t = peek();
    if (t?.type === TOKEN.OP && (t.value === "+" || t.value === "-")) {
      eat();
      return t.value === "-" ? -parseUnary() : parseUnary();
    }
    return parsePrimary();
  };
  const parsePrimary = () => {
    const t = eat();
    if (!t) throw new Error("unexpected end of expression");
    if (t.type === TOKEN.NUMBER) return t.value;
    if (t.type === TOKEN.LPAREN) {
      const v = parseExpr();
      const close = eat();
      if (close?.type !== TOKEN.RPAREN) throw new Error("expected )");
      return v;
    }
    throw new Error(`unexpected token "${t.value}"`);
  };

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("trailing tokens");
  return result;
}

/**
 * Evaluate a math expression safely (no eval, no new Function).
 * @returns {number}
 */
export function evaluate(expression) {
  const tokens = tokenize(String(expression ?? ""));
  if (tokens.length === 0) return NaN;
  const result = parse(tokens);
  if (!Number.isFinite(result)) throw new Error("non-finite result");
  return result;
}

/** Format result, trimming trailing zeros, capping precision. */
export function formatResult(value) {
  if (!Number.isFinite(value)) return "—";
  // Avoid sci notation for sensible ranges
  const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  return String(rounded);
}
