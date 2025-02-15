const express = require("express");
const cors = require('cors');
const app = express();
const port = 8080;
require('dotenv').config();
const {getUserPlaylists, migrateUserPlaylists, removeLikedSongs, deletePlaylist} = require('../backend/Business Logics/spotify-playlist-BL').default

const corsOptions = {
    origin: 'http://localhost:3000', // Restrict allowed origins
    methods: ['GET', 'POST'],          // Allow specific HTTP methods
    // credentials: true,                 // Allow cookies
};

app.use(express.json());
app.use(cors(corsOptions));

app.post("/getUserPlaylists", getUserPlaylists);
app.post("/migrateUserPlaylists",migrateUserPlaylists)
app.post('/removeLikedSongs',removeLikedSongs)
app.post('/deletePlaylist',deletePlaylist)

app.listen(port, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`Server is started at port no ${port}`);
    }
});