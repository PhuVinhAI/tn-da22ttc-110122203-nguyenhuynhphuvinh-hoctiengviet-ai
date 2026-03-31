#!/usr/bin/env bun

/**
 * Manual Google OAuth Test
 * 
 * Script này sẽ:
 * 1. Mở browser đến Google OAuth login
 * 2. Bạn đăng nhập thủ công
 * 3. Script capture token từ callback
 * 4. Verify token và user data
 * 
 * Usage: bun run scripts/test/manual/google-oauth.test.ts
 */

import { spawn } from 'child_process';
import http from 'http';

const CONFIG = {
  backendUrl: 'http://localhost:3000',
  frontendPort: 3001,
  timeout: 120000, // 2 minutes để login
};

interface CallbackData {
  token: string;
  timestamp: number;
}

let capturedData: CallbackData | null = null;

// Tạo temporary server để capture callback
function createCallbackServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://localhost:${CONFIG.frontendPort}`);
      
      if (url.pathname === '/auth/callback') {
        const token = url.searchParams.get('token');
        
        if (token) {
          capturedData = {
            token,
            timestamp: Date.now(),
          };
          
          // Trả về HTML success page
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>OAuth Success</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                  text-align: center;
                  max-width: 500px;
                }
                .success-icon {
                  font-size: 64px;
                  color: #4CAF50;
                  margin-bottom: 20px;
                }
                h1 {
                  color: #333;
                  margin-bottom: 10px;
                }
                p {
                  color: #666;
                  margin-bottom: 20px;
                }
                .token {
                  background: #f5f5f5;
                  padding: 15px;
                  border-radius: 5px;
                  word-break: break-all;
                  font-family: monospace;
                  font-size: 12px;
                  margin-top: 20px;
                }
                .close-info {
                  margin-top: 20px;
                  color: #999;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">✓</div>
                <h1>Đăng nhập thành công!</h1>
                <p>Token đã được capture. Bạn có thể đóng tab này.</p>
                <div class="token">
                  <strong>Token:</strong><br>
                  ${token.substring(0, 50)}...
                </div>
                <div class="close-info">
                  Script đang verify token...
                </div>
              </div>
              <script>
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </body>
            </html>
          `);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>OAuth Error</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background: #f44336;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 10px;
                  text-align: center;
                }
                .error-icon {
                  font-size: 64px;
                  color: #f44336;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">✗</div>
                <h1>Lỗi: Không nhận được token</h1>
              </div>
            </body>
            </html>
          `);
        }
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(CONFIG.frontendPort, () => {
      console.log(`✓ Callback server đang chạy tại http://localhost:${CONFIG.frontendPort}`);
      resolve(server);
    });
  });
}

// Mở browser
function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;

  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }

  console.log(`\n🌐 Đang mở browser đến: ${url}\n`);
  
  spawn(command, { shell: true, stdio: 'ignore' });
}

// Verify JWT token
async function verifyToken(token: string): Promise<any> {
  try {
    // Decode JWT (không verify signature, chỉ decode để xem payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );

    return payload;
  } catch (error) {
    throw new Error(`Failed to decode token: ${error}`);
  }
}

// Test user data với token
async function testUserData(token: string): Promise<any> {
  console.log('\n📋 Testing user data...');
  
  const response = await fetch(`${CONFIG.backendUrl}/api/v1/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
  }

  const userData = await response.json();
  // Unwrap data if wrapped
  const user = userData.data || userData;
  console.log('✓ User data:', JSON.stringify(user, null, 2));
  
  return user;
}

// Main test function
async function runTest() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Google OAuth Manual Test                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let server: http.Server | null = null;

  try {
    // 1. Check backend is running
    console.log('1️⃣  Checking backend...');
    try {
      const healthCheck = await fetch(`${CONFIG.backendUrl}/api/v1/auth/google`);
      // Chỉ cần check backend responding, không cần 200 OK
      console.log('✓ Backend is running\n');
    } catch (error) {
      console.error('✗ Backend is not running!');
      console.error('   Please start backend first: bun run start:dev');
      process.exit(1);
    }

    // 2. Start callback server
    console.log('2️⃣  Starting callback server...');
    server = await createCallbackServer();
    console.log('');

    // 3. Open browser
    console.log('3️⃣  Opening browser for Google OAuth...');
    const oauthUrl = `${CONFIG.backendUrl}/api/v1/auth/google`;
    openBrowser(oauthUrl);
    
    console.log('📝 Instructions:');
    console.log('   1. Browser sẽ mở trang Google login');
    console.log('   2. Đăng nhập bằng Google account của bạn');
    console.log('   3. Cho phép quyền truy cập');
    console.log('   4. Đợi redirect về callback page');
    console.log(`   5. Script sẽ tự động capture token (timeout: ${CONFIG.timeout / 1000}s)\n`);

    // 4. Wait for callback
    console.log('4️⃣  Waiting for OAuth callback...');
    const startTime = Date.now();
    
    await new Promise<void>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (capturedData) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > CONFIG.timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for OAuth callback'));
        }
      }, 500);
    });

    console.log('✓ Token captured!\n');

    // 5. Verify token
    console.log('5️⃣  Verifying token...');
    const payload = await verifyToken(capturedData!.token);
    console.log('✓ Token payload:', JSON.stringify(payload, null, 2));
    console.log('');

    // 6. Test user data
    console.log('6️⃣  Fetching user data...');
    const userData = await testUserData(capturedData!.token);
    console.log('');

    // 7. Verify OAuth-specific fields
    console.log('7️⃣  Verifying OAuth fields...');
    const checks = [
      { name: 'Email', value: userData.email, required: true },
      { name: 'Full Name', value: userData.fullName, required: true },
      { name: 'Google ID', value: userData.googleId, required: true },
      { name: 'Provider', value: userData.provider, expected: 'google' },
      { name: 'Email Verified', value: userData.emailVerified, expected: true },
      { name: 'Avatar URL', value: userData.avatarUrl, required: false },
    ];

    let allPassed = true;
    for (const check of checks) {
      if (check.required && !check.value) {
        console.log(`✗ ${check.name}: Missing`);
        allPassed = false;
      } else if (check.expected !== undefined && check.value !== check.expected) {
        console.log(`✗ ${check.name}: Expected ${check.expected}, got ${check.value}`);
        allPassed = false;
      } else {
        console.log(`✓ ${check.name}: ${check.value || '(optional, not set)'}`);
      }
    }
    console.log('');

    // Summary
    if (allPassed) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✓ ALL TESTS PASSED                       ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      console.log('📊 Summary:');
      console.log(`   • User ID: ${userData.id}`);
      console.log(`   • Email: ${userData.email}`);
      console.log(`   • Provider: ${userData.provider}`);
      console.log(`   • Google ID: ${userData.googleId}`);
      console.log(`   • Token: ${capturedData!.token.substring(0, 30)}...`);
      console.log('');
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✗ SOME TESTS FAILED                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    if (server) {
      server.close();
      console.log('🧹 Callback server closed');
    }
  }
}

// Run test
runTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
