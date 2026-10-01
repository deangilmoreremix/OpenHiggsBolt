import { test, expect } from '@playwright/test';
import { resolveDemoAuthStatePath } from '../playwright.shared';

const BASE_URL = 'http://localhost:3000';
const AUTH_STATE = resolveDemoAuthStatePath();

test.describe('GO AI Viral — Diagnostic', () => {
  test.use({ storageState: AUTH_STATE });

  test('checks feed loading and API', async ({ page }) => {
    await page.goto(`${BASE_URL}/studio/go-ai-viral`);
    
    // Wait for network to be mostly idle
    await page.waitForTimeout(8000);
    
    console.log('URL:', page.url());
    
    // Check for loading indicators
    const loadingText = await page.getByText(/loading/i).count();
    console.log('Loading indicators:', loadingText);
    
    // Check for error messages
    const errorText = await page.getByText(/error/i).count();
    console.log('Error indicators:', errorText);
    
    // Check for any prompt cards by looking for titles
    const allText = await page.textContent('body');
    console.log('Body keywords:', {
      hasGoViral: allText?.includes('GO-Viral'),
      hasPrompts: allText?.includes('prompt'),
      hasFeed: allText?.includes('Feed'),
      hasImage: allText?.includes('Image'),
      hasVideo: allText?.includes('Video'),
      hasPersonalize: allText?.includes('Personalize This Demo'),
      hasCreateStyle: allText?.includes('Create This Style'),
      hasViewPrompt: allText?.includes('View Prompt'),
    });
    
    // Check API response
    const apiResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/go-ai-viral/prompts?page=1&pageSize=1');
        const data = await res.json();
        return { status: res.status, dataKeys: data ? Object.keys(data) : [], count: data?.data?.length };
      } catch (e) {
        return { error: String(e) };
      }
    });
    console.log('API response:', JSON.stringify(apiResponse));
    
    await page.screenshot({ path: 'playwright/marketing-artifacts/diag-go-ai-viral-2.png', fullPage: true });
  });
});
