const connection = require('../../../../mysql').getConnection();
const index = require('../../../../algolia').getIndex();
import { getSession } from 'next-auth/react'
import axios from "axios";

export default async (req, res) => {
    const {
        query: { id },
    } = req
    const session = await getSession({ req })

    if (req.method === 'POST') {
        const protocol = req.protocol;
        const hasPerm = await axios.post(`${protocol}://${req.headers.host}/api/region/testPermission/${id}`, {email: session.user.email, name: session.user.name})
        if(hasPerm.data === true) {
            connection.query("UPDATE `regions` SET `subregion`=? WHERE `uid`=?", [req.body.subregion, id], (err) => {
                if (!err) {
                    index.partialUpdateObject({
                        subregion: req.body.subregion,
                        objectID: id
                    }).then(() => {
                        res.send("ok");
                    })

                } else {
                    res.send("error: " + err)
                }
            })
        }
    }

}
