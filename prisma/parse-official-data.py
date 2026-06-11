#!/usr/bin/env python3
"""
Parse official AIP Peru PDF data from extracted text files.
V3 - Robust parsing with proper string handling.
"""

import json
import math
import re
import os
import sys

DATA_FILE = "/home/z/my-project/public/data/airways-data.json"
ENR31_FILE = "/tmp/enr31.txt"
ENR32_FILE = "/tmp/enr32.txt"
ENR33_FILE = "/tmp/enr33.txt"
ENR41_FILE = "/tmp/enr41.txt"
ENR44_FILE = "/tmp/enr44.txt"
ENR51_FILE = "/tmp/enr51.txt"

# Regex for DMS coordinates: 03d26m50sS - 080d00m34sW  (using d,m,s as placeholders)
# We'll build these patterns as raw strings to avoid quote issues

def dms_to_decimal(dms_str):
    if not dms_str:
        return None, None
    s = dms_str.strip()
    
    # Pattern: DDdMM'SS''H - DDDdMM'SS''H  (where d=degree symbol)
    pat = re.compile(
        r"(\d{2})\xb0\s*(\d{2})['\u2019\u2032]\s*(\d{2})[\"'\u2019\u2032\u2033]*\s*([NS])\s*[-\u2013]\s*"
        r"(\d{3})\xb0\s*(\d{2})['\u2019\u2032]\s*(\d{2})[\"'\u2019\u2032\u2033]*\s*([EW])"
    )
    m = pat.search(s)
    if m:
        lat = int(m.group(1)) + int(m.group(2))/60 + int(m.group(3))/3600
        if m.group(4) == 'S': lat = -lat
        lon = int(m.group(5)) + int(m.group(6))/60 + int(m.group(7))/3600
        if m.group(8) == 'W': lon = -lon
        return round(lat, 6), round(lon, 6)
    
    # Compact: DDMMSSH DDDMMSSH
    pat2 = re.compile(r"(\d{2})(\d{2})(\d{2})([NS])\s+(\d{3})(\d{2})(\d{2})([EW])")
    m = pat2.search(s)
    if m:
        lat = int(m.group(1)) + int(m.group(2))/60 + int(m.group(3))/3600
        if m.group(4) == 'S': lat = -lat
        lon = int(m.group(5)) + int(m.group(6))/60 + int(m.group(7))/3600
        if m.group(8) == 'W': lon = -lon
        return round(lat, 6), round(lon, 6)
    
    # Compact with dash: DDMMSSH-DDDMMSSH
    pat3 = re.compile(r"(\d{2})(\d{2})(\d{2})([NS])\s*[-\u2013]\s*(\d{3})(\d{2})(\d{2})([EW])")
    m = pat3.search(s)
    if m:
        lat = int(m.group(1)) + int(m.group(2))/60 + int(m.group(3))/3600
        if m.group(4) == 'S': lat = -lat
        lon = int(m.group(5)) + int(m.group(6))/60 + int(m.group(7))/3600
        if m.group(8) == 'W': lon = -lon
        return round(lat, 6), round(lon, 6)
    
    return None, None

def haversine_bearing(lat1, lon1, lat2, lon2):
    if None in [lat1, lon1, lat2, lon2]:
        return None, None
    R = 3440.065
    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)
    dlon = lon2_r - lon1_r
    x = math.sin(dlon) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlon)
    bearing = math.degrees(math.atan2(x, y))
    bearing = (bearing + 360) % 360
    a = math.sin((lat2_r-lat1_r)/2)**2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    dist = R * c
    return round(bearing, 1), round(dist, 1)

def is_coordinate_line(line):
    line = line.strip()
    # DMS format with degree symbols
    if re.search(r"\d{2}\xb0\s*\d{2}", line):
        return True
    # Compact format
    if re.search(r"\d{6}[NS]\s+\d{7}[EW]", line):
        return True
    if re.search(r"\d{6}[NS]\s*[-\u2013]\s*\d{7}[EW]", line):
        return True
    return False

def is_airway_designator(line):
    line = line.strip()
    pats = [
        r"^UV\s*\d+",
        r"^[VAGBR]\d+",
        r"^L\d+",
        r"^T\d+",
        r"^U[LMTWPBS]\d+",
        r"^UN\d+",
    ]
    for pat in pats:
        if re.match(pat, line):
            # Make sure it's not just a partial match
            # Check that the line is just the designator (+ optional RNAV spec)
            if re.match(pat + r"(\s*\(RNAV[\d]+(\s*-\s*RNP\d+)?\))?$", line):
                return True
    return False

# ─── Step 1: Navaids ──────────────────────────────────────────────────────

