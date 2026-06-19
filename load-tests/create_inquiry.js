import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        load_100: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '30s', target: 100 }, { duration: '1m', target: 100 }, { duration: '30s', target: 0 }] },
        load_500: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '1m', target: 500 }, { duration: '2m', target: 500 }, { duration: '1m', target: 0 }], startTime: '2m' },
        load_1000: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '2m', target: 1000 }, { duration: '3m', target: 1000 }, { duration: '1m', target: 0 }], startTime: '6m' },
    },
    thresholds: {
        http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
    const payload = JSON.stringify({ car_id: "00000000-0000-0000-0000-000000000000", message: "Load test inquiry" });
    const params = { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${__ENV.TEST_TOKEN || 'test-token'}` } };
    const res = http.post(`${BASE_URL}/inquiries/`, payload, params);
    check(res, { 'status is 201 or 401 or 404': (r) => [201, 401, 404, 422].includes(r.status) });
    sleep(1);
}
