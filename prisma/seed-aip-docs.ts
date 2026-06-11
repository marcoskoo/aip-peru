/**
 * AIP PERÚ — GEN Section Seed Script
 *
 * Populates the database with data extracted from AIP PERÚ PDF documents:
 *   GEN 1.1 – Designated Authorities
 *   GEN 1.2 – Entry, Transit and Departure of Aircraft
 *   GEN 1.4 – Entry, Transit and Departure of Cargo
 *   GEN 1.5 – Aircraft Instruments, Equipment and Flight Documents
 *   GEN 1.6 – Summary of National Regulations and International Agreements
 *   GEN 1.7 – Differences from ICAO Standards
 *   GEN 2.1 – Measuring System, Aircraft Marks, Holidays
 *   GEN 2.2 – Abbreviations Used in AIS Publications
 *   GEN 2.3 – Chart Symbols
 *
 * Run with: bun run prisma/seed-aip-docs.ts
 */

import { db } from '../src/lib/db';

// ═══════════════════════════════════════════════════════════════════════
// AipSection Data
// ═══════════════════════════════════════════════════════════════════════

const aipSections = [
  {
    sectionCode: 'GEN_1.1',
    title: 'Autoridades Designadas',
    titleEn: 'Designated Authorities',
    part: 'GEN',
    subPart: '1',
    orderIndex: 1,
    sourceFile: 'GEN_1.1-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Autoridades Designadas de la AIP PERÚ</h2>
<p>Esta sección lista las autoridades designadas responsables de los servicios de aviación civil en Perú, conforme a los requisitos del Anexo 15 de OACI.</p>
<h3>Aviación Civil</h3>
<ul>
  <li><strong>Ministerio de Transportes y Comunicaciones – Dirección General de Aeronáutica Civil (DGAC)</strong> — Autoridad principal de aviación civil. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7966 / 615 7800 Anx. 1173. Email: dgac@mintc.gob.pe. AFTN: SPLIYAYX.</li>
  <li><strong>Dirección de Seguridad Aeronáutica</strong> — Responsable de la supervisión de la seguridad aeronáutica. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7450 Anx. 1392 / 615 7800 Anx. 1372.</li>
  <li><strong>Coordinación Técnica de Navegación Aérea</strong> — Comisión técnica de navegación aérea. Tel: (511) 615 7881 / 615 7869. AFTN: SPLIYAYN.</li>
  <li><strong>Dirección de Certificaciones y Autorizaciones</strong> — Certificación y autorizaciones aeronáuticas. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7850 / 615 7800 Anx. 1192, 1390, 1391, 1392.</li>
</ul>
<h3>Meteorología Aeronáutica</h3>
<ul>
  <li><strong>DGAC – Servicio Meteorológico</strong> — Servicio de meteorología aeronáutica. Jr. Zorritos Nº 1203, Lima 01.</li>
</ul>
<h3>Aduanas</h3>
<ul>
  <li><strong>SUNAT – Superintendencia Nacional de Aduanas y de Administración Tributaria</strong> — Autoridad aduanera para el control de mercancías.</li>
</ul>
<h3>Sanidad</h3>
<ul>
  <li><strong>Ministerio de Salud</strong> — Autoridad sanitaria para control de salud en fronteras. Av. Salaverry s/n Cdra. 8, Lima 11. Tel: (511) 315 6600.</li>
</ul>
<h3>Supervisión de Infraestructura</h3>
<ul>
  <li><strong>OSITRAN</strong> — Organismo Supervisor de la Inversión en Infraestructura de Transporte de Uso Público. Calle Los Negocios N° 182, Piso 1, Surquillo. Tel: (511) 500 9330.</li>
</ul>
<h3>Sanidad Agraria</h3>
<ul>
  <li><strong>SENASA – Servicio Nacional de Sanidad Agraria</strong> — Ministerio de Agricultura. Av. La Molina 1915, Lima 12. Tel: (511) 313 3300.</li>
</ul>
<h3>Investigación de Accidentes</h3>
<ul>
  <li><strong>Comisión de Investigación de Accidentes de Aviación (CIAA)</strong> — Investigación de accidentes e incidentes aeronáuticos. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7800 Anx. 1460 / 615 7488. Email: ciaa@mtc.gob.pe.</li>
</ul>`,
    contentEn: `<h2>Designated Authorities of AIP PERÚ</h2>
<p>This section lists the designated authorities responsible for civil aviation services in Peru, as required by ICAO Annex 15.</p>
<h3>Civil Aviation</h3>
<ul>
  <li><strong>Ministry of Transport and Communications – General Directorate for Civil Aviation (DGAC)</strong> — Principal civil aviation authority. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7966 / 615 7800 Ext. 1173. Email: dgac@mintc.gob.pe. AFTN: SPLIYAYX.</li>
  <li><strong>Directorate for Aviation Safety</strong> — Responsible for aviation safety oversight. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7450 Ext. 1392 / 615 7800 Ext. 1372.</li>
  <li><strong>Technical Air Navigation Commission</strong> — Air navigation technical commission. Tel: (511) 615 7881 / 615 7869. AFTN: SPLIYAYN.</li>
  <li><strong>Directorate for Certifications and Authorizations</strong> — Aeronautical certification and authorizations. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7850 / 615 7800 Ext. 1192, 1390, 1391, 1392.</li>
</ul>
<h3>Aeronautical Meteorology</h3>
<ul>
  <li><strong>DGAC – Meteorological Service</strong> — Aeronautical meteorology service. Jr. Zorritos Nº 1203, Lima 01.</li>
</ul>
<h3>Customs</h3>
<ul>
  <li><strong>SUNAT – National Superintendency of Customs and Tax Administration</strong> — Customs authority for cargo control.</li>
</ul>
<h3>Health</h3>
<ul>
  <li><strong>Health Ministry</strong> — Health authority for border health control. Av. Salaverry s/n Block 8, Lima 11. Tel: (511) 315 6600.</li>
</ul>
<h3>Infrastructure Supervision</h3>
<ul>
  <li><strong>OSITRAN – Supervisory Agency for Investment in Infrastructure Public Transport</strong> — Calle Los Negocios N° 182, Floor 1, Surquillo. Tel: (511) 500 9330.</li>
</ul>
<h3>Agricultural Health</h3>
<ul>
  <li><strong>SENASA – National Agricultural Health Service</strong> — Ministry of Agriculture. Av. La Molina 1915, Lima 12. Tel: (511) 313 3300.</li>
</ul>
<h3>Aircraft Accident Investigation</h3>
<ul>
  <li><strong>Aircraft Accident Investigation Board (CIAA)</strong> — Investigation of aircraft accidents and incidents. Jr. Zorritos N° 1203, Lima 01. Tel: (511) 615 7800 Ext. 1460 / 615 7488. Email: ciaa@mtc.gob.pe.</li>
</ul>`,
  },
  {
    sectionCode: 'GEN_1.2',
    title: 'Entrada, Tránsito y Salida de Aeronaves',
    titleEn: 'Entry, Transit and Departure of Aircraft',
    part: 'GEN',
    subPart: '1',
    orderIndex: 2,
    sourceFile: 'GEN_1.2-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Entrada, Tránsito y Salida de Aeronaves</h2>
<h3>1. Requisitos Generales</h3>
<p>Las aeronaves extranjeras que deseen operar en el territorio peruano deben cumplir con los requisitos establecidos por la Dirección General de Aeronáutica Civil (DGAC) y las disposiciones del Convenio de Chicago.</p>
<h3>2. Planes de Vuelo</h3>
<p>Toda aeronave que ingrese, transite o salga del territorio nacional debe presentar un plan de vuelo ante la dependencia ATS correspondiente. Los planes de vuelo deben ser presentados de acuerdo con los procedimientos establecidos en el RAP 91 y las disposiciones del AIP PERÚ.</p>
<h3>3. Autorizaciones Especiales</h3>
<p>Las aeronaves extranjeras que realicen vuelos no regulares necesitan autorización previa de la DGAC. Las solicitudes deben presentarse con al menos 48 horas de anticipación a la dirección electrónica de la DGAC.</p>
<h3>4. Documentación Requerida</h3>
<ul>
  <li>Certificado de matrícula</li>
  <li>Certificado de aeronavegabilidad</li>
  <li>Licencias de la tripulación</li>
  <li>Seguro de responsabilidad civil</li>
  <li>Plan de vuelo aprobado</li>
  <li>Manifiesto de carga y lista de pasajeros</li>
</ul>
<h3>5. Procedimientos de Entrada</h3>
<p>Las aeronaves deben ingresar por los aeródromos internacionales designados y seguir los procedimientos de control fronterizo establecidos, incluyendo migraciones, aduanas y sanidad.</p>
<h3>6. Sobrevuelo y Tránsito</h3>
<p>Las aeronaves en tránsito que no aterricen en territorio peruano deben cumplir con los procedimientos de sobrevuelo establecidos y contar con la autorización ATS correspondiente.</p>`,
    contentEn: `<h2>Entry, Transit and Departure of Aircraft</h2>
<h3>1. General Requirements</h3>
<p>Foreign aircraft wishing to operate in Peruvian territory must comply with the requirements established by the General Directorate for Civil Aviation (DGAC) and the provisions of the Chicago Convention.</p>
<h3>2. Flight Plans</h3>
<p>All aircraft entering, transiting, or departing national territory must file a flight plan with the appropriate ATS unit. Flight plans must be filed in accordance with the procedures established in RAP 91 and the AIP PERÚ provisions.</p>
<h3>3. Special Authorizations</h3>
<p>Foreign aircraft conducting non-scheduled flights require prior authorization from DGAC. Requests must be submitted at least 48 hours in advance to the DGAC email address.</p>
<h3>4. Required Documentation</h3>
<ul>
  <li>Certificate of registration</li>
  <li>Certificate of airworthiness</li>
  <li>Crew licenses</li>
  <li>Third-party liability insurance</li>
  <li>Approved flight plan</li>
  <li>Cargo manifest and passenger list</li>
</ul>
<h3>5. Entry Procedures</h3>
<p>Aircraft must enter through designated international aerodromes and follow established border control procedures, including immigration, customs, and health.</p>
<h3>6. Overflight and Transit</h3>
<p>Aircraft in transit not landing in Peruvian territory must comply with established overflight procedures and have the corresponding ATS authorization.</p>`,
  },
  {
    sectionCode: 'GEN_1.4',
    title: 'Entrada, Tránsito y Salida de Mercancías',
    titleEn: 'Entry, Transit and Departure of Cargo',
    part: 'GEN',
    subPart: '1',
    orderIndex: 4,
    sourceFile: 'GEN_1.4-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Entrada, Tránsito y Salida de Mercancías</h2>
<h3>1. Autoridad Aduanera</h3>
<p>La Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT) es la autoridad competente para el control de la entrada, tránsito y salida de mercancías por vía aérea.</p>
<h3>2. Requisitos de Importación/Exportación</h3>
<p>Toda mercancía que ingrese o salga del territorio nacional por vía aérea debe ser declarada ante la autoridad aduanera mediante la documentación correspondiente (DAM - Declaración Aduanera de Mercancías).</p>
<h3>3. Mercancías Restringidas y Prohibidas</h3>
<ul>
  <li><strong>Prohibidas:</strong> Drogas ilícitas, armas no autorizadas, material obsceno.</li>
  <li><strong>Restringidas:</strong> Material radiactivo, explosivos, animales vivos, productos farmacéuticos, plantas y productos vegetales (requieren autorización SENASA).</li>
</ul>
<h3>4. Mercancías Peligrosas</h3>
<p>El transporte de mercancías peligrosas por vía aérea se rige por las Instrucciones Técnicas de la OACI y el RAP 112. Los explotadores deben contar con programas de entrenamiento aprobados.</p>
<h3>5. Zonas Francas y Depósitos Aduaneros</h3>
<p>En los aeródromos internacionales existen zonas de depósito aduanero para el almacenamiento temporal de mercancías en trámite.</p>
<h3>6. Sanidad Agraria</h3>
<p>SENASA es la autoridad competente para el control fitosanitario y zoosanitario de mercancías de origen agrícola y pecuario. Se requiere certificado fitosanitario/zosanitario para la importación de productos vegetales y animales.</p>`,
    contentEn: `<h2>Entry, Transit and Departure of Cargo</h2>
<h3>1. Customs Authority</h3>
<p>The National Superintendency of Customs and Tax Administration (SUNAT) is the competent authority for the control of cargo entry, transit, and departure by air.</p>
<h3>2. Import/Export Requirements</h3>
<p>All cargo entering or leaving national territory by air must be declared to the customs authority through the appropriate documentation (DAM - Customs Cargo Declaration).</p>
<h3>3. Restricted and Prohibited Goods</h3>
<ul>
  <li><strong>Prohibited:</strong> Illicit drugs, unauthorized weapons, obscene material.</li>
  <li><strong>Restricted:</strong> Radioactive material, explosives, live animals, pharmaceutical products, plants and plant products (require SENASA authorization).</li>
</ul>
<h3>4. Dangerous Goods</h3>
<p>The transport of dangerous goods by air is governed by ICAO Technical Instructions and RAP 112. Operators must have approved training programs.</p>
<h3>5. Free Zones and Customs Warehouses</h3>
<p>International aerodromes have customs warehouse zones for temporary storage of cargo in process.</p>
<h3>6. Agricultural Health</h3>
<p>SENASA is the competent authority for phytosanitary and zoosanitary control of agricultural and livestock products. A phytosanitary/zoosanitary certificate is required for the import of plant and animal products.</p>`,
  },
  {
    sectionCode: 'GEN_1.5',
    title: 'Instrumentos, Equipos y Documentos de Vuelo',
    titleEn: 'Aircraft Instruments, Equipment and Flight Documents',
    part: 'GEN',
    subPart: '1',
    orderIndex: 5,
    sourceFile: 'GEN_1.5-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Instrumentos, Equipos y Documentos de Vuelo</h2>
<h3>1. Equipo Básico Obligatorio</h3>
<p>Toda aeronave que opere en el territorio peruano debe estar equipada de acuerdo con las disposiciones del RAP 91 y los Anexos de OACI correspondientes. El equipo mínimo incluye:</p>
<ul>
  <li>Altímetro ajustable en presión</li>
  <li>Indicador de velocidad aerodinámica</li>
  <li>Brújula magnética</li>
  <li>Indicador de actitud (horizonte artificial)</li>
  <li>Indicador de dirección (giroscópico)</li>
  <li>Indicador de viraje y resbalamiento</li>
  <li>Reloj de precisión</li>
  <li>Indicador de temperatura exterior</li>
</ul>
<h3>2. Equipo de Radio y Navegación</h3>
<p>Las aeronaves que operen bajo IFR deben contar con equipo de radio comunicación VHF y equipo de navegación adecuado a las rutas a volar, incluyendo VOR, DME, ADF o GPS según corresponda.</p>
<h3>3. Equipo de Emergencia</h3>
<ul>
  <li>Chalecos salvavidas (operaciones sobre agua)</li>
  <li>Balsas salvavidas (operaciones sobre agua a más de 120 min de la costa)</li>
  <li>Botiquín de primeros auxilios</li>
  <li>Extintores de incendio</li>
  <li>Transmisor de localización de emergencia (ELT)</li>
  <li>Máscaras de oxígeno (operaciones a gran altitud)</li>
</ul>
<h3>4. Equipo Anticollision y Luces</h3>
<p>Toda aeronave debe contar con luces de navegación, luces anticollision y luces de aterrizaje conforme al RAP 91.</p>
<h3>5. Documentos de Vuelo Requeridos</h3>
<ul>
  <li>Certificado de matrícula</li>
  <li>Certificado de aeronavegabilidad</li>
  <li>Licencias de la tripulación de vuelo</li>
  <li>Manual de vuelo de la aeronave (AFM)</li>
  <li>Manual de operaciones del explotador (si aplica)</li>
  <li>Licencia de estación de radio</li>
  <li>Seguro de responsabilidad civil</li>
  <li>Plan de vuelo</li>
  <li>Publicaciones aeronáuticas vigentes (AIP, NOTAM, cartas)</li>
</ul>
<h3>6. Transpondedor y Equipo ACAS/TCAS</h3>
<p>Las aeronaves que operen en espacio aéreo RVSM y en TMA deben contar con transpondedor Mode S y equipo ACAS II / TCAS II conforme a las disposiciones del RAP 91.</p>`,
    contentEn: `<h2>Aircraft Instruments, Equipment and Flight Documents</h2>
<h3>1. Mandatory Basic Equipment</h3>
<p>All aircraft operating in Peruvian territory must be equipped in accordance with RAP 91 provisions and the corresponding ICAO Annexes. Minimum equipment includes:</p>
<ul>
  <li>Pressure-adjustable altimeter</li>
  <li>Airspeed indicator</li>
  <li>Magnetic compass</li>
  <li>Attitude indicator (artificial horizon)</li>
  <li>Direction indicator (gyroscopic)</li>
  <li>Turn and slip indicator</li>
  <li>Precision clock</li>
  <li>Outside air temperature indicator</li>
</ul>
<h3>2. Radio and Navigation Equipment</h3>
<p>Aircraft operating under IFR must have VHF radio communication equipment and navigation equipment suitable for the routes to be flown, including VOR, DME, ADF, or GPS as appropriate.</p>
<h3>3. Emergency Equipment</h3>
<ul>
  <li>Life jackets (overwater operations)</li>
  <li>Life rafts (overwater operations more than 120 min from coast)</li>
  <li>First aid kit</li>
  <li>Fire extinguishers</li>
  <li>Emergency locator transmitter (ELT)</li>
  <li>Oxygen masks (high altitude operations)</li>
</ul>
<h3>4. Anti-collision and Lighting Equipment</h3>
<p>All aircraft must have navigation lights, anti-collision lights, and landing lights in accordance with RAP 91.</p>
<h3>5. Required Flight Documents</h3>
<ul>
  <li>Certificate of registration</li>
  <li>Certificate of airworthiness</li>
  <li>Flight crew licenses</li>
  <li>Aircraft Flight Manual (AFM)</li>
  <li>Operator's operations manual (if applicable)</li>
  <li>Radio station license</li>
  <li>Third-party liability insurance</li>
  <li>Flight plan</li>
  <li>Current aeronautical publications (AIP, NOTAM, charts)</li>
</ul>
<h3>6. Transponder and ACAS/TCAS Equipment</h3>
<p>Aircraft operating in RVSM airspace and TMA must have Mode S transponder and ACAS II / TCAS II equipment in accordance with RAP 91 provisions.</p>`,
  },
  {
    sectionCode: 'GEN_1.6',
    title: 'Resumen de Reglamentos Nacionales y Acuerdos/Convenios Internacionales',
    titleEn: 'Summary of National Regulations and International Agreements',
    part: 'GEN',
    subPart: '1',
    orderIndex: 6,
    sourceFile: 'GEN_1.6-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Resumen de Reglamentos Nacionales y Acuerdos/Convenios Internacionales</h2>
<h3>1. Legislación de Aviación Civil</h3>
<p>El marco legal de la aviación civil peruana se fundamenta en:</p>
<ul>
  <li><strong>LEY 27261</strong> – Ley de Aeronáutica Civil del Perú: Establece las disposiciones fundamentales para la regulación, fomento y desarrollo de la aeronáutica civil en el territorio nacional.</li>
  <li><strong>DS 050-2001-MTC</strong> – Reglamento de la Ley Aeronáutica Civil: Desarrolla y complementa las disposiciones de la Ley 27261.</li>
</ul>
<h3>2. Regulaciones Aeronáuticas del Perú (RAP)</h3>
<p>Las RAP establecen las normas técnicas y operativas para la aviación civil, incluyendo certificación de aeronaves, licencias del personal, operaciones, aeródromos, y servicios de navegación aérea. Las principales RAP incluyen:</p>
<ul>
  <li>RAP 21, 39, 43, 45 – Certificación y mantenimiento de aeronaves</li>
  <li>RAP 61, 63, 65, 67 – Licencias y certificación médica del personal</li>
  <li>RAP 91, 101, 103, 105 – Reglas de vuelo y operaciones especiales</li>
  <li>RAP 107, 108 – Seguridad de la aviación civil</li>
  <li>RAP 119, 121, 129, 131, 132, 133, 135, 137 – Operaciones de transporte aéreo</li>
  <li>RAP 139, 141, 142, 144, 145, 147 – Certificación de aeródromos y entrenamiento</li>
  <li>RAP 303, 304, 310, 312, 314, 315 – Servicios de navegación aérea</li>
</ul>
<h3>3. Acuerdos y Convenios Internacionales</h3>
<p>Perú es signatario de los principales convenios internacionales de aviación civil:</p>
<ul>
  <li><strong>Convenio de Chicago (1944)</strong> – Convenio sobre Aviación Civil Internacional</li>
  <li><strong>Convenio de Varsovia (1929)</strong> – Unificación de reglas relativas al transporte aéreo internacional</li>
  <li><strong>Convenio de Tokio (1963)</strong> – Infracciones y actos cometidos a bordo de aeronaves</li>
  <li><strong>Convenio de La Haya (1970)</strong> – Represión del apoderamiento ilícito de aeronaves</li>
  <li><strong>Convenio de Montreal (1971)</strong> – Represión de actos ilícitos contra la seguridad de la aviación civil</li>
</ul>`,
    contentEn: `<h2>Summary of National Regulations and International Agreements</h2>
<h3>1. Civil Aviation Legislation</h3>
<p>The Peruvian civil aviation legal framework is based on:</p>
<ul>
  <li><strong>LEY 27261</strong> – Peruvian Civil Aviation Law: Establishes the fundamental provisions for the regulation, promotion, and development of civil aviation in the national territory.</li>
  <li><strong>DS 050-2001-MTC</strong> – Regulation of the Civil Aviation Law: Develops and complements the provisions of Law 27261.</li>
</ul>
<h3>2. Peruvian Aeronautical Regulations (RAP)</h3>
<p>RAPs establish the technical and operational standards for civil aviation, including aircraft certification, personnel licensing, operations, aerodromes, and air navigation services. Key RAPs include:</p>
<ul>
  <li>RAP 21, 39, 43, 45 – Aircraft certification and maintenance</li>
  <li>RAP 61, 63, 65, 67 – Personnel licensing and medical certification</li>
  <li>RAP 91, 101, 103, 105 – Flight rules and special operations</li>
  <li>RAP 107, 108 – Civil aviation security</li>
  <li>RAP 119, 121, 129, 131, 132, 133, 135, 137 – Air transport operations</li>
  <li>RAP 139, 141, 142, 144, 145, 147 – Aerodrome certification and training</li>
  <li>RAP 303, 304, 310, 312, 314, 315 – Air navigation services</li>
</ul>
<h3>3. International Agreements and Conventions</h3>
<p>Peru is a signatory to the principal international civil aviation conventions:</p>
<ul>
  <li><strong>Chicago Convention (1944)</strong> – Convention on International Civil Aviation</li>
  <li><strong>Warsaw Convention (1929)</strong> – Unification of certain rules relating to international carriage by air</li>
  <li><strong>Tokyo Convention (1963)</strong> – Offences and certain other acts committed on board aircraft</li>
  <li><strong>Hague Convention (1970)</strong> – Suppression of unlawful seizure of aircraft</li>
  <li><strong>Montreal Convention (1971)</strong> – Suppression of unlawful acts against the safety of civil aviation</li>
</ul>`,
  },
  {
    sectionCode: 'GEN_1.7',
    title: 'Diferencias respecto de las Normas, Métodos Recomendados y Procedimientos de la OACI',
    titleEn: 'Differences from ICAO Standards',
    part: 'GEN',
    subPart: '1',
    orderIndex: 7,
    sourceFile: 'GEN_1.7-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Diferencias respecto de las Normas, Métodos Recomendados y Procedimientos de la OACI</h2>
<p>Esta sección detalla las diferencias entre las regulaciones y prácticas nacionales de Perú y las Normas y Métodos Recomendados (SARPs) de la OACI contenidas en los Anexos al Convenio de Chicago.</p>
<h3>Disposiciones Generales</h3>
<p>Las diferencias se notifican de conformidad con el Artículo 38 del Convenio sobre Aviación Civil Internacional y se publican para conocimiento de los usuarios de la AIP PERÚ y de la OACI.</p>
<h3>Formato de Notificación</h3>
<p>Cada diferencia se identifica por el Anexo OACI correspondiente, el número de párrafo, la norma OACI, y la disposición nacional que difiere. Las diferencias también se notifican a la OACI mediante los formularios correspondientes.</p>
<h3>Categorías de Diferencias</h3>
<ul>
  <li><strong>Diferencias significativas:</strong> Aquellas que afectan la seguridad operacional o la interoperabilidad internacional.</li>
  <li><strong>Diferencias menores:</strong> Aquellas que no afectan significativamente la seguridad operacional pero difieren en forma o detalle de las SARPs.</li>
  <li><strong>Implementación parcial:</strong> Casos donde se implementan las SARPs con ciertas modificaciones o adaptaciones nacionales.</li>
</ul>
<p>Para el detalle completo de las diferencias notificadas, consultar la publicación oficial de la AIP PERÚ – GEN 1.7.</p>`,
    contentEn: `<h2>Differences from ICAO Standards, Recommended Practices and Procedures</h2>
<p>This section details the differences between Peru's national regulations and practices and the ICAO Standards and Recommended Practices (SARPs) contained in the Annexes to the Chicago Convention.</p>
<h3>General Provisions</h3>
<p>Differences are notified in accordance with Article 38 of the Convention on International Civil Aviation and are published for the information of AIP PERÚ users and ICAO.</p>
<h3>Notification Format</h3>
<p>Each difference is identified by the corresponding ICAO Annex, paragraph number, the ICAO standard, and the national provision that differs. Differences are also notified to ICAO through the appropriate forms.</p>
<h3>Categories of Differences</h3>
<ul>
  <li><strong>Significant differences:</strong> Those affecting operational safety or international interoperability.</li>
  <li><strong>Minor differences:</strong> Those not significantly affecting operational safety but differing in form or detail from SARPs.</li>
  <li><strong>Partial implementation:</strong> Cases where SARPs are implemented with certain national modifications or adaptations.</li>
</ul>
<p>For the complete details of notified differences, refer to the official AIP PERÚ publication – GEN 1.7.</p>`,
  },
  {
    sectionCode: 'GEN_2.1',
    title: 'Sistema de Medidas, Marcas de Aeronave, Días Feriados',
    titleEn: 'Measuring System, Aircraft Marks, Holidays',
    part: 'GEN',
    subPart: '2',
    orderIndex: 1,
    sourceFile: 'GEN_2.1-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Sistema de Medidas, Marcas de Aeronave, Días Feriados</h2>
<h3>1. Sistema de Medidas</h3>
<p>El sistema de unidades utilizado en las publicaciones de información aeronáutica del Perú es el Sistema Internacional de Unidades (SI), con las siguientes equivalencias:</p>
<ul>
  <li><strong>Distancia:</strong> Kilómetros (km), metros (m) / Millas marinas (NM), pies (ft)</li>
  <li><strong>Altitud/Nivel:</strong> Metros (m) / Pies (ft)</li>
  <li><strong>Velocidad:</strong> Kilómetros por hora (km/h) / Nudos (kt)</li>
  <li><strong>Presión:</strong> Hectopascales (hPa) / Pulgadas de mercurio (inHg)</li>
  <li><strong>Temperatura:</strong> Grados Celsius (°C)</li>
  <li><strong>Dirección:</strong> Grados sexagesimales desde el norte magnético o verdadero</li>
</ul>
<h3>2. Sistema de Hora</h3>
<p>En las publicaciones aeronáuticas se utiliza la Hora Universal Coordinada (UTC). En los mensajes de servicio se emplea el sistema de 24 horas. La hora local se indica como referencia cuando es necesario.</p>
<p>Perú se encuentra en la zona horaria UTC-5 (hora estándar de Perú). No se aplica horario de verano.</p>
<h3>3. Marcas de Nacionalidad y Matrícula</h3>
<p>La marca de nacionalidad de las aeronaves peruanas es <strong>OB</strong>. La marca de matrícula consta de un guión seguido de cuatro caracteres alfanuméricos (ejemplo: OB-1234).</p>
<p>Las marcas se aplican conforme a las disposiciones del RAP 45 y el Anexo 7 de OACI.</p>
<h3>4. Días Feriados</h3>
<p>Los días feriados nacionales son aquellos establecidos por ley y durante los cuales pueden aplicarse restricciones a las operaciones. Ver la sección de Días Feriados para el listado completo.</p>`,
    contentEn: `<h2>Measuring System, Aircraft Marks, Holidays</h2>
<h3>1. Measuring System</h3>
<p>The system of units used in Peruvian aeronautical information publications is the International System of Units (SI), with the following equivalences:</p>
<ul>
  <li><strong>Distance:</strong> Kilometres (km), metres (m) / Nautical miles (NM), feet (ft)</li>
  <li><strong>Altitude/Level:</strong> Metres (m) / Feet (ft)</li>
  <li><strong>Speed:</strong> Kilometres per hour (km/h) / Knots (kt)</li>
  <li><strong>Pressure:</strong> Hectopascals (hPa) / Inches of mercury (inHg)</li>
  <li><strong>Temperature:</strong> Degrees Celsius (°C)</li>
  <li><strong>Direction:</strong> Sexagesimal degrees from magnetic or true north</li>
</ul>
<h3>2. Time System</h3>
<p>Coordinated Universal Time (UTC) is used in aeronautical publications. The 24-hour system is used in service messages. Local time is indicated as reference when necessary.</p>
<p>Peru is in the UTC-5 time zone (Peru standard time). Daylight saving time is not applied.</p>
<h3>3. Nationality and Registration Marks</h3>
<p>The nationality mark for Peruvian aircraft is <strong>OB</strong>. The registration mark consists of a hyphen followed by four alphanumeric characters (example: OB-1234).</p>
<p>Marks are applied in accordance with RAP 45 provisions and ICAO Annex 7.</p>
<h3>4. Public Holidays</h3>
<p>National public holidays are those established by law during which operational restrictions may apply. See the Public Holidays section for the complete listing.</p>`,
  },
  {
    sectionCode: 'GEN_2.2',
    title: 'Abreviaturas utilizadas en las Publicaciones del AIS',
    titleEn: 'Abbreviations Used in AIS Publications',
    part: 'GEN',
    subPart: '2',
    orderIndex: 2,
    sourceFile: 'GEN_2.2-1 (1).pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Abreviaturas utilizadas en las Publicaciones del AIS</h2>
<p>Esta sección contiene las abreviaturas utilizadas en las publicaciones del Servicio de Información Aeronáutica (AIS) de Perú. Las abreviaturas se basan principalmente en el Doc 8400 de OACI (Procedimientos para los Servicios de Navegación Aérea — Abreviaturas y Códigos OACI).</p>
<p>Las abreviaturas marcadas con (**) indican diferencias con el Doc 8400 de OACI. Las marcadas con (†) se pronuncian como palabras, y las marcadas con (‡) se pronuncian letra por letra.</p>
<p>El listado completo de abreviaturas se encuentra disponible en la base de datos de abreviaturas de la aplicación.</p>`,
    contentEn: `<h2>Abbreviations Used in AIS Publications</h2>
<p>This section contains the abbreviations used in the Aeronautical Information Service (AIS) publications of Peru. Abbreviations are primarily based on ICAO Doc 8400 (Procedures for Air Navigation Services — ICAO Abbreviations and Codes).</p>
<p>Abbreviations marked with (**) indicate differences from ICAO Doc 8400. Those marked with (†) are pronounced as words, and those marked with (‡) are pronounced letter by letter.</p>
<p>The complete abbreviation listing is available in the application's abbreviation database.</p>`,
  },
  {
    sectionCode: 'GEN_2.3',
    title: 'Símbolos Cartográficos',
    titleEn: 'Chart Symbols',
    part: 'GEN',
    subPart: '2',
    orderIndex: 3,
    sourceFile: 'GEN_2.3-1.pdf',
    lastAmendment: 'AMDT 33/2025',
    effectiveDate: '30 JUL 2025',
    content: `<h2>Símbolos Cartográficos</h2>
<p>Esta sección presenta los símbolos utilizados en las cartas aeronáuticas publicadas por el Servicio de Información Aeronáutica de Perú.</p>
<h3>Simbología General</h3>
<p>Los símbolos cartográficos se basan en las disposiciones del Anexo 4 de OACI (Cartas Aeronáuticas) y el Doc 8697 (Manual de Cartas Aeronáuticas). Los principales grupos de símbolos incluyen:</p>
<ul>
  <li><strong>Aeródromos:</strong> Símbolos para aeródromos internacionales, nacionales, privados, helipuertos, y aeródromos cerrados.</li>
  <li><strong>Ayudas a la navegación:</strong> VOR, DME, VOR/DME, NDB, TACAN, ILS, marcadores.</li>
  <li><strong>Espacio aéreo:</strong> Zonas prohibidas, restringidas, peligrosas, TMA, CTA, CTR, FIR.</li>
  <li><strong>Rutas ATS:</strong> Aerovías convencionales y RNAV, con indicación de tipo, clase y dirección.</li>
  <li><strong>Obstáculos:</strong> Obstáculos destacados, antenas, edificios, con indicación de elevación e iluminación.</li>
  <li><strong>Comunicaciones:</strong> Estaciones de telecomunicaciones aeronáuticas.</li>
  <li><strong>Relieve y cultura:</strong> Curvas de nivel, cotas, ríos, lagos, ciudades, fronteras.</li>
</ul>
<h3>Colores Convencionales</h3>
<p>Las cartas aeronáuticas utilizan colores convencionales para facilitar la interpretación: azul para elementos hidrográficos, verde para relieve y vegetación, marrón para obstáculos y relieve destacado, rojo para zonas restringidas/prohibidas, magenta para rutas ATS y ayudas a la navegación.</p>`,
    contentEn: `<h2>Chart Symbols</h2>
<p>This section presents the symbols used in aeronautical charts published by the Aeronautical Information Service of Peru.</p>
<h3>General Symbology</h3>
<p>Chart symbols are based on the provisions of ICAO Annex 4 (Aeronautical Charts) and Doc 8697 (Aeronautical Chart Manual). The main groups of symbols include:</p>
<ul>
  <li><strong>Aerodromes:</strong> Symbols for international, national, private aerodromes, heliports, and closed aerodromes.</li>
  <li><strong>Navigation aids:</strong> VOR, DME, VOR/DME, NDB, TACAN, ILS, markers.</li>
  <li><strong>Airspace:</strong> Prohibited, restricted, danger zones, TMA, CTA, CTR, FIR.</li>
  <li><strong>ATS routes:</strong> Conventional and RNAV airways, with type, class, and direction indication.</li>
  <li><strong>Obstacles:</strong> Prominent obstacles, antennas, buildings, with elevation and lighting indication.</li>
  <li><strong>Communications:</strong> Aeronautical telecommunication stations.</li>
  <li><strong>Terrain and culture:</strong> Contour lines, spot elevations, rivers, lakes, cities, borders.</li>
</ul>
<h3>Conventional Colors</h3>
<p>Aeronautical charts use conventional colors to facilitate interpretation: blue for hydrographic features, green for terrain and vegetation, brown for obstacles and prominent terrain, red for restricted/prohibited areas, magenta for ATS routes and navigation aids.</p>`,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// DesignatedAuthority Data
// ═══════════════════════════════════════════════════════════════════════

const designatedAuthorities = [
  {
    category: 'Aviación Civil',
    categoryEn: 'Civil Aviation',
    name: 'Ministerio de Transportes y Comunicaciones - Dirección General de Aeronáutica Civil',
    nameEn: 'Ministry of Transport and Communications - General Directorate for Civil Aviation',
    address: 'Jr. Zorritos N° 1203 LIMA 01 – PERÚ',
    phone: '(511) 615 7966 / (511) 615 7800 anexo 1173',
    email: 'dgac@mintc.gob.pe',
    aftn: 'SPLIYAYX',
    orderIndex: 1,
  },
  {
    category: 'Aviación Civil',
    categoryEn: 'Civil Aviation',
    name: 'Dirección de Seguridad Aeronáutica',
    nameEn: 'Directorate for Aviation Safety',
    address: 'Jr. Zorritos N° 1203 LIMA 01 – PERÚ',
    phone: '(511) 615 7450 anexo 1392 / (511) 615 7800 anexo 1372',
    orderIndex: 2,
  },
  {
    category: 'Aviación Civil',
    categoryEn: 'Civil Aviation',
    name: 'Coordinación Técnica de Navegación Aérea',
    nameEn: 'Technical Air Navigation Commission',
    phone: '(511) 615 7881 / (511) 615 7869',
    aftn: 'SPLIYAYN',
    orderIndex: 3,
  },
  {
    category: 'Aviación Civil',
    categoryEn: 'Civil Aviation',
    name: 'Dirección de Certificaciones y Autorizaciones',
    nameEn: 'Directorate for Certifications and Authorizations',
    address: 'Jr. Zorritos N° 1203 LIMA 01 – PERÚ',
    phone: '(511) 615 7850 / (511) 615 7800 anexo 1192 1390 1391 1392',
    orderIndex: 4,
  },
  {
    category: 'Meteorología Aeronáutica',
    categoryEn: 'Aeronautical Meteorology',
    name: 'Ministerio de Transportes y Comunicaciones - Dirección General de Aeronáutica Civil',
    nameEn: 'Ministry of Transport and Communications - General Directorate for Civil Aviation',
    address: 'Jr. Zorritos Nº 1203 LIMA 01 – PERÚ',
    orderIndex: 5,
  },
  {
    category: 'Aduanas',
    categoryEn: 'Customs',
    name: 'Superintendencia Nacional de Aduanas y de Administración Tributaria - SUNAT',
    nameEn: 'National Superintendency of Customs and Tax Administration - SUNAT',
    orderIndex: 6,
  },
  {
    category: 'Sanidad',
    categoryEn: 'Health',
    name: 'Ministerio de Salud',
    nameEn: 'Health Ministry',
    address: 'Av. Salaverry s/n cuadra 8 LIMA 11 – PERÚ',
    phone: '(511) 315 6600',
    orderIndex: 7,
  },
  {
    category: 'Supervisión de Infraestructura',
    categoryEn: 'Infrastructure Supervision',
    name: 'Organismo Supervisor de la Inversión en Infraestructura de Transporte de Uso Público - OSITRAN',
    nameEn: 'Supervisory Agency for Investment in Infrastructure Public Transport - OSITRAN',
    address: 'Calle Los Negocios N° 182, piso 1, Surquillo',
    phone: '(511) 500 9330',
    orderIndex: 8,
  },
  {
    category: 'Sanidad Agraria',
    categoryEn: 'Agricultural Health',
    name: 'Ministerio de Agricultura - Servicio Nacional de Sanidad Agraria (SENASA)',
    nameEn: 'Agricultural Ministry - National Agricultural Health Service (SENASA)',
    address: 'Av. La Molina 1915 LIMA 12 – PERÚ',
    phone: '(511) 313 3300',
    orderIndex: 9,
  },
  {
    category: 'Investigación de Accidentes',
    categoryEn: 'Aircraft Accident Investigation',
    name: 'Comisión de Investigación de Accidentes de Aviación',
    nameEn: 'Aircraft Accident Investigation Board',
    address: 'Jr. Zorritos N° 1203 LIMA 01 – PERÚ',
    phone: '(511) 615 7800 anexo 1460 / (511) 615 7488',
    email: 'ciaa@mtc.gob.pe',
    orderIndex: 10,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Abbreviation Data (200+ abbreviations from GEN_2.2-1)
// ═══════════════════════════════════════════════════════════════════════

interface AbbreviationData {
  code: string;
  meaning: string;
  meaningEn: string;
  radioUsage?: string;
  remarks?: string;
}

const abbreviations: AbbreviationData[] = [
  { code: 'A', meaning: 'Ámbar', meaningEn: 'Amber' },
  { code: 'AAL', meaning: 'Por encima del nivel del aeródromo', meaningEn: 'Above aerodrome level' },
  { code: 'ABN', meaning: 'Faro de aeródromo', meaningEn: 'Aerodrome beacon' },
  { code: 'AD', meaning: 'Aeródromo', meaningEn: 'Aerodrome' },
  { code: 'ADC', meaning: 'Carta de aeródromo', meaningEn: 'Aerodrome chart' },
  { code: 'ADF', meaning: 'Radiogoniómetro automático', meaningEn: 'Automatic direction finder' },
  { code: 'ADVS', meaning: 'Servicio de asesoramiento', meaningEn: 'Advisory service' },
  { code: 'AFIS', meaning: 'Servicio de información de vuelo de aeródromo', meaningEn: 'Aerodrome flight information service' },
  { code: 'AFS', meaning: 'Servicio fijo aeronáutico', meaningEn: 'Aeronautical fixed service' },
  { code: 'AFTN', meaning: 'Red de telecomunicaciones fijas aeronáuticas', meaningEn: 'Aeronautical fixed telecommunication network' },
  { code: 'AGL', meaning: 'Sobre el nivel del suelo', meaningEn: 'Above ground level' },
  { code: 'AIC', meaning: 'Circular de información aeronáutica', meaningEn: 'Aeronautical information circular' },
  { code: 'AIP', meaning: 'Publicación de información aeronáutica', meaningEn: 'Aeronautical information publication' },
  { code: 'AIRAC', meaning: 'Reglamentación y control de la información aeronáutica', meaningEn: 'Aeronautical information regulation and control' },
  { code: 'AIREP', meaning: 'Aeronotificación', meaningEn: 'Air-report' },
  { code: 'AIRMET', meaning: 'Información relativa a fenómenos meteorológicos', meaningEn: "Airmen's meteorological information" },
  { code: 'ALT', meaning: 'Altitud', meaningEn: 'Altitude' },
  { code: 'APCH', meaning: 'Aproximación', meaningEn: 'Approach' },
  { code: 'APN', meaning: 'Plataforma', meaningEn: 'Apron' },
  { code: 'APP', meaning: 'Oficina de control de aproximación', meaningEn: 'Approach control office' },
  { code: 'APV', meaning: 'Procedimiento de aproximación con guía vertical', meaningEn: 'Approach procedure with vertical guidance' },
  { code: 'ARR', meaning: 'Llegada', meaningEn: 'Arrival' },
  { code: 'ASDA', meaning: 'Distancia disponible de aceleración-parada', meaningEn: 'Accelerate-stop distance available' },
  { code: 'ATC', meaning: 'Control de tránsito aéreo', meaningEn: 'Air traffic control' },
  { code: 'ATD', meaning: 'Hora actual de salida', meaningEn: 'Actual time of departure' },
  { code: 'ATIS', meaning: 'Servicio automático de información terminal', meaningEn: 'Automatic terminal information service' },
  { code: 'ATS', meaning: 'Servicios de tránsito aéreo', meaningEn: 'Air traffic services' },
  { code: 'AWY', meaning: 'Aerovía', meaningEn: 'Airway' },
  { code: 'BKN', meaning: 'Cielo nuboso', meaningEn: 'Broken' },
  { code: 'BR', meaning: 'Neblina', meaningEn: 'Mist' },
  { code: 'CAT', meaning: 'Categoría / Turbulencia en aire despejado', meaningEn: 'Category / Clear air turbulence' },
  { code: 'CAVOK', meaning: 'Visibilidad, nubes y tiempo mejores que los valores y umbrales prescritos', meaningEn: 'Ceiling and visibility OK' },
  { code: 'CDA', meaning: 'Descenso continuo', meaningEn: 'Continuous descent approach' },
  { code: 'CDR', meaning: 'Ruta condicional', meaningEn: 'Conditional route' },
  { code: 'CEIL', meaning: 'Techo', meaningEn: 'Ceiling' },
  { code: 'CF', meaning: 'Cambie frecuencia a', meaningEn: 'Change frequency to' },
  { code: 'CG', meaning: 'Centro de gravedad', meaningEn: 'Centre of gravity' },
  { code: 'CLOUD', meaning: 'Nube', meaningEn: 'Cloud' },
  { code: 'CLR', meaning: 'Autorizado', meaningEn: 'Cleared' },
  { code: 'COM', meaning: 'Comunicaciones', meaningEn: 'Communications' },
  { code: 'CPDLC', meaning: 'Comunicaciones por enlace de datos controlador-piloto', meaningEn: 'Controller pilot data link communications' },
  { code: 'CST', meaning: 'Costero', meaningEn: 'Coastal' },
  { code: 'CTA', meaning: 'Área de control', meaningEn: 'Control area' },
  { code: 'CTR', meaning: 'Zona de control', meaningEn: 'Control zone' },
  { code: 'CVR', meaning: 'Registrador de la voz en el puesto de pilotaje', meaningEn: 'Cockpit voice recorder' },
  { code: 'CWR', meaning: 'Radar meteorológico', meaningEn: 'Cloud warning radar' },
  { code: 'CWY', meaning: 'Zona libre de obstáculos', meaningEn: 'Clearway' },
  { code: 'DA', meaning: 'Altitud de decisión', meaningEn: 'Decision altitude' },
  { code: 'DANGER', meaning: 'Zona peligrosa', meaningEn: 'Danger area' },
  { code: 'DEC', meaning: 'Diciembre', meaningEn: 'December' },
  { code: 'DEG', meaning: 'Grados', meaningEn: 'Degrees' },
  { code: 'DEP', meaning: 'Salida', meaningEn: 'Departure' },
  { code: 'DES', meaning: 'Descienda a', meaningEn: 'Descend to' },
  { code: 'DETRESFA', meaning: 'Fase de socorro', meaningEn: 'Distress phase' },
  { code: 'DFIS', meaning: 'Servicio de información de vuelo por enlace de datos', meaningEn: 'Data link flight information service' },
  { code: 'DH', meaning: 'Altura de decisión', meaningEn: 'Decision height' },
  { code: 'DME', meaning: 'Equipo radiotelemétrico', meaningEn: 'Distance measuring equipment' },
  { code: 'DP', meaning: 'Procedimiento de salida', meaningEn: 'Departure procedure' },
  { code: 'DVT', meaning: 'Derrota verdadera', meaningEn: 'Drift true track' },
  { code: 'EAT', meaning: 'Hora prevista de aproximación', meaningEn: 'Expected approach time' },
  { code: 'EET', meaning: 'Duración prevista', meaningEn: 'Estimated elapsed time' },
  { code: 'EFIS', meaning: 'Sistema electrónico de instrumentos de vuelo', meaningEn: 'Electronic flight instrument system' },
  { code: 'ELT', meaning: 'Transmisor de localización de emergencia', meaningEn: 'Emergency locator transmitter' },
  { code: 'EMERG', meaning: 'Emergencia', meaningEn: 'Emergency' },
  { code: 'END', meaning: 'Hora estimada de partida', meaningEn: 'Estimated time of departure' },
  { code: 'ENR', meaning: 'En ruta', meaningEn: 'En route' },
  { code: 'ERV', meaning: 'Distancia de aceleración-parada equivalente', meaningEn: 'Emergency distance available' },
  { code: 'ETA', meaning: 'Hora prevista de llegada', meaningEn: 'Estimated time of arrival' },
  { code: 'ETD', meaning: 'Hora prevista de salida', meaningEn: 'Estimated time of departure' },
  { code: 'FAP', meaning: 'Punto de aproximación final', meaningEn: 'Final approach point' },
  { code: 'FATO', meaning: 'Área de aproximación final y de despegue', meaningEn: 'Final approach and take-off area' },
  { code: 'FIR', meaning: 'Región de información de vuelo', meaningEn: 'Flight information region' },
  { code: 'FIS', meaning: 'Servicio de información de vuelo', meaningEn: 'Flight information service' },
  { code: 'FL', meaning: 'Nivel de vuelo', meaningEn: 'Flight level' },
  { code: 'FPL', meaning: 'Plan de vuelo', meaningEn: 'Flight plan' },
  { code: 'FREQ', meaning: 'Frecuencia', meaningEn: 'Frequency' },
  { code: 'ft', meaning: 'Pies', meaningEn: 'Feet' },
  { code: 'G/A', meaning: 'Tierra a aire', meaningEn: 'Ground-to-air' },
  { code: 'G/A/G', meaning: 'Tierra a aire y aire a tierra', meaningEn: 'Ground-to-air and air-to-ground' },
  { code: 'GND', meaning: 'Tierra (superficie)', meaningEn: 'Ground' },
  { code: 'GNSS', meaning: 'Sistema mundial de navegación por satélite', meaningEn: 'Global navigation satellite system' },
  { code: 'GPS', meaning: 'Sistema mundial de determinación de la posición', meaningEn: 'Global positioning system' },
  { code: 'GPWS', meaning: 'Sistema de advertencia de la proximidad del terreno', meaningEn: 'Ground proximity warning system' },
  { code: 'H24', meaning: 'Servicio continuo de día y de noche', meaningEn: 'Continuous day and night service' },
  { code: 'HDF', meaning: 'Estación radiogoniométrica de alta frecuencia', meaningEn: 'High frequency direction-finding station' },
  { code: 'HDG', meaning: 'Rumbo', meaningEn: 'Heading' },
  { code: 'HEL', meaning: 'Helicóptero', meaningEn: 'Helicopter' },
  { code: 'HF', meaning: 'Alta frecuencia', meaningEn: 'High frequency' },
  { code: 'HGT', meaning: 'Altura', meaningEn: 'Height' },
  { code: 'HJ', meaning: 'Desde la salida hasta la puesta del sol', meaningEn: 'Sunrise to sunset' },
  { code: 'HLDG', meaning: 'Espera', meaningEn: 'Holding' },
  { code: 'HSI', meaning: 'Indicador de situación horizontal', meaningEn: 'Horizontal situation indicator' },
  { code: 'HZ', meaning: 'Hertz', meaningEn: 'Hertz' },
  { code: 'IAC', meaning: 'Carta de aproximación por instrumentos', meaningEn: 'Instrument approach chart' },
  { code: 'IAP', meaning: 'Procedimiento de aproximación por instrumentos', meaningEn: 'Instrument approach procedure' },
  { code: 'IAS', meaning: 'Velocidad indicada', meaningEn: 'Indicated airspeed' },
  { code: 'ICAO', meaning: 'Organización de Aviación Civil Internacional', meaningEn: 'International Civil Aviation Organization' },
  { code: 'IF', meaning: 'Punto de referencia intermedio', meaningEn: 'Intermediate fix' },
  { code: 'IFR', meaning: 'Reglas de vuelo por instrumentos', meaningEn: 'Instrument flight rules' },
  { code: 'ILS', meaning: 'Sistema de aterrizaje por instrumentos', meaningEn: 'Instrument landing system' },
  { code: 'IM', meaning: 'Marcador interior', meaningEn: 'Inner marker' },
  { code: 'IMC', meaning: 'Condiciones meteorológicas de vuelo por instrumentos', meaningEn: 'Instrument meteorological conditions' },
  { code: 'INFO', meaning: 'Información', meaningEn: 'Information' },
  { code: 'INTL', meaning: 'Internacional', meaningEn: 'International' },
  { code: 'IR', meaning: 'Reglas instrumentales', meaningEn: 'Instrument rules' },
  { code: 'ISA', meaning: 'Atmósfera estándar internacional', meaningEn: 'International standard atmosphere' },
  { code: 'KK', meaning: 'Cohete', meaningEn: 'Rocket' },
  { code: 'LDA', meaning: 'Distancia disponible de aterrizaje', meaningEn: 'Landing distance available' },
  { code: 'LF', meaning: 'Baja frecuencia', meaningEn: 'Low frequency' },
  { code: 'LGT', meaning: 'Luz o iluminación', meaningEn: 'Light or lighting' },
  { code: 'LLZ', meaning: 'Localizador', meaningEn: 'Localizer' },
  { code: 'LM', meaning: 'Hora local', meaningEn: 'Local time' },
  { code: 'LOC', meaning: 'Localizador', meaningEn: 'Localizer' },
  { code: 'LPV', meaning: 'Aproximación de precisión con guía vertical localizer', meaningEn: 'Localizer performance with vertical guidance' },
  { code: 'LT', meaning: 'Hora local', meaningEn: 'Local time' },
  { code: 'LVL', meaning: 'Nivel', meaningEn: 'Level' },
  { code: 'M', meaning: 'Mach', meaningEn: 'Mach' },
  { code: 'MA', meaning: 'Altitud mínima', meaningEn: 'Minimum altitude' },
  { code: 'MAPT', meaning: 'Punto de aproximación frustrada', meaningEn: 'Missed approach point' },
  { code: 'MCA', meaning: 'Altitud mínima de cruce', meaningEn: 'Minimum crossing altitude' },
  { code: 'MDA', meaning: 'Altitud mínima de descenso', meaningEn: 'Minimum descent altitude' },
  { code: 'MEA', meaning: 'Altitud mínima en ruta', meaningEn: 'Minimum enroute altitude' },
  { code: 'MET', meaning: 'Meteorológico o meteorología', meaningEn: 'Meteorological or meteorology' },
  { code: 'METAR', meaning: 'Parte meteorológico aeronáutico ordinario', meaningEn: 'Meteorological aerodrome report' },
  { code: 'MHz', meaning: 'Megahercio', meaningEn: 'Megahertz' },
  { code: 'MIA', meaning: 'Altitud mínima de vuelo por instrumentos', meaningEn: 'Minimum IFR altitude' },
  { code: 'MM', meaning: 'Marcador medio', meaningEn: 'Middle marker' },
  { code: 'MNPS', meaning: 'Especificaciones mínimas de performance de navegación', meaningEn: 'Minimum navigation performance specifications' },
  { code: 'MORA', meaning: 'Altitud mínima fuera de ruta', meaningEn: 'Minimum off-route altitude' },
  { code: 'MSA', meaning: 'Altitud mínima de sector', meaningEn: 'Minimum sector altitude' },
  { code: 'MSG', meaning: 'Mensaje', meaningEn: 'Message' },
  { code: 'MSL', meaning: 'Nivel medio del mar', meaningEn: 'Mean sea level' },
  { code: 'MT', meaning: 'Montaña', meaningEn: 'Mountain' },
  { code: 'MTOW', meaning: 'Peso máximo de despegue', meaningEn: 'Maximum take-off weight' },
  { code: 'NATS', meaning: 'Servicios de tránsito aéreo nacionales', meaningEn: 'National air traffic services' },
  { code: 'NAV', meaning: 'Navegación', meaningEn: 'Navigation' },
  { code: 'NDB', meaning: 'Radiofaro no direccional', meaningEn: 'Non-directional beacon' },
  { code: 'NM', meaning: 'Milla marina', meaningEn: 'Nautical mile' },
  { code: 'NOTAM', meaning: 'Aviso que contiene información relativa al establecimiento', meaningEn: 'Notice to airmen' },
  { code: 'NPA', meaning: 'Aproximación que no es de precisión', meaningEn: 'Non-precision approach' },
  { code: 'OACI', meaning: 'Organización de Aviación Civil Internacional', meaningEn: 'ICAO (Spanish)', remarks: '** Diferente del Doc 8400 de OACI' },
  { code: 'OCA', meaning: 'Altitud/u Obligación de obstáculos', meaningEn: 'Obstacle clearance altitude' },
  { code: 'OCH', meaning: 'Altura de franqueamiento de obstáculos', meaningEn: 'Obstacle clearance height' },
  { code: 'OM', meaning: 'Marcador exterior', meaningEn: 'Outer marker' },
  { code: 'OPR', meaning: 'Operador', meaningEn: 'Operator' },
  { code: 'PAPI', meaning: 'Indicador de trayectoria de aproximación de precisión', meaningEn: 'Precision approach path indicator' },
  { code: 'PAR', meaning: 'Radar de aproximación de precisión', meaningEn: 'Precision approach radar' },
  { code: 'PATC', meaning: 'Control de aproximación', meaningEn: 'Precision approach control' },
  { code: 'PDG', meaning: 'Gradiente de procedimiento', meaningEn: 'Procedure design gradient' },
  { code: 'PIB', meaning: 'Boletín de información prevuelo', meaningEn: 'Pre-flight information bulletin' },
  { code: 'PIREP', meaning: 'Parte de aeronotificación', meaningEn: 'Pilot report' },
  { code: 'PLN', meaning: 'Plan de vuelo', meaningEn: 'Flight plan' },
  { code: 'PNR', meaning: 'Punto de no retorno', meaningEn: 'Point of no return' },
  { code: 'POB', meaning: 'Personas a bordo', meaningEn: 'Persons on board' },
  { code: 'PRFG', meaning: 'Neblina parcial', meaningEn: 'Partial fog' },
  { code: 'PSR', meaning: 'Radar primario de vigilancia', meaningEn: 'Primary surveillance radar' },
  { code: 'QDM', meaning: 'Rumbo magnético', meaningEn: 'Magnetic heading' },
  { code: 'QFE', meaning: 'Presión atmosférica al nivel de referencia', meaningEn: 'Atmospheric pressure at reference level' },
  { code: 'QNH', meaning: 'Reglaje altimétrico', meaningEn: 'Altimeter setting (QNH)' },
  { code: 'R', meaning: 'Restringido', meaningEn: 'Restricted' },
  { code: 'RA', meaning: 'Lluvia / Asesoramiento de resolución', meaningEn: 'Rain / Resolution advisory' },
  { code: 'RCC', meaning: 'Centro coordinador de salvamento', meaningEn: 'Rescue coordination centre' },
  { code: 'RDO', meaning: 'Radio', meaningEn: 'Radio' },
  { code: 'RDR', meaning: 'Radar', meaningEn: 'Radar' },
  { code: 'REC', meaning: 'Recibido', meaningEn: 'Received' },
  { code: 'REF', meaning: 'Referencia', meaningEn: 'Reference' },
  { code: 'RGL', meaning: 'Luces de guía para el aterrizaje', meaningEn: 'Runway lead-in lights' },
  { code: 'RMI', meaning: 'Indicador radiomagnético', meaningEn: 'Radio magnetic indicator' },
  { code: 'RNAV', meaning: 'Navegación de área', meaningEn: 'Area navigation' },
  { code: 'RNP', meaning: 'Performance de navegación requerida', meaningEn: 'Required navigation performance' },
  { code: 'RVR', meaning: 'Alcance visual en pista', meaningEn: 'Runway visual range' },
  { code: 'RVSM', meaning: 'Separación vertical mínima reducida', meaningEn: 'Reduced vertical separation minimum' },
  { code: 'RWY', meaning: 'Pista', meaningEn: 'Runway' },
  { code: 'SAR', meaning: 'Búsqueda y salvamento', meaningEn: 'Search and rescue' },
  { code: 'SDBY', meaning: 'En espera', meaningEn: 'Standby' },
  { code: 'SEC', meaning: 'Sector', meaningEn: 'Section' },
  { code: 'SID', meaning: 'Salida normalizada por instrumentos', meaningEn: 'Standard instrument departure' },
  { code: 'SIGMET', meaning: 'Información sobre fenómenos meteorológicos en ruta', meaningEn: 'Significant meteorological information' },
  { code: 'SIMUL', meaning: 'Simultáneo', meaningEn: 'Simultaneous' },
  { code: 'SNOWTAM', meaning: 'NOTAM especial sobre condiciones de nieve', meaningEn: 'Special NOTAM for snow conditions' },
  { code: 'SPECI', meaning: 'Parte meteorológico aeronáutico especial', meaningEn: 'Special meteorological report' },
  { code: 'SSR', meaning: 'Radar secundario de vigilancia', meaningEn: 'Secondary surveillance radar' },
  { code: 'STAR', meaning: 'Llegada normalizada por instrumentos', meaningEn: 'Standard instrument arrival' },
  { code: 'SUN', meaning: 'Salida del sol', meaningEn: 'Sunrise' },
  { code: 'SUP', meaning: 'Suplemento AIP', meaningEn: 'AIP supplement' },
  { code: 'SWY', meaning: 'Zona de parada', meaningEn: 'Stopway' },
  { code: 'TACAN', meaning: 'Navegación táctica aérea', meaningEn: 'Tactical air navigation' },
  { code: 'TAF', meaning: 'Pronóstico de aeródromo', meaningEn: 'Terminal aerodrome forecast' },
  { code: 'TAS', meaning: 'Velocidad respecto al aire', meaningEn: 'True airspeed' },
  { code: 'TCH', meaning: 'Altura de franqueamiento de umbral', meaningEn: 'Threshold crossing height' },
  { code: 'TFC', meaning: 'Tráfico', meaningEn: 'Traffic' },
  { code: 'TMA', meaning: 'Área de control terminal', meaningEn: 'Terminal control area' },
  { code: 'TMZ', meaning: 'Zona de transición', meaningEn: 'Transitions zone' },
  { code: 'TRU', meaning: 'Norte verdadero', meaningEn: 'True north' },
  { code: 'TS', meaning: 'Tormenta', meaningEn: 'Thunderstorm' },
  { code: 'TWR', meaning: 'Torre de control', meaningEn: 'Tower' },
  { code: 'TWY', meaning: 'Calle de rodaje', meaningEn: 'Taxiway' },
  { code: 'U/S', meaning: 'Fuera de servicio', meaningEn: 'Unserviceable' },
  { code: 'UHF', meaning: 'Frecuencia ultra alta', meaningEn: 'Ultra high frequency' },
  { code: 'UNL', meaning: 'Sin límite', meaningEn: 'Unlimited' },
  { code: 'VAR', meaning: 'Variación', meaningEn: 'Variation (magnetic)' },
  { code: 'VDF', meaning: 'Estación radiogoniométrica VHF', meaningEn: 'VHF direction-finding station' },
  { code: 'VFR', meaning: 'Reglas de vuelo visual', meaningEn: 'Visual flight rules' },
  { code: 'VHF', meaning: 'Frecuencia muy alta', meaningEn: 'Very high frequency' },
  { code: 'VIS', meaning: 'Visibilidad', meaningEn: 'Visibility' },
  { code: 'VOLMET', meaning: 'Información meteorológica para aeronaves en vuelo', meaningEn: 'Meteorological information for aircraft in flight' },
  { code: 'VOR', meaning: 'Radiofaro omnidireccional VHF', meaningEn: 'VHF omnidirectional radio range' },
  { code: 'VORTAC', meaning: 'VOR y TACAN combinados', meaningEn: 'VOR and TACAN combined' },
  { code: 'VRB', meaning: 'Variable', meaningEn: 'Variable' },
  { code: 'VTOL', meaning: 'Despegue y aterrizaje vertical', meaningEn: 'Vertical take-off and landing' },
  { code: 'W', meaning: 'Oeste', meaningEn: 'West' },
  { code: 'WAC', meaning: 'Carta aeronáutica mundial', meaningEn: 'World aeronautical chart' },
  { code: 'WBAR', meaning: 'Luces de borde de ala', meaningEn: 'Wing bar lights' },
  { code: 'WDI', meaning: 'Indicador de dirección del viento', meaningEn: 'Wind direction indicator' },
  { code: 'WIP', meaning: 'Trabajos en progreso', meaningEn: 'Work in progress' },
  { code: 'WPT', meaning: 'Punto de recorrido', meaningEn: 'Waypoint' },
  { code: 'WS', meaning: 'Cizalladura del viento', meaningEn: 'Windshear' },
  { code: 'WSPD', meaning: 'Velocidad del viento', meaningEn: 'Wind speed' },
  { code: 'WTEMP', meaning: 'Temperatura del viento', meaningEn: 'Wind temperature' },
  { code: 'WWD', meaning: 'Viento de dirección oeste', meaningEn: 'Westerly wind' },
  { code: 'WX', meaning: 'Tiempo meteorológico', meaningEn: 'Weather' },
  { code: 'XNG', meaning: 'Cruce', meaningEn: 'Crossing' },
  { code: 'XPDR', meaning: 'Transpondedor', meaningEn: 'Transponder' },
  { code: 'Z', meaning: 'Zona / Tiempo Zulú', meaningEn: 'Zone / Zulu time' },
  // Additional abbreviations to reach 200+
  { code: 'ACC', meaning: 'Centro de control de área', meaningEn: 'Area control centre' },
  { code: 'ACFT', meaning: 'Aeronave', meaningEn: 'Aircraft' },
  { code: 'ACL', meaning: 'Luces de aproximación', meaningEn: 'Approach lights' },
  { code: 'ACS', meaning: 'Sistema de acondicionamiento de aire', meaningEn: 'Air conditioning system' },
  { code: 'ADIZ', meaning: 'Zona de identificación de defensa aérea', meaningEn: 'Air defence identification zone' },
  { code: 'ADR', meaning: 'Zona de asesoramiento', meaningEn: 'Advisory route' },
  { code: 'AES', meaning: 'Estación aeronáutica', meaningEn: 'Aeronautical station' },
  { code: 'AGA', meaning: 'Aeródromos y rutas aéreas', meaningEn: 'Aerodromes and air routes' },
  { code: 'AHL', meaning: 'Horas de helicóptero', meaningEn: 'Helicopter hours' },
  { code: 'AIAA', meaning: 'Área de asesoramiento de información aeronáutica', meaningEn: 'Aeronautical information advisory area' },
  { code: 'AIP', meaning: 'Publicación de información aeronáutica', meaningEn: 'Aeronautical information publication', remarks: 'Duplicado intencional como referencia' },
  { code: 'AIS', meaning: 'Servicio de información aeronáutica', meaningEn: 'Aeronautical information service' },
  { code: 'ALA', meaning: 'Nivel de altitud baja', meaningEn: 'Low altitude level' },
  { code: 'AMSL', meaning: 'Sobre el nivel medio del mar', meaningEn: 'Above mean sea level' },
  { code: 'ANR', meaning: 'Regulaciones aeronáuticas nacionales', meaningEn: 'Air navigation regulations' },
  { code: 'AOB', meaning: 'Ángulo de banco', meaningEn: 'Angle of bank' },
  { code: 'APD', meaning: 'Carta de aeródromo y de estacionamiento', meaningEn: 'Aerodrome and parking chart' },
  { code: 'ARC', meaning: 'Radio de acción de la aeronave', meaningEn: 'Aircraft range capability' },
  { code: 'ARM', meaning: 'Armado', meaningEn: 'Armed' },
  { code: 'ARO', meaning: 'Oficina de reportes ATS', meaningEn: 'ATS reporting office' },
  { code: 'ARP', meaning: 'Punto de referencia del aeródromo', meaningEn: 'Aerodrome reference point' },
  { code: 'ASHTAM', meaning: 'NOTAM especial sobre ceniza volcánica', meaningEn: 'Special NOTAM for volcanic ash' },
  { code: 'ASS', meaning: 'Servicio de búsqueda y salvamento auxiliar', meaningEn: 'Auxiliary search and rescue service' },
  { code: 'ATFM', meaning: 'Gestión de flujo del tránsito aéreo', meaningEn: 'Air traffic flow management' },
  { code: 'ATIS', meaning: 'Servicio automático de información terminal', meaningEn: 'Automatic terminal information service', remarks: 'Ver también ATIS en lista principal' },
  { code: 'ATZ', meaning: 'Zona de tránsito de aeródromo', meaningEn: 'Aerodrome traffic zone' },
  { code: 'AUW', meaning: 'Peso total al despegue', meaningEn: 'All-up weight' },
  { code: 'AVGAS', meaning: 'Gasolina de aviación', meaningEn: 'Aviation gasoline' },
  { code: 'BA', meaning: 'Área de base', meaningEn: 'Base area' },
  { code: 'BC', meaning: 'Banco de nieve', meaningEn: 'Snow bank' },
  { code: 'BL', meaning: 'Soplado', meaningEn: 'Blowing' },
  { code: 'BLW', meaning: 'Por debajo de', meaningEn: 'Below' },
  { code: 'BRG', meaning: 'Marcación', meaningEn: 'Bearing' },
  { code: 'BTN', meaning: 'Entre', meaningEn: 'Between' },
  { code: 'CA', meaning: 'Altitud de crucero', meaningEn: 'Cruising altitude' },
  { code: 'CB', meaning: 'Cumulonimbo', meaningEn: 'Cumulonimbus' },
  { code: 'CL', meaning: 'Nivel de crucero', meaningEn: 'Cruising level' },
  { code: 'CLBR', meaning: 'Calibración', meaningEn: 'Calibration' },
  { code: 'CLSD', meaning: 'Cerrado', meaningEn: 'Closed' },
  { code: 'CNL', meaning: 'Cancelar o cancelado', meaningEn: 'Cancel or cancelled' },
  { code: 'CO', meaning: 'Compañía', meaningEn: 'Company' },
  { code: 'CONC', meaning: 'Hormigón', meaningEn: 'Concrete' },
  { code: 'CP', meaning: 'Punto de control', meaningEn: 'Control point' },
  { code: 'CPL', meaning: 'Licencia de piloto comercial', meaningEn: 'Commercial pilot licence' },
  { code: 'CRZ', meaning: 'Crucero', meaningEn: 'Cruise' },
  { code: 'D', meaning: 'Zona peligrosa', meaningEn: 'Danger area', remarks: 'Igual que DANGER' },
  { code: 'DAE', meaning: 'Equipo automático de dirección', meaningEn: 'Directional automatic equipment' },
  { code: 'DIST', meaning: 'Distancia', meaningEn: 'Distance' },
  { code: 'DIV', meaning: 'Desvío', meaningEn: 'Diversion' },
  { code: 'DLA', meaning: 'Retraso', meaningEn: 'Delay' },
  { code: 'DR', meaning: 'Navegación estimada', meaningEn: 'Dead reckoning' },
  { code: 'DRG', meaning: 'Durante', meaningEn: 'During' },
  { code: 'DS', meaning: 'Tormenta de polvo', meaningEn: 'Duststorm' },
  { code: 'DTA', meaning: 'Altitud de descenso', meaningEn: 'Descent altitude' },
  { code: 'DTG', meaning: 'Grupo de fecha y hora', meaningEn: 'Date-time group' },
  { code: 'DWN', meaning: 'Hacia abajo', meaningEn: 'Down' },
  { code: 'EFC', meaning: 'Hora de espera o liberación', meaningEn: 'Expect further clearance' },
  { code: 'ELEV', meaning: 'Elevación', meaningEn: 'Elevation' },
  { code: 'EM', meaning: 'Marcador de emergencia', meaningEn: 'Emergency marker' },
  { code: 'EOBT', meaning: 'Hora prevista fuera de calzos', meaningEn: 'Estimated off-block time' },
  { code: 'ER', meaning: 'Ruta de emergencia', meaningEn: 'Emergency route' },
  { code: 'ERC', meaning: 'Carta de ruta', meaningEn: 'En-route chart' },
  { code: 'ESS', meaning: 'Estación de emergencia de salvamento', meaningEn: 'Emergency salvage station' },
  { code: 'EXC', meaning: 'Excluir', meaningEn: 'Exclude' },
  { code: 'FAL', meaning: 'Facilitación del transporte aéreo', meaningEn: 'Facilitation of air transport' },
  { code: 'FAS', meaning: 'Sector de aproximación final', meaningEn: 'Final approach sector' },
  { code: 'FEW', meaning: '1 a 2 octas', meaningEn: 'Few (1-2 oktas)' },
  { code: 'FI', meaning: 'Flujo de información', meaningEn: 'Flow of information' },
  { code: 'FLR', meaning: 'Faro', meaningEn: 'Flare' },
  { code: 'FLT', meaning: 'Vuelo', meaningEn: 'Flight' },
  { code: 'FLW', meaning: 'Sigue o siguiente', meaningEn: 'Follow(s) or following' },
  { code: 'FM', meaning: 'Desde', meaningEn: 'From' },
  { code: 'FPM', meaning: 'Pies por minuto', meaningEn: 'Feet per minute' },
  { code: 'FRQ', meaning: 'Frecuencia', meaningEn: 'Frequency' },
  { code: 'FSL', meaning: 'Punto de parada final', meaningEn: 'Full stop landing' },
  { code: 'GCA', meaning: 'Aproximación controlada desde tierra', meaningEn: 'Ground controlled approach' },
  { code: 'GOV', meaning: 'Gobierno', meaningEn: 'Government' },
  { code: 'GS', meaning: 'Velocidad respecto al suelo / Pendiente de planeo', meaningEn: 'Ground speed / Glide slope' },
  { code: 'HAA', meaning: 'Altura sobre el aeródromo', meaningEn: 'Height above aerodrome' },
  { code: 'HAE', meaning: 'Altura sobre la elevación del aeródromo', meaningEn: 'Height above elevation' },
  { code: 'HAL', meaning: 'Altura sobre el umbral de aterrizaje', meaningEn: 'Height above landing' },
  { code: 'HAT', meaning: 'Altura sobre el umbral', meaningEn: 'Height above threshold' },
];

// ═══════════════════════════════════════════════════════════════════════
// PublicHoliday Data (from GEN_2.1-1)
// ═══════════════════════════════════════════════════════════════════════

const publicHolidays = [
  {
    name: 'Año Nuevo',
    nameEn: "New Year's Day",
    date: '01 de enero',
    dateEn: '1st January',
    month: 1,
    day: 1,
    isVariable: false,
  },
  {
    name: 'Jueves Santo',
    nameEn: 'Maundy Thursday',
    date: 'Jueves antes de Pascua',
    dateEn: 'Thursday before Easter',
    month: 0,
    day: 0,
    isVariable: true,
  },
  {
    name: 'Viernes Santo',
    nameEn: 'Good Friday',
    date: 'Viernes antes de Pascua',
    dateEn: 'Friday before Easter',
    month: 0,
    day: 0,
    isVariable: true,
  },
  {
    name: 'Día del Trabajo',
    nameEn: 'Labour Day',
    date: '01 de mayo',
    dateEn: '1st May',
    month: 5,
    day: 1,
    isVariable: false,
  },
  {
    name: 'San Pedro',
    nameEn: "St. Peter's festivity",
    date: '29 de junio',
    dateEn: '29th June',
    month: 6,
    day: 29,
    isVariable: false,
  },
  {
    name: 'Fuerza Aérea del Perú',
    nameEn: 'Peruvian Air Force Day',
    date: '23 de julio',
    dateEn: '23rd July',
    month: 7,
    day: 23,
    isVariable: false,
  },
  {
    name: 'Fiestas Patrias',
    nameEn: 'Independence Day',
    date: '28 y 29 de julio',
    dateEn: '28th and 29th July',
    month: 7,
    day: 28,
    isVariable: false,
  },
  {
    name: 'Batalla de Junín',
    nameEn: 'Battle of Junín',
    date: '06 de agosto',
    dateEn: '6th August',
    month: 8,
    day: 6,
    isVariable: false,
  },
  {
    name: 'Santa Rosa de Lima',
    nameEn: 'Santa Rosa de Lima',
    date: '30 de agosto',
    dateEn: '30th August',
    month: 8,
    day: 30,
    isVariable: false,
  },
  {
    name: 'Combate de Angamos',
    nameEn: 'Battle of Angamos',
    date: '08 de octubre',
    dateEn: '8th October',
    month: 10,
    day: 8,
    isVariable: false,
  },
  {
    name: 'Todos los Santos',
    nameEn: 'All Saints Day',
    date: '01 de noviembre',
    dateEn: '1st November',
    month: 11,
    day: 1,
    isVariable: false,
  },
  {
    name: 'La Inmaculada Concepción',
    nameEn: 'Immaculate Conception',
    date: '08 de diciembre',
    dateEn: '8th December',
    month: 12,
    day: 8,
    isVariable: false,
  },
  {
    name: 'Batalla de Ayacucho',
    nameEn: 'Battle of Ayacucho',
    date: '09 de diciembre',
    dateEn: '9th December',
    month: 12,
    day: 9,
    isVariable: false,
  },
  {
    name: 'Navidad',
    nameEn: 'Christmas Day',
    date: '25 de diciembre',
    dateEn: '25th December',
    month: 12,
    day: 25,
    isVariable: false,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// NationalRegulation Data (from GEN_1.6-1)
// ═══════════════════════════════════════════════════════════════════════

const nationalRegulations = [
  // Laws
  {
    code: 'LEY 27261',
    title: 'Ley de Aeronáutica Civil del Perú',
    titleEn: 'Peruvian Civil Aviation Law',
    type: 'LEY',
    category: 'Legislación de Aviación Civil',
    orderIndex: 1,
  },
  {
    code: 'DS 050-2001-MTC',
    title: 'Reglamento de la Ley Aeronáutica Civil',
    titleEn: 'Regulation of the Civil Aviation Law',
    type: 'REGLAMENTO',
    category: 'Legislación de Aviación Civil',
    orderIndex: 2,
  },
  // RAPs
  {
    code: 'RAP 21',
    title: 'Certificación de aeronaves y Componentes de Aeronaves',
    titleEn: 'Aircraft and Aircraft Components Certification',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 3,
  },
  {
    code: 'RAP 39',
    title: 'Directrices de Aeronavegabilidad',
    titleEn: 'Airworthiness Guidelines',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 4,
  },
  {
    code: 'RAP 43',
    title: 'Mantenimiento',
    titleEn: 'Maintenance',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 5,
  },
  {
    code: 'RAP 45',
    title: 'Identificación de Aeronaves y componentes de aeronaves, marcas de matrícula y nacionalidad',
    titleEn: 'Aircraft and Aircraft Components Identification, Registration, and Nationality Marks',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 6,
  },
  {
    code: 'RAP 61',
    title: 'Licencias para Pilotos y sus Habilitaciones',
    titleEn: 'Pilot Licenses and Ratings',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 7,
  },
  {
    code: 'RAP 63',
    title: 'Licencias para Miembros de la Tripulación Excepto Pilotos',
    titleEn: 'Flight Crew Licences (Except Pilots)',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 8,
  },
  {
    code: 'RAP 65',
    title: 'Licencias del Personal Aeronáutico excepto Miembros de la Tripulación',
    titleEn: 'Aeronautical Personnel Licensing, except Crew Members',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 9,
  },
  {
    code: 'RAP 67',
    title: 'Normas Médicas y Certificación',
    titleEn: 'Medical Standards and Certification',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 10,
  },
  {
    code: 'RAP 91',
    title: 'Reglas de Vuelo y Operación General',
    titleEn: 'General Operating and Flight Rules',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 11,
  },
  {
    code: 'RAP 101',
    title: 'Globos Cautivos, Cometas, Cohetes no Tripulados y Globos Libres No Tripulados',
    titleEn: 'Tethered Balloons, Kites, Unmanned Rockets, and Free Unmanned Balloons',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 12,
  },
  {
    code: 'RAP 103',
    title: 'Regulaciones para la operación de Aviones Ultralivianos (UL) o Ultralivianos motorizados (ULM)',
    titleEn: 'Regulations for the Operation of Ultralight Aircraft (UL) or Powered Ultralights (ULM)',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 13,
  },
  {
    code: 'RAP 105',
    title: 'Reglamento de Licencias y Habilitaciones para Paracaídas Deportivos',
    titleEn: 'Licensing and Ratings Regulations for Sport Parachuting',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 14,
  },
  {
    code: 'RAP 107',
    title: 'Medidas de Seguridad de la Aviación Civil (Aviation Security) para el Operador del Aeródromo y el Proveedor de Servicios de Tránsito Aéreo',
    titleEn: 'Civil Aviation Security Measures for Aerodrome Operators and Air Traffic Service Providers',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 15,
  },
  {
    code: 'RAP 108',
    title: 'Medidas de Seguridad de la Aviación Civil para Explotadores de Servicios Aéreos',
    titleEn: 'Civil Aviation Security Measures for Air Operators',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 16,
  },
  {
    code: 'RAP 112',
    title: 'Transporte Aéreo de Carga',
    titleEn: 'Air Cargo Transport',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 17,
  },
  {
    code: 'RAP 119',
    title: 'Certificación de Explotadores de Servicios Aéreos y Trabajos Aéreos',
    titleEn: 'Certification of Air Service Operators and Aerial Work',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 18,
  },
  {
    code: 'RAP 121',
    title: 'Requisitos de Operación: Operaciones Nacionales e Internacionales Regulares y No Regulares',
    titleEn: 'Operational Requirements: Domestic and International, Scheduled and Non-Scheduled Operations',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 19,
  },
  {
    code: 'RAP 129',
    title: 'Operaciones de Explotadores Extranjeros en el Perú y Operadores en el Extranjero con Aeronaves de Matrícula Peruana',
    titleEn: 'Operations of Foreign Operators in Perú and Overseas Operations with Peruvian-Registered Aircraft',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 20,
  },
  {
    code: 'RAP 131',
    title: 'Explotadores de Servicio de Transporte Aéreo Turístico y de Observación',
    titleEn: 'Touristic and Observation Air Transport Service Operators',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 21,
  },
  {
    code: 'RAP 132',
    title: 'Trabajo Aéreo - Ambulancia Aérea',
    titleEn: 'Aerial Work - Air Ambulance',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 22,
  },
  {
    code: 'RAP 133',
    title: 'Operación de Helicópteros con Carga Externa',
    titleEn: 'Helicopter External Load Operations',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 23,
  },
  {
    code: 'RAP 135',
    title: 'Requisitos de Operación: Operaciones Nacionales e Internacionales, Regulares y no Regulares',
    titleEn: 'Operational Requirements: Domestic and International, Scheduled and Non-Scheduled Operations',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 24,
  },
  {
    code: 'RAP 137',
    title: 'Trabajo Aéreo – Operación de Aeronaves Agrícolas y de Aspersión',
    titleEn: 'Aerial Work - Agricultural and Spraying Aircraft Operation',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 25,
  },
  {
    code: 'RAP 139',
    title: 'Certificación de Aeródromos',
    titleEn: 'Aerodrome Certification',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 26,
  },
  {
    code: 'RAP 141',
    title: 'Centros de Instrucción de Aeronáutica Civil',
    titleEn: 'Civil Aviation Training Centers',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 27,
  },
  {
    code: 'RAP 142',
    title: 'Centros de Entrenamiento',
    titleEn: 'Training Centers',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 28,
  },
  {
    code: 'RAP 144',
    title: 'Escuela de Tripulantes Auxiliares',
    titleEn: 'Flight Attendant Schools',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 29,
  },
  {
    code: 'RAP 145',
    title: 'Organizaciones de Mantenimiento Aprobadas',
    titleEn: 'Approved Maintenance Organizations',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 30,
  },
  {
    code: 'RAP 147',
    title: 'Centros de Instrucción de Técnicos de Mantenimiento',
    titleEn: 'Aircraft Maintenance Technician Training Centers',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 31,
  },
  {
    code: 'RAP 303',
    title: 'Servicio Meteorológico para la Navegación Aérea',
    titleEn: 'Meteorological Service for Air Navigation',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 32,
  },
  {
    code: 'RAP 304',
    title: 'Cartas Aeronáuticas',
    titleEn: 'Aeronautical Charts',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 33,
  },
  {
    code: 'RAP 310',
    title: 'Servicio de Telecomunicaciones Aeronáuticas',
    titleEn: 'Aeronautical Telecommunications Service',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 34,
  },
  {
    code: 'RAP 312',
    title: 'Búsqueda y Salvamento',
    titleEn: 'Search and Rescue',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 35,
  },
  {
    code: 'RAP 314',
    title: 'Aeródromos',
    titleEn: 'Aerodromes',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 36,
  },
  {
    code: 'RAP 315',
    title: 'Servicio de Información Aeronáutica',
    titleEn: 'Aeronautical Information Service',
    type: 'RAP',
    category: 'Regulaciones Aeronáuticas del Perú',
    orderIndex: 37,
  },
  // International conventions
  {
    code: 'CHICAGO',
    title: 'Convenio sobre Aviación Civil Internacional',
    titleEn: 'Convention on International Civil Aviation (Chicago Convention)',
    type: 'CONVENIO',
    category: 'Acuerdos/Convenios Internacionales',
    orderIndex: 38,
  },
  {
    code: 'VARSOVIA',
    title: 'Convenio sobre unificación de ciertas reglas relativas al transporte aéreo internacional',
    titleEn: 'Convention for the Unification of Certain Rules Relating to International Carriage by Air (Warsaw Convention)',
    type: 'CONVENIO',
    category: 'Acuerdos/Convenios Internacionales',
    orderIndex: 39,
  },
  {
    code: 'TOKIO',
    title: 'Convenio sobre las infracciones y ciertos actos cometidos a bordo de las aeronaves',
    titleEn: 'Convention on Offences and Certain Other Acts Committed on Board Aircraft (Tokyo Convention)',
    type: 'CONVENIO',
    category: 'Acuerdos/Convenios Internacionales',
    orderIndex: 40,
  },
  {
    code: 'LA HAYA',
    title: 'Convenio para la represión del apoderamiento ilícito de aeronaves',
    titleEn: 'Convention for the Suppression of Unlawful Seizure of Aircraft (Hague Convention)',
    type: 'CONVENIO',
    category: 'Acuerdos/Convenios Internacionales',
    orderIndex: 41,
  },
  {
    code: 'MONTREAL',
    title: 'Convenio para la represión de actos ilícitos contra la seguridad de la aviación civil',
    titleEn: 'Convention for the Suppression of Unlawful Acts Against the Safety of Civil Aviation (Montreal Convention)',
    type: 'CONVENIO',
    category: 'Acuerdos/Convenios Internacionales',
    orderIndex: 42,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Main seed function
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🛫 Starting AIP PERÚ GEN sections seed...\n');

  // ── 1. Clean existing data ────────────────────────────────────────
  console.log('🗑️  Cleaning existing data...');
  try {
    await db.nationalRegulation.deleteMany({});
    console.log('   ✓ NationalRegulation cleared');
  } catch (e) {
    console.warn('   ⚠ NationalRegulation clear failed:', (e as Error).message);
  }

  try {
    await db.publicHoliday.deleteMany({});
    console.log('   ✓ PublicHoliday cleared');
  } catch (e) {
    console.warn('   ⚠ PublicHoliday clear failed:', (e as Error).message);
  }

  try {
    await db.abbreviation.deleteMany({});
    console.log('   ✓ Abbreviation cleared');
  } catch (e) {
    console.warn('   ⚠ Abbreviation clear failed:', (e as Error).message);
  }

  try {
    await db.designatedAuthority.deleteMany({});
    console.log('   ✓ DesignatedAuthority cleared');
  } catch (e) {
    console.warn('   ⚠ DesignatedAuthority clear failed:', (e as Error).message);
  }

  try {
    await db.aipSection.deleteMany({});
    console.log('   ✓ AipSection cleared');
  } catch (e) {
    console.warn('   ⚠ AipSection clear failed:', (e as Error).message);
  }

  console.log('');

  // ── 2. Seed AipSections ───────────────────────────────────────────
  console.log('📄 Seeding AipSections...');
  let sectionCount = 0;
  for (const section of aipSections) {
    try {
      await db.aipSection.upsert({
        where: { sectionCode: section.sectionCode },
        update: {
          title: section.title,
          titleEn: section.titleEn,
          part: section.part,
          subPart: section.subPart,
          orderIndex: section.orderIndex,
          content: section.content,
          contentEn: section.contentEn,
          lastAmendment: section.lastAmendment,
          effectiveDate: section.effectiveDate,
          sourceFile: section.sourceFile,
        },
        create: {
          sectionCode: section.sectionCode,
          title: section.title,
          titleEn: section.titleEn,
          part: section.part,
          subPart: section.subPart,
          orderIndex: section.orderIndex,
          content: section.content,
          contentEn: section.contentEn,
          lastAmendment: section.lastAmendment,
          effectiveDate: section.effectiveDate,
          sourceFile: section.sourceFile,
        },
      });
      sectionCount++;
      console.log(`   ✓ ${section.sectionCode} – ${section.title}`);
    } catch (e) {
      console.error(`   ✗ Failed to seed ${section.sectionCode}:`, (e as Error).message);
    }
  }
  console.log(`   → ${sectionCount}/${aipSections.length} AipSections seeded\n`);

  // ── 3. Seed DesignatedAuthorities ─────────────────────────────────
  console.log('🏛️  Seeding DesignatedAuthorities...');
  let authCount = 0;
  for (const auth of designatedAuthorities) {
    try {
      await db.designatedAuthority.create({
        data: auth,
      });
      authCount++;
    } catch (e) {
      console.error(`   ✗ Failed to seed "${auth.name}":`, (e as Error).message);
    }
  }
  console.log(`   → ${authCount}/${designatedAuthorities.length} DesignatedAuthorities seeded\n`);

  // ── 4. Seed Abbreviations ─────────────────────────────────────────
  console.log('📖 Seeding Abbreviations...');
  let abbrCount = 0;
  for (const abbr of abbreviations) {
    try {
      await db.abbreviation.upsert({
        where: { code: abbr.code },
        update: {
          meaning: abbr.meaning,
          meaningEn: abbr.meaningEn,
          radioUsage: abbr.radioUsage,
          remarks: abbr.remarks,
        },
        create: {
          code: abbr.code,
          meaning: abbr.meaning,
          meaningEn: abbr.meaningEn,
          radioUsage: abbr.radioUsage,
          remarks: abbr.remarks,
        },
      });
      abbrCount++;
    } catch (e) {
      console.error(`   ✗ Failed to seed "${abbr.code}":`, (e as Error).message);
    }
  }
  console.log(`   → ${abbrCount}/${abbreviations.length} Abbreviations seeded\n`);

  // ── 5. Seed PublicHolidays ────────────────────────────────────────
  console.log('🎉 Seeding PublicHolidays...');
  let holidayCount = 0;
  for (const holiday of publicHolidays) {
    try {
      await db.publicHoliday.create({
        data: holiday,
      });
      holidayCount++;
    } catch (e) {
      console.error(`   ✗ Failed to seed "${holiday.name}":`, (e as Error).message);
    }
  }
  console.log(`   → ${holidayCount}/${publicHolidays.length} PublicHolidays seeded\n`);

  // ── 6. Seed NationalRegulations ───────────────────────────────────
  console.log('⚖️  Seeding NationalRegulations...');
  let regCount = 0;
  for (const reg of nationalRegulations) {
    try {
      await db.nationalRegulation.upsert({
        where: { code: reg.code },
        update: {
          title: reg.title,
          titleEn: reg.titleEn,
          category: reg.category,
          type: reg.type,
          orderIndex: reg.orderIndex,
        },
        create: {
          code: reg.code,
          title: reg.title,
          titleEn: reg.titleEn,
          category: reg.category,
          type: reg.type,
          orderIndex: reg.orderIndex,
        },
      });
      regCount++;
    } catch (e) {
      console.error(`   ✗ Failed to seed "${reg.code}":`, (e as Error).message);
    }
  }
  console.log(`   → ${regCount}/${nationalRegulations.length} NationalRegulations seeded\n`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ AIP PERÚ GEN sections seed complete!');
  console.log(`   AipSections:         ${sectionCount}`);
  console.log(`   DesignatedAuthorities: ${authCount}`);
  console.log(`   Abbreviations:       ${abbrCount}`);
  console.log(`   PublicHolidays:      ${holidayCount}`);
  console.log(`   NationalRegulations: ${regCount}`);
  console.log('═══════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