def parse_enr41():
    print("=" * 60)
    print("STEP 1: Parsing ENR 4.1 - Radio Navigation Aids")
    print("=" * 60)
    
    # Hardcoded from the PDF for reliability - 31 navaids
    navaid_data = [
        ("AND", "ANDAHUAYLAS", "VOR/DME", "114.30 MHZ CH 90X", "134251S", "0732240W", None, "05\u00b0 W"),
        ("OAS", "ANDOAS", "VOR/DME", "116.80 MHZ CH 115X", "024722S", "0762839W", None, None),
        ("EQU", "AREQUIPA", "VOR/DME", "113.70 MHZ CH 84X", "162021S", "0713550W", 39, "06\u00b0 W"),
        ("ARI", "ARICA", "VOR/DME", "116.50 MHZ CH 112X", "182210S", "0702047W", None, None),
        ("POY", "CHACHAPOYAS", "VOR/DME", "115.10 MHZ CH 98X", "061202S", "0775135W", None, "03\u00b0 W"),
        ("CLA", "CHICLAYO", "VOR/DME", "114.90 MHZ CH 96X", "064302S", "0794909W", 121, "02\u00b0 W"),
        ("BTE", "CHIMBOTE", "VOR", "112.50 MHZ", "090851S", "0783119W", None, "02\u00b0 W"),
        ("ZCO", "CUSCO", "VOR/DME", "114.90 MHZ CH 96X", "133109S", "0720036W", None, "05\u00b0 W"),
        ("ILO", "ILO", "VOR", "112.50 MHZ", "174128S", "0712102W", None, "05\u00b0 W"),
        ("IQT", "IQUITOS", "VOR/DME", "116.50 MHZ CH 112X", "034733S", "0731904W", 335, "07\u00b0 W"),
        ("JCL", "JORGE CHAVEZ", "DVOR/DME", "116.90 MHZ CH 116X", "120223S", "0770620W", 115, "02\u00b0 W"),
        ("JUL", "JULIACA", "VOR/DME", "115.50 MHZ CH 102X", "152805S", "0700904W", None, "07\u00b0 W"),
        ("LPA", "LAS PALMAS", "DVOR/DME", "113.30 MHZ CH 80X", "120921S", "0765958W", None, None),
        ("LET", "LETICIA", "DVOR/DME", "117.50 MHZ CH 122X", "041142S", "0695624W", 285, "10\u00b0 W"),
        ("MLV", "MALVINAS", "VOR/DME", "117.20 MHZ CH 119X", "115130S", "0725616W", None, None),
        ("SCO", "PISCO", "VOR/DME", "114.10 MHZ CH 88X", "134419S", "0761246W", 100, "02\u00b0 W"),
        ("URA", "PIURA", "VOR/DME", "117.70 MHZ CH 124X", "051236S", "0803658W", None, "01\u00b0 W"),
        ("PZA", "PTO. ESPERANZA", "VOR", "113.90 MHZ", "094609S", "0704218W", None, None),
        ("PUL", "PUCALLPA", "VOR/DME", "116.70 MHZ CH 114X", "082233S", "0743420W", 537, "04\u00b0 W"),
        ("PLG", "PUERTO LEGUIZAMO", "VOR/DME", "112.80 MHZ CH 75X", "001043S", "0744632W", 665, None),
        ("PDO", "PTO. MALDONADO", "VOR/DME", "116.10 MHZ CH 108X", "123628S", "0691338W", None, None),
        ("SLS", "SALINAS", "DVOR/DME", "114.70 MHZ CH 94X", "111715S", "0773345W", None, None),
        ("SRV", "SANTA ROSA", "VOR", "116.60 MHZ", "032650S", "0800034W", None, "03\u00b0 W"),
        ("UAS", "SIHUAS", "VOR", "113.50 MHZ", "162216S", "0720801W", None, "05\u00b0 W"),
        ("TCA", "TACNA", "VOR/DME", "116.80 MHZ CH 115X", "180328S", "0701635W", 1277, "05\u00b0 W"),
        ("TAL", "TALARA", "VOR", "116.10 MHZ", "043449S", "0811509W", None, "01\u00b0 W"),
        ("TAP", "TARAPOTO", "VOR/DME", "115.50 MHZ CH 102X", "063929S", "0762104W", None, "04\u00b0 W"),
        ("TRO", "TROMPETEROS", "VOR/DME", "114.80 MHZ CH 95X", "034810S", "0750303W", None, "05\u00b0 W"),
        ("TRU", "TRUJILLO", "DVOR/DME", "116.30 MHZ CH 110X", "080515S", "0790645W", None, "01\u00b0 W"),
        ("BES", "TUMBES", "VOR/DME", "112.90 MHZ CH 76X", "033240S", "0802321W", None, "02\u00b0 W"),
        ("URC", "URCOS", "VOR/DME", "115.60 MHZ CH 103X", "133858S", "0713511W", 14086, "05\u00b0 W"),
    ]
    
    navaids = {}
    for entry in navaid_data:
        ident = entry[0]
        lat, lon = dms_to_decimal(entry[4] + " " + entry[5])
        navaids[ident] = {
            "id": ident, "name": entry[1], "type": entry[2],
            "frequency": entry[3], "lat": lat, "lon": lon,
            "elevation": entry[6], "declination": entry[7],
        }
        print(f"  Navaid: {ident} - {entry[1]} ({entry[2]}) at {lat}, {lon}")
    
    print(f"\n  Total navaids: {len(navaids)}")
    return navaids

