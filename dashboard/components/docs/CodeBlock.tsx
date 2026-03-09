"use client";

import { useState, useMemo } from "react";
import { LuCopy, LuCheck } from "react-icons/lu";

type Token = { text: string; type: string };

const TOKEN_COLORS: Record<string, string> = {
  key: "text-[#6ee7b7]", // emerald-300 — brand-tied, muted
  string: "text-[#fbbf24]", // amber-400 — warm, high contrast
  number: "text-[#67e8f9]", // cyan-300 — cool, distinct from strings
  boolean: "text-[#c084fc]", // purple-400 — stands out for true/false
  null: "text-[#6b7280]", // gray-500 — intentionally dim
  bracket: "text-[#525252]", // neutral-600 — structural, recedes
  colon: "text-[#525252]",
  comma: "text-[#525252]",
  keyword: "text-[#f472b6]", // pink-400 — python/js keywords
  builtin: "text-[#67e8f9]", // cyan-300 — built-in functions
  function: "text-[#6ee7b7]", // emerald-300 — function names
  comment: "text-[#404040]", // near-invisible
  operator: "text-[#9ca3af]", // gray-400
  param: "text-[#fdba74]", // orange-300 — function params
  decorator: "text-[#c084fc]", // purple-400
  property: "text-[#9ca3af]", // gray-400 — object access
  method: "text-[#6ee7b7]", // emerald-300
  flag: "text-[#67e8f9]", // cyan-300 — CLI flags
  url: "text-[#fbbf24]", // amber — URLs stand out
  variable: "text-[#f0abfc]", // fuchsia-300 — shell variables
  plain: "text-[#d4d4d4]", // neutral-300 — default text
};

function detectLanguage(code: string, title?: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes("python")) return "python";
  if (t.includes("node") || t.includes("javascript") || t.includes("js"))
    return "javascript";
  if (t.includes("curl") || t.includes("bash") || t.includes("shell"))
    return "shell";
  if (t.includes("signature")) return "shell";

  const trimmed = code.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("curl ")) return "shell";
  if (trimmed.includes("import ") && trimmed.includes("def ")) return "python";
  if (
    trimmed.includes("const ") ||
    trimmed.includes("function ") ||
    trimmed.includes("require(")
  )
    return "javascript";
  if (trimmed.includes("Authorization:") || trimmed.includes("Bearer"))
    return "shell";

  return "json";
}

function tokenizeJSON(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    // whitespace
    if (/\s/.test(code[i])) {
      let ws = "";
      while (i < code.length && /\s/.test(code[i])) ws += code[i++];
      tokens.push({ text: ws, type: "plain" });
      continue;
    }

    // strings
    if (code[i] === '"') {
      let str = '"';
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\") {
          str += code[i++];
        }
        if (i < code.length) str += code[i++];
      }
      if (i < code.length) str += code[i++];

      // detect if this is a key (followed by colon)
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      const isKey = code[j] === ":";

      tokens.push({ text: str, type: isKey ? "key" : "string" });
      continue;
    }

    // numbers
    if (
      /[\d-]/.test(code[i]) &&
      (code[i] !== "-" || /\d/.test(code[i + 1] || ""))
    ) {
      let num = "";
      if (code[i] === "-") num += code[i++];
      while (i < code.length && /[\d.eE+\-]/.test(code[i])) num += code[i++];
      tokens.push({ text: num, type: "number" });
      continue;
    }

    // booleans and null
    const rest = code.slice(i);
    const boolMatch = rest.match(/^(true|false)/);
    if (boolMatch) {
      tokens.push({ text: boolMatch[0], type: "boolean" });
      i += boolMatch[0].length;
      continue;
    }
    const nullMatch = rest.match(/^null/);
    if (nullMatch) {
      tokens.push({ text: "null", type: "null" });
      i += 4;
      continue;
    }

    // structural
    if ("{[".includes(code[i])) {
      tokens.push({ text: code[i], type: "bracket" });
      i++;
      continue;
    }
    if ("}]".includes(code[i])) {
      tokens.push({ text: code[i], type: "bracket" });
      i++;
      continue;
    }
    if (code[i] === ":") {
      tokens.push({ text: ":", type: "colon" });
      i++;
      continue;
    }
    if (code[i] === ",") {
      tokens.push({ text: ",", type: "comma" });
      i++;
      continue;
    }

    // ellipsis / rest
    if (code.slice(i, i + 3) === "...") {
      tokens.push({ text: "...", type: "comment" });
      i += 3;
      continue;
    }

    tokens.push({ text: code[i], type: "plain" });
    i++;
  }

  return tokens;
}

