# Eden ERP — 项目结构说明

## 目录结构

```
eden-erp/
├── app/                    # 后端 FastAPI 应用
│   ├── main.py, config.py, database.py, models.py, schemas.py
│   ├── migrations/         # Alembic 迁移
│   ├── routers/            # API 路由
│   └── services/           # 业务逻辑
├── web/                    # 前端 React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/          # 路由级页面
│   │   ├── components/     # 组件
│   │   ├── api/, contexts/, hooks/, i18n/, lib/
│   └── docs/               # 前端设计系统与重构文档
├── tests/                  # 后端 pytest
├── scripts/                # 迁移与种子脚本（migrate_v2, seed_products）
├── .github/workflows/      # CI/CD（测试 + Cloud Run 部署）
├── docker-compose*.yml     # 本地 / GCE / 生产
├── Dockerfile*             # 单体 / 后端 / 前端
├── requirements.txt
├── alembic.ini
└── .env.example            # 环境变量示例（勿提交 .env）
```

## 部署说明

- **CI/CD**：推送到 `main` 触发 `.github/workflows/deploy.yml`，运行测试后构建并部署到 **Cloud Run**（后端 + 前端）。数据库 URL 使用 GitHub Secrets `DATABASE_URL`。
- **本地**：复制 `.env.example` 为 `.env`，配置 `DATABASE_URL` 后可用 `docker-compose up` 或直接运行后端/前端。
- **Knative/自定义**：若需使用 Knative 等，可参考 `backend-service.example.yaml`（勿将含真实凭证的 `backend-service.yaml` 提交；已加入 `.gitignore`）。

## 已清理内容

- **backend-service.yaml**：曾包含硬编码数据库凭证且未被 CI 引用，已删除。若该凭证曾用于生产，请在 Neon 控制台轮换密码。本地或自建部署请使用 `backend-service.example.yaml` 并配合 Secret 使用。