# ─── Step 2: Waypoints ──────────────────────────────────────────────────────

def parse_enr44():
    print("\n" + "=" * 60)
    print("STEP 2: Parsing ENR 4.4 - Waypoint Designators")
    print("=" * 60)
    
    with open(ENR44_FILE, "r", encoding="utf-8") as f:
        lines = f.read().split("\n")
    
    waypoints = {}
    skip_pats = [
        r"^AIP PER", r"^CORPAC", r"^ENR 4\.4", r"^Designador", r"^Name-code",
        r"^Coordinates", r"^Coordenadas", r"^Ruta ATS", r"^ATS Route",
        r"^Observaciones", r"^Remarks", r"^AMDT", r"^30 JUL", r"^\d$",
        r"^Name of", r"^Nombre de", r"^Identification", r"^Identificaci",
    ]
    
    content = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        skip = False
        for pat in skip_pats:
            if re.match(pat, line):
                skip = True
                break
        if not skip:
            content.append(line)
    
    i = 0
    pending_names = []
    
    while i < len(content):
        line = content[i]
        
        # Inline: NAME DDMMSSH DDDMMSSH
        m = re.match(r"^([A-Z]{3,6})\s+(\d{6}[NS]\s+\d{7}[EW])$", line)
        if m:
            name = m.group(1)
            lat, lon = dms_to_decimal(m.group(2))
            if lat is not None:
                waypoints[name] = {"id": name, "lat": lat, "lon": lon}
            pending_names = []
            i += 1
            continue
        
        # Standalone name
        if re.match(r"^[A-Z]{3,6}$", line):
            pending_names.append(line)
            i += 1
            continue
        
        # Single coord line: DDMMSSH DDDMMSSH
        m = re.match(r"^(\d{6}[NS]\s+\d{7}[EW])$", line)
        if m and pending_names:
            name = pending_names.pop(0)
            lat, lon = dms_to_decimal(m.group(1))
            if lat is not None:
                waypoints[name] = {"id": name, "lat": lat, "lon": lon}
            i += 1
            continue
        
        # Batch: multiple lat lines then multiple lon lines
        if re.match(r"^\d{6}[NS]$", line):
            lats = []
            j = i
            while j < len(content) and re.match(r"^\d{6}[NS]$", content[j]):
                lats.append(content[j])
                j += 1
            lons = []
            k = j
            while k < len(content) and re.match(r"^\d{7}[EW]$", content[k]):
                lons.append(content[k])
                k += 1
            
            if lats and lons and pending_names:
                count = min(len(lats), len(lons), len(pending_names))
                for idx in range(count):
                    name = pending_names.pop(0)
                    coord_str = lats[idx] + " " + lons[idx]
                    lat, lon = dms_to_decimal(coord_str)
                    if lat is not None:
                        waypoints[name] = {"id": name, "lat": lat, "lon": lon}
                i = k
                continue
            else:
                i = j
                continue
        
        # Split: lat on this line, lon on next
        m = re.match(r"^(\d{6}[NS])$", line)
        if m and pending_names and i + 1 < len(content) and re.match(r"^\d{7}[EW]$", content[i+1]):
            name = pending_names.pop(0)
            coord_str = content[i] + " " + content[i+1]
            lat, lon = dms_to_decimal(coord_str)
            if lat is not None:
                waypoints[name] = {"id": name, "lat": lat, "lon": lon}
            i += 2
            continue
        
        # Clear pending names if we hit non-name, non-coord content
        if not re.match(r"^\d", line) and not re.match(r"^\[", line):
            pending_names = []
        
        i += 1
    
    for name, wp in sorted(waypoints.items()):
        print(f"  Waypoint: {name} at {wp['lat']}, {wp['lon']}")
    
    print(f"\n  Total waypoints: {len(waypoints)}")
    return waypoints

