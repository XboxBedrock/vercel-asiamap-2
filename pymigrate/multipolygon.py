import geojson
from area import area
import math
import uuid
import time 

with open("teamcis.geojson", encoding='utf8') as f:
    gj = geojson.load(f)
features = gj['features']

sql = ""

for i in features:
    if i['geometry']['type'] != 'MultiPolygon':
        continue
    else:
        for k in i['geometry']['coordinates']:
            createdDate = time.strftime('%Y-%m-%d %H:%M:%S')
            username = "n/a"
            oldData = k
            data = []
            for j in range(len(oldData[0])):
                data.append([oldData[0][j][1], oldData[0][j][0]])
            city = "n/a"
            size = math.floor(area(i['geometry']))
            useruuid = "8667ba71-b85a-4004-af54-457a9734eed7"

            if 'description' in i['properties'].keys():
                username = i['properties']['description'][0:254].lstrip("by ").replace('\n', '')
            elif 'name' in i['properties'].keys():
                username = i['properties']['name'][0:254].replace('\n', '')
                
            if 'name' in i['properties'].keys():
                city = i['properties']['name'][0:254].replace('\n', '')
                
            sql += f"INSERT INTO `regions` (`uid`, `createdDate`, `username`, `data`, `city`, `area`, `useruuid`) VALUES ('{uuid.uuid4()}', '{createdDate}', '{username}', '{data}', '{city}', {size}, '{useruuid}');"
            sql += "\n"
        
with open("regions_2.sql", "w", encoding='utf8') as f:
    f.write(sql)