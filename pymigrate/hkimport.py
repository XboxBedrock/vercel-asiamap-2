import geojson
from area import area
import math
import uuid
import time 

with open("hkmu.geojson", encoding='utf8') as f:
    gj = geojson.load(f)
features = gj['features']

sql = ""


for i in features:
    if i['geometry']['type'] != 'Polygon':
        continue
    else:
        
        createdDate = time.strftime('%Y-%m-%d %H:%M:%S')
        username = 'HKMU'
        oldData = i['geometry']['coordinates']
        data = []
        for j in range(len(oldData[0])):
            data.append([oldData[0][j][1], oldData[0][j][0]])
        city = 'N/A'
        count = 1
        region = 'N/A'
        subregion = 'N/A'
        buildType = "N/A"
        size = math.floor(area(i['geometry']))
        useruuid = "ec561538-f3fd-461d-aff5-086b22154bce"

        if 'description' in i['properties'].keys() and i['properties']['description'] != None:
            city = i['properties']['description'].replace("'" , "\''")
            
        if 'Name' in i['properties'].keys():
            username = i['properties']['Name'].replace("'" , "\''")
            
        
        sql += f"INSERT INTO `regions` (`uid`, `createdDate`, `username`, `data`, `city`, `area`, `useruuid`, `count`, `region`, `subregion`, `type`) VALUES ('{uuid.uuid4()}', '{createdDate}', '{username}', '{data}', '{city}', {size}, '{useruuid}', {count}, '{region}', '{subregion}', '{buildType}');"
        sql += "\n"
        
with open("regions_hkmu.sql", "w", encoding='utf8') as f:
    f.write(sql)