import React, { useState, useEffect } from "react";
import { Accordion, Button, Form, Row, Col, Container, Table } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from 'axios'
import { Buffer } from 'buffer'
import { client } from "../client/client";

const ParentComponent = () => {
    const [selectAll, setSelectAll] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loader, setLoader] = useState(false)
    // const [playlists,setPlaylists] = useState([])
    const [sourcePlaylistsData, setSourcePlaylistsData] = useState([])
    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        setSelectedItems(selectAll ? [] : sourcePlaylistsData);

    };

    const handleSelect = (playlist) => {
        setSelectedItems((prev) =>
            prev.find((item)=>item.id == playlist.id) ? prev.filter((item) => item.id == playlist.id) : [...prev, playlist]
        );
    };



    const [authorizationCode, setAuthorizationCode] = useState({ sourceCode: localStorage.getItem('sourceCode'), targetCode: localStorage.getItem('targetCode') })
    const clientId = process.env.REACT_APP_CLIENTID
    const clientSecret = process.env.REACT_APP_CLIENTSECRET
    const redirectUri = process.env.REACT_APP_REDIRECTURI
    const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-library-modify', 'user-library-read', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-email']
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`;

    const handleAuthentication = (e) => {
        try {
            debugger
            setLoader(true);
            const authWindow = window.open(authUrl, "_blank", "width=600,height=700");

            const handleMessage = async (event) => {
                debugger
                if (event.origin !== window.location.origin) return; // Security check
                const { token } = event.data;
                if (token) {
                    await getAccessToken(token, e.target.name)
                    window.removeEventListener("message", handleMessage); // Remove listener after first use
                }
                setLoader(false);
            };

            window.addEventListener("message", handleMessage);
        } catch (error) {
            console.log(error);
        }
    };


    async function getUserPlaylists() {
        try {
            setLoader(true)
            debugger
            let config = {
                method: 'post',
                url: 'http://localhost:8080/getUserPlaylists',
                data: {
                    sourceRefreshToken: authorizationCode.sourceCode,
                    targetRefreshToken: authorizationCode.targetCode
                }
            }
            let result = await client(config)
            setSourcePlaylistsData(result.data)
            setLoader(false)
        } catch (error) {
            console.log(error);
        }
    }

    async function getAccessToken(code, type) {
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
                if (response1.status == 200) {
                    localStorage.setItem(type + 'Code', response.data.refresh_token)
                    setAuthorizationCode({ ...authorizationCode, [type + 'Code']: response.data.refresh_token });
                }
            }

        } catch (error) {
            console.error("Error fetching access token:", error);
        }
    }

    const copyPlaylist = async () => {
        try {
            debugger
            setLoader(true)
            // let payloadData = selectedItems.map((id) => ({ id }))
            let config = {
                method: 'post',
                url: 'http://localhost:8080/migrateUserPlaylists',
                data: {
                    playlists: selectedItems,
                    sourceRefreshToken: authorizationCode.sourceCode,
                    targetRefreshToken: authorizationCode.targetCode
                }
            }
            await axios(config)
            setLoader(false)
            window.location.href = 'https://open.spotify.com'
        } catch (error) {
            setLoader(false)
            console.log(error);
        }
    }

    return (
        <div style={{ backgroundColor: 'black' }}>
            <Container className="bg-dark text-light p-4" style={{ minHeight: "100vh" }}>
                <h2 style={{color:'#1abc54'}} className="text-center mb-4"><img src="https://www.freepnglogos.com/uploads/spotify-logo-png/spotify-download-logo-30.png" width={"25px"}/> Spotify Playlists Migration</h2>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item style={{ backgroundColor: 'black' }} eventKey="0">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Spotify Source User Authentication</Accordion.Header>
                        <Accordion.Body>
                            <Button name="source" onClick={(e) => { handleAuthentication(e) }} variant="success">Authenticate with Spotify</Button>
                            <span hidden={!authorizationCode.sourceCode}>
                                <img style={{ marginLeft: '10px' }} width={30} src="./success-icon.png" />
                                <span style={{ marginLeft: '10px' }} className="text-success">Successfully Verified</span>
                            </span>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                        <Accordion.Header style={{ backgroundColor: "Black", color: "#121212" }}>Spotify Target User Authentication</Accordion.Header>
                        <Accordion.Body style={{ backgroundColor: 'black' }}>
                            <Button name="target" onClick={(e) => { handleAuthentication(e) }} variant="success">Authenticate with Spotify</Button>
                            <span hidden={!authorizationCode.targetCode}>
                                <img style={{ marginLeft: '10px' }} width={30} src="./success-icon.png" />
                                <span style={{ marginLeft: '10px' }} className="text-success">Successfully Verified</span>
                            </span>
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2">
                        <Accordion.Header style={{ backgroundColor: "#1DB954", color: "#121212" }}>Playlists Migration</Accordion.Header>
                        {authorizationCode.sourceCode && authorizationCode.targetCode ?
                            <Accordion.Body style={{ backgroundColor: 'black' }}>
                                <Row className="g-3" style={{ maxHeight: "650px" }}>
                                    <Row className="g-3">
                                        <Col md={1} style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "#121212", color: "#1DB954", padding: "10px" }}>
                                            <Form.Check
                                                type="checkbox"
                                                // label="Select All"
                                                className="p-2"
                                                checked={selectAll && (selectedItems.length == sourcePlaylistsData.length)}
                                                onChange={handleSelectAll}
                                            />
                                        </Col>
                                        <Col md={9} className="p-3 text-center align-items-center" style={{ backgroundColor: "#121212", color: "#1DB954", fontWeight: 'bold' }}>Source Playlist</Col>
                                        <Col md={2} className="p-3 text-center align-items-center" style={{ backgroundColor: "#121212", color: "#1DB954", fontWeight: 'bold' }}>Count</Col>
                                    </Row>
                                    {sourcePlaylistsData.length != 0 ?
                                        <Row className="g-3" style={{ "--bs-gutter-y": "0rem" }}>
                                            {sourcePlaylistsData.map((playlist) => (
                                                <>
                                                    <Col md={1} style={{ maxHeight: "150px", overflowY: "auto", backgroundColor: "#121212", color: "#1DB954", padding: "10px" }}>
                                                        <Form.Check
                                                            type="checkbox"
                                                            // label="Select All"
                                                            className="p-2"
                                                            checked={selectedItems.some((item)=>item.id == playlist.id)}
                                                            onChange={() => { handleSelect(playlist) }}
                                                        />
                                                    </Col>
                                                    <Col md={9} className="p-3 text-center align-items-center" style={{ backgroundColor: "#121212", color: "#1DB954" }}>{playlist.name}</Col>
                                                    <Col md={2} className="p-3 text-center align-items-center" style={{ backgroundColor: "#121212", color: "#1DB954" }}>{playlist.trackCount}</Col>
                                                </>
                                            ))}
                                        </Row>
                                        :
                                        <Row className="g-3" style={{ "--bs-gutter-y": "0rem" }}>
                                            <div className="text-center" style={{ backgroundColor: "#121212" }}>
                                                <div className="mb-3" style={{ color: "#1DB954", }}><span style={{ width: '200px' }}>No Playlists to Show. Please Press the "Get My Playlists" button to reveal your playlists</span></div>
                                                <Button onClick={() => { getUserPlaylists() }} className="mb-3" variant="success">Get My Playlists</Button>
                                            </div>
                                        </Row>
                                    }
                                    <Button disabled={selectedItems.length==0} onClick={copyPlaylist} variant="success" style={{ width: '150px', float: 'right' }}>Copy Playlist</Button>
                                </Row>
                            </Accordion.Body>
                            :
                            <Accordion.Body style={{backgroundColor : 'black'}} >
                                <div className="text-center text-danger">*First Verify and Come</div>
                            </Accordion.Body>}
                    </Accordion.Item>
                </Accordion>
            </Container>
            {loader && <div className="overlay">
                <Spinner animation='grow' variant="success" />
            </div>}
        </div >
    );
};

export default ParentComponent;