function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  const keywords = new Set([
    "import",
    "from",
    "def",
    "return",
    "if",
    "else",
    "elif",
    "for",
    "while",
    "class",
    "try",
    "except",
    "finally",
    "with",
    "as",
    "in",
    "not",
    "and",
    "or",
    "is",
    "True",
    "False",
    "None",
    "pass",
    "break",
    "continue",
    "raise",
    "yield",
    "lambda",
    "global",
    "nonlocal",
    "assert",
    "del",
  ]);
  const builtins = new Set([
    "print",
    "len",
    "range",
    "str",
    "int",
    "float",
    "bool",
    "list",
    "dict",
    "set",
    "tuple",
    "type",
    "isinstance",
    "hasattr",
    "getattr",
    "setattr",
    "encode",
    "decode",
    "hexdigest",
    "compare_digest",
  ]);
  let i = 0;

  while (i < code.length) {
    // whitespace
    if (/\s/.test(code[i])) {
      let ws = "";
      while (i < code.length && /\s/.test(code[i])) ws += code[i++];
      tokens.push({ text: ws, type: "plain" });
      continue;
    }

    // comments
    if (code[i] === "#") {
      let comment = "";
      while (i < code.length && code[i] !== "\n") comment += code[i++];
      tokens.push({ text: comment, type: "comment" });
      continue;
    }

    // decorators
    if (code[i] === "@") {
      let dec = "@";
      i++;
      while (i < code.length && /[\w.]/.test(code[i])) dec += code[i++];
      tokens.push({ text: dec, type: "decorator" });
      continue;
    }

    // strings (single, double, triple-quoted)
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      const triple = code.slice(i, i + 3) === quote.repeat(3);
      const end = triple ? quote.repeat(3) : quote;
      let str = "";
      const startLen = triple ? 3 : 1;
      str += code.slice(i, i + startLen);
      i += startLen;
      while (i < code.length) {
        if (code[i] === "\\" && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
          continue;
        }
        if (code.slice(i, i + end.length) === end) {
          str += end;
          i += end.length;
          break;
        }
        str += code[i++];
      }
      tokens.push({ text: str, type: "string" });
      continue;
    }

    // f-strings prefix
    if (code[i] === "f" && (code[i + 1] === '"' || code[i + 1] === "'")) {
      tokens.push({ text: "f", type: "keyword" });
      i++;
      continue;
    }

    // identifiers and keywords
    if (/[a-zA-Z_]/.test(code[i])) {
      let word = "";
      while (i < code.length && /[\w]/.test(code[i])) word += code[i++];

      if (keywords.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (builtins.has(word)) {
        tokens.push({ text: word, type: "builtin" });
      } else if (i < code.length && code[i] === "(") {
        tokens.push({ text: word, type: "function" });
      } else if (i < code.length && code[i] === ".") {
        tokens.push({ text: word, type: "plain" });
      } else {
        tokens.push({ text: word, type: "param" });
      }
      continue;
    }

    // operators
    if ("=+-*/<>!&|%^~".includes(code[i])) {
      let op = code[i++];
      if (i < code.length && "=+-*/<>!&|".includes(code[i])) op += code[i++];
      tokens.push({ text: op, type: "operator" });
      continue;
    }

    // structural
    if ("()[]{}:,.".includes(code[i])) {
      tokens.push({
        text: code[i],
        type: code[i] === ":" ? "colon" : code[i] === "," ? "comma" : "bracket",
      });
      i++;
      continue;
    }

    tokens.push({ text: code[i], type: "plain" });
    i++;
  }

  return tokens;
}

