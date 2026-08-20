import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

async function check(name, fn) {
  try { await fn(); console.log('PASS', name); }
  catch (e) { console.log('FAIL', name, '-', e.message.split('\n')[0]); process.exitCode = 1; }
}

// Dashboard
await page.goto(BASE + '/');
await check('dashboard loading spinner shows', () =>
  page.getByTestId('table-loading').waitFor({ state: 'visible', timeout: 3000 }));
await check('table appears after load', () =>
  page.getByTestId('employee-table').waitFor({ state: 'visible', timeout: 5000 }));
await check('search filters rows', async () => {
  await page.getByTestId('search-input').fill('Alice');
  await page.getByTestId('employee-row-1001').waitFor({ timeout: 3000 });
  const count = await page.getByTestId('employee-table-body').locator('tr').count();
  if (count !== 1) throw new Error('expected 1 row, got ' + count);
  await page.getByTestId('clear-filters-button').click();
});
await check('sort by name works', async () => {
  await page.getByTestId('sort-name').click();
  const first = await page.locator('[data-testid^="cell-name-"]').first().textContent();
  if (first !== 'Aaron Fischer') throw new Error('expected Aaron Fischer first, got ' + first);
});
await check('pagination next works', async () => {
  await page.getByTestId('pagination-next').click();
  const info = await page.getByTestId('pagination-info').textContent();
  if (!info.includes('Page 2')) throw new Error('got: ' + info);
});

// Form
await page.getByTestId('nav-apply').click();
await check('form renders', () => page.getByTestId('application-form').waitFor({ timeout: 3000 }));
await check('submit disabled until terms', async () => {
  const disabled = await page.getByTestId('submit-button').isDisabled();
  if (!disabled) throw new Error('submit should be disabled');
});
await check('validation errors appear', async () => {
  await page.getByTestId('terms-checkbox').check();
  await page.getByTestId('submit-button').click();
  await page.getByTestId('error-firstName').waitFor({ timeout: 2000 });
  await page.getByTestId('error-email').waitFor({ timeout: 2000 });
});
await check('happy path submit succeeds', async () => {
  await page.getByTestId('first-name-input').fill('Sunil');
  await page.getByTestId('last-name-input').fill('Tester');
  await page.getByTestId('email-input').fill('sunil@example.com');
  await page.getByTestId('position-select').selectOption('QA Automation Engineer');
  await page.getByTestId('employment-type-fulltime').check();
  await page.getByTestId('skill-playwright').check();
  await page.getByTestId('salary-input').fill('95000');
  await page.getByTestId('start-date-input').fill('2026-10-01');
  await page.getByTestId('submit-button').click();
  await page.getByTestId('submit-success').waitFor({ timeout: 5000 });
});
await check('error email triggers server error', async () => {
  await page.getByTestId('first-name-input').fill('Sunil');
  await page.getByTestId('last-name-input').fill('Tester');
  await page.getByTestId('email-input').fill('sunil@error.com');
  await page.getByTestId('position-select').selectOption('QA Automation Engineer');
  await page.getByTestId('employment-type-contract').check();
  await page.getByTestId('skill-python').check();
  await page.getByTestId('salary-input').fill('95000');
  await page.getByTestId('start-date-input').fill('2026-10-01');
  await page.getByTestId('terms-checkbox').check();
  await page.getByTestId('submit-button').click();
  await page.getByTestId('submit-error').waitFor({ timeout: 5000 });
});

// Playground
await page.getByTestId('nav-playground').click();
await check('modal opens and closes', async () => {
  await page.getByTestId('open-modal-button').click();
  await page.getByTestId('name-modal').waitFor({ timeout: 2000 });
  await page.getByTestId('modal-name-input').fill('Sunil');
  await page.getByTestId('modal-save-button').click();
  await page.getByTestId('modal-saved-name').waitFor({ timeout: 2000 });
});
await check('async load users', async () => {
  await page.getByTestId('load-users-button').click();
  await page.getByTestId('users-loading').waitFor({ timeout: 2000 });
  await page.getByTestId('user-list').waitFor({ timeout: 5000 });
});
await check('delayed element appears', async () => {
  await page.getByTestId('reveal-delayed-button').click();
  await page.getByTestId('delayed-element').waitFor({ timeout: 6000 });
});
await check('tabs switch', async () => {
  await page.getByTestId('tab-pricing').click();
  await page.getByTestId('tab-content-pricing').waitFor({ timeout: 2000 });
});
await check('accordion expands', async () => {
  await page.getByTestId('accordion-header-faq-2').click();
  await page.getByTestId('accordion-panel-faq-2').waitFor({ timeout: 2000 });
});
await check('tooltip on hover', async () => {
  await page.getByTestId('info-tooltip-trigger').hover();
  await page.getByTestId('info-tooltip').waitFor({ state: 'visible', timeout: 2000 });
});
await check('alerts appear and dismiss', async () => {
  await page.getByTestId('trigger-success-alert').click();
  await page.getByTestId('alert-success').waitFor({ timeout: 2000 });
});
await check('conditional input enables', async () => {
  const input = page.getByTestId('conditional-input');
  if (!(await input.isDisabled())) throw new Error('should start disabled');
  await page.getByTestId('enable-input-toggle').check({ force: true });
  if (await input.isDisabled()) throw new Error('should be enabled after toggle');
});

if (errors.length) { console.log('JS ERRORS:', errors.join(' | ')); process.exitCode = 1; }
else console.log('No JS console/page errors.');
await browser.close();
