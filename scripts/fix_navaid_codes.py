#!/usr/bin/env python3
"""
Fix navaid ICAO codes in airways-data.json based on official Peru AIP GEN 2.5 data.

Changes:
1. Rename 9 navaid codes throughout the entire file
2. Update frequency and type for existing navaids
3. Add 16 new navaids from AIP GEN 2.5
4. Add corresponding NAVAID-type waypoint entries
5. Update all airway segment references
"""

import json
import sys

INPUT_FILE = "/home/z/my-project/public/data/airways-data.json"

# Mapping of old navaid IDs to new official ICAO IDs
NAVAID_ID_MAP = {
    "LIM": "JCL",
    "PSO": "SCO",
    "AQP": "EQU",
    "TBP": "BES",
    "CIX": "CLA",
    "CUZ": "ZCO",
    "PCL": "PUL",
    "TCQ": "TCA",
    "PEM": "PDO",
}

# Corrected navaid data from AIP GEN 2.5
NAVAID_CORRECTIONS = {
    "JCL": {  # was LIM
        "id": "JCL",
        "name": "JORGE CHAVEZ",
        "type": "DVOR/DME",
        "frequency": "113.8 MHz",
        "lat": -12.0086,
        "lon": -77.1228,
        "elevation": 33
    },
    "SCO": {  # was PSO
        "id": "SCO",
        "name": "PISCO",
        "type": "VOR/DME",
        "frequency": "114.1 MHz",
        "lat": -13.7333,
        "lon": -76.2167,
        "elevation": 12
    },
    "EQU": {  # was AQP
        "id": "EQU",
        "name": "AREQUIPA",
        "type": "VOR/DME",
        "frequency": "113.7 MHz",
        "lat": -16.3419,
        "lon": -71.5833,
        "elevation": 2552
    },
    "BES": {  # was TBP
        "id": "BES",
        "name": "TUMBES",
        "type": "VOR/DME",
        "frequency": "112.9 MHz",
        "lat": -3.55,
        "lon": -80.3833,
        "elevation": 27
    },
    "CLA": {  # was CIX
        "id": "CLA",
        "name": "CHICLAYO",
        "type": "VOR/DME",
        "frequency": "114.9 MHz",
        "lat": -6.7858,
        "lon": -79.8225,
        "elevation": 28
    },
    "ZCO": {  # was CUZ
        "id": "ZCO",
        "name": "CUSCO",
        "type": "VOR/DME",
        "frequency": "114.9 MHz",
        "lat": -13.5358,
        "lon": -71.9425,
        "elevation": 3318
    },
    "PUL": {  # was PCL
        "id": "PUL",
        "name": "PUCALLPA",
        "type": "VOR/DME",
        "frequency": "116.7 MHz",
        "lat": -8.3781,
        "lon": -74.5725,
        "elevation": 149
    },
    "TCA": {  # was TCQ
        "id": "TCA",
        "name": "TACNA",
        "type": "VOR/DME",
        "frequency": "116.8 MHz",
        "lat": -18.0647,
        "lon": -70.2997,
        "elevation": 458
    },
    "PDO": {  # was PEM
        "id": "PDO",
        "name": "PTO MALDONADO",
        "type": "VOR/DME",
        "frequency": "116.1 MHz",
        "lat": -12.5983,
        "lon": -69.1967,
        "elevation": 207
    },
}

