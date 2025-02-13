import React, { useState, useEffect } from "react";
import { Accordion, Button, Form, Row, Col, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios'
import { Buffer } from 'buffer'

const ParentComponent = () => {
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [tokenVerification, setTokenVerification] = useState({ source: localStorage.getItem('sourceToken') || false, target: localStorage.getItem('targetToken') })
    const options = ["Option 1", "Option 2", "Option 3", "Option 4"];

    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        setSelectedItems(selectAll ? [] : options);
    };

    const handleSelect = (option) => {
        setSelectedItems((prev) =>
            prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
        );
    };



    const [authorizationCode, setAuthorizationCode] = useState('')
    const clientId = process.env.REACT_APP_CLIENTID
    const clientSecret = process.env.REACT_APP_CLIENTSECRET
    const redirectUri = process.env.REACT_APP_REDIRECTURI
    const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-library-modify', 'user-library-read', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-email']

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`;
    const queryParams = new URLSearchParams('')
    // useEffect(() => {
    //     if (queryParams.get('code')) {
    //         let code = queryParams.get('code')
    //         console.log(code);
    //         setAuthorizationCode(code)
    //         queryParams.delete('code')
    //         // navigate(location.pathname + '?' + queryParams.toString(), { state: code })
    //     }
    // }, [])

    function handleAuthentication(type) {
        try {
            window.open(authUrl, "_blank", "width=600,height=700");

            // Listen for messages from the new tab (callback)
            const handleMessage = async(event) => {
                debugger
                if (event.origin !== window.location.origin) return; // Security check
                const { token } = event.data;
                if (token) {
                    // setToken(token);
                    // console.log(token);
                    // window.localStorage.setItem(type + "Token", token);
                    // setLoad(false)
                    await getAccessToken(type, token)
                }
            };

            window.addEventListener("message", handleMessage, false);
        } catch (error) {
            console.log(error);
        }
    }


    async function getAccessToken(type, code) {
        try {
            debugger
            const body = new URLSearchParams();
            body.append('grant_type', 'authorization_code');
            body.append('code', code);
            body.append('redirect_uri', redirectUri);

            const response = await axios.post(
                "https://accounts.spotify.com/api/token",
                body, // Pass the encoded body
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, // Base64 encode client_id:client_secret
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            )

            if (response.status == 200) {
                const response1 = await axios.get('https://api.spotify.com/v1/me/tracks', {
                    headers: {
                        Authorization: 'Bearer ' + response.data.access_token
                    }
                })
                if (response1.data.statusCode == 200) {
                    setTokenVerification({ ...tokenVerification, [type + 'token']: true })
                    localStorage.setItem(type + 'token', response.data.refresh_token)
                }
                else {
                    localStorage.removeItem(type + 'token')
                }
            }

            // then((response) => {
            //     // Response contains the access token
            //     console.log("Access Token:", response.data.access_token);
            //     .then((response1) => {

            //     })
            // console.log("Refresh Token:", response.data.refresh_token);
            // console.log("Expires In:", response.data.expires_in);
            // }).catch ((error) => {
            // console.log(error);
            // })


        } catch (error) {
            console.error("Error fetching access token:", error);
            localStorage.removeItem(type + 'token')
        }
    }


    return (
        <div style={{ backgroundColor: 'black' }}>
            <Container className="bg-dark text-light p-4" style={{ minHeight: "100vh" }}>
                <h2 className="text-center text-success mb-4">Spotify Playlists Migration</h2>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Spotify Authentication</Accordion.Header>
                        <Accordion.Body>
                            <Button onClick={() => { handleAuthentication("source") }} variant="success">Authenticate with Spotify</Button>
                            <span hidden={!tokenVerification.source}>
                                <img style={{ marginLeft: '10px' }} width={30} src="./success-icon.png" />
                                <span style={{ marginLeft: '10px' }} className="text-success">Successfully Verified</span>
                            </span>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Another Spotify Auth</Accordion.Header>
                        <Accordion.Body>
                            <Button onClick={() => { handleAuthentication("target") }} variant="success">Authenticate with Spotify</Button>
                            <span hidden={!tokenVerification.target}>
                                <img style={{ marginLeft: '10px' }} width={30} src="./success-icon.png" />
                                <span style={{ marginLeft: '10px' }} className="text-success">Successfully Verified</span>
                            </span>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Grid with Select Options</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-3">
                                <Col md={4} style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "#121212", color: "#1DB954", padding: "10px" }}>
                                    <Form.Check
                                        type="checkbox"
                                        label="Select All"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                    />
                                    {options.map((option) => (
                                        <Form.Check
                                            key={option}
                                            type="checkbox"
                                            label={option}
                                            checked={selectedItems.includes(option)}
                                            onChange={() => handleSelect(option)}
                                        />
                                    ))}
                                </Col>
                                <Col md={4} className="p-3" style={{ backgroundColor: "#121212", color: "#1DB954" }}>Column 2</Col>
                                <Col md={4} className="p-3" style={{ backgroundColor: "#121212", color: "#1DB954" }}>Column 3</Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="3">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Grid without Select Options</Accordion.Header>
                        <Accordion.Body>
                            <Row className="g-3">
                                <Col md={4} className="p-3" style={{ backgroundColor: "#121212", color: "#1DB954" }}>Column 1</Col>
                                <Col md={4} className="p-3" style={{ backgroundColor: "#121212", color: "#1DB954" }}>Column 2</Col>
                                <Col md={4} className="p-3" style={{ backgroundColor: "#121212", color: "#1DB954" }}>Column 3</Col>
                            </Row>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        </div>
    );
};

export default ParentComponent;
