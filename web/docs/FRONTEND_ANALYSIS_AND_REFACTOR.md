# Eden Web 前端分析与重构建议

## 一、技术栈概览

| 层级 | 技术 |
|------|------|
| 框架 | React 18 |
| 构建 | Vite 4, @vitejs/plugin-react |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 3, tailwindcss-animate, PostCSS |
| UI 基元 | Radix UI (Dialog, Label, Select, Tabs) |
| 工具 | CVA, clsx, tailwind-merge (`cn`) |
| 表单 | react-hook-form, @hookform/resolvers, Zod |
| 动效 | Framer Motion |
| 平台 | Telegram Mini App (@telegram-apps/sdk, @twa-dev/sdk) |
| 图标 | Lucide React |

设计令牌与主题已在 `src/index.css` 中定义（`:root` / `.dark`、Eden 品牌色、语义色），Tailwind 配置也映射了 `--tg-theme-*` 与 fallback。**问题在于大量组件未使用这些令牌，而是直接使用硬编码颜色。**

---

## 二、主要 UI/UX 问题

### 1. 硬编码颜色，破坏主题与深色模式

设计系统已提供语义令牌（`background`、`foreground`、`muted`、`destructive`、`primary` 等），但很多地方仍使用 Tailwind 原始色类，导致：

- 深色模式下部分区域仍是浅色（如 `bg-white`、`bg-gray-50`）；
- 与 Telegram 动态主题不一致；
- 品牌色与语义色不统一。

**典型位置：**

| 文件 | 问题类示例 |
|------|------------|
| `App.tsx` | `bg-gray-50`, `text-gray-500`, `text-red-600`, `text-gray-600`, `text-gray-400` |
| `Root.tsx` (ErrorFallback) | `bg-red-50`, `text-red-600`, `bg-white/50`, `bg-red-600`, `border-red-200` |
| `BottomTabBar.tsx` | `text-gray-400`, `text-gray-600`, `text-gray-500`（未激活态） |
| `SettingsMenu.tsx` | 大量 `gray-*`, `white`, `border-gray-*`, `bg-amber-*`, `text-red-*` |
| `EmptyState.tsx` | `text-gray-300`, `text-gray-500`, `text-gray-400` |
| `BottomDrawer.tsx` | `bg-white`, `text-gray-400`, `bg-gray-50` |
| `SuccessOverlay.tsx` | `bg-white`, `bg-green-500`, `text-gray-900` |
| Admin 表单页 | `bg-white`, `text-gray-500`, `bg-gray-50`, `border-gray-200`, `text-red-500` |
| 其他 | `ErrorRetry`, `Skeleton`, `StoreRequest`, `StoreBill`, `MarketHeader`, `MarketItemRow`, `RoleBadge` 等 |

**建议：** 全项目将 `gray-*` / `red-*` / `white` 等替换为语义令牌：`bg-background`、`text-foreground`、`text-muted-foreground`、`bg-destructive`、`text-destructive`、`bg-card`、`border-border` 等。

---

### 2. Tailwind `content` 路径错误

`tailwind.config.js` 中：

```js
content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
],
```

项目实际源码均在 `web/src/` 下，不存在 `web/pages/`、`web/components/`、`web/app/`。前三条路径无效，可能造成误以为样式已覆盖或扫不到类。建议只保留 `./src/**/*.{ts,tsx}`，或按实际目录调整。

---

### 3. 无障碍（a11y）

- **底部 Tab：** 使用普通 `<button>`，未设置 `aria-current="page"`、无稳定 `aria-label`，读屏无法明确“当前页”和“可导航项”。
- **焦点样式：** 部分组件使用 `outline-none` / `focus:outline-none` 且无替代可见焦点（如 `focus-visible:ring-2`），键盘用户难以识别焦点。`ui/` 下组件已用 `focus-visible:ring`，但部分业务组件仍混用 `focus:` 或去掉 outline。
- **地标：** `AppLayout` 的 `<main>` 依赖浏览器默认；若需更强 a11y，可显式 `role="main"` 并保证仅一个 main。

建议：Tab 项加 `aria-current={isActive ? 'page' : undefined}` 和 `aria-label`；全站交互元素统一使用 `focus-visible:ring-*`，避免无替代的 `outline-none`。

---

### 4. 国际化与 HTML 属性

- `index.html` 中 `<html lang="en">` 写死。应用支持 en/ru/uz/cn，应根据当前语言（如 LanguageContext）动态设置 `document.documentElement.lang`，以利读屏和 SEO。

---

### 5. 结构与可维护性

- 无独立 `pages/` 或 `app/` 目录，路由与页面组件混在 `components/` 下（如 `MarketRun`, `StoreRequest`, `admin/*`）。功能增多后不利于按功能/路由划分。
- 共享组件（`EmptyState`, `ErrorRetry`, `BottomDrawer` 等）与业务强耦合的样式（硬编码色）混在一起，不利于复用时保持主题一致。

---

## 三、重构建议

### 方案 A：渐进式修复（推荐先做）

在不做大结构变动的前提下，优先解决主题一致性和 a11y：

1. **设计令牌替换**
   - 逐个文件将 `gray-*` / `red-*` / `white` 等替换为 `index.css` 与 `tailwind.config.js` 中已有语义色（如 `background`, `foreground`, `muted`, `muted-foreground`, `destructive`, `card`, `border` 等）。
   - 为“成功/警告”等状态统一使用 `success` / `warning` / `danger`，避免散落 `green-500`、`amber-*` 等。

