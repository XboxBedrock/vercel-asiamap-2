const connection = require('../../../mysql').getConnection();
const index = require('../../../algolia').getIndex();
import { getSession } from 'next-auth/react'

export default async (req, res) => {
    const {
        query: { id },
    } = req
    const session = await getSession({ req })

    console.log(req.method)

    if (req.method === 'GET') {
        connection.query("SELECT * FROM `regions` WHERE `uid`=?", [id], function (error, results, fields) {
            if (!error) {
                res.json(results[0]);
            } else {
                res.send("error: " + error)
            }
        })
    } else if (req.method === 'DELETE') {
        console.log(session.user)
        if(JSON.parse(process.env.ALLOW_EVERYTHING).includes(session.user.email)) {
            connection.query("DELETE FROM `regions` WHERE  `uid`=?", [id], function (error, results, fields) {
                if (!error) {
                    index.deleteObjects([id]).then(() => {
                        res.send("ok");
                    })

                } else {
                    res.send("error: " + error)
                }
            })
            return;
        }
        if(session.user.name) {
            connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
                if (!error) {
                    console.log(session.user.name)
                    if (session.user.name.toLowerCase() === region[0].username.toLowerCase()) {
                        connection.query("DELETE FROM `regions` WHERE  `uid`=?", [id], function (error, results, fields) {
                            if (!error) {
                                index.deleteObjects([id]).then(() => {
                                    res.send("ok");
                                })

                            } else {
                                res.send("error: " + error)
                            }
                        })
                    } else {
                        console.log(error)
                        res.status(401).send("not authorized")
                    }
                } else {
                    res.send("error: " + error)
                }
            })
        }
        if (session.user.email) connection.query("SELECT * FROM `userLinks` WHERE `discordMail`=?", [session.user.email], (error, user) => {
            if (!error) {
                connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
                    if (!error) {
                        if(user[0].mcuuid === region[0].useruuid) {
                            connection.query("DELETE FROM `regions` WHERE  `uid`=?", [id], function (error, results, fields) {
                                if (!error) {
                                    index.deleteObjects([id]).then(() => {
                                        res.send("ok");
                                    })

                                } else {
                                    res.send("error: " + error)
                                }
                            })
                        } else {
                            res.status(401).send("not authorized")
                        }
                    } else {
                        res.send("error: " + error)
                    }
                })
            } else {
                res.send("error: " + error)
            }
        })

    } else if (req.method === "POST") {
        if(JSON.parse(process.env.ALLOW_EVERYTHING).includes(session.user.email)) {

            connection.query("UPDATE `regions` SET `useruuid`=?,`username`=? WHERE `uid`=?", [req.body.useruuid, req.body.username, id], (err) => {
                if (!err) {
                    index.partialUpdateObject({
                        useruuid: req.body.useruuid,
                        username: req.body.username,
                        objectID: id
                    }).then(() => {
                        res.send("ok");
                    })

                } else {
                    res.send("error: " + err)
                }
            })
            return;
        }

        if (session.user.email) connection.query("SELECT * FROM `userLinks` WHERE `discordMail`=?", [session.user.email], (error, user) => {
            if (!error) {
                connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
                    if (!error) {
                        if(user[0].mcuuid === region[0].useruuid) {
                            connection.query("UPDATE `regions` SET `useruuid`=?,`username`=? WHERE `uid`=?", [req.body.useruuid, req.body.username, id], (err) => {
                                if (!err) {
                                    index.partialUpdateObject({
                                        useruuid: req.body.useruuid,
                                        username: req.body.username,
                                        objectID: id
                                    }).then(() => {
                                        res.send("ok");
                                    })

                                } else {
                                    res.send("error: " + err)
                                }
                            })
                        } else {
                            res.status(401).send("not authorized")
                        }
                    } else {
                        res.send("error: " + error)
                    }
                })
            } else {
                res.send("error: " + error)
            }
        })
        else if(session.user.name) {
            connection.query("SELECT * FROM `regions` WHERE `uid`=?",[id], function (error, region, fields) {
                if (!error) {
                    if (req.body.name === region[0].username) {
                        connection.query("UPDATE `regions` SET `useruuid`=?,`username`=? WHERE `uid`=?", [req.body.useruuid, req.body.username, id], (err) => {
                            if (!err) {
                                index.partialUpdateObject({
                                    useruuid: req.body.useruuid,
                                    username: req.body.username,
                                    objectID: id
                                }).then(() => {
                                    res.send("ok");
                                })

                            } else {
                                res.send("error: " + err)
                            }
                        })
                    } else {
                        res.status(401).send("not authorized")
                    }
                } else {
                    res.send("error: " + error)
                }
            })
        } 
    }

}
