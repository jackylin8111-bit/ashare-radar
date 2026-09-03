# A股主线雷达 MVP

面向 A 股短中线研究的可追溯评分终端。当前版本使用明确标注的 Mock 数据，不包含自动下单能力。

## 本地运行

```bash
npm ci
npm run dev
```

- 前端开发地址：`http://127.0.0.1:5173`
- API 健康检查：`http://127.0.0.1:3001/api/health`

## 生产构建

```bash
npm run build
npm start
```

生产模式由 Express 同时提供 `dist/` 静态页面与 `/api/*` 接口，并支持 `/lifecycle` 等前端路由回退。

## Render 部署

仓库根目录包含 `render.yaml`。在 Render 创建 Blueprint 并连接本仓库即可；服务必须使用平台提供的 `PORT`，应用已绑定 `0.0.0.0`。

验收端点：

- `/`
- `/lifecycle`
- `/api/health`
- `/api/dashboard`

> 仅供研究，不构成投资建议。