# New navaids to add from AIP GEN 2.5
NEW_NAVAIDS = [
    {"id": "BTE", "name": "CHIMBOTE", "type": "VOR", "frequency": "112.5 MHz", "lat": -7.0833, "lon": -78.5, "elevation": 23},
    {"id": "ILO", "name": "ILO", "type": "VOR", "frequency": "112.5 MHz", "lat": -17.6933, "lon": -71.3433, "elevation": 5},
    {"id": "TAP", "name": "TARAPOTO", "type": "VOR/DME", "frequency": "115.5 MHz", "lat": -6.475, "lon": -76.345, "elevation": 285},
    {"id": "TAL", "name": "TALARA", "type": "VOR", "frequency": "116.5 MHz", "lat": -4.5733, "lon": -81.2467, "elevation": 27},
    {"id": "URC", "name": "URCOS", "type": "VOR/DME", "frequency": "115.6 MHz", "lat": -13.7778, "lon": -71.6667, "elevation": 3123},
    {"id": "SLS", "name": "SALINAS", "type": "DVOR/DME", "frequency": "114.7 MHz", "lat": -11.9333, "lon": -77.0833, "elevation": 6},
    {"id": "AND", "name": "ANDAHUAYLAS", "type": "VOR/DME", "frequency": "114.3 MHz", "lat": -13.7597, "lon": -73.3503, "elevation": 3580},
    {"id": "LPA", "name": "LAS PALMAS", "type": "DVOR/DME", "frequency": "116.1 MHz", "lat": -12.05, "lon": -77.05, "elevation": 88},
    {"id": "MLV", "name": "MALVINAS", "type": "VOR/DME", "frequency": "114.9 MHz", "lat": -9.35, "lon": -76.15, "elevation": 350},
    {"id": "OAS", "name": "ANDOAS", "type": "VOR/DME", "frequency": "113.7 MHz", "lat": -2.8667, "lon": -76.3, "elevation": 185},
    {"id": "POY", "name": "CHACHAPOYAS", "type": "VOR/DME", "frequency": "114.5 MHz", "lat": -6.2031, "lon": -77.8158, "elevation": 2533},
    {"id": "PZA", "name": "PTO ESPERANZA", "type": "VOR", "frequency": "113.9 MHz", "lat": -10.6833, "lon": -73.3333, "elevation": 200},
    {"id": "SRV", "name": "SANTA ROSA", "type": "VOR", "frequency": "115.5 MHz", "lat": -8.0833, "lon": -79.1, "elevation": 20},
    {"id": "UAS", "name": "SIHUAS", "type": "VOR", "frequency": "112.5 MHz", "lat": -16.4333, "lon": -71.6333, "elevation": 3675},
    {"id": "TRO", "name": "TROMPETEROS", "type": "VOR/DME", "frequency": "113.5 MHz", "lat": -6.85, "lon": -75.8833, "elevation": 180},
    {"id": "ARI", "name": "ARICA", "type": "VOR/DME", "frequency": "114.9 MHz", "lat": -18.3464, "lon": -70.3336, "elevation": 56},
]


def replace_id_in_string(val, id_map):
    """Replace old navaid IDs in a string value."""
    if isinstance(val, str) and val in id_map:
        return id_map[val]
    return val