function tokenizeJS(code: string): Token[] {
  const tokens: Token[] = [];
  const keywords = new Set([
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "do",
    "switch",
    "case",
    "break",
    "continue",
    "new",
    "this",
    "class",
    "extends",
    "import",
    "export",
    "default",
    "from",
    "async",
    "await",
    "try",
    "catch",
    "finally",
    "throw",
    "typeof",
    "instanceof",
    "in",
    "of",
    "true",
    "false",
    "null",
    "undefined",
    "void",
  ]);
  const builtins = new Set([
    "console",
    "require",
    "module",
    "exports",
    "crypto",
    "JSON",
    "Math",
    "Date",
    "Promise",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "Buffer",
    "process",
  ]);
  let i = 0;

  while (i < code.length) {
    if (/\s/.test(code[i])) {
      let ws = "";
      while (i < code.length && /\s/.test(code[i])) ws += code[i++];
      tokens.push({ text: ws, type: "plain" });
      continue;
    }

    // comments
    if (code[i] === "/" && code[i + 1] === "/") {
      let comment = "";
      while (i < code.length && code[i] !== "\n") comment += code[i++];
      tokens.push({ text: comment, type: "comment" });
      continue;
    }

    // template literals
    if (code[i] === "`") {
      let str = "`";
      i++;
      while (i < code.length && code[i] !== "`") {
        if (code[i] === "\\" && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
          continue;
        }
        str += code[i++];
      }
      if (i < code.length) str += code[i++];
      tokens.push({ text: str, type: "string" });
      continue;
    }

    // strings
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") str += code[i++];
        if (i < code.length) str += code[i++];
      }
      if (i < code.length) str += code[i++];
      tokens.push({ text: str, type: "string" });
      continue;
    }

    // numbers
    if (/\d/.test(code[i])) {
      let num = "";
      while (i < code.length && /[\d.xXa-fA-F]/.test(code[i])) num += code[i++];
      tokens.push({ text: num, type: "number" });
      continue;
    }

    // identifiers
    if (/[a-zA-Z_$]/.test(code[i])) {
      let word = "";
      while (i < code.length && /[\w$]/.test(code[i])) word += code[i++];

      if (keywords.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (builtins.has(word)) {
        tokens.push({ text: word, type: "builtin" });
      } else if (i < code.length && code[i] === "(") {
        tokens.push({ text: word, type: "function" });
      } else {
        tokens.push({ text: word, type: "param" });
      }
      continue;
    }

    if ("=+-*/<>!&|%^~?".includes(code[i])) {
      let op = code[i++];
      if (i < code.length && "=+-*/<>!&|=".includes(code[i])) op += code[i++];
      if (i < code.length && code[i] === "=") op += code[i++];
      tokens.push({ text: op, type: "operator" });
      continue;
    }

    if ("()[]{}:,;.".includes(code[i])) {
      tokens.push({
        text: code[i],
        type:
          code[i] === ":"
            ? "colon"
            : code[i] === ","
            ? "comma"
            : code[i] === "."
            ? "operator"
            : "bracket",
      });
      i++;
      continue;
    }

    tokens.push({ text: code[i], type: "plain" });
    i++;
  }

  return tokens;
}

