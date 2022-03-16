const wc = require('which-country');
const connection = require('../../../mysql').getConnection();
const rewind = require('@mapbox/geojson-rewind');

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
                    regionName += region.region.toLowerCase() + " - ";
                }
                if (region.subregion.toLowerCase() !== "n/a") {
                    regionName += region.subregion.toLowerCase() + " - ";
                }
                if (region.city.toLowerCase() !== "n/a") {
                    regionName += region.city.toLowerCase() 
                }
                const ring = [...JSON.parse(region.data).map(coord => coord.reverse()), JSON.parse(region.data)[0].reverse()];
                if (ring.length < 4) continue;
                const feature = {
                    "type": "Feature",
                    "properties": {
                        "name": `${regionName} - ${region.area} - ${region.count} - ${region.type} - ${region.username}`,
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