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
        const hasPerm = await axios.post(`http://localhost:3000/api/region/testPermission/${id}`, {email: session.user.email})
        if(hasPerm.data === true) {
            connection.query("UPDATE `regions` SET `region`=? WHERE `uid`=?", [req.body.region, id], (err) => {
                if (!err) {
                    index.partialUpdateObject({
                        city: req.body.city,
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
