const https = require('https');

const BASE_URL = 'https://ai-store-87n2.onrender.com';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, {
      method,
      headers,
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================');
  console.log('🤖 NEXORA END-TO-END AI AGENT TESTS');
  console.log('====================================\n');

  // Step 1: Login
  console.log('1️⃣ Logging in as Admin...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'kumar@nexora.ai',
    password: 'kumar@4396'
  });

  if (loginRes.status !== 200 || !loginRes.body.token) {
    console.error('❌ Login failed:', loginRes);
    return;
  }
  const token = loginRes.body.token;
  console.log('✅ Logged in successfully! Role:', loginRes.body.user?.role || 'admin');

  // Step 2: Test General AI Chat (Explicitly testing Gemini / default AI provider)
  console.log('\n2️⃣ Testing /api/ai/chat (General Chat / Gemini)...');
  try {
    const chatRes = await request('POST', '/api/ai/chat', {
      messages: [
        { role: 'user', content: 'Explain in one short sentence why AI agents are the future.' }
      ],
      provider: 'gemini'
    }, token);

    console.log(`Status: ${chatRes.status}`);
    if (chatRes.status === 200 && (chatRes.body.content || chatRes.body.message)) {
      console.log('✅ AI Chat Response:', chatRes.body.content || chatRes.body.message);
      console.log('   Provider used:', chatRes.body.provider || 'gemini');
    } else {
      console.log('⚠️ Chat response:', chatRes.body || chatRes.raw);
    }
  } catch (err) {
    console.error('❌ AI Chat error:', err.message);
  }

  // Step 3: Test Stock Intelligence (AAPL)
  console.log('\n3️⃣ Testing /api/agents/stock/analyze (Stock Intelligence)...');
  try {
    const stockRes = await request('POST', '/api/agents/stock/analyze', {
      symbol: 'AAPL'
    }, token);

    console.log(`Status: ${stockRes.status}`);
    if (stockRes.status === 200 && stockRes.body.symbol === 'AAPL') {
      console.log(`✅ Stock AAPL Current Price: $${stockRes.body.currentPrice}, RSI: ${stockRes.body.technicalIndicators?.rsi}`);
    } else {
      console.log('⚠️ Stock response:', stockRes.body);
    }
  } catch (err) {
    console.error('❌ Stock test error:', err.message);
  }

  // Step 4: Test Research Scientist
  console.log('\n4️⃣ Testing /api/agents/research/project (Research Scientist)...');
  try {
    const researchRes = await request('POST', '/api/agents/research/project', {
      title: 'Quantum Computing in Drug Discovery',
      topic: 'Biochemistry & Quantum Mechanics',
      description: 'Using variational quantum eigensolvers to simulate molecular docking for cancer therapeutics.'
    }, token);

    console.log(`Status: ${researchRes.status}`);
    if (researchRes.status === 200) {
      console.log('✅ Research project created and analyzed!');
      console.log('   ID:', researchRes.body.id);
      console.log('   Title:', researchRes.body.title);
      if (researchRes.body.summaryReport) {
        console.log('   Abstract:', (researchRes.body.summaryReport.abstract || '').slice(0, 120) + '...');
      }
    } else {
      console.log('⚠️ Research response:', researchRes.body);
    }
  } catch (err) {
    console.error('❌ Research test error:', err.message);
  }

  // Step 5: Test Career / JobPilot (Career Coaching)
  console.log('\n5️⃣ Testing /api/agents/career/jobpilot/coaching (JobPilot Coach)...');
  try {
    const careerRes = await request('POST', '/api/agents/career/jobpilot/coaching', {
      targetRole: 'Senior Full Stack AI Engineer',
      currentSkills: 'React, Node.js, TypeScript, PostgreSQL',
      experienceLevel: 'Mid-Level (3 years)'
    }, token);

    console.log(`Status: ${careerRes.status}`);
    if (careerRes.status === 200) {
      console.log('✅ Career Coaching response received!');
      console.log('   Preview:', JSON.stringify(careerRes.body).slice(0, 200) + '...');
    } else {
      console.log('⚠️ Career response:', careerRes.body);
    }
  } catch (err) {
    console.error('❌ Career test error:', err.message);
  }

  // Step 6: Test Business Automator (Lead follow-up email)
  console.log('\n6️⃣ Testing Business Automator (Create lead + Generate Follow-up Email)...');
  try {
    const createLeadRes = await request('POST', '/api/agents/automator/leads', {
      name: 'John Doe',
      email: 'john.doe@techcorp.example',
      notes: 'Interested in enterprise automated AI agents.'
    }, token);

    console.log(`   Create Lead Status: ${createLeadRes.status}`);
    if (createLeadRes.status === 201 && createLeadRes.body.id) {
      const leadId = createLeadRes.body.id;
      console.log(`   Lead created (ID: ${leadId}). Generating follow-up email...`);

      const emailRes = await request('POST', `/api/agents/automator/leads/${leadId}/email`, {
        pitchGoal: 'Book a 15-minute discovery call for Nexora enterprise deployment'
      }, token);

      console.log(`   Email Gen Status: ${emailRes.status}`);
      if (emailRes.status === 200) {
        console.log('✅ Follow-up email generated successfully!');
        console.log('   Subject:', emailRes.body.subject || emailRes.body.emailSubject || '(Generated Subject)');
        console.log('   Preview:', (emailRes.body.body || emailRes.body.content || JSON.stringify(emailRes.body)).slice(0, 150) + '...');
      } else {
        console.log('⚠️ Email gen response:', emailRes.body);
      }
    } else {
      console.log('⚠️ Could not create lead:', createLeadRes.body);
    }
  } catch (err) {
    console.error('❌ Automator test error:', err.message);
  }

  // Step 7: Test Startup Analyzer
  console.log('\n7️⃣ Testing /api/agents/startup/analyze (Startup Idea Analyzer)...');
  try {
    const startupRes = await request('POST', '/api/agents/startup/analyze', {
      name: 'Nexora OS',
      industry: 'Artificial Intelligence',
      description: 'An autonomous agent marketplace where developers sell micro-agents and businesses run autonomous workflows.'
    }, token);

    console.log(`Status: ${startupRes.status}`);
    if (startupRes.status === 200) {
      console.log('✅ Startup idea analyzed!');
      console.log('   Score/Summary:', JSON.stringify(startupRes.body).slice(0, 200) + '...');
    } else {
      console.log('⚠️ Startup response:', startupRes.body);
    }
  } catch (err) {
    console.error('❌ Startup test error:', err.message);
  }

  console.log('\n====================================');
  console.log('🎉 ALL TESTS FINISHED');
  console.log('====================================');
}

runTests();

