"""Plain-language checker for student-facing text (rules: PLAIN_LANGUAGE.md).
usage:  lint_plain.py file.json [...]     JSON: any nesting of strings; a string under a key named
        "question_ok" (or a list item starting with "?") may ask a question.
        as a module: issues(text, allow_question=False) -> list of (kind, detail)
FAIL kinds block a build; WARN kinds are listed for review."""
import re, sys, json

DECOR = r"""ghosts?|ghost['’]s|races?|racers?|racing|hugs?|chases?|rides?\s+aboard|forgets?|quietly|trustworthy|stor(?:y|ies)|journey|
unlock(?:s|ed)?|reveal(?:s|ed)?|magic(?:al)?|secrets?|myster(?:y|ies)|twists?|danc(?:e|es|ing)|paints?|compounding|falls?\s+behind|
runs?\s+late|tug(?:s|ging)?|whispers?|sneak(?:s|y)?|surpris(?:e|es|ing)|tapestry|symphony|heart\s+of\s+it|under\s+the\s+hood|
the\s+big\s+one|big\s+race|neat|gentl(?:e|y)|beautiful(?:ly)?|stunning|elegant(?:ly)?|fancy|imagine|picture\s+this|watch\s+closely|
spot\s+on|sticks?\s+at|amplitude-blind|blind\s+to"""
OPENERS = r"""^(here['’]s|here\s+is|let['’]s|lets|let\s+us|now\s+for|meet\s+the|over\s+to\s+you|one\s+last\s+question|time\s+to|ready\?|great!|nice!|exactly[.!—–-])"""
HEDGE = r"""(very\s+reasonable|fair\s+guess|natural\s+guess|it['’]s\s+a\s+creative|though\s+it['’]s|really|actually|basically|simply|just\s+)"""
re_decor = re.compile(r"\b(" + DECOR.replace("\n", "") + r")\b", re.I)
re_open = re.compile(OPENERS.replace("\n", ""), re.I)
re_hedge = re.compile(HEDGE, re.I)
re_dash = re.compile(r"(?<![0-9°])(?:\s[—–]|[—–]\s)(?![0-9])")   # an aside dash has a space beside it; E–k, Kronig–Penney pass

def sentences(t):
    t = re.sub(r"\b(e\.g|i\.e|vs|approx|Fig)\.", r"\1", t)
    return [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9“\"(])", t) if s.strip()]

def issues(text, allow_question=False):
    out = []
    t = re.sub(r"</(p|li|h\d|div)>|<br\s*/?>", "\n", text or "", flags=re.I)   # each line/paragraph is its own unit
    t = re.sub(r"<[^>]+>", "", t).strip()
    if not t: return out
    for m in re_decor.finditer(t): out.append(("FAIL decorative", m.group(0)))
    for s in [x for line in t.split("\n") for x in sentences(line.strip())]:
        if re_open.search(s.strip()): out.append(("FAIL opener", s.strip()[:40]))
        n = len(re.findall(r"[A-Za-z0-9θ₀]+", s))
        if n > 25: out.append(("FAIL long sentence", f"{n} words: {s[:60]}…"))
        elif n > 18: out.append(("WARN long sentence", f"{n} words: {s[:60]}…"))
    for m in re_hedge.finditer(t): out.append(("FAIL hedge/padding", m.group(0)))
    if re_dash.search(t): out.append(("FAIL dash aside", t[max(0, re_dash.search(t).start()-25):re_dash.search(t).end()+25]))
    if "!" in t: out.append(("FAIL exclamation", t[:50]))
    if "?" in t and not allow_question: out.append(("WARN question", t[:60]))
    return out

def walk(x, path=""):
    if isinstance(x, str):
        q = x.startswith("?")
        yield path, (x[1:] if q else x), q or path.endswith("question_ok")
    elif isinstance(x, list):
        for i, v in enumerate(x): yield from walk(v, f"{path}[{i}]")
    elif isinstance(x, dict):
        for k, v in x.items(): yield from walk(v, f"{path}.{k}")

if __name__ == "__main__":
    fails = 0
    for f in sys.argv[1:]:
        for path, text, q in walk(json.load(open(f))):
            for kind, det in issues(text, q):
                fails += kind.startswith("FAIL")
                print(f"{f}{path}: {kind}: {det}")
    print(f"== {fails} FAIL")
    sys.exit(1 if fails else 0)
