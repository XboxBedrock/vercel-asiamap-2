const connection = require('../../mysql').getConnection();

export default (req, res) => {
    connection.query("SELECT SUM(count) as totalBuildings FROM regions;", function (error, results, fields) {
        if (!error) {
            if(results.length === 0) {
                res.status(404).send("error: " + error)
                return ;
            }
            res.json(results[0]);
        } else {
            res.send("error: " + error)
        }


    })

}
