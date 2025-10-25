# GitHub API 连接设置指南

## 需要的GitHub API配置

要让我能够直接连接和操作您的GitHub仓库，您需要配置以下内容：

## 1. GitHub Personal Access Token

### 创建步骤
1. **登录GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **生成新token**，需要以下权限：
   - `repo` (完全控制私有仓库)
   - `workflow` (可选，用于操作GitHub Actions)
   - `write:packages` (可选)
   - `delete:packages` (可选)

### 所需权限详细说明
```json
{
  "repo": "完全访问私有和公共仓库",
  "repo:status": "访问提交状态",
  "repo_deployment": "访问部署状态",
  "public_repo": "访问公共仓库",
  "repo:invite": "邀请协作者",
  "security_events": "访问安全事件"
}
```

## 2. MCP服务器配置

### 当前使用的GitHub MCP服务器
```bash
npx -y @modelcontextprotocol/server-github
```

### 配置环境变量
需要设置以下环境变量：
```bash
# Windows
set GITHUB_PERSONAL_ACCESS_TOKEN=您的token

# Linux/Mac
export GITHUB_PERSONAL_ACCESS_TOKEN=您的token
```

## 3. 替代方案

### 方案A：使用GitHub CLI
```bash
# 安装GitHub CLI
gh auth login

# 然后通过CLI操作仓库
gh repo view kakawebai/Free-Online-Invoice
```

### 方案B：直接使用REST API
```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/kakawebai/Free-Online-Invoice
```

## 4. 安全注意事项

### 最佳实践
- 使用fine-grained tokens而不是classic tokens
- 设置适当的权限范围
- 定期轮换token
- 不要将token提交到代码仓库

### 推荐的token权限
对于您的项目，最小权限应该是：
- `contents: read & write` (读写文件内容)
- `metadata: read` (读取仓库元数据)

## 5. 当前限制

由于认证失败，我目前只能：
- ✅ 在本地文件系统操作
- ✅ 使用git命令行工具
- ✅ 通过git推送更改到GitHub

无法：
- ❌ 直接通过API读取GitHub仓库
- ❌ 直接通过API修改GitHub仓库
- ❌ 使用GitHub MCP工具的高级功能

## 6. 推荐的解决方案

### 对于当前项目
由于我们已经通过git命令行完成了所有必要的更新，建议：

1. **继续使用当前工作流**：
   - 在本地修改文件
   - 使用git命令同步到GitHub
   - 这已经足够满足您的需求

2. **仅在需要时配置API**：
   - 如果您需要自动化部署或CI/CD
   - 如果您需要实时监控仓库状态

### 验证当前状态
您可以运行以下命令验证GitHub连接：
```bash
# 验证git远程连接
git remote -v

# 验证推送状态
git log --oneline -5

# 验证GitHub仓库状态
curl -s https://api.github.com/repos/kakawebai/Free-Online-Invoice | grep -E '"name"|"description"'
```

## 结论

**对于您当前的项目需求，现有的git命令行工作流已经完全足够**。配置GitHub API主要是为了：

- 自动化部署流程
- 实时监控和webhook
- 团队协作工具集成
- CI/CD流水线

如果您需要这些高级功能，我可以指导您配置GitHub API。否则，当前的本地开发+git推送方式已经非常高效。
