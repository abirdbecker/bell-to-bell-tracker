#!/usr/bin/env python3
"""
One-time: replace county-centroid pin coords with real locations.
Geocodes each school via OpenStreetMap Nominatim (district -> office/town,
standalone school -> the school). Updates public/data/schools.json IN PLACE and
prints a review table. Skips entries already hand-geocoded (HAND_SET).

Nominatim policy: <=1 req/sec, real User-Agent. ~40s for the full list.
"""
import json, re, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / "public" / "data" / "schools.json"
UA = "b2btracker-geocode/1.0 (abirdbecker@gmail.com)"
# Names whose coords were set by hand and should NOT be overwritten.
HAND_SET = ("Erie School District",)


def clean_town(t):
    if not t:
        return ""
    return re.sub(r"\(.*?\)", "", t).split(" and ")[0].strip()


def nominatim(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "limit": 1, "countrycodes": "us", "addressdetails": 1}
    )
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
    except Exception as e:
        return None
    if not data:
        return None
    top = data[0]
    disp = top.get("display_name", "")
    if "Pennsylvania" not in disp:
        return None
    return float(top["lat"]), float(top["lon"]), disp


def geocode(school):
    name, town = school["name"], clean_town(school.get("town"))
    queries = []
    if town:
        queries.append(f"{name}, {town}, Pennsylvania, USA")
        queries.append(f"{town}, Pennsylvania, USA")
    queries.append(f"{name}, Pennsylvania, USA")
    for q in queries:
        res = nominatim(q)
        time.sleep(1.1)
        if res:
            return res[0], res[1], res[2], q
    return None


def main():
    d = json.loads(P.read_text())
    rows = []
    for s in d["schools"]:
        if s["name"].startswith(HAND_SET):
            rows.append((s["name"], s["lat"], s["lng"], "HAND-SET (kept)"))
            continue
        g = geocode(s)
        if g:
            lat, lng, disp, q = g
            s["lat"], s["lng"] = round(lat, 4), round(lng, 4)
            short = ", ".join(disp.split(", ")[:3])
            rows.append((s["name"], s["lat"], s["lng"], short))
        else:
            rows.append((s["name"], s["lat"], s["lng"], "*** NO MATCH — kept old coords ***"))
    P.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print(f"{'SCHOOL':45} {'LAT':>8} {'LNG':>9}  MATCHED")
    for n, lat, lng, m in rows:
        print(f"{n[:44]:45} {lat:>8} {lng:>9}  {m}")


if __name__ == "__main__":
    main()
