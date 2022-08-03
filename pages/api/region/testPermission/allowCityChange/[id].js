import {getSession} from "next-auth/react";

const connection = require('../../../../../mysql').getConnection();



export default async (req, res) => {
    const {
        query: { id },
    } = req
    const session = await getSession({ req })

    if(req.body && req.body.email) {
        if(JSON.parse(process.env.ALLOW_EVERYTHING).includes(session.user.email)) {
            res.send(true);
            return;
        } else {res.send(false); return;}
    } 

    if(req.body && req.body.name) {
        connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
            if (!error) {
                res.send(req.body.name === region[0].username)
            } else {
                res.send(false)
            }
        })
    }



}
