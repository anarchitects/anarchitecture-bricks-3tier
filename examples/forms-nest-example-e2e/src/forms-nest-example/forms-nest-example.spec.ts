import axios from 'axios';

describe('Forms nest example', () => {
  it('GET /health should return status', async () => {
    const res = await axios.get(`/health`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'forms-nest-example' });
  });

  it('GET /forms/contact_default should return a form definition envelope', async () => {
    const res = await axios.get('/forms/contact_default');

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('config');
    expect(res.data).toHaveProperty('schema');
  });
});
