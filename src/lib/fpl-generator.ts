import type { ICAOFlightPlan } from "@/lib/types"

/**
 * Mapeo de campos ICAOFlightPlan → IDs del formulario FPL (fpl-template.html)
 *
 * Plantilla FPL oficial CORPAC con imagen base PNG y campos superpuestos.
 * IDs según el HTML:
 *   - ac_id   : Aircraft Identification (F7)
 *   - sel_r   : Reglas de vuelo I/V/Y/Z (F8a)
 *   - sel_t   : Tipo de vuelo S/N/G/M/X (F8b)
 *   - num_a   : Número de aeronaves (F9a)
 *   - ac_tp   : Tipo de aeronave (F9b)
 *   - sel_w   : Categoría de estela H/M/L (F9c)
 *   - eq_c    : Equipo / capacidades (F10a)
 *   - eq_s    : Transpondedor SSR (F10b)
 *   - dep     : Aeródromo de salida (F13a)
 *   - dep_t   : EOBT (F13b)
 *   - spd     : Velocidad de crucero (F15a)
 *   - lvl     : Nivel de crucero (F15b)
 *   - ruta    : Ruta (F15c)
 *   - dst     : Aeródromo de destino (F16a)
 *   - eet_h   : EET horas (F16b)
 *   - eet_m   : EET minutos (F16b)
 *   - alt1    : Alternativa 1 (F16c)
 *   - alt2    : Alternativa 2 (F16d)
 *   - otros   : Otra información (F18)
 *   - end_h   : Endurance horas (F19 E/)
 *   - end_m   : Endurance minutos (F19 E/)
 *   - pob     : Personas a bordo (F19 P/)
 *   - sq_uhf  : Radio emergencia UHF (F19 R/U)
 *   - sq_vhf  : Radio emergencia VHF (F19 R/V)
 *   - sq_elt  : Radio emergencia ELT (F19 R/E)
 *   - sq_s    : Equipo supervivencia POLAR (F19 S/)
 *   - sq_p    : Equipo supervivencia DESERT (F19 S/)
 *   - sq_d    : Equipo supervivencia MARITIME (F19 S/)
 *   - sq_m    : Equipo supervivencia JUNGLE (F19 S/)
 *   - sq_jj   : Chalecos LIGHT (F19 J/)
 *   - sq_ll   : Chalecos FLUO (F19 J/)
 *   - sq_ff   : Chalecos V/U/Radio (F19 J/)
 *   - sq_uu   : Chalecos UHF (F19 J/)
 *   - sq_vv   : Chalecos VHF (F19 J/)
 *   - sq_n    : Balsas - indicador N (F19 D/) [checkbox]
 *   - d_c     : Balsas - capacidad (F19 D/)
 *   - sq_cub  : Balsas - cubierta (F19 D/)
 *   - d_col   : Balsas - color (F19 D/)
 *   - color_a : Color y marcas (F19 A/)
 *   - obs     : Observaciones (F19 RMK/)
 *   - pic     : Piloto al mando (F19 N/)
 *   - filed   : Filed by (texto libre)
 *   - esp     : Espacio adicional (texto libre)
 */

interface FplFillData {
  // Campos texto
  ac_id: string
  num_a: string
  ac_tp: string
  eq_c: string
  eq_s: string
  dep: string
  dep_t: string
  spd: string
  lvl: string
  ruta: string
  dst: string
  eet_h: string
  eet_m: string
  alt1: string
  alt2: string
  otros: string
  end_h: string
  end_m: string
  pob: string
  d_c: string
  d_col: string
  color_a: string
  obs: string
  pic: string
  filed: string
  esp: string
  // Campos select
  sel_r: string
  sel_t: string
  sel_w: string
  // Checkboxes (ids de divs .sq a marcar con clase "on")
  squares: string[]
}

/**
 * Convierte un ICAOFlightPlan a la estructura FplFillData
 * que se inyectará en la plantilla HTML.
 */
