-- 启用 blog_posts 表的行级安全 (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 创建一个新策略，允许任何人 (anon) 读取状态为 'published' 的文章
-- 这个策略命名为 "Public can read published blog posts"
CREATE POLICY "Public can read published blog posts" 
ON public.blog_posts FOR SELECT 
USING (status = 'published');

-- 说明:
-- 1. `CREATE POLICY "policy_name"`: 定义一个新策略并命名。
-- 2. `ON public.blog_posts`: 指定这个策略应用于 `blog_posts` 表。
-- 3. `FOR SELECT`: 指明这个策略只针对 SELECT (读取) 操作。
-- 4. `USING (status = 'published')`: 这是策略的核心规则，只有当一行数据的 `status` 列等于 'published' 时，该行才对查询可见。