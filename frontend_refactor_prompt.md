# Eden ERP 前端重构详细文档 (Prompt for LLM)

## 1. 项目背景与目标
**Eden ERP** 是一套作为 **Telegram Mini App (TMA)** 运行的多门店综合经营管理系统的前端。当前希望完全重构前端，以提升代码质量、UI/UX，并符合 TMA 的最新设计规范和交互标准。

## 2. 技术栈 (Tech Stack)
- **核心构建**: React 18 + Vite + TypeScript
- **路由与状态管理**: React Router DOM (v6, HashRouter) + React Context (User, Language, Toast)
- **UI 框架与样式**: Tailwind CSS (v3) + Radix UI (原生无头组件) + Framer Motion (动画) + Lucide React (图标)
- **表单与验证**: React Hook Form + Zod
- **Telegram 集成**: `@telegram-apps/sdk`, `@telegram-apps/sdk-react` (用于主题解析、安全区获取、返回键控制、Haptic 反馈等)
- **其他**: Fuse.js (模糊搜索), 自定义 i18n (原生实现)

## 3. 核心业务逻辑与角色权限 (RBAC)
应用入口 `AppDispatcher` 会根据用户角色重定向到不同路由：
- **Admin (管理员)**
  - 权限：拥有所有访问权限。能够模拟其他角色。
  - 访问路径：`/admin/*` (包含产品管理、用户管理、门店管理、摊位管理)
- **Store Manager (店长)**
  - 权限：管理特定门店的订货请求、查看账单。
  - 访问路径：`/store` (发起或管理请求), `/store/bills` (查看每日账单)
- **Global Purchaser (全局采购员)**
  - 权限：查看汇总订单、在市场执行采购、创建批次、分配费用。
  - 访问路径：`/market` (市场采购执行), `/store/bills` (查看各店账单及公摊记录)

## 4. 核心功能与页面结构 (Features & Routes)
### 4.1. Admin (管理后台 - `/admin`)
- **Inventory Master (`/admin/products`)**: 基础商品库管理，包含分类筛选、多语言商品名称录入、参考价格、默认摊位分配。
- **Store List (`/admin/stores`)**: 门店列表，添加和修改门店信息（名称、地址等）。
- **User List (`/admin/users`)**: 账号及权限分配，能够将用户分配给特定 `role` 级允许其访问的 `allowed_store_ids`。
- **Stall Manager (`/admin/stalls`)**: 市场摊位管理（如蔬菜区、肉类区等），支持禁用/启用、排序操作。

### 4.2. Store Manager (门店请求 - `/store`)
- **Store Request (`/store`)**: 根据分类展示商品，支持加减数量（购物车模式）。支持保存常用模板 (OrderTemplate)。提交时选择 Delivery Date 并带上各商品备注。
- **Store Bills (`/store/bills`)**: 每日账单页面，可查看当天的各项开销详情（分项价格、总价）及公摊费用明细。

### 4.3. Global Purchaser (市场采购 - `/market`)
- **Market Run (`/market`)**: 核心采购执行界面。
  - **按摊位汇总 (Stall Consolidation)**: 聚合当天所有门店的请求，按照商品绑定的 Default Stall 分组展示需要购买的商品总数与详细（如 A店要5斤，B店要3斤，总计8斤）。
  - **采购录入 (Batch Submission)**: 记录在该摊位实际购买的总量及总金额，系统会自动计算实际单位成本 (Unit Price = Total Cost / Total Quantity) 以供月末/当日结算。
  - **公共费用分配 (Shared Expenses)**: 录入如打车费、搬运费等，选择分摊方式（`equal` 平均分摊 或 `proportional` 按采购比例/额度分摊）。

## 5. 核心 API 与数据模型 (Data Models)
所有请求都通过 `src/api/client.ts` 集中处理。包含以下资源：
- **Products**: `id, category_id, default_stall_id, name_i18n, unit_i18n, price_reference, is_active`
- **Categories**: `id, name_i18n, sort_order`
- **Stalls**: `id, name, location, sort_order, is_active`
- **Stores**: `id, name, address, location, config, is_active`
- **Users**: `id, telegram_id, role, allowed_store_ids`
- **Orders**: `store_id, delivery_date, items [{ product_id, quantity_requested, notes }]`
- **Purchases (Batch)**: `market_location, items [{ product_id, total_quantity_bought, total_cost_uzs }]`
- **Templates**: `store_id, name, items [{product_id, quantity}]`
- **Shared Expenses**: `expense_date, expense_type, amount, split_method (equal|proportional)`
- **Daily Bills**: 聚合视图，包含各店物品详情 (`items`) 及 分摊费用详情 (`expenses`)。

## 6. Telegram Mini App (TMA) 特殊要求
作为 TMA，前端必须遵循以下原则处理 UI 和逻辑：
- **认证 (Auth)**: 必须从 `@telegram-apps/sdk` 中获取 `initData`，随每个请求将其通过 `X-Telegram-Init-Data` Header 发送给后端验证。本地开发时使用 `X-Dev-Telegram-Id`。
- **主题适配 (Theme)**: 监听并应用 Telegram 传入的主题变量 (`themeParams`)。如果启用了 Dark Mode，需动态在 `<html>` 上加上 `.dark` 类，使 Tailwind 工作。
- **安全区 (Safe Area)**: （重要！）必须使用 `useSignal` 挂载获取 Telegram 的 `safeAreaInsets`，在顶部和底部补充 padding，避免内容被操作系统的刘海或 Telegram 原生关闭按钮遮挡。
- **返回按钮 (Back Button)**: 监听路由变化，若不在首页，需展示 Telegram App 原生的 Back Button (`backButton.show()`) 并绑定路由的 `navigate(-1)`。
- **全屏 (Fullscreen)**: 支持 TMA 全屏展开 (`expand()`)。
- **Haptic 反馈**: 点击购物车、提交按钮、错误弹窗等，需要调用 `hapticFeedback.impactOccurred('light' | 'medium' | 'error')` 增加原生体验。

## 7. UI/UX 设计规范与建议
- 要求美观、现代、流畅，带有细微动画 (`framer-motion`)。
- **颜色系统**: 建议保留原版品牌色作为主色调，并适配暗色主题。
- **多语言 (i18n)**: 当前支持 en, ru, uz, cn，所有商品名称 (`name_i18n`) 和 UI 文本必须依赖语言上下文渲染。

## 8. 重构时的要求重点
1. **代码结构**: 保持组件的高内聚低耦合，拆分过于臃肿的组件（如 `MarketRun`, `StoreRequest`）。可以考虑使用特征驱动目录结构 (Feature-sliced design)。
2. **状态管理**: 评估是否引入 Zustand 等轻量级库替代多层 Content，以提升渲染性能。
3. **样式一致性**: 使用 Tailwind 组件类或 `class-variance-authority` (cva) 彻底统一 Button, Input, Card 的风格。
4. **用户体验**: 在表单中严格使用 Zod 验证，错误提示必须即时明确；表格和列表添加骨架屏 (Skeleton) 防止数据加载时界面跳动。
5. **TMA 兼容性**: 完美解决所有移动端设备的适配（特别是 iPhone 底部小黑条、顶部刘海以及输入法键盘弹起导致的遮挡问题）。

---
本文件旨在包含目前 Eden ERP 重构前端业务逻辑分析和需求汇总，在编写新代码前，请以本文档内容为事实标准，逐步搭建并迁移相应模块。
