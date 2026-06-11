#!/usr/bin/env python3
"""
Add 34 missing airways to airways-data.json.
These airways were missed by the original parser due to PDF page-break issues.
"""

import json
import math

JSON_PATH = "/home/z/my-project/public/data/airways-data.json"


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in NM and true bearing between two points."""
    R = 6371000  # Earth radius in meters
    NM = 1852    # 1 NM in meters

    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    dist_nm = (R * c) / NM

    y = math.sin(dlon) * math.cos(lat2_r)
    x = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlon)
    bearing = math.degrees(math.atan2(y, x))
    bearing = (bearing + 360) % 360

    return round(dist_nm, 1), round(bearing, 1)


def build_segment(from_id, to_id, coord_map, min_fl, max_fl, mag_fwd=None, mag_rev=None):
    lat1, lon1 = coord_map[from_id]
    lat2, lon2 = coord_map[to_id]
    dist, bearing = haversine(lat1, lon1, lat2, lon2)
    reverse = (bearing + 180) % 360

    return {
        "from": from_id,
        "to": to_id,
        "distance": dist,
        "bearing": bearing,
        "minFL": min_fl,
        "maxFL": max_fl,
        "trackTrue": bearing,
        "reverseTrack": reverse,
        "bearingMagnetic": mag_fwd if mag_fwd is not None else round(bearing),
        "bearingMagneticReverse": mag_rev if mag_rev is not None else round(reverse),
    }


def build_airway(designator, airway_type, level, waypoint_seq, coord_map,
                 min_fl, max_fl, mag_bearings=None, rnav_spec=None):
    segments = []
    for i in range(len(waypoint_seq) - 1):
        mag_fwd = mag_rev = None
        if mag_bearings and i < len(mag_bearings):
            mag_fwd, mag_rev = mag_bearings[i]
        segments.append(build_segment(waypoint_seq[i], waypoint_seq[i + 1],
                                      coord_map, min_fl, max_fl, mag_fwd, mag_rev))

    airway = {
        "designator": designator,
        "type": airway_type,
        "level": level,
        "segments": segments,
    }
    if rnav_spec:
        airway["rnavSpec"] = rnav_spec
    return airway


# ── Load ──────────────────────────────────────────────────────
with open(JSON_PATH) as f:
    data = json.load(f)

coord_map = {}
for w in data["waypoints"]:
    coord_map[w["id"]] = (w["lat"], w["lon"])
for n in data["navaids"]:
    coord_map[n["id"]] = (n["lat"], n["lon"])

existing_conv = {aw["designator"] for aw in data["airways"]["conventional"]}
existing_rnav = {aw["designator"] for aw in data["airways"]["rnav"]}

new_conventional = []
new_rnav = []

# ════════════════════════════════════════════════════════════════
# V-Routes  (ENR 3.1 – Conventional, LOWER)
# ════════════════════════════════════════════════════════════════

new_conventional.append(build_airway(
    "V5", "CONVENTIONAL", "LOWER",
    ["IQT", "RONSO", "IKARO", "TAP", "UTKIK", "RELOR", "MANPA", "VATES", "TRU"],
    coord_map, 80, 240,
    mag_bearings=[(234, 53), (233, 51), (231, 51), (247, 66),
                  (246, 66), (246, 65), (245, 65), (245, 65)],
))

new_conventional.append(build_airway(
    "V10", "CONVENTIONAL", "LOWER",
    ["ZCO", "URC", "CEMIL", "PDO"],
    coord_map, 80, 240,
    mag_bearings=[(113, 294), (72, 253), (73, 254)],
))

new_conventional.append(build_airway(
    "V11", "CONVENTIONAL", "LOWER",
    ["AND", "TILPA", "URC", "ILMOX", "JUL"],
    coord_map, 80, 240,
    mag_bearings=[(93, 273), (93, 274), (149, 329), (149, 329)],
))

# ════════════════════════════════════════════════════════════════
# T-Routes  (ENR 3.3 Lower – RNAV, LOWER)
# ════════════════════════════════════════════════════════════════

# T234  OAS → OSUBU → PUNUD → VUKOK → TAP   (ENR 3.3 line 619)
new_rnav.append(build_airway(
    "T234", "RNAV", "LOWER",
    ["OAS", "OSUBU", "PUNUD", "VUKOK", "TAP"],
    coord_map, 130, 240,
    mag_bearings=[(146, 327), (190, 10), (190, 10), (190, 9)],
    rnav_spec="RNAV5",
))

# T244  ESKOM → BODET → ARPIR → LIVAT  (not in PDF, from task/ENR 4.4)
new_rnav.append(build_airway(
    "T244", "RNAV", "LOWER",
    ["ESKOM", "BODET", "ARPIR", "LIVAT"],
    coord_map, 145, 275,
    rnav_spec="RNAV5",
))

# T311  IQT → KALAR → ILROL → TOKAN → LODIN → RONSO  (task/ENR 4.4)
new_rnav.append(build_airway(
    "T311", "RNAV", "LOWER",
    ["IQT", "KALAR", "ILROL", "TOKAN", "LODIN", "RONSO"],
    coord_map, 80, 240,
    rnav_spec="RNAV5",
))

# T319  JCL → DARKI → PAKOL → POVLO  (ENR 3.3 line 1329)
new_rnav.append(build_airway(
    "T319", "RNAV", "LOWER",
    ["JCL", "DARKI", "PAKOL", "POVLO"],
    coord_map, 210, 240,
    rnav_spec="RNAV5",
))

# T327  IBARE → COCOS → ILROL → KALAR → REPUL  (task/ENR 4.4)
new_rnav.append(build_airway(
    "T327", "RNAV", "LOWER",
    ["IBARE", "COCOS", "ILROL", "KALAR", "REPUL"],
    coord_map, 80, 240,
    rnav_spec="RNAV5",
))

# T333  AND → EKUVA → ROKOP → PALUK  (ENR 3.3 line 1819)
new_rnav.append(build_airway(
    "T333", "RNAV", "LOWER",
    ["AND", "EKUVA", "ROKOP", "PALUK"],
    coord_map, 170, 240,
    rnav_spec="RNAV5",
))

# ════════════════════════════════════════════════════════════════
# UL / UM / UP Routes  (ENR 3.3 Upper – RNAV, UPPER)
# ════════════════════════════════════════════════════════════════

# UL342  PLG → ANDID → UMSOK → TAP → NENER → ILROL → KALAR  (ENR 3.3 line 2651)
new_rnav.append(build_airway(
    "UL342", "RNAV", "UPPER",
    ["PLG", "ANDID", "UMSOK", "TAP", "NENER", "ILROL", "KALAR"],
    coord_map, 250, 600,
    mag_bearings=[(200, 19), (199, 19), (199, 18), (198, 17), (197, 16), (198, 17)],
    rnav_spec="RNAV5",
))

# UM784  VUMPU → ISIDI  (ENR 3.3 line 3767)
new_rnav.append(build_airway(
    "UM784", "RNAV", "UPPER",
    ["VUMPU", "ISIDI"],
    coord_map, 250, 600,
    rnav_spec="RNAV5",
))

# UP408  KABAG → VUKOK → KOTKU → PUGUP → PUL → ERINI → NILSA → ANKUG → TOMIX → JUL → VURUS
# (ENR 3.3 line 4090)
new_rnav.append(build_airway(
    "UP408", "RNAV", "UPPER",
    ["KABAG", "VUKOK", "KOTKU", "PUGUP", "PUL", "ERINI", "NILSA",
     "ANKUG", "TOMIX", "JUL", "VURUS"],
    coord_map, 250, 600,
    mag_bearings=[(159, 339), (156, 336), (156, 336), (156, 336),
                  (155, 335), (155, 335), (155, 335), (152, 333),
                  (155, 335), (154, 334)],
    rnav_spec="RNAV5",
))

# UP525  PUPAS → REMEX  (ENR 3.3 line 4182)
new_rnav.append(build_airway(
    "UP525", "RNAV", "UPPER",
    ["PUPAS", "REMEX"],
    coord_map, 250, 600,
    mag_bearings=[(167, 347)],
    rnav_spec="RNAV5",
))

# UP673  ILO → ISLOD → ORALO → OGMAS  (ENR 3.3 line 4242)
new_rnav.append(build_airway(
    "UP673", "RNAV", "UPPER",
    ["ILO", "ISLOD", "ORALO", "OGMAS"],
    coord_map, 250, 600,
    mag_bearings=[(82, 263), (83, 263)],
    rnav_spec="RNAV5",
))

# UP776  ANDID → ILMUX → KOTKU → ORETO → POSKA → LODIN → ILROL → KALAR  (ENR 3.3 line 4291)
new_rnav.append(build_airway(
    "UP776", "RNAV", "UPPER",
    ["ANDID", "ILMUX", "KOTKU", "ORETO", "POSKA", "LODIN", "ILROL", "KALAR"],
    coord_map, 250, 600,
    mag_bearings=[(217, 36), (216, 36), (215, 33), (213, 33),
                  (213, 32), (212, 31), (198, 17)],
    rnav_spec="RNAV5",
))

# ════════════════════════════════════════════════════════════════
# UT Routes  (ENR 3.3 Upper – RNAV, UPPER)
# ════════════════════════════════════════════════════════════════

# UT218  JCL → ILPIP → LOKEB → BODET → ANKUG → ETEBA → ANBON → PDO  (ENR 3.3 line 4388)
new_rnav.append(build_airway(
    "UT218", "RNAV", "UPPER",
    ["JCL", "ILPIP", "LOKEB", "BODET", "ANKUG", "ETEBA", "ANBON", "PDO"],
    coord_map, 250, 600,
    mag_bearings=[(96, 277), (97, 277), (97, 278), (100, 281),
                  (101, 281), (101, 282), (102, 283)],
    rnav_spec="RNAV5",
))

# UT222  AKSOL → KOSKO → DIKOS → ASUPA → EQU  (ENR 3.3 line 4444)
new_rnav.append(build_airway(
    "UT222", "RNAV", "UPPER",
    ["AKSOL", "KOSKO", "DIKOS", "ASUPA", "EQU"],
    coord_map, 250, 600,
    mag_bearings=[(136, 316), (136, 317), (129, 309), (122, 302)],
    rnav_spec="RNAV5",
))

# UT224  JCL → ASOXI → SCO → ESIRA → ISOKI → MIGEB → ILO → TCA  (ENR 3.3 line 4508)
new_rnav.append(build_airway(
    "UT224", "RNAV", "UPPER",
    ["JCL", "ASOXI", "SCO", "ESIRA", "ISOKI", "MIGEB", "ILO", "TCA"],
    coord_map, 250, 600,
    mag_bearings=[(148, 328), (161, 341), (137, 317), (138, 318),
                  (128, 309), (129, 309), (115, 296)],
    rnav_spec="RNAV5",
))

# UT226  MLV → ASEMO → OGNUM → MONKU → ALDAL → JCL  (ENR 3.3 line 4585)
new_rnav.append(build_airway(
    "UT226", "RNAV", "UPPER",
    ["MLV", "ASEMO", "OGNUM", "MONKU", "ALDAL", "JCL"],
    coord_map, 250, 600,
    mag_bearings=[(295, 115), (277, 97), (272, 91), (271, 91), (256, 75)],
    rnav_spec="RNAV5",
))

# UT234  OAS → OSUBU → PUNUD → VUKOK → TAP  (ENR 3.3 line 4664)
new_rnav.append(build_airway(
    "UT234", "RNAV", "UPPER",
    ["OAS", "OSUBU", "PUNUD", "VUKOK", "TAP"],
    coord_map, 250, 600,
    mag_bearings=[(146, 327), (190, 10), (190, 10), (190, 9)],
    rnav_spec="RNAV5",
))

# UT313  PUL → COCOS → PADIS → RENON → LUVSO → MIKAR  (ENR 3.3 line 4723)
new_rnav.append(build_airway(
    "UT313", "RNAV", "UPPER",
    ["PUL", "COCOS", "PADIS", "RENON", "LUVSO", "MIKAR"],
    coord_map, 250, 600,
    mag_bearings=[(242, 62), (211, 31), (211, 30), (214, 34), (214, 34)],
    rnav_spec="RNAV5",
))

# UT315  PUL → MIKAR → DALGI → VADOS → OPROS → JCL  (ENR 3.3 line 4807)
new_rnav.append(build_airway(
    "UT315", "RNAV", "UPPER",
    ["PUL", "MIKAR", "DALGI", "VADOS", "OPROS", "JCL"],
    coord_map, 250, 600,
    mag_bearings=[(213, 33), (215, 35), (215, 34), (227, 47), (227, 46)],
    rnav_spec="RNAV5",
))

# UT317  JCL → OPROS → IRESO → ROGAT → PUMAS  (ENR 3.3 line 4851)
new_rnav.append(build_airway(
    "UT317", "RNAV", "UPPER",
    ["JCL", "OPROS", "IRESO", "ROGAT", "PUMAS"],
    coord_map, 250, 600,
    mag_bearings=[(46, 227), (92, 272), (92, 273), (97, 277)],
    rnav_spec="RNAV5",
))

# UT321  JCL → PEROV → UDENI → ITARA → GAXUN → URC  (ENR 3.3 line 4940)
new_rnav.append(build_airway(
    "UT321", "RNAV", "UPPER",
    ["JCL", "PEROV", "UDENI", "ITARA", "GAXUN", "URC"],
    coord_map, 250, 600,
    mag_bearings=[(109, 289), (106, 287), (107, 288), (108, 288), (121, 301)],
    rnav_spec="RNAV5",
))

# UT323  SCO → ESOGO → VUPKO → SIMEL → UAS → EQU  (ENR 3.3 line 4984)
new_rnav.append(build_airway(
    "UT323", "RNAV", "UPPER",
    ["SCO", "ESOGO", "VUPKO", "SIMEL", "UAS", "EQU"],
    coord_map, 250, 600,
    mag_bearings=[(129, 309), (129, 310), (130, 310), (100, 280), (92, 272)],
    rnav_spec="RNAV5",
))

# UT327  PUL → COCOS → IBARE  (ENR 3.3 line 5064)
new_rnav.append(build_airway(
    "UT327", "RNAV", "UPPER",
    ["PUL", "COCOS", "IBARE"],
    coord_map, 250, 600,
    mag_bearings=[(242, 62), (242, 61)],
    rnav_spec="RNAV5",
))

# UT330  TRU → RELUN → MARBA → ROBIG → POY  (ENR 3.3 line 5142)
new_rnav.append(build_airway(
    "UT330", "RNAV", "UPPER",
    ["TRU", "RELUN", "MARBA", "ROBIG", "POY"],
    coord_map, 250, 600,
    rnav_spec="RNAV5",
))

# UT331  VAKUD → KOMLA → CLA  (ENR 3.3 line 5129)
new_rnav.append(build_airway(
    "UT331", "RNAV", "UPPER",
    ["VAKUD", "KOMLA", "CLA"],
    coord_map, 250, 600,
    rnav_spec="RNAV5",
))

# UT332  PUMSA → LOMOL → URAPA → UROLO → UDENI → PEROV  (ENR 3.3 line 5193)
new_rnav.append(build_airway(
    "UT332", "RNAV", "UPPER",
    ["PUMSA", "LOMOL", "URAPA", "UROLO", "UDENI", "PEROV"],
    coord_map, 250, 600,
    mag_bearings=[(281, 100), (280, 99), (279, 98), (278, 98), (287, 106)],
    rnav_spec="RNAV5",
))

# UT333  AND → PALUK → EKUVA → ROKOP → SCO  (ENR 3.3 line 5261)
new_rnav.append(build_airway(
    "UT333", "RNAV", "UPPER",
    ["AND", "PALUK", "EKUVA", "ROKOP", "SCO"],
    coord_map, 250, 600,
    mag_bearings=[(274, 93), (273, 93), (273, 93), (273, 92)],
    rnav_spec="RNAV5",
))

# UT334  SCO → KOSKO → LIXIT → VUPUD → POVLO  (ENR 3.3 line 5299)
new_rnav.append(build_airway(
    "UT334", "RNAV", "UPPER",
    ["SCO", "KOSKO", "LIXIT", "VUPUD", "POVLO"],
    coord_map, 250, 600,
    mag_bearings=[(76, 256), (76, 257), (77, 257), (77, 257)],
    rnav_spec="RNAV5",
))

# UT335  FANES → MULMA → UROKU → ARPIR → VUPAM → ANKUG → URAPA → URC  (task / existing T335)
new_rnav.append(build_airway(
    "UT335", "RNAV", "UPPER",
    ["FANES", "MULMA", "UROKU", "ARPIR", "VUPAM", "ANKUG", "URAPA", "URC"],
    coord_map, 250, 600,
    rnav_spec="RNAV5",
))

# UT336  ASOXI → REKEM → VUPUD → AND  (ENR 3.3 line 5427)
new_rnav.append(build_airway(
    "UT336", "RNAV", "UPPER",
    ["ASOXI", "REKEM", "VUPUD", "AND"],
    coord_map, 250, 600,
    mag_bearings=[(110, 290), (110, 290), (110, 291)],
    rnav_spec="RNAV5",
))

# UT337  ISOKI → TOROK → SIMEL → UAS  (ENR 3.3 line 5458)
new_rnav.append(build_airway(
    "UT337", "RNAV", "UPPER",
    ["ISOKI", "TOROK", "SIMEL", "UAS"],
    coord_map, 250, 600,
    mag_bearings=[(99, 280), (100, 280), (100, 280)],
    rnav_spec="RNAV5",
))

# ── Add & dedup ───────────────────────────────────────────────
added_conv = 0
added_rnav = 0
skipped = []

for aw in new_conventional:
    if aw["designator"] not in existing_conv:
        data["airways"]["conventional"].append(aw)
        added_conv += 1
        print(f"  + CONV  {aw['designator']:8s}  {len(aw['segments'])} segments")
    else:
        skipped.append(aw["designator"])
        print(f"  SKIP    {aw['designator']} (already exists)")

for aw in new_rnav:
    if aw["designator"] not in existing_rnav:
        data["airways"]["rnav"].append(aw)
        added_rnav += 1
        print(f"  + RNAV  {aw['designator']:8s}  {len(aw['segments'])} segments")
    else:
        skipped.append(aw["designator"])
        print(f"  SKIP    {aw['designator']} (already exists)")

data["airways"]["conventional"].sort(key=lambda x: x["designator"])
data["airways"]["rnav"].sort(key=lambda x: x["designator"])

with open(JSON_PATH, "w") as f:
    json.dump(data, f, indent=2)

print(f"\n{'='*50}")
print(f"Added : {added_conv} conventional + {added_rnav} RNAV = {added_conv + added_rnav}")
print(f"Skipped: {skipped or 'none'}")
print(f"Totals : {len(data['airways']['conventional'])} conv, {len(data['airways']['rnav'])} rnav")
