# GitHub Token 生成详细指南

## 选择哪种Token

### 建议选择：**Generate new token (classic)**
- ✅ **更通用**：兼容性更好，支持更多工具
- ✅ **权限明确**：权限设置简单明了
- ✅ **MCP服务器兼容**：当前GitHub MCP服务器支持classic tokens

## 详细生成步骤

### 步骤1：访问Token生成页面
1. 登录GitHub
2. 点击右上角头像 → **Settings**
3. 左侧菜单 → **Developer settings**
4. 选择 **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token** → **Generate new token (classic)**

### 步骤2：填写Token信息
```
Note: MCP-GitHub-Server-Token
Expiration: 90 days (推荐) 或 1 year
```

### 步骤3：选择权限（必须勾选）
**必须勾选的权限：**
- [x] **repo** (完全控制私有仓库)
  - [x] repo:status
  - [x] repo_deployment
  - [x] public_repo
  - [x] repo:invite
  - [x] security_events

**可选权限：**
- [ ] workflow (如果需要操作GitHub Actions)
- [ ] write:packages
- [ ] delete:packages

### 步骤4：生成Token
1. 点击 **Generate token**
2. **立即复制token**（只会显示一次！）
3. 安全保存token

## Token权限详细说明

### repo权限包含：
```json
{
  "权限": "repo",
  "描述": "完全访问您的公共和私有仓库",
  "包括": [
    "读取和写入代码",
    "读取和写入提交状态",
    "读取和写入部署",
    "读取和写入webhooks",
    "管理仓库设置"
  ]
}
```

## 配置到MCP服务器

### 方法1：设置环境变量
```bash
# Windows命令提示符
set GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"

# Linux/Mac
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 方法2：永久环境变量（推荐）
**Windows设置永久环境变量：**
1. 右键"此电脑" → 属性 → 高级系统设置
2. 环境变量 → 系统变量 → 新建
3. 变量名：`GITHUB_PERSONAL_ACCESS_TOKEN`
4. 变量值：您的token
5. 确定保存

## 验证Token是否工作

### 测试API连接
```bash
# 使用curl测试
curl -H "Authorization: token YOUR_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user
```

### 测试MCP工具
配置后，我可以尝试：
```javascript
// 读取仓库文件
use_mcp_tool("GitHub", "get_file_contents", {
  owner: "kakawebai",
  repo: "Free-Online-Invoice", 
  path: "README.md"
})
```

## 安全注意事项

### 🔒 重要安全提示
1. **永不提交token到代码仓库**
2. **使用环境变量存储**
3. **定期轮换token（建议90天）**
4. **仅在需要时启用权限**
5. **监控token使用情况**

### 如果token泄露
1. 立即到GitHub撤销该token
2. 生成新token
3. 更新所有使用该token的地方

## 替代方案

如果不想配置token，我们继续使用当前工作流：
- ✅ 本地文件编辑
- ✅ git命令行操作
- ✅ 手动推送更改

## 当前项目状态

无论是否配置token，我们已经：
- ✅ 修复所有服务问题
- ✅ 实现内容管理系统
- ✅ 优化SEO性能
- ✅ 成功部署到GitHub

配置token主要是为了：
- 实时监控仓库
- 自动化部署
- 更高级的仓库管理功能

## 下一步操作建议

1. **如果您想尝试API连接**：按照上述步骤生成classic token
2. **如果当前工作流足够**：继续使用git命令行方式
3. **我可以指导您完成**：token生成和配置过程

请告诉我您的选择，我可以提供相应的指导。
