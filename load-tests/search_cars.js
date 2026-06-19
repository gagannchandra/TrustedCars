import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        load_100: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 100 },
                { duration: '1m', target: 100 },
                { duration: '30s', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
        load_500: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 500 },
                { duration: '2m', target: 500 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
            startTime: '2m',
        },
        load_1000: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 1000 },
                { duration: '3m', target: 1000 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
            startTime: '6m',
        },
    },
    thresholds: {
        http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'], // < 1% errors
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
    const res = http.get(`${BASE_URL}/cars?limit=20&offset=0`);
    
    check(res, {
        'is status 200': (r) => r.status === 200,
        'has results': (r) => r.json('items') !== undefined,
    });
    
    sleep(1);
}
