# Eden Web 设计系统约定

本项目的 UI 必须通过 **设计令牌（design tokens）** 保持主题一致、支持深色模式与 Telegram 动态主题。禁止在业务组件中直接使用 Tailwind 原始色类。

## 1. 颜色令牌（必须使用）

所有背景、文字、边框、状态色均使用 `src/index.css` 与 `tailwind.config.js` 中定义的语义令牌：


| 用途        | Token                                         | 示例                                         |
| --------- | --------------------------------------------- | ------------------------------------------ |
| 页面/背景     | `background`, `foreground`                    | `bg-background`, `text-foreground`         |
| 卡片/浮层     | `card`, `card-foreground`                     | `bg-card`, `text-card-foreground`          |
| 主操作/品牌    | `primary`, `primary-foreground`               | `bg-primary`, `text-primary`               |
| 次要/弱化     | `muted`, `muted-foreground`                   | `bg-muted`, `text-muted-foreground`        |
| 强调区       | `accent`, `accent-foreground`                 | `bg-accent`                                |
| 边框/输入框    | `border`, `input`, `ring`                     | `border-border`, `focus-visible:ring-ring` |
| 错误/危险     | `destructive`, `destructive-foreground`       | `bg-destructive`, `text-destructive`       |
| 成功/警告     | `success`, `warning`, `danger`                | `bg-success`, `text-warning`               |
| 品牌色（Eden） | `eden-50`, `eden-500`, `eden-600`, `eden-700` | `text-eden-500`, `bg-eden-50`              |


## 2. 禁止使用的类

- **禁止**：`bg-gray-`*, `text-gray-*`, `bg-white`, `bg-red-*`, `text-red-*`, `border-gray-*`, `text-blue-*`, `bg-green-*`, `text-emerald-*`, `bg-amber-*` 等原始色。
- **例外**：仅在设计系统内部（如 `index.css`、Tailwind 主题扩展）或极少数需要固定品牌色且无语义 token 时，可保留 `eden-`*；其余一律用上表语义 token。

## 3. 无障碍（a11y）

- **焦点**：交互元素必须具有可见焦点样式，使用 `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`（或等效），禁止仅使用 `outline-none` 且无替代。
- **导航**：当前页 Tab 使用 `aria-current="page"`，每个 Tab 提供 `aria-label`。
- **地标**：主内容区使用 `<main role="main">`。
- **语言**：`<html lang="">` 由 `LanguageContext` 根据当前语言动态设置（en / ru / uz / zh-CN）。

## 4. 目录约定

- **路由级页面**：放在 `src/pages/`，通过 `src/pages/index.ts` 统一导出；`App.tsx` 仅从 `pages` 导入页面组件。
- **可复用 UI**：`src/components/ui/` 为基元组件，`src/components/shared/` 为跨功能共享组件，`src/components/layout/` 为布局与导航。
- **业务组件**：按功能放在 `src/components/` 子目录（如 `admin/`, `store-request/`, `market-run/`）。

## 5. 参考

- 设计令牌定义：`src/index.css`（`:root` 与 `.dark`）
- Tailwind 主题映射：`tailwind.config.js`（colors, borderRadius, zIndex）
- 前端分析与重构说明：`docs/FRONTEND_ANALYSIS_AND_REFACTOR.md`