# ─── Step 3: Airways ──────────────────────────────────────────────────────

def parse_airways_from_file(filepath, default_type, default_level):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.read().split("\n")
    
    # Clean lines - remove headers/footers/remarks
    skip_pats = [
        r"^AIP[- ]PER", r"^CORPAC", r"^ENR 3\.\d", r"^AIS[- ]PER",
        r"^Designador de ruta", r"^Nombre de puntos", r"^Coordenadas$",
        r"^Derrota MAG", r"^VOR RDL", r"^DIST$", r"^\(COP\)",
        r"^L.mite superior", r"^L.mite inferior", r"^Altitud m.nima",
        r"^Clasificaci", r"^espacio a.reo", r"^WID$", r"^NM$",
        r"^Sentido de", r"^direcci", r"^Impar$", r"^Par$",
        r"^Observaciones", r"^Dependencia de", r"^control$", r"^Frecuencia$",
        r"^AMDT", r"^\d{2}\s+(MAY|JUL|AUG|SEP|OCT|NOV|DEC)",
        r"^RUTAS ATS", r"^RUTAS DE NAVEGACION",
        r"^GNSS o IRU", r"^UNIDIRECCIONAL",
        r"^Ruta ATS delegada", r"^Fuera de",
        r"^Espacio a.reo Clase", r"^Sectores LIMA",
        r"^(Nor|Sur)-(uno|dos) radar", r"^Lima radar",
        r"^(Piura|Tumbes|Chiclayo|Trujillo|Iquitos|Pucallpa|Cusco|Juliaca|Arequipa|Tacna|Pisco|Chachapoyas|Andoas|Puerto) (TWR|APP|AFIS)",
        r"^\d{2}$", r"^\d+\.\d+\s*MHz",
        r"^Fuera del TMA", r"^Espacio aereo",
        r"^Zona (activada|permanentemente|activa)",
        r"^Permanently", r"^Zone activated", r"^Zona de",
        r"^Prohibido", r"^actividades",
        r"^Autoridad responsable",
        r"^Dependencia ATS",
        r"^Frecuencia (principal|alterna)",
        r"^Servicio ATS",
        r"^Reglas de operaci",
        r"^Mantener comunicaciones",
        r"^Toda aeronave",
        r"^Todo vuelo",
        r"^S.lo se permiten",
        r"^llevar activado",
        r"^Las aeronaves que",
        r"^Las rutas de vuelo",
        r"^La zona se activar",
        r"^Se emitir",
        r"^Las comunicaciones",
        r"^previa coordinaci",
        r"^ingresos con",
        r"^bajo coordinaci",
        r"^Corredor supers",
        r"^ING", r"^cir", r"^vuelos militares",
        r"^Unidireccional",
        r"^S.lo VFR",
    ]
    
    clean = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        skip = False
        for pat in skip_pats:
            if re.match(pat, s):
                skip = True
                break
        if not skip:
            clean.append(s)
    
    airways = []
    current_desig = None
    current_type = default_type
    current_level = default_level
    current_rnav = None
    wp_list = []      # (id, lat, lon)
    bd_list = []       # (fwd_mag, rev_mag, dist)
    fl_list = []       # (upper, lower)
    
    i = 0
    while i < len(clean):
        line = clean[i]
        
        # Airspace header
        if "ESPACIO A" in line and "SUPERIOR" in line:
            current_level = "UPPER"
            i += 1
            continue
        if "ESPACIO A" in line and "INFERIOR" in line:
            current_level = "LOWER"
            i += 1
            continue
        
        # Airway designator
        if is_airway_designator(line):
            if current_desig and wp_list:
                aw = build_airway(current_desig, current_type, current_level,
                                  current_rnav, wp_list, bd_list, fl_list)
                if aw:
                    airways.append(aw)
            
            m = re.match(r"^(.+?)\s*\((RNAV[\d]+(?:\s*-\s*RNP\d+)?)\)$", line)
            if m:
                current_desig = m.group(1).strip().replace(" ", "")
                current_rnav = m.group(2)
            else:
                current_desig = line.strip().replace(" ", "")
                current_rnav = None
            
            if current_desig.startswith("UV") and current_type == "CONVENTIONAL":
                current_level = "UPPER"
            elif len(current_desig) > 1 and current_desig[0] == "U" and current_desig[1] in "LMTWPBS":
                current_level = "UPPER"
            
            wp_list = []
            bd_list = []
            fl_list = []
            i += 1
            continue
        
        if not current_desig:
            i += 1
            continue
        
        # Navaid reference: "NAME TYPE (IDENT)"
        nm = re.match(r"^(.+?)\s+(VOR/DME|DVOR/DME|VOR|DME|NDB/MKR|NDB|TACAN)\s*(?:\(\d+[^\)]*\))?\s*\(([A-Z]{2,3})\)\s*$", line)
        if nm:
            ident = nm.group(3)
            lat, lon = None, None
            # Check for coord on next lines
            for j in range(i+1, min(i+4, len(clean))):
                if is_coordinate_line(clean[j]):
                    lat, lon = dms_to_decimal(clean[j])
                    i = j
                    break
                elif not re.match(r"^\d", clean[j]) and not re.match(r"^[A-Z]{3,6}$", clean[j]):
                    break
            wp_list.append((ident, lat, lon))
            i += 1
            continue
        
        # Waypoint with inline coordinate (DMS format)
        wm = re.match(r"^([A-Z]{3,6})\s+(.+[NS]\s*[-\u2013]\s*\d{3}.+[EW])$", line)
        if wm:
            name = wm.group(1)
            lat, lon = dms_to_decimal(wm.group(2))
            wp_list.append((name, lat, lon))
            i += 1
            continue
        
        # Waypoint with inline coordinate (compact)
        wm2 = re.match(r"^([A-Z]{3,6})\s+(\d{6}[NS]\s*[-\u2013]?\s*\d{7}[EW])$", line)
        if wm2:
            name = wm2.group(1)
            lat, lon = dms_to_decimal(wm2.group(2))
            wp_list.append((name, lat, lon))
            i += 1
            continue
        
        # Standalone waypoint name
        if re.match(r"^[A-Z]{3,6}$", line):
            name = line
            lat, lon = None, None
            for j in range(i+1, min(i+4, len(clean))):
                if is_coordinate_line(clean[j]):
                    lat, lon = dms_to_decimal(clean[j])
                    i = j
                    break
                else:
                    break
            wp_list.append((name, lat, lon))
            i += 1
            continue
        
        # Coordinate line (belongs to previous waypoint)
        if is_coordinate_line(line):
            if wp_list and wp_list[-1][1] is None:
                lat, lon = dms_to_decimal(line)
                wp_list[-1] = (wp_list[-1][0], lat, lon)
            i += 1
            continue
        
        # Bearing: NNN degrees
        bm = re.match(r"^(\d{1,3})[\xb0\u00ba]$", line)
        if bm:
            fwd = int(bm.group(1))
            rev = None
            dist = None
            j = i + 1
            if j < len(clean):
                rm = re.match(r"^(\d{1,3})[\xb0\u00ba]$", clean[j])
                if rm:
                    rev = int(rm.group(1))
                    j += 1
                if j < len(clean):
                    dm = re.match(r"^(\d+\.?\d*)\s*NM$", clean[j])
                    if dm:
                        dist = float(dm.group(1))
                        j += 1
            if rev is not None:
                bd_list.append((fwd, rev, dist))
            i = j if j > i + 1 else i + 1
            continue
        
        # Distance alone
        dm = re.match(r"^(\d+\.?\d*)\s*NM$", line)
        if dm and bd_list:
            fwd, rev, old_dist = bd_list[-1]
            if old_dist is None:
                bd_list[-1] = (fwd, rev, float(dm.group(1)))
            i += 1
            continue
        
        # FL limits
        flm = re.match(r"^([AGDF])\s+(FL\s*\d+|UNL|GND)$", line)
        if flm:
            upper = flm.group(1) + " " + flm.group(2)
            lower = None
            if i + 1 < len(clean):
                lm = re.match(r"^(FL\s*\d+|GND|MSL)$", clean[i+1])
                if lm:
                    lower = lm.group(1)
                    i += 1
            fl_list.append((upper, lower))
            i += 1
            continue
        
        fla = re.match(r"^(FL\s*\d+|UNL|GND)$", line)
        if fla:
            val = fla.group(1)
            if fl_list and fl_list[-1][1] is None:
                fl_list[-1] = (fl_list[-1][0], val)
            else:
                fl_list.append((val, None))
            i += 1
            continue
        
        i += 1
    
    # Save last airway
    if current_desig and wp_list:
        aw = build_airway(current_desig, current_type, current_level,
                          current_rnav, wp_list, bd_list, fl_list)
        if aw:
            airways.append(aw)
    
    return airways


