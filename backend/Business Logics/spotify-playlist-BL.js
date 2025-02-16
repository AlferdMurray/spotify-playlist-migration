import qs from 'qs'
import axios from 'axios'
async function getUserPlaylists(req, res) {
    try {
        let token = await generateToken(req.body.sourceRefreshToken)
        let config = {
            method: "GET",
            url: 'https://api.spotify.com/v1/me/playlists',
            headers: {
                Authorization: "Bearer " + token
            }
        }
        let playlists = []
        while (true) {
            let result = await axios(config)
            playlists.push(...result.data.items)
            if (!result.data.next) {
                break
            }
            else {
                config.url = result.data.next
            }
        }
        playlists = playlists.map((playlist) => (
            {
                id: playlist.id,
                name: playlist.name,
                trackCount: playlist.tracks.total
            }
        ))
        config.url = 'https://api.spotify.com/v1/me/tracks'
        let songs = await axios(config)
        playlists.push({ id: 'liked', name: 'Liked Songs', trackCount: songs.data.total })
        res.status(200).send(playlists)
    } catch (error) {
        res.status(400).send(error)
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

async function migrateUserPlaylists(req, res) {
    try {
        res.send()
        let getProfileConfig = {
            method: 'GET',
            url: 'https://api.spotify.com/v1/me',
            headers: {
                Authorization: ''
            }
        }
        let profiles = {
            sourceId: null,
            targetId: null
        }
        for (const playlist of req.body.playlists) {
            let token = {
                sourceToken: await generateToken(req.body.sourceRefreshToken),
                targetToken: await generateToken(req.body.targetRefreshToken)
            }
            if (!profiles.sourceId && !profiles.targetId) {
                getProfileConfig.headers.Authorization = 'Bearer ' + token.sourceToken
                profiles.sourceId = (await axios(getProfileConfig)).data.id
                getProfileConfig.headers.Authorization = 'Bearer ' + token.targetToken
                profiles.targetId = (await axios(getProfileConfig)).data.id
            }
            let createPlaylistConfig = {
                method: 'POST',
                url: 'https://api.spotify.com/v1/me/playlists',
                headers: {
                    Authorization: 'Bearer ' + token.targetToken
                },
                data: {
                    name: playlist.name,
                    public: true
                }
            }
            let createPlaylist
            if (playlist.id != 'liked') {
                createPlaylist = await axios(createPlaylistConfig)
            }
            let songGetConfig = {
                method: 'get',
                url: (playlist.id != 'liked' ? 'https://api.spotify.com/v1/users/' + profiles.sourceId + '/playlists/' + playlist.id + '/tracks' : 'https://api.spotify.com/v1/me/tracks'),
                headers: {
                    Authorization: 'Bearer ' + token.sourceToken
                }
            }
            let sourceSongs = []
            while (true) {
                let songRes = await axios(songGetConfig)
                sourceSongs.push(...songRes.data.items)
                if (!songRes.data.next) {
                    break
                }
                else {
                    songGetConfig.url = songRes.data.next
                }
            }
            let songPostConfig = {
                method: (playlist.id != 'liked' ? 'POST' : 'PUT'),
                url: (playlist.id != 'liked' ? 'https://api.spotify.com/v1/users/' + profiles.targetId + '/playlists/' + createPlaylist.data.id + '/tracks' : 'https://api.spotify.com/v1/me/tracks'),
                headers: {
                    Authorization: 'Bearer ' + token.targetToken
                }
            }
            let songData = []

            for (const song of sourceSongs) {
                songData.push((playlist.id != 'liked' ? song.track.uri : song.track.id))
                if (songData.length == (playlist.id != 'liked' ? 100 : 50)) {
                    songPostConfig['data'] = ((playlist.id != 'liked') ? songData : { "ids": songData })
                    songData = []
                    await axios(songPostConfig)
                }
            }
            if (songData.length != 0) {
                songPostConfig['data'] = ((playlist.id != 'liked') ? songData : { "ids": songData })
                await axios(songPostConfig)
            }
            if (playlist.id != 'liked') {
                let config = {
                    method: 'PUT',
                    url: 'https://api.spotify.com/v1/playlists/' + createPlaylist.data.id + '/followers',
                    headers: {
                        Authorization: 'Bearer ' + token.targetToken
                    }
                }
                await axios(config)
            }
        }
    } catch (error) {
        console.log(error)
    }
}




async function deletePlaylist(req, res) {
    try {
        let token = await generateToken(req.body.targetRefreshToken)
        let getPlaylistConfig = {
            method: 'GET',
            url: 'https://api.spotify.com/v1/me/playlists',
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
        let playlists = (await axios(getPlaylistConfig)).data.items
        for (const playlist of playlists) {
            let deleteConfig = {
                method: 'DELETE',
                url: 'https://api.spotify.com/v1/playlists/' + playlist.id + '/followers',
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }
            await axios(deleteConfig)
        }
        res.send()
    } catch (error) {
        throw error
    }
}

async function removeLikedSongs(req, res) {
    try {
        res.send()
        let token = await generateToken(req.body.targetRefreshToken)
        let getConfig = {
            method: 'GET',
            url: 'https://api.spotify.com/v1/me/tracks',
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
        let tracks = []
        while (true) {
            let result = await axios(getConfig)
            tracks.push(...result.data.items)
            if (!result.data.next) {
                break
            }
            else {
                getConfig.url = result.data.next
            }
        }
        let songData = []
        let deleteConfig = {
            method: 'DELETE',
            url: 'https://api.spotify.com/v1/me/tracks',
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
        for (const track of tracks) {
            songData.push(track.track.id)
            if (songData.length == 50) {
                deleteConfig.data = {ids : songData}
                songData = []
                await axios(deleteConfig)
            }
        }
        if (songData.length != 0) {
            deleteConfig.data = {ids : songData}
            await axios(deleteConfig)
        }
    } catch (error) {
        throw error
    }
}



export default {
    getUserPlaylists,
    migrateUserPlaylists,
    removeLikedSongs,
    deletePlaylist
}