export function planToFplData(plan: ICAOFlightPlan): FplFillData {
  // EET total: "0230" → horas "02", minutos "30"
  const eet = (plan.totalEET || "").padStart(4, "0")
  const eet_h = eet.slice(0, 2)
  const eet_m = eet.slice(2, 4)

  // Endurance: "0450" → horas "04", minutos "50"
  const end = (plan.endurance || "").padStart(4, "0")
  const end_h = end.slice(0, 2)
  const end_m = end.slice(2, 4)

  // Radio de emergencia: "V", "U", "E" o combinaciones tipo "UV", "UVE"
  const emergencyRadio = (plan.emergencyRadio || "").toUpperCase()
  const squares: string[] = []
  if (emergencyRadio.includes("U")) squares.push("sq_uhf")
  if (emergencyRadio.includes("V")) squares.push("sq_vhf")
  if (emergencyRadio.includes("E")) squares.push("sq_elt")

  // Equipo de supervivencia: POLAR, DESERT, MARITIME, JUNGLE
  const survival = (plan.survivalEquipment || "").toUpperCase()
  if (survival.includes("POLAR")) squares.push("sq_s")
  if (survival.includes("DESERT")) squares.push("sq_p")
  if (survival.includes("MARITIME")) squares.push("sq_d")
  if (survival.includes("JUNGLE")) squares.push("sq_m")

  // Chalecos: LIGHT, FLUO + V/U/Radio
  // Formato típico: "LIGHT/FLUO/V" o "LIGHT FLUO V U"
  const jackets = (plan.jackets || "").toUpperCase()
  if (jackets.includes("LIGHT")) squares.push("sq_jj")
  if (jackets.includes("FLUO") || jackets.includes("FLUORESCENT"))
    squares.push("sq_ll")
  // Radio en chalecos: V, U
  if (jackets.includes("V")) squares.push("sq_vv")
  if (jackets.includes("U")) squares.push("sq_uu")
  // Force/Fluorescent color flag
  if (jackets.includes("FLUO") || jackets.includes("FLUORESCENT"))
    squares.push("sq_ff")

  // Balsas (dinghies): formato "2 8 C ORANGE" → indicador N, capacidad, cubierta, color
  const dinghiesStr = (plan.dinghies || "").trim()
  let d_c = ""
  let d_col = ""
  if (dinghiesStr) {
    const parts = dinghiesStr.split(/\s+/)
    // Marcar el checkbox N (indica que hay balsas)
    squares.push("sq_n")
    if (parts.length >= 2) d_c = parts[1]
    // Cubierta: "C" si aparece en el string
    if (dinghiesStr.toUpperCase().includes("C")) squares.push("sq_cub")
    // Color: todo lo que queda después del número, capacidad y "C"
    const colMatch = dinghiesStr.match(
      /\b(ORANGE|YELLOW|RED|BLUE|GREEN|WHITE|BLACK|RED-ORANGE)\b/i
    )
    if (colMatch) d_col = colMatch[1].toUpperCase()
  }

  return {
    ac_id: plan.aircraftIdentification || "",
    num_a: plan.numberOfAircraft && plan.numberOfAircraft !== "1"
      ? plan.numberOfAircraft
      : "",
    ac_tp: plan.typeOfAircraft || "",
    eq_c: plan.equipment || "",
    eq_s: plan.transponder || "",
    dep: plan.departureAerodrome || "",
    dep_t: plan.estimatedOffBlockTime || "",
    spd: plan.cruisingSpeed || "",
    lvl: plan.level || "",
    ruta: plan.route || "",
    dst: plan.destinationAerodrome || "",
    eet_h,
    eet_m,
    alt1: plan.alternateAerodrome1 || "",
    alt2: plan.alternateAerodrome2 || "",
    otros: plan.otherInformation || "",
    end_h,
    end_m,
    pob: plan.personsOnBoard || "",
    d_c,
    d_col,
    color_a: plan.aircraftColorAndMarkings || "",
    obs: plan.remarks || "",
    pic: plan.pilotInCommand || "",
    filed: "",
    esp: "",
    sel_r: plan.flightRules || "",
    sel_t: plan.typeOfFlight || "",
    sel_w: plan.wakeTurbulenceCat || "",
    squares,
  }
}

/**
 * Escapa un string para ser embebido dentro de comillas simples o dobles
 * en JavaScript. Conserva los caracteres especiales de ruta (espacios, /, etc).
 */
function escapeJsString(s: string): string {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
}

/**
 * Genera el script de relleno que se inyecta antes de </body>.
 * Este script:
 *  1. Rellena los inputs/textareas con los valores del plan
 *  2. Selecciona los valores en los <select>
 *  3. Activa los checkboxes (divs .sq) marcándolos con clase "on"
 *  4. Marca el botón de impresión como predeterminado si el usuario quiere imprimir
 */