function tokenizeShell(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    if (/\s/.test(code[i])) {
      let ws = "";
      while (i < code.length && /\s/.test(code[i])) ws += code[i++];
      tokens.push({ text: ws, type: "plain" });
      continue;
    }

    // comments
    if (code[i] === "#") {
      let comment = "";
      while (i < code.length && code[i] !== "\n") comment += code[i++];
      tokens.push({ text: comment, type: "comment" });
      continue;
    }

    // flags
    if (code[i] === "-") {
      let flag = "";
      while (i < code.length && /\S/.test(code[i])) flag += code[i++];
      tokens.push({ text: flag, type: "flag" });
      continue;
    }

    // strings
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") str += code[i++];
        if (i < code.length) str += code[i++];
      }
      if (i < code.length) str += code[i++];
      tokens.push({ text: str, type: "string" });
      continue;
    }

    // variables
    if (code[i] === "$") {
      let v = "$";
      i++;
      if (i < code.length && code[i] === "{") {
        while (i < code.length && code[i] !== "}") v += code[i++];
        if (i < code.length) v += code[i++];
      } else {
        while (i < code.length && /\w/.test(code[i])) v += code[i++];
      }
      tokens.push({ text: v, type: "variable" });
      continue;
    }

    // URLs
    if (code.slice(i).match(/^https?:\/\//)) {
      let url = "";
      while (i < code.length && /\S/.test(code[i])) url += code[i++];
      tokens.push({ text: url, type: "url" });
      continue;
    }

    // words
    if (/[a-zA-Z_]/.test(code[i])) {
      let word = "";
      while (i < code.length && /[\w./:=]/.test(code[i])) word += code[i++];
      const cmds = [
        "curl",
        "echo",
        "export",
        "set",
        "grep",
        "awk",
        "sed",
        "cat",
        "jq",
      ];
      const headerKeys = [
        "Authorization",
        "Content-Type",
        "X-Webhook-Event",
        "X-Webhook-Signature",
      ];
      if (cmds.includes(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (
        word.includes("Bearer") ||
        headerKeys.some((h) => word.startsWith(h))
      ) {
        tokens.push({ text: word, type: "builtin" });
      } else if (word.startsWith("v1=") || word.includes("HMAC")) {
        tokens.push({ text: word, type: "function" });
      } else {
        tokens.push({ text: word, type: "plain" });
      }
      continue;
    }

    // operators
    if ("|&;><\\".includes(code[i])) {
      tokens.push({ text: code[i], type: "operator" });
      i++;
      continue;
    }

    if ("()[]{}".includes(code[i])) {
      tokens.push({ text: code[i], type: "bracket" });
      i++;
      continue;
    }

    tokens.push({ text: code[i], type: "plain" });
    i++;
  }

  return tokens;
}

function tokenize(code: string, language: string): Token[] {
  switch (language) {
    case "json":
      return tokenizeJSON(code);
    case "python":
      return tokenizePython(code);
    case "javascript":
      return tokenizeJS(code);
    case "shell":
      return tokenizeShell(code);
    default:
      return [{ text: code, type: "plain" }];
  }
}

export function CodeBlock({
  title,
  children,
  language,
}: {
  title?: string;
  children: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const lang = language || detectLanguage(children, title);
  const tokens = useMemo(() => tokenize(children, lang), [children, lang]);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langLabel =
    lang === "json"
      ? "JSON"
      : lang === "python"
      ? "Python"
      : lang === "javascript"
      ? "JS"
      : lang === "shell"
      ? "Shell"
      : "";

  return (
    <div className="rounded-lg border border-border overflow-hidden group">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-surface/80 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-text-muted">{title}</span>
            {langLabel && (
              <span className="text-[9px] font-mono tracking-wider text-text-muted/50 uppercase">
                {langLabel}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <>
                <LuCheck className="w-3.5 h-3.5 text-delivered" />
                <span className="text-delivered">Copied</span>
              </>
            ) : (
              <>
                <LuCopy className="w-3.5 h-3.5" />
                <span className="cursor-pointer">Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute top-2.5 right-3 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100 z-10"
        >
          {copied ? (
            <LuCheck className="w-3.5 h-3.5 text-delivered" />
          ) : (
            <LuCopy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
      <div className="relative bg-[#0a0a0c] px-4 py-3">
        <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto">
          <code>
            {tokens.map((token, i) => (
              <span
                key={i}
                className={TOKEN_COLORS[token.type] || TOKEN_COLORS.plain}
              >
                {token.text}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
