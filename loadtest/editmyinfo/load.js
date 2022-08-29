import http from 'k6/http';
import {check, group, sleep, fail} from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
    stages: [
        {duration: '10m', target: 185},
        {duration: '10m', target: 185},
        {duration: '10m', target: 0},
    ],
    thresholds: {
        http_req_duration: ['p(99)<200'],
        'checks{myTag:login}': ['rate>0.9'],
        'checks{myTag:editMyInfo}': ['rate>0.9'],
    },
};

const BASE_URL = 'https://sm9171.r-e.kr/';
const USERNAME = 'sm9171@nate.com';
const PASSWORD = '1234';
const AGE = '32';
const MEMBER_ID = '1';

export default function () {
    let authToken = login();
    editMyInfo(authToken);//데이터를 갱신하는 페이지
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

    const success = check(loginRes, {
            'logged in successfully': (resp) => resp.json('accessToken') !== '',
        },
        {myTag: 'login'});
    errorRate.add(!success);
    sleep(1);
    return authToken;
}

function editMyInfo(accessToken) {
    let payload = JSON.stringify({
        email: USERNAME,
        password: PASSWORD,
        age: AGE,
    });

    let params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        }
    };

    let response = http.put(`${BASE_URL}/members/` + MEMBER_ID, payload, params);

    const success = check(response, {
            'editMyInfo successfully': (res) => res.status === 200
        },
        {myTag: 'editMyInfo'});
    errorRate.add(!success);
    sleep(1);
}