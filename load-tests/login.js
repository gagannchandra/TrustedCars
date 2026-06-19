import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        load_100: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '30s', target: 100 }, { duration: '1m', target: 100 }, { duration: '30s', target: 0 }] },
        load_500: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '1m', target: 500 }, { duration: '2m', target: 500 }, { duration: '1m', target: 0 }], startTime: '2m' },
        load_1000: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '2m', target: 1000 }, { duration: '3m', target: 1000 }, { duration: '1m', target: 0 }], startTime: '6m' },
    },
    thresholds: {
        http_req_duration: ['p(50)<500', 'p(95)<1000', 'p(99)<2000'], // Login involves hashing, may be slower
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
    const payload = { username: "test@example.com", password: "Password123!" };
    const params = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    check(res, { 'status is 200 or 401': (r) => [200, 401].includes(r.status) });
    sleep(1);
}
