import axios from "axios";

export async function client(config) {
    try {
        return (await axios(config))
    } catch (error) {
        throw error
    }
}