def build_airway(designator, awy_type, awy_level, rnav_spec, wp_entries, bd_entries, fl_entries):
    segments = []
    n = len(wp_entries) - 1
    if n < 1:
        return None
    
    for si in range(n):
        w1_id, w1_lat, w1_lon = wp_entries[si]
        w2_id, w2_lat, w2_lon = wp_entries[si + 1]
        
        fwd_mag = rev_mag = dist = None
        if si < len(bd_entries):
            fwd_mag, rev_mag, dist = bd_entries[si]
        
        true_brng = true_rev = comp_dist = None
        if all(v is not None for v in [w1_lat, w1_lon, w2_lat, w2_lon]):
            true_brng, comp_dist = haversine_bearing(w1_lat, w1_lon, w2_lat, w2_lon)
            true_rev = round((true_brng + 180) % 360, 1) if true_brng else None
        
        upper_fl = lower_fl = None
        if si < len(fl_entries):
            upper_fl, lower_fl = fl_entries[si]
        elif fl_entries:
            upper_fl, lower_fl = fl_entries[0]
        
        max_fl = min_fl = None
        if upper_fl:
            fm = re.search(r"FL\s*(\d+)", str(upper_fl))
            if fm:
                max_fl = int(fm.group(1))
            elif "UNL" in str(upper_fl):
                max_fl = 999
        if lower_fl:
            fm = re.search(r"FL\s*(\d+)", str(lower_fl))
            if fm:
                min_fl = int(fm.group(1))
        
        actual_dist = dist if dist else comp_dist
        
        segments.append({
            "from": w1_id, "to": w2_id,
            "distance": actual_dist,
            "bearingMagnetic": fwd_mag,
            "bearingMagneticReverse": rev_mag,
            "trackTrue": true_brng,
            "reverseTrack": true_rev,
            "minFL": min_fl, "maxFL": max_fl,
            "fromLat": w1_lat, "fromLon": w1_lon,
            "toLat": w2_lat, "toLon": w2_lon,
        })
    
    result = {"designator": designator, "type": awy_type, "level": awy_level, "segments": segments}
    if rnav_spec:
        result["rnavSpec"] = rnav_spec
    return result

