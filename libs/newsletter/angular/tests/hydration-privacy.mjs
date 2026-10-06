import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium, expect } from '@playwright/test';

// Exercise actual Angular SSR output of the built package, with no client bootstrap.
// JS-enabled = before hydration; JS-disabled = a permanently non-hydrating page.
const root = process.cwd();
const temp = mkdtempSync(path.join(tmpdir(), 'newsletter-ssr-'));
let browser;
let server;
try {
  mkdirSync(path.join(temp, 'node_modules/@anarchitects'), { recursive: true });
  for (const domain of ['newsletter', 'forms'])
    for (const layer of ['angular', 'ts'])
      cpSync(
        path.join(root, 'dist/libs', domain, layer),
        path.join(temp, 'node_modules/@anarchitects', `${domain}-${layer}`),
        { recursive: true },
      );
  for (const name of ['@angular', '@ngrx', '@sinclair', 'rxjs', 'tslib'])
    symlinkSync(
      path.join(root, 'node_modules', name),
      path.join(temp, 'node_modules', name),
      'junction',
    );
  const fixture = path.join(temp, 'ssr-fixture.mjs');
  const output = path.join(temp, 'signup.html');
  cpSync(path.join(import.meta.dirname, 'ssr-fixture.mjs'), fixture);
  const render = spawnSync(process.execPath, [fixture, output], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(render.status, 0, render.stderr);
  const html = readFileSync(output, 'utf8');
  assert.match(
    html,
    /ngh=/,
    'fixture must include real Angular hydration metadata',
  );
  const requests = [];
  server = createServer((request, response) => {
    requests.push({ method: request.method, url: request.url });
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}/signup`;
  browser = await chromium.launch();
  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled });
    try {
      const page = await context.newPage();
      const navigations = [];
      page.on('framenavigated', (frame) => navigations.push(frame.url()));
      await page.goto(url);
      await expect(page.locator('form')).toHaveCount(2);
      for (const prefix of ['header-news', 'footer-news']) {
        const email = page.locator(`#${prefix}-email`);
        const form = page.locator('form').filter({ has: email });
        await expect(form).toHaveAttribute('method', 'post');
        await expect(form.locator('button')).toHaveAttribute('type', 'button');
        await expect(
          form.locator('button[type=submit],input[type=submit]'),
        ).toHaveCount(0);
        await expect(page.locator(`#${prefix}-website`)).toBeEnabled();
        await expect(page.locator(`#${prefix}-website`)).toHaveAttribute(
          'tabindex',
          '-1',
        );
        await expect(page.locator(`#${prefix}-consent`)).not.toBeChecked();
        await email.fill('privacy-check@example.test');
        await page.locator(`#${prefix}-consent`).check();
        await form.getByRole('button').click();
        await email.press('Enter');
        // Let any native navigation finish before checking. No Angular JS exists here.
        await page.waitForLoadState('networkidle');
        assert.equal(page.url(), url);
        await expect(email).toHaveValue('privacy-check@example.test');
      }
      assert.deepEqual(navigations, [url]);
      assert.ok(
        requests.every(
          (request) =>
            request.method === 'GET' &&
            ['/signup', '/favicon.ico'].includes(request.url),
        ),
        JSON.stringify(requests),
      );
    } finally {
      await context.close();
    }
  }
  console.log(
    'SSR privacy passed: click and Enter cause no submission/navigation before hydration or without JavaScript.',
  );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  rmSync(temp, { recursive: true, force: true });
}
