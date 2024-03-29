const wc = require('which-country');
const connection = require('../../../mysql').getConnection();
const rewind = require('@mapbox/geojson-rewind');

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
function capitalizeFirstLetter(string) {
    return string.split("-").map((strin) => capitalize(strin).trim()).join("-");
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
                geojson.features.push(feature);
            }
            return await res.json(rewind(geojson, false));
        } else {
            await res.send("error: " + error)
        }


    })

}