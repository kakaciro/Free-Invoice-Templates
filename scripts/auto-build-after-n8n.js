// 自动构建脚本 - 在 N8N 发布文章后自动运行
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 N8N 文章发布后自动构建开始...');

// 构建文章页面
function buildArticles() {
  return new Promise((resolve, reject) => {
    console.log('📝 开始构建文章页面...');
    
    exec('npm run build:articles', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 构建失败:', error);
        reject(error);
        return;
      }
      
      console.log('✅ 构建输出:', stdout);
      if (stderr) {
        console.warn('⚠️ 构建警告:', stderr);
      }
      
      console.log('🎉 文章页面构建完成');
      resolve(stdout);
    });
  });
}

// 提交更改到 Git
function commitChanges() {
  return new Promise((resolve, reject) => {
    console.log('💾 提交更改到 Git...');
    
    const commitMessage = `自动更新: N8N 发布新文章 - ${new Date().toISOString()}`;
    
    exec('git add .', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git add 失败:', error);
        reject(error);
        return;
      }
      
      exec(`git commit -m "${commitMessage}"`, (commitError, commitStdout, commitStderr) => {
        if (commitError) {
          console.error('❌ Git commit 失败:', commitError);
          // 如果 commit 失败，可能是没有更改，这不一定是错误
          console.log('ℹ️  没有需要提交的更改');
          resolve('no-changes');
          return;
        }
        
        console.log('✅ Git 提交完成:', commitStdout);
        resolve('committed');
      });
    });
  });
}

// 推送到 GitHub
function pushToGitHub() {
  return new Promise((resolve, reject) => {
    console.log('📤 推送到 GitHub...');
    
    exec('git push origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Git push 失败:', error);
        reject(error);
        return;
      }
      
      console.log('✅ 推送完成:', stdout);
      resolve(stdout);
    });
  });
}

// 生成构建报告
function generateBuildReport() {
  const report = {
    timestamp: new Date().toISOString(),
    build_type: 'n8n_auto_build',
    status: 'completed',
    steps: {
      build_articles: 'success',
      git_commit: 'success',
      git_push: 'success'
    }
  };
  
  const reportPath = path.join(__dirname, '../logs/n8n-build-report.json');
  const logsDir = path.dirname(reportPath);
  
  // 确保日志目录存在
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // 读取现有报告或创建新数组
  let reports = [];
  try {
    const existingData = fs.readFileSync(reportPath, 'utf8');
    reports = JSON.parse(existingData);
  } catch (error) {
    console.log('创建新的构建报告文件...');
  }
  
  // 添加新报告（最多保留最近10次）
  reports.unshift(report);
  if (reports.length > 10) {
    reports = reports.slice(0, 10);
  }
  
  // 保存报告
  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  console.log('📊 构建报告已保存到 logs/n8n-build-report.json');
}

// 主函数
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🚀 N8N 自动构建流程开始');
    console.log('='.repeat(50));
    
    // 步骤 1: 构建文章页面
    await buildArticles();
    
    // 步骤 2: 提交到 Git
    const commitResult = await commitChanges();
    
    // 步骤 3: 推送到 GitHub (只有在有提交的情况下)
    if (commitResult === 'committed') {
      await pushToGitHub();
    } else {
      console.log('ℹ️  没有新的更改，跳过推送');
    }
    
    // 步骤 4: 生成构建报告
    generateBuildReport();
    
    console.log('='.repeat(50));
    console.log('🎉 N8N 自动构建流程完成!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 自动构建流程失败:', error);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main, buildArticles, commitChanges, pushToGitHub };
