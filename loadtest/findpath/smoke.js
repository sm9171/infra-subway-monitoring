import http from 'k6/http';
import {check, group, sleep, fail} from 'k6';

export let options = {
    vus: 1, // 1 user looping for 1 minute
    duration: '10m',
    thresholds: {
        http_req_duration: ['p(99)<200'],
        'checks{myTag:login}': ['rate>0.9'],
        'checks{myTag:findPath}': ['rate>0.9'],
    },
};

const BASE_URL = 'https://sm9171.r-e.kr/';
const USERNAME = 'sm9171@nate.com';
const PASSWORD = '1234';
const AGE = '32';
const MEMBER_ID = '1';

export default function () {
    let authToken = login();
    findPath(authToken); // 여러 데이터를 참조하는 페이지
};

function login() {
    let payload = JSON.stringify({
        email: USERNAME,
        password: PASSWORD,
    });

    let params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };


    let loginRes = http.post(`${BASE_URL}/login/token`, payload, params);
    let authToken = loginRes.json('accessToken');

    check(loginRes, {
            'logged in successfully': (resp) => resp.json('accessToken') !== '',
        },
        {myTag: 'login'});

    sleep(1);
    return authToken;
}

function findPath(accessToken) {
    let params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        }
    };

    let response = http.get(`${BASE_URL}/path?source=3&target=8`, params);

    check(response, {
            'find path successfully': (res) => res.status === 200
        },
        {myTag: 'findPath'});

    sleep(1);
}