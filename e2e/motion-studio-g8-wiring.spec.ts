/**
 * G8 — Motion Studio 孤儿件接线（Motion Agent / 历史画廊 / 主题面板 / 素材接入）。
 *
 * 全部离线：auth 走 dev-only 的 `__e2e_auth_bypass` cookie（不加 httpOnly，
 * `document.cookie` 能读到——入口页的 e2e 分支正是这么判定的），本地 seed
 * 掉 API key 让 onboarding 弹窗不出现，所有可能计费的域名在网络层被 abort。
 * 素材只走浏览器本地 object URL（blob:），不产生任何网络请求。
 */
import { test, expect, type Page } from '@playwright/test';
import {
  installStudioSession,
  assertNoOnboardingModal,
  waitForWorkbench,
  captureEvidence,
  approveFilmAndOpenWorkbench,
} from './helpers/motion-studio';

/** 1×1 PNG —— 用来验证本地素材接入（不上传、不调外部 API） */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const DUMMY_MUAPI_KEY = 'e2e-dummy-muapi-key-000000';
const DUMMY_OPENAI_KEY = 'e2e-dummy-openai-key-000000';

/**
 * 会话准备：绕过 cookie + 本地 key + 屏蔽计费域名。
 *
 * 另外拦两个接口，让外层壳（StandaloneShell）彻底不弹窗：
 *  - `GET /api/auth/muapi-key`：首屏「从账号恢复 key」用；回一对假 key，
 *    onboarding 弹窗就不会出现（弹窗是在恢复之后才决定要不要弹的）。
 *  - `GET /api/api/v1/account/balance`：余额轮询；用假 key 打真接口会拿到
 *    401/403，壳会把它当成「key 失效」弹出 Settings 挡住点击。
 */
async function installG8Session(page: Page, entrySeen: boolean) {
  await installStudioSession(page, { entrySeen });
  await page.route('**/api/auth/muapi-key', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ key: DUMMY_MUAPI_KEY, openaiKey: DUMMY_OPENAI_KEY }),
        })
      : route.continue(),
  );
  await page.route('**/api/api/v1/account/balance', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ balance: 0, email: 'e2e@example.com' }),
    }),
  );
}

