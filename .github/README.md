# GitHub Actions 使用指南

本项目使用 GitHub Actions 实现自动化 CI/CD 流程。

## 🚀 工作流概览

### 1. CI/CD Pipeline (`ci-cd.yml`)
主要的持续集成和部署流程，包含：
- 后端测试（Python + FastAPI）
- 前端测试（React + TypeScript）
- Docker 镜像构建和推送
- 自动部署到不同环境

**触发条件：**
- 推送到 `main` 或 `develop` 分支
- 创建 Pull Request 到 `main` 或 `develop` 分支

### 2. Security Scan (`security-scan.yml`)
安全扫描和漏洞检查：
- CodeQL 代码安全分析
- 依赖漏洞扫描
- Docker 镜像安全扫描

**触发条件：**
- 每周一凌晨 2 点自动运行
- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 分支

### 3. Code Quality (`code-quality.yml`)
代码质量检查：
- Python 代码格式化（Black、isort）
- Python 代码检查（flake8、mypy）
- TypeScript 代码检查（ESLint、Prettier）
- 自动代码格式修复

**触发条件：**
- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

### 4. Deploy (`deploy.yml`)
专门的部署流程：
- 测试环境部署（develop 分支）
- 生产环境部署（main 分支）
- 部署后验证和回滚

**触发条件：**
- CI/CD Pipeline 完成后自动触发

## 🔧 环境配置

### 环境变量
在 GitHub 仓库的 Settings > Secrets and variables > Actions 中配置：

#### 必需的环境变量：
- `DATABASE_URL`: 数据库连接字符串
- `JWT_SECRET_KEY`: JWT 密钥
- `JWT_EXPIRE_MINUTES`: JWT 过期时间

#### 可选的环境变量：
- `DOCKER_USERNAME`: Docker 仓库用户名
- `DOCKER_PASSWORD`: Docker 仓库密码
- `STAGING_SERVER`: 测试服务器地址
- `PRODUCTION_SERVER`: 生产服务器地址

### 环境保护规则
- `staging`: 测试环境，需要至少一个 reviewer 批准
- `production`: 生产环境，需要至少两个 reviewer 批准

## 📋 使用步骤

### 1. 开发流程
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发代码
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: add new feature"

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建 Pull Request
# GitHub Actions 会自动运行代码质量检查
```

### 2. 部署流程
```bash
# 1. 合并到 develop 分支
# 自动部署到测试环境

# 2. 合并到 main 分支
# 自动部署到生产环境
```

## 🐛 故障排除

### 常见问题

#### 1. 测试失败
- 检查测试代码是否正确
- 查看测试日志了解具体错误
- 确保所有依赖都已安装

#### 2. 构建失败
- 检查 Dockerfile 语法
- 确认依赖文件路径正确
- 查看构建日志了解错误详情

#### 3. 部署失败
- 检查环境变量配置
- 确认服务器连接正常
- 查看部署日志了解错误

### 手动触发工作流
1. 进入 GitHub 仓库页面
2. 点击 Actions 标签
3. 选择要运行的工作流
4. 点击 "Run workflow" 按钮
5. 选择分支和参数
6. 点击 "Run workflow"

## 📚 相关资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Docker 官方文档](https://docs.docker.com/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
5. 等待代码审查和 CI 检查通过
6. 合并代码

## 📞 支持

如果遇到问题，请：
1. 查看 GitHub Actions 日志
2. 检查相关配置文件
3. 创建 Issue 描述问题
4. 联系项目维护者
