const connection = require('../../../mysql').getConnection();
//@ts-check

function wc (region) {
    if (region["city"].split("-").length === 4) {
        return (region["city"].split(" - ")[1])?.toLowerCase()?.trim();
    }
    else if (region["city"].split("-").length === 3) {
        return (region["city"].split( "-")[1].toLowerCase())?.toLowerCase()?.trim();
    }
    else if (region["city"].split("-").length <= 2) {
        return (region["city"].split("-")[0].split("] ")[1])?.toLowerCase()?.trim();
    }
    else {
        return null;
    }
}

export default async (req, res) => {
    connection.query("SELECT city FROM regions;", async function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            const cities = new Map();
            for (const region of results) {
                let count = 1;
                if (region["city"].split(" - ").length === 4) {
                    if (!Number.isNaN(parseInt(region["city"].split(" - ")[3]))) {
                        count = parseInt(region["city"].split(" - ")[3]);
                    }
                }
                else if (region["city"].split(" - ").length === 3) {
                    if (!Number.isNaN(parseInt(region["city"].split(" - ")[2]))) {
                        count = parseInt(region["city"].split(" - ")[2]);
                    }
                }
                else if (region["city"].split(" - ").length === 2) {
                    if (!Number.isNaN(parseInt(region["city"].split(" - ")[1]))) {
                        count = parseInt(region["city"].split(" - ")[1]);
                    }
                }
                const city = wc(region);
                if (!city) continue;
                if (cities.has(city)) count += cities.get(city);
                cities.set(city, count)
            }
            return res.json(Object.fromEntries(cities));
        } else {
            res.send("error: " + error)
        }


    })

}