# ─── Step 4: Restricted Areas ──────────────────────────────────────────────

def parse_enr51():
    print("\n" + "=" * 60)
    print("STEP 4: Parsing ENR 5.1 - Restricted Areas")
    print("=" * 60)
    
    with open(ENR51_FILE, "r", encoding="utf-8") as f:
        text = f.read()
    
    areas = []
    area_starts = []
    for m in re.finditer(r"((?:SPP|SPR|SPD)(\d+\w*))\s+(.+)", text):
        area_starts.append((m.start(), m.group(1), m.group(3).strip()))
    
    for idx, (start_pos, identifier, name_start) in enumerate(area_starts):
        atype = "PROHIBITED" if identifier.startswith("SPP") else \
                "RESTRICTED" if identifier.startswith("SPR") else "DANGER"
        
        end_pos = area_starts[idx + 1][0] if idx + 1 < len(area_starts) else len(text)
        area_text = text[start_pos:end_pos]
        
        name = re.split(r"Desde|Circulo|Area bounded|Circular", name_start)[0].strip()
        if not name:
            name = identifier
        
        shape = coordinates = None
        
        # Circular
        cm = re.search(r"cent[et]r(?:o|e)\s+(?:en|on)\s+(\d{6}[NS])\s+(\d{7}[EW]).*?radio\s+de\s+([\d.]+)\s*(NM|KM)", area_text, re.IGNORECASE)
        if cm:
            shape = "CIRCLE"
            clat, clon = dms_to_decimal(cm.group(1) + " " + cm.group(2))
            coordinates = json.dumps({"center": {"lat": clat, "lon": clon}, "radius": float(cm.group(3)), "radiusUnit": cm.group(4)})
        else:
            # Polygon
            pts = re.findall(r"(\d{6}[NS])\s+(\d{7}[EW])", area_text)
            if pts:
                shape = "POLYGON"
                poly = []
                for ls, lo in pts:
                    lat, lon = dms_to_decimal(ls + " " + lo)
                    if lat is not None:
                        poly.append({"lat": lat, "lon": lon})
                coordinates = json.dumps(poly)
        
        # Upper/lower limits
        upper_limit = lower_limit = None
        for pat in [r"(UNL)", r"(FL\s*\d+)", r"(\d+\s*FT\s*AGL)", r"(\d+\s*FT\s*AMSL)"]:
            m = re.search(pat, area_text)
            if m and not upper_limit:
                upper_limit = m.group(1).strip()
                break
        
        if upper_limit:
            upos = area_text.find(upper_limit)
            rem = area_text[upos + len(upper_limit):]
            for pat in [r"(GND)", r"(MSL)", r"(FL\s*\d+)", r"(\d+\s*FT\s*AGL)", r"(\d+\s*FT\s*AMSL)"]:
                m = re.search(pat, rem)
                if m:
                    lower_limit = m.group(1).strip()
                    break
        
        areas.append({
            "identifier": identifier, "name": name, "type": atype,
            "shape": shape or "UNKNOWN", "coordinates": coordinates,
            "upperLimit": upper_limit, "lowerLimit": lower_limit,
        })
        print(f"  Area: {identifier} - {name} ({atype}, {shape}, {upper_limit}/{lower_limit})")
    
    print(f"\n  Total restricted areas: {len(areas)}")
    return areas

