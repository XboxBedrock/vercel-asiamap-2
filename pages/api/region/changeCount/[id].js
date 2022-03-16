const connection = require('../../../../mysql').getConnection();
const index = require('../../../../algolia').getIndex();
import { getSession } from 'next-auth/client'
import axios from "axios";

export default async (req, res) => {
    const {
        query: { id },
    } = req
    const session = await getSession({ req })

    if (req.method === 'POST') {
        const protocol = req.protocol;
        const hasPerm = await axios.post(`${protocol}://${req.headers.host}/api/region/testPermission/${id}`, {email: session.user.email})
        if(hasPerm.data === true) {
            connection.query("UPDATE `regions` SET `count`=? WHERE `uid`=?", [req.body.count, id], (err) => {
                if (!err) {
                    index.partialUpdateObject({
                        count: req.body.count,
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
