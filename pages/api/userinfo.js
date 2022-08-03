export default async (req, res) => {
    if(req.body && req.body.email) {
        connection.query("SELECT * FROM `userLinks` WHERE `discordMail`=?", [req.body.email], (error, user) => {
            if (!error) {
                res.send(user[0].mcuuid);
                return;
            } else {
                res.send(null)
            }
        })
    } else {
        res.send(null)
    }

}
