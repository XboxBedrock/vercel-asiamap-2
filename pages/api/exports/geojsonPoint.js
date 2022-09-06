const wc = require('which-country');
const connection = require('../../../mysql').getConnection();
const rewind = require('@mapbox/geojson-rewind');

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function capitalizeFirstLetter(string) {
    return string.split("-").map((strin) => capitalize(strin).trim()).join("-");
}

const getCentroid2 = (arr) => {
    let twoTimesSignedArea = 0;
    let cxTimes6SignedArea = 0;
    let cyTimes6SignedArea = 0;

    let length = arr.length

    let x = function (i) { return arr[i % length][0] };
    let y = function (i) { return arr[i % length][1] };

    for ( let i = 0; i < arr.length; i++) {
        let twoSA = x(i)*y(i+1) - x(i+1)*y(i);
        twoTimesSignedArea += twoSA;
        cxTimes6SignedArea += (x(i) + x(i+1)) * twoSA;
        cyTimes6SignedArea += (y(i) + y(i+1)) * twoSA;
    }
    let sixSignedArea = 3 * twoTimesSignedArea;
    return [ cxTimes6SignedArea / sixSignedArea, cyTimes6SignedArea / sixSignedArea];
}

export default async (req, res) => {
    await connection.query("SELECT * FROM regions;", async function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            let geojson = {
                "type": "FeatureCollection",
                "features": []
            }
            for (const region of results) {
                const ring = [...JSON.parse(region.data).map(coord => coord.reverse()), JSON.parse(region.data)[0].reverse()];
                if (ring.length < 4) continue;
                const feature = {
                    "type": "Feature",
                    "properties": {
                        "username": region.username,
                        "userUuid": region.useruuid,
                        "regionType": region.useruuid === "EVENT"? "event": "normal",
                        "id": region.uid
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [ring]
                    }
                }
                const feature2 = {
                    "type": "Feature",
                    "properties": {
                        "username": region.username,
                        "userUuid": region.useruuid,
                        "regionType": region.useruuid === "EVENT"? "event": "normal",
                        "id": region.uid
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [...getCentroid2(JSON.parse(region.data))]
                    }
                }
                geojson.features.push(feature, feature2);
            }
            return await res.json(rewind(geojson, false));
        } else {
            await res.send("error: " + error)
        }


    })

}