import geojson
from area import area
import math
import uuid
import time 
import csv
with open('usernames.csv', newline='', encoding="utf8") as csvfile:
    usernamesrdr = csv.reader(csvfile)
    usernames = {rows[0]:rows[1].strip() for rows in usernamesrdr}

with open("teamcis.geojson", encoding='utf8') as f:
    gj = geojson.load(f)
features = gj['features']

sql = ""

def wcity (region):

    georegion = "N/A"
    subregion = "N/A"
    city = "N/A"
    
    split = region.split("-")
    if len(split) >= 5:
        split = region.split(" - ")
    split.reverse()
    
    count = 1
    try:
        count = int(split[0].strip())
        split.pop(0)
        split.reverse()
    except:
        split.reverse()
    
    if len(split) == 3:
        split2=split[0].split("] ")
        if (len(split2) == 2):
            georegion = (split2[1]).strip()
        else:
            georegion = ((split2[0])).strip()
        subregion = (split[1]).strip()
        city = (split[2]).strip()
    elif (len(split) == 2):
        split2=split[0].split("] ")
        if (len(split2) == 2):
            georegion = (split2[1]).strip()
        else:
            georegion = ((split2[0])).strip()
        city = (split[1]).strip()
    elif (len(split) <= 1):
        split2=split[0].split("] ")
        if (len(split2) == 2):
            city = (split2[1]).strip()
        else:
            city = ((split2[0])).strip()
    else:
        print(region)
    return [city[0:254].replace('\n', ''), count, georegion[0:254].replace('\n', ''), subregion[0:254].replace('\n', '')]

def transformUsername(username):
    return usernames.get(username.strip().lstrip("@"), username.strip().lstrip("@"))
    


for i in features:
    if i['geometry']['type'] == 'MultiPolygon':
        first = True
        for k in i['geometry']['coordinates']:
            createdDate = time.strftime('%Y-%m-%d %H:%M:%S')
            username = "n/a"
            oldData = k
            count = 1
            region = "N/A"
            subregion = "N/A"
            data = []
            for j in range(len(oldData[0])):
                data.append([oldData[0][j][1], oldData[0][j][0]])
            city = 'N/A'
            count = 1
            region = 'N/A'
            subregion = 'N/A'
            buildType = "N/A"
            size = math.floor(area(i['geometry']))
            useruuid = "8667ba71-b85a-4004-af54-457a9734eed7"

            if 'description' in i['properties'].keys():
                username = transformUsername(i['properties']['description'][0:254].lstrip("by ").replace('\n', ''))
                
            if username == '': username = "N/A"
                
            if 'name' in i['properties'].keys():
                city, count, region, subregion = wcity(i['properties']['name'])

            if region.lower() == "Санкт".lower() or subregion.lower() == "Петербург".lower():
                region = "N/A"
                subregion = "Санкт-Петербург"
            
            if city.lower() == "Поле".lower():
                buildType = "D"
            if city.lower() == "Лес".lower():
                buildType = "F"
            if city.lower() == "Водоем".lower():
                buildType = "W"
                
            if not first:
                count=0
            
            sql += f"INSERT INTO `regions` (`uid`, `createdDate`, `username`, `data`, `city`, `area`, `useruuid`, `count`, `region`, `subregion`, `type`) VALUES ('{uuid.uuid4()}', '{createdDate}', '{username}', '{data}', '{city}', {size}, '{useruuid}', {count}, '{region}', '{subregion}', '{buildType}');"
            sql += "\n"
            first = False
    if i['geometry']['type'] == 'Polygon':
        createdDate = time.strftime('%Y-%m-%d %H:%M:%S')
        username = 'N/A'
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
        useruuid = "8667ba71-b85a-4004-af54-457a9734eed7"

        if 'description' in i['properties'].keys():
            username = transformUsername(i['properties']['description'][0:254].lstrip("by ").replace('\n', ''))
        if username == '': username = "N/A"
            
        if 'name' in i['properties'].keys():
            city, count, region, subregion = wcity(i['properties']['name'])

        if region.lower() == "Санкт".lower() or subregion.lower() == "Петербург".lower():
            region = "N/A"
            subregion = "Санкт-Петербург"
        
        if city.lower() == "Поле".lower():
            buildType = "D"
        if city.lower() == "Лес".lower():
            buildType = "F"
        if city.lower() == "Водоем".lower():
            buildType = "W"
            
        
        sql += f"INSERT INTO `regions` (`uid`, `createdDate`, `username`, `data`, `city`, `area`, `useruuid`, `count`, `region`, `subregion`, `type`) VALUES ('{uuid.uuid4()}', '{createdDate}', '{username}', '{data}', '{city}', {size}, '{useruuid}', {count}, '{region}', '{subregion}', '{buildType}');"
        sql += "\n"
        
with open("regions.sql", "w", encoding='utf8') as f:
    f.write(sql)