/** 兜底：万一外层壳的弹窗还是冒出来（它比工作室晚渲染），先关掉 */
async function dismissShellModals(page: Page) {
  const close = page.getByRole('button', { name: /^Close$/ });
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if ((await close.count()) === 0) {
      await page.waitForTimeout(400);
      if ((await close.count()) === 0) return;
      continue;
    }
    await close.first().click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

/** 打开 Motion Studio 工作台（跳过入口页，直接进编辑器） */
async function openWorkbench(page: Page) {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(180_000);
  await installG8Session(page, true);
  await page.goto('/studio/motion-studio');
  await waitForWorkbench(page);
  await expect(page.locator('.timeline')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
  await dismissShellModals(page);
  await assertNoOnboardingModal(page);
}

/** 打开右侧工作台（Agent / Prompt / History 三个面之一） */
async function openRail(page: Page, tab: 'agent' | 'prompt' | 'history') {
  // 顶栏只有 Agent / History 两个开关；Prompt 面走工作台内的页签
  if (tab === 'prompt') {
    await page.getByTestId('topbar-agent-toggle').click();
  } else {
    await page.getByTestId(`topbar-${tab}-toggle`).click();
  }
  const rail = page.getByTestId('studio-rail');
  await expect(rail).toBeVisible();
  if (tab === 'prompt') {
    await page.getByTestId('rail-tab-prompt').click();
  }
  await expect(page.getByTestId(`rail-tab-${tab}`)).toHaveAttribute('aria-selected', 'true');
}

/**
 * 点时间标尺 scrub 到某一帧。
 *
 * 播放头停在 0 帧时字卡的词还在入场（透明），画面看着是空的；停在 ~34 帧
 * 文字才真的在画面上。默认缩放是 2px/帧（store.pxPerFrame）。
 */
async function seekToFrame(page: Page, frame: number) {
  const ruler = page.locator('.ruler');
  await expect(ruler).toBeVisible();
  const box = await ruler.boundingBox();
  if (!box) throw new Error('ruler has no box');
  await page.mouse.click(box.x + frame * 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
}

/** Player 里渲染出来的真实字号（getComputedStyle，取的是屏幕上的值） */
const renderedFontSize = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector('.preview-stage');
    if (!stage) return null;
    // 字卡把文案拆成一个个词，所以按单词找带字号的元素
    for (const el of stage.querySelectorAll('div,span,em')) {
      if (el.textContent?.trim() === 'Every') return getComputedStyle(el).fontSize;
    }
    return null;
  });

test.describe('G8 · Motion Studio 孤儿件接线', () => {
  // dev 服务器首次编译 150 张卡片很慢；单测别按 15 分钟的全局超时干等
  test.beforeEach(() => {
    test.setTimeout(300_000);
  });

  test('G8-1: Agent 面板可开，一句话改到 clip 属性，Player 重渲染', async ({ page }) => {
    await openWorkbench(page);

    // 绕过 cookie 不能是 httpOnly——入口页的 e2e 分支要靠 document.cookie 判断
    await expect
      .poll(() => page.evaluate(() => document.cookie))
      .toContain('__e2e_auth_bypass=1');

    // 顶栏按钮打开右侧工作台（Agent 面）
    await openRail(page, 'agent');

    const agentInput = page.getByPlaceholder(/tell the agent/i);
    await expect(agentInput).toBeVisible();

    // 选中时间轨上的 Ink Press 字卡（frame 0，Player 里正显示的就是它）
    // 片段名那一层是 pointer-events:none，命中的是 .clip 本体
    const titleClip = page.locator('.clip', { hasText: 'Ink Press' }).first();
    await expect(titleClip).toBeVisible();
    await titleClip.click();

    // 属性面板里的字号 = 116（卡片 schema 默认值）
    const fontSizeValue = page
      .locator('.prop-row', { hasText: 'Font size' })
      .locator('.slider-val');
    await expect(fontSizeValue).toHaveText('116px');

    // 播放头挪到文字真正入场的帧，画面上才看得见字
    await seekToFrame(page, 34);
    await expect(page.locator('.timecode')).not.toHaveText(/^00:00\.00/);
    expect(await renderedFontSize(page)).toBe('116px');
    await captureEvidence(page, 'test-results/g8-agent-panel-before.png');

    // 发一句话：字号 +18%
    await agentInput.fill('make the text bigger');
    await agentInput.press('Enter');

    // Agent 回执气泡
    await expect(page.getByText(/Set the text size on/)).toBeVisible({ timeout: 60_000 });

    // 属性变了
    await expect(fontSizeValue).toHaveText('137px');

    // Player 重渲染了：画面上真实渲染出来的字号变了
    await expect.poll(() => renderedFontSize(page)).toBe('137px');
    await expect
      .poll(async () => (await page.locator('.preview-stage').innerHTML()).match(/font-size:\s*137px/))
      .toBeTruthy();

    await captureEvidence(page, 'test-results/g8-agent-panel.png');
  });

  test('G8-2: 历史画廊可开，里面是 store 里的真实会话 + 对话', async ({ page }) => {
    await openWorkbench(page);

    // 先用 Agent 造一条真实会话（会话 + 对话都进 store）
    await openRail(page, 'agent');
    const agentInput = page.getByPlaceholder(/tell the agent/i);
    await agentInput.fill('make the text bigger');
    await agentInput.press('Enter');
    await expect(page.getByText(/Set the text size on/)).toBeVisible({ timeout: 60_000 });

    // 切到历史面
    await openRail(page, 'history');
    const history = page.getByTestId('motion-history-section');
    await expect(history).toBeVisible();

    // 真实数据：会话卡 + 那句对话
    await expect(history.getByText('make the text bigger')).toBeVisible({ timeout: 30_000 });
    await expect(history.getByText('Generated')).toBeVisible();

    await captureEvidence(page, 'test-results/g8-history-gallery.png');
  });

  test('G8-3: 主题面板从属性面板里可开，改色真的落到 setThemeColors', async ({ page }) => {
    await openWorkbench(page);

    await page.getByTestId('inspector-tab-theme').click();
    const themePanel = page.locator('.theme-panel');
    await expect(themePanel).toBeVisible();
    await expect(themePanel).toContainText('Presets');
    // 面板本体（预设 + 配色编辑器）确实渲染了
    await expect(themePanel.locator('.theme-panel-heading').first()).toHaveText('Presets');
    await expect(page.getByTestId('inspector-tab-theme')).toHaveAttribute('aria-selected', 'true');

    // 配色编辑器可编辑 → setThemeColors 有入口
    const backgroundHex = themePanel.locator('input[aria-label="Background hex value"]');
    await expect(backgroundHex).toBeVisible();
    await expect(backgroundHex).toHaveValue(/^#[0-9a-f]{6}$/i);

    // 改一个颜色 → 工程的 themeColors 变了 → Player 的舞台底色跟着变
    await backgroundHex.fill('#123456');
    await backgroundHex.blur();
    await expect
      .poll(async () => {
        const html = await page.locator('.preview-stage').innerHTML();
        return html.includes('rgb(18, 52, 86)') || html.includes('#123456');
      })
      .toBe(true);

    // 存档里也写下了这组配色
    await expect
      .poll(async () =>
        page.evaluate(() => {
          try {
            const raw = window.localStorage.getItem('shotcraft-workbench-project-v1');
            if (!raw) return '';
            const p = JSON.parse(raw);
            return JSON.stringify(p.themeColors ?? {});
          } catch {
            return '';
          }
        }),
      )
      .toContain('#123456');

    await captureEvidence(page, 'test-results/g8-theme-panel.png');
  });

  test('G8-4: 提示词条上的素材按钮存在，选文件后素材落成时间轴上的片段', async ({ page }) => {
    await openWorkbench(page);

    await openRail(page, 'prompt');
    const mediaButton = page.getByTestId('motion-prompt-media-button');
    await expect(mediaButton).toBeVisible();

    // 隐藏的 file input（图片 / 视频 / 音频）
    const input = page.getByTestId('motion-prompt-media-input');
    await expect(input).toHaveAttribute('accept', 'image/*,video/*,audio/*');

    const clipsBefore = await page.locator('.clip').count();

    await input.setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: PNG });

    // 缩略图预览（上游 PROMPT_MEDIA_PREVIEW_CLASS）
    await expect(page.getByTestId('motion-prompt-media-thumb')).toBeVisible({ timeout: 30_000 });

    // 素材落成了时间轨上的一个片段
    await expect(page.locator('.clip')).toHaveCount(clipsBefore + 1, { timeout: 30_000 });
    await expect(page.locator('.clip-name', { hasText: 'shot.png' })).toBeVisible();

    // 合成里真的渲染了这个本地素材（blob: 地址）
    await expect(page.locator('.preview-stage img[src^="blob:"]')).toHaveCount(1, {
      timeout: 60_000,
    });

    await captureEvidence(page, 'test-results/g8-media-attach.png');
  });

  test('G8-5: 入口页的素材接入没被破坏（只接一次，接进新工程）', async ({ page }) => {
    // 入口页（没看过入口）
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(180_000);
    await installG8Session(page, false);
    await page.goto('/studio/motion-studio');
    await expect(page.getByPlaceholder('Describe your motion video...')).toBeVisible({
      timeout: 120_000,
    });
    await dismissShellModals(page);
    await assertNoOnboardingModal(page);

    const input = page.getByTestId('motion-prompt-media-input');
    await expect(input).toHaveAttribute('accept', 'image/*,video/*,audio/*');
    await input.setInputFiles({ name: 'entry-shot.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByTestId('motion-prompt-media-thumb')).toBeVisible({ timeout: 30_000 });

    // 描述 + 生成 → 进入工作台
    await page.getByPlaceholder('Describe your motion video...').fill('A calm ink press opener');
    await page.getByRole('button', { name: 'Generate' }).click();

    // "ink press" in the message takes the template path straight to a storyboard;
    // approve it, and the attached screenshot becomes the product shots' page.
    await approveFilmAndOpenWorkbench(page);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const p = JSON.parse(localStorage.getItem('motion-director:project-v1') || '{}');
            return (p.tracks ?? [])
              .flatMap((t: any) => t.clips)
              .filter((c: any) => (c.props?.screens ?? []).some((u: string) => u.startsWith('blob:'))).length;
          }),
        { timeout: 60_000 },
      )
      .toBeGreaterThan(0);

    await captureEvidence(page, 'test-results/g8-entry-media.png');
  });
});