# ─── Main ──────────────────────────────────────────────────────────────────

def main():
    print("AIP Peru Official Data Parser V3")
    print("=" * 60)
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        current_data = json.load(f)
    
    old = {
        "navaids": len(current_data.get("navaids", [])),
        "waypoints": len(current_data.get("waypoints", [])),
        "conventional": len(current_data.get("airways", {}).get("conventional", [])),
        "rnav": len(current_data.get("airways", {}).get("rnav", [])),
        "restricted": len(current_data.get("restrictedAreas", [])),
    }
    print(f"Current data: {old}")
    
    navaids = parse_enr41()
    waypoints = parse_enr44()
    
    print("\n" + "=" * 60)
    print("STEP 3: Parsing Airways")
    print("=" * 60)
    
    aw31 = parse_airways_from_file(ENR31_FILE, "CONVENTIONAL", "LOWER")
    aw32 = parse_airways_from_file(ENR32_FILE, "CONVENTIONAL", "UPPER")
    aw33 = parse_airways_from_file(ENR33_FILE, "RNAV", "LOWER")
    
    print(f"  ENR 3.1: {len(aw31)} airways")
    print(f"  ENR 3.2: {len(aw32)} airways")
    print(f"  ENR 3.3: {len(aw33)} airways")
    
    all_airways = aw31 + aw32 + aw33
    print(f"  Total: {len(all_airways)} airways")
    
    restricted = parse_enr51()
    
    # ─── Build JSON ────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("STEP 5: Building Updated Data")
    print("=" * 60)
    
    # Master coordinates
    all_coords = {}
    for ident, nav in navaids.items():
        all_coords[ident] = {"lat": nav["lat"], "lon": nav["lon"]}
    for ident, wp in waypoints.items():
        all_coords[ident] = {"lat": wp["lat"], "lon": wp["lon"]}
    
    # Fill missing coordinates
    for airway in all_airways:
        for seg in airway["segments"]:
            if seg.get("fromLat") is None and seg["from"] in all_coords:
                seg["fromLat"] = all_coords[seg["from"]]["lat"]
                seg["fromLon"] = all_coords[seg["from"]]["lon"]
            if seg.get("toLat") is None and seg["to"] in all_coords:
                seg["toLat"] = all_coords[seg["to"]]["lat"]
                seg["toLon"] = all_coords[seg["to"]]["lon"]
            if seg.get("fromLat") and seg.get("toLat") and seg.get("trackTrue") is None:
                tb, cd = haversine_bearing(seg["fromLat"], seg["fromLon"], seg["toLat"], seg["toLon"])
                seg["trackTrue"] = tb
                seg["reverseTrack"] = round((tb + 180) % 360, 1) if tb else None
                if seg.get("distance") is None:
                    seg["distance"] = cd
    
    # Navaids list
    navaids_list = []
    for ident, nav in sorted(navaids.items()):
        navaids_list.append({
            "id": nav["id"], "name": nav["name"], "type": nav["type"],
            "frequency": nav["frequency"], "lat": nav["lat"], "lon": nav["lon"],
            "elevation": nav["elevation"],
        })
    
    # Waypoints list
    navaid_ids = set(navaids.keys())
    wps_list = []
    for ident, wp in sorted(waypoints.items()):
        if ident not in navaid_ids:
            wps_list.append({"id": wp["id"], "name": wp["id"], "type": "WAYPOINT", "lat": wp["lat"], "lon": wp["lon"]})
    
    # Missing waypoints from airways
    aw_ids = set()
    for aw in all_airways:
        for seg in aw["segments"]:
            aw_ids.add(seg["from"])
            aw_ids.add(seg["to"])
    
    known = navaid_ids | set(waypoints.keys())
    missing = aw_ids - known
    non_wp = {"UNL", "GND", "FL", "COP", "NM", "WID", "H24", "HJ"}
    missing -= non_wp
    
    for wid in sorted(missing):
        lat = lon = None
        for aw in all_airways:
            for seg in aw["segments"]:
                if seg["from"] == wid and seg.get("fromLat"):
                    lat, lon = seg["fromLat"], seg["fromLon"]
                    break
                if seg["to"] == wid and seg.get("toLat"):
                    lat, lon = seg["toLat"], seg["toLon"]
                    break
            if lat:
                break
        if lat and lon:
            wps_list.append({"id": wid, "name": wid, "type": "WAYPOINT", "lat": lat, "lon": lon})
            print(f"  Added missing waypoint: {wid}")
    
    # Build airway categories
    conv_aws = []
    rnav_aws = []
    
    for aw in all_airways:
        segs = []
        for seg in aw["segments"]:
            segs.append({
                "from": seg["from"], "to": seg["to"],
                "distance": seg.get("distance"),
                "bearing": seg.get("trackTrue"),
                "minFL": seg.get("minFL"), "maxFL": seg.get("maxFL"),
                "trackTrue": seg.get("trackTrue"),
                "reverseTrack": seg.get("reverseTrack"),
                "bearingMagnetic": seg.get("bearingMagnetic"),
                "bearingMagneticReverse": seg.get("bearingMagneticReverse"),
            })
        entry = {"designator": aw["designator"], "type": aw["type"], "level": aw["level"], "segments": segs}
        if aw.get("rnavSpec"):
            entry["rnavSpec"] = aw["rnavSpec"]
        (conv_aws if aw["type"] == "CONVENTIONAL" else rnav_aws).append(entry)
    
    def sort_key(aw):
        m = re.match(r"^([A-Z]+)(\d+)$", aw["designator"])
        if m:
            return (m.group(1), int(m.group(2)))
        return (aw["designator"], 0)
    
    conv_aws.sort(key=sort_key)
    rnav_aws.sort(key=sort_key)
    
    # Restricted areas
    ra_list = []
    for area in restricted:
        ra_list.append({
            "identifier": area["identifier"], "name": area["name"],
            "type": area["type"], "shape": area["shape"],
            "coordinates": area["coordinates"],
            "upperLimit": area["upperLimit"], "lowerLimit": area["lowerLimit"],
        })
    
    # Assemble
    updated = {
        "firBoundaries": current_data.get("firBoundaries", {}),
        "adjacentFirs": current_data.get("adjacentFirs", []),
        "navaids": navaids_list,
        "waypoints": wps_list,
        "airways": {"conventional": conv_aws, "rnav": rnav_aws},
        "restrictedAreas": ra_list,
    }
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    
    new = {
        "navaids": len(navaids_list),
        "waypoints": len(wps_list),
        "conventional": len(conv_aws),
        "rnav": len(rnav_aws),
        "restricted": len(ra_list),
    }
    
    print(f"\n" + "=" * 60)
    print("BEFORE/AFTER COMPARISON")
    print("=" * 60)
    for k in ["navaids", "waypoints", "conventional", "rnav", "restricted"]:
        print(f"  {k:>15}: {old.get(k, 0):>4} -> {new[k]:>4}")
    
    # Sample airways
    print("\n" + "=" * 60)
    print("SAMPLE AIRWAYS (3 with 3+ segments)")
    print("=" * 60)
    shown = 0
    for aw in conv_aws + rnav_aws:
        if len(aw["segments"]) >= 3 and shown < 3:
            print(f"\n  {aw['designator']} ({aw['type']}, {aw['level']}) - {len(aw['segments'])} segments")
            for seg in aw["segments"][:5]:
                d = f"{seg['distance']:.0f}NM" if seg.get("distance") else "?NM"
                t = f"{seg['trackTrue']:.0f}T" if seg.get("trackTrue") else "?T"
                m = f"{seg['bearingMagnetic']}M" if seg.get("bearingMagnetic") else "?M"
                fl = f"FL{seg.get('minFL', '?')}-FL{seg.get('maxFL', '?')}"
                print(f"    {seg['from']:>5} -> {seg['to']:<5}: {d:>6} {t:>5} {m:>5} {fl}")
            if len(aw["segments"]) > 5:
                print(f"    ... and {len(aw['segments'])-5} more segments")
            shown += 1
    
    # Warnings
    print("\n" + "=" * 60)
    print("WARNINGS")
    print("=" * 60)
    mc = sum(1 for aw in all_airways for seg in aw["segments"] if seg.get("fromLat") is None or seg.get("toLat") is None)
    md = sum(1 for aw in all_airways for seg in aw["segments"] if seg.get("distance") is None)
    if mc: print(f"  {mc} segments missing coordinates")
    if md: print(f"  {md} segments missing distances")
    
    # List all airway designators
    print("\n  Conventional airways:", [aw["designator"] for aw in conv_aws])
    print("  RNAV airways:", [aw["designator"] for aw in rnav_aws])
    
    print("\nDone!")

if __name__ == "__main__":
    main()
