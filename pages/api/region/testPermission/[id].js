import {getSession} from "next-auth/react";

const connection = require('../../../../mysql').getConnection();



export default async (req, res) => {
    const {
        query: { id },
    } = req
    const session = await getSession({ req })

    if(req.body && req.body.email) {
        if(JSON.parse(process.env.ALLOW_EVERYTHING).includes(req.body.email)) {
            res.send(true);
            return;
        }
        connection.query("SELECT * FROM `userLinks` WHERE `discordMail`=?", [req.body.email], (error, user) => {
            if (!error) {
                console.log(user)
                if(!user[0] || !user[0].mcuuid) {
                    res.send(false);
                    return;
                }
                connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
                    if (!error) {
                        res.send(user[0].mcuuid === region[0].useruuid)
                    } else {
                        res.send("error: " + error)
                    }
                })
            } else {
                res.send("error: " + error)
            }
        })
    }
    if(req.body && req.body.name) {
        connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
            if (!error) {
                res.send(req.body.name === region[0].username)
            } else {
                res.send("error: " + error)
            }
        })
    }

}
