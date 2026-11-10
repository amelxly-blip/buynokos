const { execSync } = require('child_process');

// Prevent infinite recursion when OpenNext calls `npm run build`
if (process.env.BUILDING_OPEN_NEXT === '1') {
  console.log('⚡ [Build Step] OpenNext is invoking Next.js build...');
  try {
    execSync('npx next build', { stdio: 'inherit', env: process.env });
  } catch (err) {
    process.exit(1);
  }
} else {
  console.log('🚀 [Build Step] Initiating OpenNext Cloudflare Edge compilation...');
  process.env.BUILDING_OPEN_NEXT = '1';
  try {
    execSync('npx opennextjs-cloudflare build', { stdio: 'inherit', env: process.env });
  } catch (err) {
    process.exit(1);
  }
}
