// Robust extractor: find `var NAME=[...];` and eval the array literal.
import fs from "node:fs"

const html = fs.readFileSync("upload/aip-peru-v20-dragfix.html", "utf8")

function extractArray(name) {
  const startIdx = html.indexOf(`var ${name}=`)
  if (startIdx < 0) return { error: "not found" }
  const ob = html.indexOf("[", startIdx)
  if (ob < 0) return { error: "no [" }
  let depth = 0
  let inStr = false, strCh = "", esc = false
  let inLine = false, inBlock = false
  for (let i = ob; i < html.length; i++) {
    const ch = html[i]
    const next = html[i + 1] || ""
    if (inLine) { if (ch === "\n") inLine = false; continue }
    if (inBlock) { if (ch === "*" && next === "/") { inBlock = false; i++; } continue }
    if (inStr) {
      if (esc) { esc = false; continue }
      if (ch === "\\") { esc = true; continue }
      if (ch === strCh) { inStr = false }
      continue
    }
    if (ch === "/" && next === "/") { inLine = true; i++; continue }
    if (ch === "/" && next === "*") { inBlock = true; i++; continue }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = true; strCh = ch; continue }
    if (ch === "[") depth++
    else if (ch === "]") {
      depth--
      if (depth === 0) {
        const slice = html.slice(ob, i + 1)
        try {
          // eslint-disable-next-line no-eval
          const v = eval("(" + slice + ")")
          return v
        } catch (e) {
          return { error: "eval: " + e.message.slice(0, 150), sample: slice.slice(0, 300) }
        }
      }
    }
  }
  return { error: "no ]" }
}

const targets = [
  "WAYPOINTS", "NAVAIDS", "NAVAIDS_INTL", "ROUTES", "ROUTES_LOW", "ROUTES_RNAV",
  "FIR_TRANSFERS", "FIR_BOUNDS", "FIR_NEIGHBORS", "ATC_SECTORS", "TMA_SECTORS",
  "FREQS", "SIDSTAR", "RESTR", "OBSTACLES", "AIRSPACE",
]

fs.mkdirSync("scripts/aip-out", { recursive: true })
for (const t of targets) {
  const r = extractArray(t)
  if (Array.isArray(r)) {
    fs.writeFileSync(`scripts/aip-out/${t}.json`, JSON.stringify(r, null, 2))
    console.log(t.padEnd(18), r.length)
  } else {
    console.log(t.padEnd(18), "FAIL", JSON.stringify(r).slice(0, 200))
  }
}
