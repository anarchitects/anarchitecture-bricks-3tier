import axios from 'axios';

describe('Auth nest example', () => {
  it('GET /health should return status', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok', service: 'auth-nest-example' });
  });

  it('GET /protected/admin should reject anonymous users', async () => {
    await expect(axios.get('/api/protected/admin')).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });

  it('GET /protected/admin should reject users without required policy', async () => {
    const login = await axios.post('/api/auth/login', {
      credential: 'member@example.com',
      password: 'memberpass123',
    });

    await expect(
      axios.get('/api/protected/admin', {
        headers: {
          Authorization: `Bearer ${login.data.accessToken}`,
        },
      }),
    ).rejects.toMatchObject({
      response: {
        status: 403,
      },
    });
  });

  it('GET /protected/admin should allow authorized users', async () => {
    const login = await axios.post('/api/auth/login', {
      credential: 'admin@example.com',
      password: 'adminpass123',
    });

    const res = await axios.get('/api/protected/admin', {
      headers: {
        Authorization: `Bearer ${login.data.accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      area: 'admin',
      userId: 'admin-user-id',
      status: 'granted',
    });
  });
});
