var SUPABASE_URL = 'https://pytavytnuhvkghldkxlp.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dGF2eXRudWh2a2dobGRreGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjA3NDcsImV4cCI6MjA3NjgzNjc0N30.BYfVQDYQIrZjDt8loOpSlkAx2Bnq-dAIsaTkok0h0lQ';

// 自动校正：如果 anon key 中的项目 ID(ref) 与 SUPABASE_URL 不一致，则以密钥中的 ref 为准
(function () {
  var hasSupabaseLib = typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function';
  if (!hasSupabaseLib) {
    console.error('[Supabase] supabase-js 未加载，请检查 <script> 引入顺序。');
    return;
  }

  var resolvedUrl = SUPABASE_URL;
  try {
    var payloadBase64 = SUPABASE_ANON_KEY.split('.')[1];
    var payloadJson = JSON.parse(atob(payloadBase64));
    var ref = payloadJson && payloadJson.ref;
    if (ref && SUPABASE_URL.indexOf(ref) === -1) {
      console.warn('[Supabase] 检测到 URL (' + SUPABASE_URL + ') 与密钥项目 ID (' + ref + ') 不一致，已自动修正。');
      resolvedUrl = 'https://' + ref + '.supabase.co';
    }
  } catch (e) {
    console.warn('[Supabase] 无法解析 anon key 的项目 ID(ref)，将使用原始 URL。', e);
  }

  // 初始化 Supabase 客户端（不覆盖库对象），供其他页面复用
  window.supabaseClient = window.supabase.createClient(resolvedUrl, SUPABASE_ANON_KEY);
})();