def main():
    # Read the JSON file
    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changes_count = {
        "navaids_renamed": 0,
        "navaids_updated": 0,
        "navaids_added": 0,
        "waypoints_updated": 0,
        "waypoints_added": 0,
        "airway_segments_updated": 0,
    }

    # =========================================================================
    # 1. UPDATE NAVAIDS ARRAY
    # =========================================================================
    print("\n=== Updating Navaids Array ===")
    new_navaids = []
    existing_ids = set()
    
    for navaid in data["navaids"]:
        old_id = navaid["id"]
        existing_ids.add(old_id)
        
        if old_id in NAVAID_ID_MAP:
            new_id = NAVAID_ID_MAP[old_id]
            # Use the corrected data from AIP
            if new_id in NAVAID_CORRECTIONS:
                corrected = NAVAID_CORRECTIONS[new_id]
                new_navaids.append(corrected)
                print(f"  RENAMED: {old_id} → {new_id} (type: {corrected['type']}, freq: {corrected['frequency']})")
                changes_count["navaids_renamed"] += 1
            else:
                # Just rename the ID
                navaid["id"] = new_id
                new_navaids.append(navaid)
                print(f"  RENAMED: {old_id} → {new_id} (no correction data)")
                changes_count["navaids_renamed"] += 1
        else:
            # Keep as-is (URA, JUL, IQT)
            new_navaids.append(navaid)
    
    # Add new navaids
    for new_navaid in NEW_NAVAIDS:
        if new_navaid["id"] not in existing_ids and new_navaid["id"] not in [n["id"] for n in new_navaids]:
            new_navaids.append(new_navaid)
            print(f"  ADDED: {new_navaid['id']} ({new_navaid['name']}, {new_navaid['type']}, {new_navaid['frequency']})")
            changes_count["navaids_added"] += 1
        else:
            print(f"  SKIP (already exists): {new_navaid['id']}")
    
    data["navaids"] = new_navaids

    # =========================================================================
    # 2. UPDATE WAYPOINTS ARRAY
    # =========================================================================
    print("\n=== Updating Waypoints Array ===")
    new_waypoints = []
    waypoint_ids = set()
    
    for wp in data["waypoints"]:
        old_id = wp["id"]
        
        # For NAVAID-type waypoints, update the ID and description
        if wp["type"] == "NAVAID" and old_id in NAVAID_ID_MAP:
            new_id = NAVAID_ID_MAP[old_id]
            wp["id"] = new_id
            wp["name"] = new_id
            # Update description to match new navaid name
            if new_id in NAVAID_CORRECTIONS:
                corrected = NAVAID_CORRECTIONS[new_id]
                wp["lat"] = corrected["lat"]
                wp["lon"] = corrected["lon"]
                wp["description"] = f"{corrected['name']} {corrected['type']} facility"
            print(f"  UPDATED waypoint: {old_id} → {new_id}")
            changes_count["waypoints_updated"] += 1
        
        waypoint_ids.add(wp["id"])
        new_waypoints.append(wp)
    
    # Add new NAVAID-type waypoints for both renamed and new navaids
    # All navaids that need waypoints
    all_navaid_waypoints = []
    
    # Renamed navaids (JCL, SCO, EQU, BES, CLA, ZCO, PUL, TCA, PDO)
    for old_id, new_id in NAVAID_ID_MAP.items():
        if new_id in NAVAID_CORRECTIONS:
            corrected = NAVAID_CORRECTIONS[new_id]
            all_navaid_waypoints.append({
                "id": new_id,
                "name": new_id,
                "type": "NAVAID",
                "lat": corrected["lat"],
                "lon": corrected["lon"],
                "description": f"{corrected['name']} {corrected['type']} facility"
            })
    
    # New navaids (BTE, ILO, TAP, TAL, URC, SLS, AND, LPA, MLV, OAS, POY, PZA, SRV, UAS, TRO, ARI)
    for new_navaid in NEW_NAVAIDS:
        all_navaid_waypoints.append({
            "id": new_navaid["id"],
            "name": new_navaid["id"],
            "type": "NAVAID",
            "lat": new_navaid["lat"],
            "lon": new_navaid["lon"],
            "description": f"{new_navaid['name']} {new_navaid['type']} facility"
        })
    
    # Add waypoints that don't already exist
    for wp in all_navaid_waypoints:
        if wp["id"] not in waypoint_ids:
            new_waypoints.append(wp)
            waypoint_ids.add(wp["id"])
            print(f"  ADDED waypoint: {wp['id']} ({wp['description']})")
            changes_count["waypoints_added"] += 1
        else:
            print(f"  SKIP waypoint (exists): {wp['id']}")
    
    data["waypoints"] = new_waypoints

    # =========================================================================
    # 3. UPDATE AIRWAY SEGMENTS
    # =========================================================================
    print("\n=== Updating Airway Segments ===")
    
    def update_segment_refs(segments):
        """Update from/to references in airway segments."""
        count = 0
        for seg in segments:
            if seg["from"] in NAVAID_ID_MAP:
                old = seg["from"]
                seg["from"] = NAVAID_ID_MAP[old]
                print(f"    from: {old} → {seg['from']}")
                count += 1
            if seg["to"] in NAVAID_ID_MAP:
                old = seg["to"]
                seg["to"] = NAVAID_ID_MAP[old]
                print(f"    to: {old} → {seg['to']}")
                count += 1
        return count
    
    # Update conventional airways
    for airway in data["airways"]["conventional"]:
        print(f"  Airway {airway['designator']}:")
        changes_count["airway_segments_updated"] += update_segment_refs(airway["segments"])
    
    # Update RNAV airways
    for airway in data["airways"]["rnav"]:
        print(f"  Airway {airway['designator']}:")
        changes_count["airway_segments_updated"] += update_segment_refs(airway["segments"])

    # =========================================================================
    # 4. VERIFY NO OLD IDS REMAIN
    # =========================================================================
    print("\n=== Verification: Checking for old IDs ===")
    json_str = json.dumps(data)
    old_ids_found = []
    for old_id in NAVAID_ID_MAP.keys():
        # Check if old ID appears as a value (not just as part of a longer string)
        import re
        # Look for the old ID as a standalone value in JSON
        # Match "from": "OLD", "to": "OLD", "id": "OLD", "name": "OLD"
        patterns = [
            f'"from":\\s*"{old_id}"',
            f'"to":\\s*"{old_id}"',
            f'"id":\\s*"{old_id}"',
            f'"name":\\s*"{old_id}"',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, json_str)
            if matches:
                old_ids_found.append(f"{old_id} found with pattern: {pattern}")
    
    if old_ids_found:
        print("  WARNING: Old IDs still found!")
        for finding in old_ids_found:
            print(f"    - {finding}")
    else:
        print("  OK: No old navaid IDs found in from/to/id/name fields.")

    # =========================================================================
    # 5. WRITE OUTPUT
    # =========================================================================
    print(f"\n=== Writing updated JSON to {INPUT_FILE} ===")
    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Validate the output is valid JSON
    print("Validating JSON...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        json.load(f)
    print("JSON is valid!")

    # =========================================================================
    # SUMMARY
    # =========================================================================
    print("\n=== SUMMARY ===")
    print(f"Navaids renamed: {changes_count['navaids_renamed']}")
    print(f"Navaids added: {changes_count['navaids_added']}")
    print(f"Waypoints updated: {changes_count['waypoints_updated']}")
    print(f"Waypoints added: {changes_count['waypoints_added']}")
    print(f"Airway segment refs updated: {changes_count['airway_segments_updated']}")
    print(f"Total navaids: {len(data['navaids'])}")
    print(f"Total waypoints: {len(data['waypoints'])}")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
