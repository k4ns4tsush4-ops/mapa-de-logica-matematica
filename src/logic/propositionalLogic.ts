export type LogicClassification = 'Tautologia' | 'Contradição' | 'Contingência';

export interface TruthTableRow {
  assignment: Record<string, boolean>;
  result: boolean;
}

export interface TruthTableResult {
  normalizedFormula: string;
  variables: string[];
  rows: TruthTableRow[];
  classification: LogicClassification;
  trueCount: number;
  totalRows: number;
}

type TokenType =
  | 'VAR'
  | 'CONST'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'XOR'
  | 'IMP'
  | 'IFF'
  | 'LPAREN'
  | 'RPAREN';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

type AstNode =
  | { kind: 'var'; name: string }
  | { kind: 'const'; value: boolean }
  | { kind: 'not'; operand: AstNode }
  | { kind: 'binary'; op: 'AND' | 'OR' | 'XOR' | 'IMP' | 'IFF'; left: AstNode; right: AstNode };

const ALLOWED_VARS = new Set(['p', 'q', 'r', 's', 'a', 'b', 'c', 'x', 'y']);

export function tokenizeFormula(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (input.startsWith('<->', i) || input.startsWith('<=>', i)) {
      tokens.push({ type: 'IFF', value: '↔', position: i });
      i += 3;
      continue;
    }

    if (input.startsWith('->', i) || input.startsWith('=>', i)) {
      tokens.push({ type: 'IMP', value: '→', position: i });
      i += 2;
      continue;
    }

    if (input.startsWith('&&', i)) {
      tokens.push({ type: 'AND', value: '∧', position: i });
      i += 2;
      continue;
    }

    if (input.startsWith('||', i)) {
      tokens.push({ type: 'OR', value: '∨', position: i });
      i += 2;
      continue;
    }

    if (ch === '¬' || ch === '~' || ch === '!') {
      tokens.push({ type: 'NOT', value: '¬', position: i });
      i++;
      continue;
    }

    if (ch === '∧' || ch === '&') {
      tokens.push({ type: 'AND', value: '∧', position: i });
      i++;
      continue;
    }

    if (ch === '∨' || ch === '|') {
      tokens.push({ type: 'OR', value: '∨', position: i });
      i++;
      continue;
    }

    if (ch === '⊻' || ch === '⊕' || ch === '^') {
      tokens.push({ type: 'XOR', value: '⊻', position: i });
      i++;
      continue;
    }

    if (ch === '→') {
      tokens.push({ type: 'IMP', value: '→', position: i });
      i++;
      continue;
    }

    if (ch === '↔') {
      tokens.push({ type: 'IFF', value: '↔', position: i });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', position: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', position: i });
      i++;
      continue;
    }

    if (ch === '⊤' || ch === '1') {
      tokens.push({ type: 'CONST', value: '⊤', position: i });
      i++;
      continue;
    }

    if (ch === '⊥' || ch === '0') {
      tokens.push({ type: 'CONST', value: '⊥', position: i });
      i++;
      continue;
    }

    const lower = ch.toLowerCase();
    if (ALLOWED_VARS.has(lower)) {
      // Ensure it is not part of a longer unknown identifier like "xor"
      if (input.slice(i, i + 3).toLowerCase() === 'xor' && (i + 3 >= input.length || !/[a-z]/i.test(input[i + 3]))) {
        tokens.push({ type: 'XOR', value: '⊻', position: i });
        i += 3;
        continue;
      }
      tokens.push({ type: 'VAR', value: lower, position: i });
      i++;
      continue;
    }

    if (input.slice(i, i + 3).toLowerCase() === 'xor') {
      tokens.push({ type: 'XOR', value: '⊻', position: i });
      i += 3;
      continue;
    }

    throw new Error(`Símbolo não reconhecido "${ch}" na posição ${i + 1}. Use variáveis (p, q, r, s) e conectivos (¬, ∧, ∨, ⊻, →, ↔).`);
  }

  return tokens;
}

