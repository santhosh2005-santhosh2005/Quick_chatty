
import puppeteer from 'puppeteer';
import { fork } from 'child_process';
import { issueToken } from '../src/auth.js';

describe('Integration Test', () => {
  let browser1, browser2, page1, page2, serverProcess;
  const sessionId = 'integration-test';

  beforeAll(async () => {
    // Start the relay server
    serverProcess = fork('src/index.js', {
      env: { ...process.env, RELAY_PORT: 5003 },
      silent: true,
    });

    // Wait for the server to start
    await new Promise(resolve => {
      serverProcess.stdout.on('data', data => {
        if (data.toString().includes('Relay server running')) {
          resolve();
        }
      });
    });

    // Launch browsers
    browser1 = await puppeteer.launch();
    browser2 = await puppeteer.launch();
    page1 = await browser1.newPage();
    page2 = await browser2.newPage();

    const token = issueToken({ sessionId });
    const url = `file://${process.cwd()}/test.html?sessionId=${sessionId}&token=${token}`;

    await page1.goto(url);
    await page2.goto(url);
  }, 30000); // 30s timeout for setup

  afterAll(async () => {
    await browser1.close();
    await browser2.close();
    serverProcess.kill();
  });

  it('should sync text between two clients', async () => {
    const textToType = 'hello world';

    // Type in the first editor
    await page1.type('#editor', textToType);

    // Wait for the text to appear in the second editor
    await page2.waitForFunction(
      (text) => document.getElementById('editor').value === text,
      {},
      textToType
    );

    const textInEditor2 = await page2.evaluate(() => document.getElementById('editor').value);
    expect(textInEditor2).toBe(textToType);
  }, 20000); // 20s timeout for the test
});
