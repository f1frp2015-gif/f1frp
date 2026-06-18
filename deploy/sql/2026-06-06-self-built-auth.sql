-- ============================================================================
-- 自建手机 + 微信认证 — 生产库迁移(等价于 pnpm db:push 的 DDL)
-- 用法: psql "$PROD_DATABASE_URL" -f deploy/sql/2026-06-06-self-built-auth.sql
--
-- 说明:
--  * 故意不包 BEGIN/COMMIT —— psql 默认每条语句自动提交。这样即使最后的唯一索引
--    因 users.phone 有重复值而失败,前面的「建表 + 加列 + clerk_id 改可空」也已生效,
--    手机验证码登录立即可用;重复值清理后单独重跑那两条 CREATE UNIQUE INDEX 即可。
--  * 全部 IF [NOT] EXISTS / DROP NOT NULL 都是幂等的,可安全重复执行。
-- ============================================================================

-- 1) users:clerk_id 改可空(自建用户无 Clerk 账号)
ALTER TABLE users ALTER COLUMN clerk_id DROP NOT NULL;

-- 2) users:新增会话版本号(全端登出开关)
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer DEFAULT 0 NOT NULL;

-- 3) phone_otps:手机验证码表(本次 500 的直接原因就是它缺失)
CREATE TABLE IF NOT EXISTS phone_otps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       varchar(20)  NOT NULL,
  code_hash   varchar(64)  NOT NULL,
  expires_at  timestamp    NOT NULL,
  attempts    integer      NOT NULL DEFAULT 0,
  consumed_at timestamp,
  created_at  timestamp    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS phone_otps_phone_idx   ON phone_otps (phone);
CREATE INDEX IF NOT EXISTS phone_otps_created_idx ON phone_otps (created_at);

-- 4) 唯一身份锚点:删旧的普通索引,建部分唯一索引(允许多个 NULL)
--    ⚠️ 下面两条若报 "could not create unique index ... duplicate key" 说明已有重复值,
--       先跑文件末尾的查重 SQL 清理,再单独重跑这两条。
DROP INDEX IF EXISTS users_phone_idx;
DROP INDEX IF EXISTS users_wechat_union_idx;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_uniq
  ON users (phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_wechat_union_uniq
  ON users (wechat_union_id) WHERE wechat_union_id IS NOT NULL;

-- ============================================================================
-- 验证(单独跑,确认全部到位):
--
--   \dt phone_otps
--   \d  phone_otps
--   SELECT column_name, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_name='users' AND column_name IN ('clerk_id','session_version');
--   SELECT indexname FROM pg_indexes
--    WHERE tablename='users' AND indexname LIKE '%uniq%';
--
-- 查重(第 4 步报错时用 —— 有结果就先合并/置空重复手机号再重跑唯一索引):
--   SELECT phone, count(*) FROM users
--    WHERE phone IS NOT NULL GROUP BY phone HAVING count(*) > 1;
-- ============================================================================