class FormulaParser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  parse(): AstNode {
    if (this.tokens.length === 0) {
      throw new Error('Digite uma fórmula proposicional, por exemplo: p → q');
    }
    const expr = this.parseIff();
    if (this.pos < this.tokens.length) {
      const extra = this.tokens[this.pos];
      throw new Error(`Token inesperado "${extra.value}" na posição ${extra.position + 1}.`);
    }
    return expr;
  }

  private parseIff(): AstNode {
    let left = this.parseImp();
    while (this.peek()?.type === 'IFF') {
      this.consume();
      const right = this.parseImp();
      left = { kind: 'binary', op: 'IFF', left, right };
    }
    return left;
  }

  private parseImp(): AstNode {
    const left = this.parseOrXor();
    if (this.peek()?.type === 'IMP') {
      this.consume();
      const right = this.parseImp();
      return { kind: 'binary', op: 'IMP', left, right };
    }
    return left;
  }

  private parseOrXor(): AstNode {
    let left = this.parseAnd();
    while (this.peek()?.type === 'OR' || this.peek()?.type === 'XOR') {
      const op = this.consume().type as 'OR' | 'XOR';
      const right = this.parseAnd();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parseAnd(): AstNode {
    let left = this.parseNot();
    while (this.peek()?.type === 'AND') {
      this.consume();
      const right = this.parseNot();
      left = { kind: 'binary', op: 'AND', left, right };
    }
    return left;
  }

  private parseNot(): AstNode {
    if (this.peek()?.type === 'NOT') {
      this.consume();
      return { kind: 'not', operand: this.parseNot() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const token = this.peek();
    if (!token) {
      throw new Error('Expressão incompleta: falta uma proposição ou parêntese de fechamento.');
    }

    if (token.type === 'VAR') {
      this.consume();
      return { kind: 'var', name: token.value };
    }

    if (token.type === 'CONST') {
      this.consume();
      return { kind: 'const', value: token.value === '⊤' };
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const inner = this.parseIff();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error('Parêntese "(" aberto sem fechamento ")".');
      }
      this.consume();
      return inner;
    }

    throw new Error(`Esperado proposição ou "(", mas encontrado "${token.value}" na posição ${token.position + 1}.`);
  }
}

function collectVariables(node: AstNode, found = new Set<string>()): string[] {
  if (node.kind === 'var') {
    found.add(node.name);
  } else if (node.kind === 'not') {
    collectVariables(node.operand, found);
  } else if (node.kind === 'binary') {
    collectVariables(node.left, found);
    collectVariables(node.right, found);
  }
  return Array.from(found).sort();
}

export function evaluateAst(node: AstNode, assignment: Record<string, boolean>): boolean {
  switch (node.kind) {
    case 'const':
      return node.value;
    case 'var':
      return Boolean(assignment[node.name]);
    case 'not':
      return !evaluateAst(node.operand, assignment);
    case 'binary': {
      const l = evaluateAst(node.left, assignment);
      const r = evaluateAst(node.right, assignment);
      switch (node.op) {
        case 'AND':
          return l && r;
        case 'OR':
          return l || r;
        case 'XOR':
          return l !== r;
        case 'IMP':
          return !l || r;
        case 'IFF':
          return l === r;
      }
    }
  }
}

function formatAst(node: AstNode, parentPrecedence = 0): string {
  if (node.kind === 'const') {
    return node.value ? '⊤' : '⊥';
  }
  if (node.kind === 'var') {
    return node.name;
  }
  if (node.kind === 'not') {
    const inner =
      node.operand.kind === 'binary'
        ? `(${formatAst(node.operand, 0)})`
        : formatAst(node.operand, 5);
    return `¬${inner}`;
  }

  const precedenceMap: Record<'IFF' | 'IMP' | 'OR' | 'XOR' | 'AND', number> = {
    IFF: 1,
    IMP: 2,
    OR: 3,
    XOR: 3,
    AND: 4,
  };
  const symbolMap: Record<'IFF' | 'IMP' | 'OR' | 'XOR' | 'AND', string> = {
    IFF: '↔',
    IMP: '→',
    OR: '∨',
    XOR: '⊻',
    AND: '∧',
  };

  const myPrec = precedenceMap[node.op];
  const leftStr = formatAst(node.left, myPrec);
  const rightStr = formatAst(node.right, myPrec + (node.op === 'IMP' ? 0 : 1));
  const combined = `${leftStr} ${symbolMap[node.op]} ${rightStr}`;
  return myPrec < parentPrecedence ? `(${combined})` : combined;
}

export function generateTruthTable(formula: string): TruthTableResult {
  const tokens = tokenizeFormula(formula.trim());
  const parser = new FormulaParser(tokens);
  const ast = parser.parse();
  const variables = collectVariables(ast);

  if (variables.length > 4) {
    throw new Error('Use no máximo 4 variáveis proposicionais distintas (ex.: p, q, r, s) para manter a tabela-verdade legível.');
  }

  const totalRows = Math.pow(2, variables.length);
  const rows: TruthTableRow[] = [];
  let trueCount = 0;

  // Standard Brazilian Logic textbook ordering: V first, F second (1 -> 0)
  for (let i = totalRows - 1; i >= 0; i--) {
    const assignment: Record<string, boolean> = {};
    variables.forEach((v, idx) => {
      const bitIndex = variables.length - 1 - idx;
      assignment[v] = Boolean((i >> bitIndex) & 1);
    });
    const result = evaluateAst(ast, assignment);
    if (result) {
      trueCount++;
    }
    rows.push({ assignment, result });
  }

  let classification: LogicClassification = 'Contingência';
  if (trueCount === totalRows) {
    classification = 'Tautologia';
  } else if (trueCount === 0) {
    classification = 'Contradição';
  }

  return {
    normalizedFormula: formatAst(ast),
    variables,
    rows,
    classification,
    trueCount,
    totalRows,
  };
}

export function areFormulasEquivalent(formulaA: string, formulaB: string): boolean {
  const astA = new FormulaParser(tokenizeFormula(formulaA.trim())).parse();
  const astB = new FormulaParser(tokenizeFormula(formulaB.trim())).parse();
  const vars = Array.from(new Set([...collectVariables(astA), ...collectVariables(astB)])).sort();

  if (vars.length > 4) {
    throw new Error('Use no máximo 4 variáveis no conjunto das fórmulas.');
  }

  const totalRows = Math.pow(2, vars.length);
  for (let i = 0; i < totalRows; i++) {
    const assignment: Record<string, boolean> = {};
    vars.forEach((v, idx) => {
      assignment[v] = Boolean((i >> idx) & 1);
    });
    if (evaluateAst(astA, assignment) !== evaluateAst(astB, assignment)) {
      return false;
    }
  }
  return true;
}
