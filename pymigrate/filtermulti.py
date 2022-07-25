import geojson
import json

with open("teamcis.geojson", encoding='utf8') as f:
    gj = geojson.load(f)
features = gj['features']
featuresnew = []

for i in features:
    if i['geometry']['type'] == 'Polygon':
        if len(i['geometry']['coordinates']) > 1:
            featuresnew.append(i)

gj['features'] = featuresnew
with open("regionsmulticis.json", "w", encoding='utf8') as f:
    json.dump(gj, f)
