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
    connection.query("SELECT * FROM regions;", async function (error, results, fields) {
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
                let regionName = `[${wc(JSON.parse(region.data)[0].reverse())}] `;
                if (region.region.toLowerCase() !== "n/a") {
                    regionName += capitalizeFirstLetter(region.region) + " - ";
                }
                if (region.subregion.toLowerCase() !== "n/a") {
                    regionName += capitalizeFirstLetter(region.subregion) + " - ";
                }
                if (region.city.toLowerCase() !== "n/a") {
                    regionName += capitalizeFirstLetter(region.city)
                }
                const ring = [...JSON.parse(region.data).map(coord => coord.reverse()), JSON.parse(region.data)[0].reverse()];
                if (ring.length < 4) continue;
                const feature = {
                    "type": "Feature",
                    "properties": {
                        "name": `${regionName} - ${region.count} - ${region.type}`,
                        "description": `By ${region.username}`,
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [ring]
                    }
                }
                geojson.features.push(feature);
            }
            return res.json(rewind(geojson, false));
        } else {
            res.send("error: " + error)
        }


    })

}