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
    const params = { headers: { 'Authorization': `Bearer ${__ENV.ADMIN_TOKEN || 'admin-token'}` } };
    const res = http.get(`${BASE_URL}/admin/users/`, params);
    check(res, { 'status is 200 or 401 or 403': (r) => [200, 401, 403].includes(r.status) });
    sleep(1);
}
