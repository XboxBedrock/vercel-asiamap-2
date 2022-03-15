const connection = require('../../mysql').getConnection();
//@ts-check

export default async (req, res) => {
    connection.query("SELECT city, region, subregion, count FROM regions;", async function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            const cities = new Map();
            const geoRegions = new Map();
            const subRegions = new Map();
            for (const region of results) {
                let cityCount = parseInt(region.count);
                let geoRCount = parseInt(region.count);
                let subRCount = parseInt(region.count);
                const city = region.city?.toLowerCase()?.trim() || "n/a";
                const georegion = region.region?.toLowerCase()?.trim() || "n/a";
                const subregion = region.subregion?.toLowerCase()?.trim() || "n/a";
                if (cities.has(city)) cityCount += cities.get(city);
                cities.set(city, cityCount)
                if (geoRegions.has(georegion)) geoRCount += geoRegions.get(georegion);
                geoRegions.set(georegion, geoRCount)
                if (subRegions.has(subregion)) subRCount += subRegions.get(subregion);
                subRegions.set(subregion, subRCount)
            }
            return res.json({cities: Object.fromEntries(cities), regions: Object.fromEntries(geoRegions), subregions: Object.fromEntries(subRegions)});
        } else {
            res.send("error: " + error)
        }


    })

}