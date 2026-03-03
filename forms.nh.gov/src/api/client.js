import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();

const client = wrapper(axios.create({
    baseURL: 'https://forms.nh.gov/licenseverification/',
    jar,
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-CH-UA': '"Chromium";v="145", "Not(A:Brand";v="99", "Google Chrome";v="145"',
        'Sec-CH-UA-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1'
    }
}));

export default client;