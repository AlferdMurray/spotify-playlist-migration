import { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer'
import axios from 'axios'
import CryptoJS from "crypto-js";

export function Redirect() {
    const location = useLocation()
    const navigate = useNavigate()
    // const [load, setLoad] = useState(false)
    const [authorizationCode, setAuthorizationCode] = useState(location?.state?.code || '')
    const clientId = process.env.REACT_APP_CLIENTID
    const clientSecret = process.env.REACT_APP_CLIENTSECRET
    const redirectUri = process.env.REACT_APP_REDIRECTURI
    const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-library-modify', 'user-library-read', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-email']

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes.join(' '))}`;
    const queryParams = new URLSearchParams(location.search)
    useEffect(() => {
        if (queryParams.get('code')) {
            let code = queryParams.get('code')
            console.log(code);
            setAuthorizationCode(code)
            queryParams.delete('code')
            // navigate(location.pathname + '?' + queryParams.toString(), { state: code })
        }
    }, [])

    const handleLogin = () => {
        setLoad(true)
        window.open(authUrl, "_blank", "width=600,height=700");

        // Listen for messages from the new tab (callback)
        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return; // Security check
            const { token } = event.data;
            if (token) {
                // setToken(token);
                console.log(token);
                window.localStorage.setItem("spotify_token", token);
                setLoad(false)
            }
        };

        window.addEventListener("message", handleMessage, false);
    };



    function getAccessToken() {
        try {
            debugger
            // console.log({
            //     grant_type: "authorization_code",
            //     code: authorizationCode,
            //     redirect_uri: redirectUri,
            // });
            // console.log(location);


            const body = new URLSearchParams();
            body.append('grant_type', 'authorization_code');
            body.append('code', authorizationCode);
            body.append('redirect_uri', redirectUri);

            const response = axios.post(
                "https://accounts.spotify.com/api/token",
                body, // Pass the encoded body
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, // Base64 encode client_id:client_secret
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            ).then((response) => {
                // Response contains the access token
                console.log("Access Token:", response.data.access_token);
                console.log("Refresh Token:", response.data.refresh_token);
                console.log("Expires In:", response.data.expires_in);
            }).catch((error) => {
                console.log(error);
            })


        } catch (error) {
            console.error("Error fetching access token:", error);
        }
    }

    if (authorizationCode != '') {
        debugger
        getAccessToken()
    }


    return (
        <div className="App" >
            {/* {load ? <Loader /> : <button onClick={handleLogin} style={{ height: 40 }}>Click Me!!!</button>} */}
        </div>
    )
}