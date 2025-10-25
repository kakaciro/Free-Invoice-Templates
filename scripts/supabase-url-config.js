/**
 * Supabase URL Configuration Automator
 * Logs into Supabase dashboard and sets Auth → URL Configuration:
 * - Site URL = https://www.freeonlineinvoice.org
 * - Redirect URLs = [index.html, auth-confirm.html, password-reset-confirm.html]
 *
 * Usage (PowerShell on Windows):
 *   npm i puppeteer
 *   $env:SUPABASE_EMAIL="your-login@email"
 *   $env:SUPABASE_PASSWORD="your-password"
 *   node scripts/supabase-url-config.js
 *
 * Optional env overrides:
 *   $env:SITE_URL="https://www.freeonlineinvoice.org"
 *   $env:REDIRECT_URLS="https://www.freeonlineinvoice.org/index.html,https://www.freeonlineinvoice.org/auth-confirm.html,https://www.freeonlineinvoice.org/password-reset-confirm.html"
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getProjectRefFromAnonKey(anonKey) {
  try {
    const payloadBase64 = anonKey.split('.')[1];
    const payloadJson = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
    return payloadJson && payloadJson.ref ? payloadJson.ref : null;
  } catch (e) {
    return null;
  }
}

function readConfigJs() {
  const configPath = path.resolve(__dirname, '..', 'config.js');
  const content = fs.readFileSync(configPath, 'utf-8');
  const urlMatch = content.match(/SUPABASE_URL\s*=\s*'([^']+)'/);
  const keyMatch = content.match(/SUPABASE_ANON_KEY\s*=\s*'([^']+)'/);
  const redirectMatch = content.match(/REDIRECT_ORIGIN\s*=\s*'([^']+)'/);
  return {
    supabaseUrl: urlMatch ? urlMatch[1] : null,
    anonKey: keyMatch ? keyMatch[1] : null,
    redirectOrigin: redirectMatch ? redirectMatch[1] : 'https://www.freeonlineinvoice.org'
  };
}

async function clickByText(page, text) {
  const handles = await page.$x(`//*[contains(normalize-space(text()), '${text}')]`);
  if (handles && handles.length) {
    await handles[0].click();
    return true;
  }
  return false;
}

async function setInputNearLabel(page, labelText, value) {
  const elements = await page.$x(`//*[contains(normalize-space(text()), '${labelText}')]`);
  if (!elements.length) throw new Error(`Label not found: ${labelText}`);
  const elHandle = elements[0];
  // Find an input within the same container
  const parent = (await elHandle.getProperty('parentElement')).asElement();
  let input = null;
  if (parent) {
    input = await parent.$('input');
  }
  if (!input) {
    // Try searching deeper within ancestors
    const container = await elHandle.evaluateHandle((el) => el.closest('div'));
    input = await container.asElement().$('input');
  }
  if (!input) throw new Error(`Input near label not found: ${labelText}`);
  await input.click({ clickCount: 3 });
  await input.type(value);
}

async function run() {
  const { supabaseUrl, anonKey, redirectOrigin } = readConfigJs();
  if (!anonKey) throw new Error('Cannot read SUPABASE_ANON_KEY from config.js');
  const projectRef = getProjectRefFromAnonKey(anonKey);
  if (!projectRef) throw new Error('Cannot decode project ref from anon key');

  const email = process.env.SUPABASE_EMAIL;
  const password = process.env.SUPABASE_PASSWORD;
  if (!email || !password) {
    throw new Error('Please set SUPABASE_EMAIL and SUPABASE_PASSWORD environment variables');
  }

  const SITE_URL = process.env.SITE_URL || redirectOrigin;
  const REDIRECT_URLS = (process.env.REDIRECT_URLS || [
    `${redirectOrigin}/index.html`,
    `${redirectOrigin}/auth-confirm.html`,
    `${redirectOrigin}/password-reset-confirm.html`
  ].join(',')).split(',').map(s => s.trim()).filter(Boolean);

  const dashboardSignInUrl = 'https://supabase.com/dashboard/sign-in';
  const urlConfigPath = `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`;

  console.log('[Start] Launching browser...');
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();

  try {
    console.log('[Navigate] Sign in page');
    await page.goto(dashboardSignInUrl, { waitUntil: 'networkidle2' });

    // Fill login form (selectors may evolve; use flexible approach)
    console.log('[Login] Filling credentials');
    const emailSelector = 'input[type="email"], input[name="email"]';
    const pwdSelector = 'input[type="password"], input[name="password"]';
    await page.waitForSelector(emailSelector, { timeout: 15000 });
    await page.type(emailSelector, email, { delay: 20 });
    await page.waitForSelector(pwdSelector, { timeout: 15000 });
    await page.type(pwdSelector, password, { delay: 20 });

    // Click Sign In button
    await clickByText(page, 'Sign in');

    // Wait for dashboard to load
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

    console.log('[Navigate] URL Configuration page');
    await page.goto(urlConfigPath, { waitUntil: 'networkidle2' });

    // Set Site URL
    console.log('[Configure] Setting Site URL:', SITE_URL);
    await setInputNearLabel(page, 'Site URL', SITE_URL);
    // Click Save changes if visible
    await clickByText(page, 'Save changes').catch(() => {});

    // Add Redirect URLs
    console.log('[Configure] Adding Redirect URLs:', REDIRECT_URLS);
    for (const url of REDIRECT_URLS) {
      // Click Add URL, then fill the last input
      await clickByText(page, 'Add URL');
      // Find the last list item input
      const inputs = await page.$$('input');
      const lastInput = inputs[inputs.length - 1];
      if (!lastInput) throw new Error('Redirect URL input not found');
      await lastInput.click({ clickCount: 3 });
      await lastInput.type(url);
      // Optional: Press Enter to confirm
      await page.keyboard.press('Enter');
    }

    // Final save if required
    await clickByText(page, 'Save changes').catch(() => {});

    // Basic verification (re-read Site URL value)
    await page.waitForTimeout(2000);
    console.log('[Verify] Configuration update attempted. Please double-check in dashboard.');

  } catch (err) {
    console.error('[Error]', err);
  } finally {
    console.log('[Done] Closing browser in 3s...');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});