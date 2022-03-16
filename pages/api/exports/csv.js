const wc = require('which-country');
const connection = require('../../../mysql').getConnection();
const rewind = require('@mapbox/geojson-rewind');
const j2csv = require('json2csv');

export default async (req, res) => {
    connection.query("SELECT * FROM regions;", async function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            let csv = [];
            let count = 1;
            for (const region of results) {
                let regionName = ``;
                let country = wc(JSON.parse(region.data)[0].reverse());
                if (region.region.toLowerCase() !== "n/a") {
                    regionName += region.region.toLowerCase() + " ";
                }
                if (region.subregion.toLowerCase() !== "n/a") {
                    regionName += region.subregion.toLowerCase() + " ";
                }
                if (region.city.toLowerCase() !== "n/a") {
                    regionName += region.city.toLowerCase() 
                }
                const ring = [...JSON.parse(region.data).map(coord => coord.reverse()), JSON.parse(region.data)[0].reverse()];
                if (ring.length < 4) continue;
                const feature = {
                    fullRegion: regionName,
                    country: country,
                    region: region.region,
                    subregion: region.subregion,
                    city: region.city,
                    area: region.area,
                    buildings: region.count,
                }
                csv.push(feature)
                ++count;
            }
            const json2csv = new j2csv.Parser({field: ['fullRegion', 'country', 'region', 'subregion', 'city', 'area', 'buildings']});
            res.setHeader( 'content-type', 'text/csv; charset=utf-8' );
            return res.send(json2csv.parse(csv));
        } else {
            res.send("error: " + error)
        }


    })

}