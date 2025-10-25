# RLS策略修复指南

## 问题诊断

**问题**：RLS已启用但无策略，导致所有非超级用户访问被拒绝
**影响表**：`public.blog_posts`
**症状**：N8N工作流返回"Failed to save blog post to database"

## 完整修复步骤

### 1. 执行RLS修复SQL
在Supabase SQL编辑器中运行以下SQL：

```sql
-- Fix RLS Policies for blog_posts table
-- Run this in Supabase SQL Editor to resolve the RLS issue

-- Step 1: Enable RLS (if not already enabled)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow API to insert new posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow API to update posts" ON public.blog_posts;

-- Step 3: Create new policies for public read and API write access

-- Allow public to read all published blog posts
CREATE POLICY "Allow public read access" ON public.blog_posts
FOR SELECT USING (status = 'published');

-- Allow service role (API) to insert new blog posts
CREATE POLICY "Allow API to insert new posts" ON public.blog_posts
FOR INSERT TO service_role WITH CHECK (true);

-- Allow service role (API) to update blog posts  
CREATE POLICY "Allow API to update posts" ON public.blog_posts
FOR UPDATE TO service_role USING (true);
```

### 2. 验证修复
运行验证查询：
```sql
-- Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'blog_posts';
```

### 3. 测试配置
重新运行N8N工作流测试数据插入。

## 策略说明

### 创建的策略：
1. **Allow public read access** - 允许公众读取状态为'published'的文章
2. **Allow API to insert new posts** - 允许服务角色插入新文章
3. **Allow API to update posts** - 允许服务角色更新文章

### 安全模型：
- **读取**：公开（仅限已发布文章）
- **写入**：仅限服务角色（API）
- **更新**：仅限服务角色（API）

## 预期结果

修复后，N8N工作流应该能够：
- ✅ 成功从Google Sheets获取关键词
- ✅ 通过AI生成SEO优化内容
- ✅ 成功插入数据到Supabase数据库
- ✅ 返回成功响应

## 故障排除

如果问题仍然存在：

1. **检查Vercel日志** - 查看详细的错误信息
2. **验证API密钥** - 确保使用正确的service_role密钥
3. **检查表结构** - 确保字段名匹配
4. **测试直接插入** - 在Supabase中手动测试插入操作

## 完整的系统状态

### 已修复的问题：
- ✅ N8N Body Parameters配置
- ✅ API字段映射
- ✅ GitHub部署配置
- ✅ Supabase连接配置
- ✅ RLS策略配置（当前步骤）

### 待验证：
- 🔄 RLS策略生效
- 🔄 N8N工作流完整执行
- 🔄 数据库数据正确插入

执行RLS修复后，整个自动化博客发布系统应该能够正常工作。
