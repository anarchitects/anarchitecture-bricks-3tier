import { getTestInstance } from 'better-auth/test';
import { passkey } from '@better-auth/passkey';

async function main() {
  const proof = {
    date: new Date().toISOString(),
    engine: 'better-auth',
    flows: [],
  };

  const instance = await getTestInstance(
    {
      plugins: [
        passkey({
          rpID: 'localhost',
          rpName: 'Anarchitecture Auth Spike',
        }),
      ],
      socialProviders: {
        github: {
          clientId: 'spike-client-id',
          clientSecret: 'spike-client-secret',
        },
      },
    },
    {
      testWith: 'sqlite',
    },
  );

  try {
    const password = await instance.client.signIn.email({
      email: instance.testUser.email,
      password: instance.testUser.password,
    });

    proof.flows.push({
      flow: 'password-sign-in',
      status: password?.data ? 'pass' : 'fail',
      notes: password?.error?.message ?? 'Email/password proof executed.',
    });
  } catch (error) {
    proof.flows.push({
      flow: 'password-sign-in',
      status: 'fail',
      notes: error instanceof Error ? error.message : String(error),
    });
  }

  proof.flows.push({
    flow: 'passkey-sign-in',
    status: 'manual',
    notes:
      'Passkey proof requires browser WebAuthn execution against the Better Auth passkey plugin endpoints.',
  });

  try {
    const socialResult = await instance.auth.api.signInSocial({
      body: {
        provider: 'github',
        callbackURL: 'http://localhost:3000/callback',
        disableRedirect: true,
      },
    });

    proof.flows.push({
      flow: 'social-sign-in',
      status: socialResult ? 'pass' : 'fail',
      notes: 'GitHub social initiation proof executed.',
    });
  } catch (error) {
    proof.flows.push({
      flow: 'social-sign-in',
      status: 'fail',
      notes: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const signOutResult = await instance.auth.api.signOut();
    proof.flows.push({
      flow: 'sign-out-or-refresh',
      status: signOutResult ? 'pass' : 'fail',
      notes: 'Session sign-out proof executed.',
    });
  } catch (error) {
    proof.flows.push({
      flow: 'sign-out-or-refresh',
      status: 'fail',
      notes: error instanceof Error ? error.message : String(error),
    });
  }

  console.log(JSON.stringify(proof, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
