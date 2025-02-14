import qs from 'qs'
import axios from 'axios'
async function getUserPlaylists(req, res) {
    try {
        console.log("Inside here", req.body);
        let token = await generateToken(req.body.sourceRefreshToken)
        let config = {
            method : "GET"
        }
        res.send(token)
    } catch (error) {
        console.log(error);
    }
}


async function generateToken(refreshToken) {
    try {
        let config = {
            method: "POST",
            url: "https://accounts.spotify.com/api/token",
            headers: {
                Authorization: "Basic " + Buffer.from(`${process.env.CLIENTID}:${process.env.CLIENTSECRET}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: qs.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            })
        }

        let response = await axios(config)
        return (response.data.access_token)
    } catch (error) {
        throw error
    }
}

export default {
    getUserPlaylists
}