function buildFillScript(data: FplFillData): string {
  const textFields: Array<[string, string]> = [
    ["ac_id", data.ac_id],
    ["num_a", data.num_a],
    ["ac_tp", data.ac_tp],
    ["eq_c", data.eq_c],
    ["eq_s", data.eq_s],
    ["dep", data.dep],
    ["dep_t", data.dep_t],
    ["spd", data.spd],
    ["lvl", data.lvl],
    ["ruta", data.ruta],
    ["dst", data.dst],
    ["eet_h", data.eet_h],
    ["eet_m", data.eet_m],
    ["alt1", data.alt1],
    ["alt2", data.alt2],
    ["otros", data.otros],
    ["end_h", data.end_h],
    ["end_m", data.end_m],
    ["pob", data.pob],
    ["d_c", data.d_c],
    ["d_col", data.d_col],
    ["color_a", data.color_a],
    ["obs", data.obs],
    ["pic", data.pic],
    ["filed", data.filed],
    ["esp", data.esp],
  ]

  const selectFields: Array<[string, string]> = [
    ["sel_r", data.sel_r],
    ["sel_t", data.sel_t],
    ["sel_w", data.sel_w],
  ]

  const textLines = textFields
    .map(([id, val]) => `  setVal(${JSON.stringify(id)}, ${JSON.stringify(val)});`)
    .join("\n")

  const selectLines = selectFields
    .map(([id, val]) => `  setSel(${JSON.stringify(id)}, ${JSON.stringify(val)});`)
    .join("\n")

  const squaresArr = JSON.stringify(data.squares)

  return `
<script>
(function(){
  function setVal(id, v){
    var el = document.getElementById(id);
    if(!el) return;
    el.value = v || "";
    // Disparar input event para que los listeners de uppercase funcionen
    try { el.dispatchEvent(new Event('input', {bubbles:true})); } catch(e){}
  }
  function setSel(id, v){
    var el = document.getElementById(id);
    if(!el) return;
    if(!v){ el.value = ""; return; }
    el.value = v;
    try { el.dispatchEvent(new Event('change', {bubbles:true})); } catch(e){}
  }
  function tap(el){
    if(!el) return;
    if(!el.classList.contains('on')) el.classList.add('on');
  }
  var squares = ${squaresArr};
  for(var i=0;i<squares.length;i++){ tap(document.getElementById(squares[i])); }
${textLines}
${selectLines}
  // Auto-trigger print dialog after a short delay (opcional, comentado para evitar bloqueo)
  // setTimeout(function(){ window.print(); }, 300);
})();
</script>`
}

/**
 * Carga la plantilla FPL desde /public/fpl-template.html, inyecta el script
 * de relleno con los datos del plan y devuelve el HTML listo para descargar.
 */
export async function generateFplHtml(plan: ICAOFlightPlan): Promise<string> {
  const data = planToFplData(plan)
  const fillScript = buildFillScript(data)

  // Cargar plantilla
  const res = await fetch("/fpl-template.html")
  if (!res.ok) {
    throw new Error(`No se pudo cargar la plantilla FPL (status ${res.status})`)
  }
  let html = await res.text()

  // Inyectar el script de relleno justo antes de </body>
  if (html.includes("</body>")) {
    html = html.replace("</body>", `${fillScript}\n</body>`)
  } else {
    html += fillScript
  }

  // Ajustar el título para reflejar el plan generado
  const acId = plan.aircraftIdentification || "FPL"
  const dep = plan.departureAerodrome || ""
  const dst = plan.destinationAerodrome || ""
  const newTitle = `FPL ${acId}${dep ? " " + dep : ""}${dst ? "-" + dst : ""}`
  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeJsString(newTitle)}</title>`
  )

  return html
}

/**
 * Descarga el FPL generado como archivo HTML.
 * El nombre del archivo incluye identificación de aeronave y ruta.
 */
export async function downloadFplHtml(plan: ICAOFlightPlan): Promise<void> {
  const html = await generateFplHtml(plan)

  const acId = (plan.aircraftIdentification || "FPL").replace(/[^A-Z0-9]/gi, "")
  const dep = (plan.departureAerodrome || "").replace(/[^A-Z0-9]/gi, "")
  const dst = (plan.destinationAerodrome || "").replace(/[^A-Z0-9]/gi, "")
  const dateStr = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")
  const fileName = `FPL_${acId}${dep ? "_" + dep : ""}${dst ? "_" + dst : ""}_${dateStr}.html`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Liberar la URL después de un pequeño delay para asegurar la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Validación pura (sin side-effects) del plan de vuelo.
 * Devuelve true si todos los campos requeridos están presentes y son válidos.
 * Se usa para habilitar el botón "Descargar FPL".
 */
export function isFlightPlanValid(plan: ICAOFlightPlan): boolean {
  // F7 - Aircraft identification: 1-7 alfanuméricos
  if (!/^[A-Z0-9]{1,7}$/.test(plan.aircraftIdentification || "")) return false

  // F13 - Departure: 4 letras ICAO
  if (!/^[A-Z]{4}$/.test(plan.departureAerodrome || "")) return false

  // F13 - EOBT: HHMM
  if (!/^\d{4}$/.test(plan.estimatedOffBlockTime || "")) return false

  // F16 - Destination: 4 letras ICAO
  if (!/^[A-Z]{4}$/.test(plan.destinationAerodrome || "")) return false

  // F16 - Total EET: HHMM
  if (!/^\d{4}$/.test(plan.totalEET || "")) return false

  // F9 - Type of aircraft
  if (!plan.typeOfAircraft) return false

  // Alternates (opcional pero si presente, 4 letras)
  if (
    plan.alternateAerodrome1 &&
    !/^[A-Z]{4}$/.test(plan.alternateAerodrome1)
  )
    return false
  if (
    plan.alternateAerodrome2 &&
    !/^[A-Z]{4}$/.test(plan.alternateAerodrome2)
  )
    return false

  return true
}
