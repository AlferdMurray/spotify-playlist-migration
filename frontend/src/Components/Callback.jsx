import { useEffect } from "react"


export function Callback() {

    useEffect(() => {
        const hash = window.location.search;
        const params = new URLSearchParams(hash);
        const token = params.get("code");
        console.log(params);
        
        if (token) {
            window.opener.postMessage({ token }, window.location.origin);
            window.close(); // Close the tab
        }
    }, [])

    return (
        <>
            <h2>Authenticating with Spotify...</h2>
        </>
    )
}