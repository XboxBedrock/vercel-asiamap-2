const wc = require('which-country');
const connection = require('../../mysql').getConnection();

export default async (req, res) => {
    connection.query("SELECT data, count FROM regions;", async function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            const countries = new Map();
            for (const region of results) {
                let count = region.count;
                const country = wc(JSON.parse(region.data)[0].reverse());
                if (!country) continue;
                if (countries.has(country)) count += countries.get(country);
                countries.set(country, count)
            }
            return res.json(Object.fromEntries(countries));
        } else {
            res.send("error: " + error)
        }


    })

}