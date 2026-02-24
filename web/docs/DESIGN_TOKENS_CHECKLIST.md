# 设计令牌使用清单 (Design Tokens Checklist)

团队在写或改 UI 时请遵守本清单，保证主题一致、深色模式与 Telegram 动态主题正常。

---

## 一、必须使用的语义令牌

| 用途           | 使用 Token                         | 示例 |
|----------------|------------------------------------|------|
| 页面/背景      | `background`, `foreground`         | `bg-background`, `text-foreground` |
| 卡片/浮层      | `card`, `card-foreground`          | `bg-card`, `text-card-foreground` |
| 主操作/品牌    | `primary`, `primary-foreground`    | `bg-primary`, `text-primary` |
| 次要/弱化     | `muted`, `muted-foreground`        | `bg-muted`, `text-muted-foreground` |
| 边框/输入      | `border`, `input`, `ring`          | `border-border`, `focus-visible:ring-ring` |
| 错误/危险      | `destructive`, `destructive-foreground` | `bg-destructive`, `text-destructive` |
| 成功/警告      | `success`, `warning`               | `bg-success`, `text-success`, `text-warning` |
| 强调区         | `accent`, `accent-foreground`      | `bg-accent` |

定义见 `src/index.css`（`:root` / `.dark`）与 `tailwind.config.js`。

---

## 二、禁止直接使用的类

- **禁止**：`bg-gray-*`, `text-gray-*`, `bg-white`, `bg-red-*`, `text-red-*`, `border-gray-*`, `text-blue-*`, `bg-green-*`, `text-emerald-*`, `bg-amber-*`, `bg-indigo-*`, `text-purple-*` 等裸色类。
- **例外**：仅在 `index.css` 或 Tailwind 主题扩展内部可引用品牌色 `eden-*`；业务组件一律用上表语义 token。

---

## 三、无障碍 (a11y)

- 交互元素：`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`，禁止仅 `outline-none` 且无替代。
- 当前页 Tab：`aria-current="page"`，每个 Tab 提供 `aria-label`。
- 装饰性图标：加 `aria-hidden`。

---

## 四、Code Review 自检

- [ ] 未使用 `gray/red/white/green/amber/blue/indigo/purple/emerald` 等裸色。
- [ ] 背景/文字/边框均来自语义 token。
- [ ] 按钮/链接等有可见焦点样式。
- [ ] 新组件通过 `ui/` 基元与设计令牌构建。

---

参考：`DESIGN_SYSTEM.md`、`FRONTEND_ANALYSIS_AND_REFACTOR.md`。