2. **Tailwind 配置**
   - 将 `content` 改为只包含实际存在的路径（至少包含 `./src/**/*.{ts,tsx}`），删除不存在的 `./pages/`、`./components/`、`./app/`。

3. **无障碍**
   - 底部 Tab：为每个 tab 设置 `aria-label` 和 `aria-current="page"`（当前页）。
   - 全局：检查所有 `outline-none`，确保均有 `focus-visible:ring-*` 等替代焦点样式。

4. **HTML lang**
   - 在 `LanguageProvider` 或根布局中，根据当前语言设置 `document.documentElement.lang`。

5. **ErrorFallback / 全局状态**
   - 使用设计令牌重写 `Root.tsx` 的 ErrorFallback，以及 App 中的 loading/error 区块（如 `App.tsx` 的未授权、加载中视图），保证与主题一致。

预计工作量：中等，可按模块（如先 layout + shared，再 admin，再 market/store）分批替换。

---

### 方案 B：全面重构

若希望同时提升可维护性和长期扩展性，可在方案 A 的基础上增加：

1. **目录结构**
   - 增加 `src/pages/`（或 `src/app/`），按路由放置页面级组件；`components/` 仅保留可复用 UI 与业务组件。
   - 将路由与页面一一对应，便于按页面做懒加载和权限控制。

2. **设计系统文档与约束**
   - 在文档中明确“禁止直接使用 gray/red/white 等，必须使用语义令牌”。
   - 可选：用 ESLint 规则或 Tailwind 的 `safelist`/限制，对裸色类做提示或限制。

3. **组件库统一**
   - 所有新组件与旧组件改造时，统一通过 `ui/` 基元（Button、Input、Sheet 等）和设计令牌构建，避免再出现硬编码色。

4. **无障碍与测试**
   - 系统性检查键盘导航、焦点顺序、ARIA；可选引入 `eslint-plugin-jsx-a11y` 与简单 e2e（如 Playwright）做关键路径 a11y 检查。

方案 B 工作量大，适合作为中长期规划，与方案 A 分阶段进行。

---

## 四、建议执行顺序

1. **立即：** 修正 `tailwind.config.js` 的 `content`，并选 1～2 个高频页面（如 App 入口、BottomTabBar、SettingsMenu）做令牌替换与 a11y 小改，验证深色模式与 Telegram 主题。
2. **短期：** 按模块完成全项目颜色令牌替换；底部 Tab 与全局焦点样式 a11y 修复；`document.documentElement.lang` 与 LanguageContext 同步。
3. **中期：** ErrorFallback、EmptyState、BottomDrawer 等共享组件全部改用令牌；必要时引入 a11y 规则与简单自动化检查。
4. **可选：** 若团队有时间，再考虑方案 B 的目录重构与设计系统文档/约束。

---

## 五、小结

- **核心问题：** 设计系统已有完善的 CSS 变量与 Tailwind 主题，但大量组件未使用，导致主题不一致、深色模式异常、可维护性差。
- **次要问题：** Tailwind 配置路径冗余、底部 Tab 与焦点 a11y 不足、HTML lang 未随语言更新。
- **推荐：** 先做渐进式修复（方案 A），再视需要做全面重构（方案 B）。如需，我可以按上述顺序从具体文件开始改起（例如先改 `tailwind.config.js`、`App.tsx`、`BottomTabBar.tsx`、`Root.tsx`）。

---

## 六、已执行的重构（本次完成）

以下工作已完成，可作为后续维护参考：

1. **Tailwind**  
   - `tailwind.config.js` 的 `content` 已改为仅 `['./index.html', './src/**/*.{ts,tsx}']`。

2. **页面层 `src/pages/`**  
   - 新增 `Dispatcher.tsx`（从 App 抽离的角色分发页）。  
   - 新增 `StoreRequestPage`、`MarketRunPage`、`StoreBillPage` 及 `admin/*` 各页的 re-export；`App.tsx` 从 `./pages` 与 `./pages/admin` 导入页面组件。

3. **设计令牌替换**  
   - 全项目将硬编码的 `gray-*`、`red-*`、`white`、`emerald-*`、`amber-*`、`blue-*` 等替换为语义 token：`background`、`foreground`、`card`、`muted`、`muted-foreground`、`primary`、`destructive`、`border`、`success`、`warning` 等。  
   - 涉及文件：`App`（现为 Dispatcher）、`Root`（ErrorFallback）、`ToastContext`、`EmptyState`、`ErrorRetry`、`BottomDrawer`、`SuccessOverlay`、`Skeleton`、`RoleBadge`、`QuantityControl`、`StoreBill`、`BottomTabBar`、`SettingsMenu`、`PageHeader`、`StoreRequest`、`MarketHeader`、`MarketItemRow`、`MarketShoppingList`、`MarketDistributionList`、Admin 表单页（Store/User/Product）等。

4. **无障碍与 i18n**  
   - 底部 Tab：每个 tab 增加 `aria-label`、`aria-current="page"`，Settings 按钮增加 `aria-label`、`aria-expanded`；所有 tab 按钮增加 `focus-visible:ring-2 focus-visible:ring-ring`。  
   - `LanguageProvider` 中根据当前语言设置 `document.documentElement.lang`（en / ru / uz / zh-CN）。  
   - `AppLayout` 的 `<main>` 增加 `role="main"`。  
   - ErrorFallback 与部分按钮增加 `focus-visible` 焦点样式。

5. **设计系统约定**  
   - 新增 `docs/DESIGN_SYSTEM.md`，约定必须使用设计令牌、禁止裸色类、a11y 与目录结构要求，便于后续开发遵守。
