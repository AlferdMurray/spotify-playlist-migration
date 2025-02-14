import { useEffect } from "react"


export function Callback() {

    useEffect(() => {
        const hash = window.location.search;
        const params = new URLSearchParams(hash);
        const token = params.get("code");

        if (token && window.opener) {
            console.log("Sending token:", token);
            window.opener.postMessage({ token }, window.origin);
            window.close();
        }
    }, []);



    return (
        <>
            <h2>Authenticating with Spotify...</h2>
        </>
    )
}