const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  if (Buffer.isBuffer(body) || typeof body === 'string') return res.end(body);
  if (body == null) return res.end();
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readJson(req, cb) {
  let data = '';
  req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(data||'{}')); } catch { cb({}); } });
  req.on('error', () => cb({}));
}

// -------- Multi-user API store --------
const Store = {
  // Individual user sessions - each user gets their own game
  users: new Map(),
  // SSE clients for real-time balance updates
  sseClients: new Set(),
  // Global settings (same for all users)
  settings: (() => {
    try {
      const settingsPath = path.join(ROOT, 'prod-rnd-backend-php-orchestra.100hp.app', 'mines', 'settings.html');
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      return {
        supportedCurrencies: ['USD','RUB','EUR','KZT','AZN','UZS','TJS','INR','AUD','BRL','TRY','XOF','PLN','UAH','COP','CRC','CLP','MXN','PAB','PEN','XAF','ARS','KES','UGX','RWF','TZS','ZMW','GHS','HKD','IDR','MYR','BDT','IRR','IQD','VND','THB','LKR','KRW','SGD','QAR','PKR','OMR','KWD','AED','JOD','PHP','CAD','BYN','AMD','CUP','CZK','DZD','GEL','KGS','MDL','NGN','NPR','SEK','SOS','BWP','CHF','BGN','HUF','JPY','DKK','TND','CNY','RON','VES','GBP','NZD','NOK','ZAR','BND','EGP','ALL','BAM','BHD','BOB','GTQ','ILS','KHR','LAK','MKD','MNT','MVR','RSD','TMT','TWD','ZWL','CDF','HNL','MAD','MMK','MOP','NIO','SAR','ARSB','HTG','PYG','LBP','MZN','MRU','GNF','ETB','USDT','GMD','SLE'],
        bets: {"AED":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":750},"defaultBet":5,"steps":[]},"AMD":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":99999},"defaultBet":500,"steps":[]},"ARS":{"quickBets":{"x2":"x2","1/2":"1/2","min":20,"max":40000},"defaultBet":200,"steps":[]},"AUD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":250},"defaultBet":1,"steps":[]},"AZN":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.2,"max":350},"defaultBet":2,"steps":[]},"BDT":{"quickBets":{"x2":"x2","1/2":"1/2","min":10,"max":20000},"defaultBet":100,"steps":[]},"BRL":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":999},"defaultBet":5,"steps":[]},"BYN":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.2,"max":500},"defaultBet":3,"steps":[]},"CAD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":300},"defaultBet":1,"steps":[]},"CLP":{"quickBets":{"x2":"x2","1/2":"1/2","min":100,"max":200000},"defaultBet":1000,"steps":[]},"COP":{"quickBets":{"x2":"x2","1/2":"1/2","min":500,"max":999999},"defaultBet":5000,"steps":[]},"CRC":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":99999},"defaultBet":500,"steps":[]},"CUP":{"quickBets":{"x2":"x2","1/2":"1/2","min":2,"max":5000},"defaultBet":20,"steps":[]},"CZK":{"quickBets":{"x2":"x2","1/2":"1/2","min":2,"max":4500},"defaultBet":20,"steps":[]},"DZD":{"quickBets":{"x2":"x2","1/2":"1/2","min":15,"max":30000},"defaultBet":150,"steps":[]},"EUR":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":200},"defaultBet":1,"steps":[]},"GEL":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.2,"max":500},"defaultBet":3,"steps":[]},"GHS":{"quickBets":{"x2":"x2","1/2":"1/2","min":1,"max":2500},"defaultBet":15,"steps":[]},"GMD":{"quickBets":{"x2":"x2","1/2":"1/2","min":7.25,"max":72500000},"defaultBet":14,"steps":[]},"HKD":{"quickBets":{"x2":"x2","1/2":"1/2","min":1,"max":1500},"defaultBet":10,"steps":[]},"IDR":{"quickBets":{"x2":"x2","1/2":"1/2","min":1500,"max":3000000},"defaultBet":15000,"steps":[]},"INR":{"quickBets":{"x2":"x2","1/2":"1/2","min":10,"max":16000},"defaultBet":100,"steps":[]},"IQD":{"quickBets":{"x2":"x2","1/2":"1/2","min":150,"max":300000},"defaultBet":1500,"steps":[]},"IRR":{"quickBets":{"x2":"x2","1/2":"1/2","min":5000,"max":9999999},"defaultBet":50000,"steps":[]},"JOD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":150},"defaultBet":1,"steps":[]},"KES":{"quickBets":{"x2":"x2","1/2":"1/2","min":10,"max":25000},"defaultBet":100,"steps":[]},"KGS":{"quickBets":{"x2":"x2","1/2":"1/2","min":10,"max":20000},"defaultBet":100,"steps":[]},"KRW":{"quickBets":{"x2":"x2","1/2":"1/2","min":100,"max":250000},"defaultBet":1000,"steps":[]},"KWD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.05,"max":60},"defaultBet":0.5,"steps":[]},"KZT":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":99999},"defaultBet":500,"steps":[]},"LKR":{"quickBets":{"x2":"x2","1/2":"1/2","min":25,"max":70000},"defaultBet":250,"steps":[]},"MDL":{"quickBets":{"x2":"x2","1/2":"1/2","min":2,"max":4000},"defaultBet":20,"steps":[]},"MXN":{"quickBets":{"x2":"x2","1/2":"1/2","min":2,"max":4000},"defaultBet":20,"steps":[]},"MYR":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":999},"defaultBet":5,"steps":[]},"NGN":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":99999},"defaultBet":50,"steps":[]},"NPR":{"quickBets":{"x2":"x2","1/2":"1/2","min":10,"max":30000},"defaultBet":150,"steps":[]},"OMR":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.05,"max":75},"defaultBet":0.5,"steps":[]},"PAB":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":200},"defaultBet":1,"steps":[]},"PEN":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":999},"defaultBet":5,"steps":[]},"PHP":{"quickBets":{"x2":"x2","1/2":"1/2","min":5,"max":9999},"defaultBet":50,"steps":[]},"PKR":{"quickBets":{"x2":"x2","1/2":"1/2","min":25,"max":50000},"defaultBet":250,"steps":[]},"PLN":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":999},"defaultBet":5,"steps":[]},"QAR":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.5,"max":750},"defaultBet":5,"steps":[]},"RUB":{"quickBets":{"x2":"x2","1/2":"1/2","min":5,"max":9999},"defaultBet":50,"steps":[]},"RWF":{"quickBets":{"x2":"x2","1/2":"1/2","min":100,"max":200000},"defaultBet":1000,"steps":[]},"SEK":{"quickBets":{"x2":"x2","1/2":"1/2","min":1,"max":2000},"defaultBet":10,"steps":[]},"SGD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":250},"defaultBet":1,"steps":[]},"SLE":{"quickBets":{"x2":"x2","1/2":"1/2","min":2.25,"max":22500000},"defaultBet":4.5,"steps":[]},"SOS":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":99999},"defaultBet":500,"steps":[]},"THB":{"quickBets":{"x2":"x2","1/2":"1/2","min":3,"max":6000},"defaultBet":30,"steps":[]},"TJS":{"quickBets":{"x2":"x2","1/2":"1/2","min":1,"max":2000},"defaultBet":10,"steps":[]},"TRY":{"quickBets":{"x2":"x2","1/2":"1/2","min":2,"max":4000},"defaultBet":20,"steps":[]},"TZS":{"quickBets":{"x2":"x2","1/2":"1/2","min":250,"max":500000},"defaultBet":2500,"steps":[]},"UAH":{"quickBets":{"x2":"x2","1/2":"1/2","min":5,"max":9999},"defaultBet":50,"steps":[]},"UGX":{"quickBets":{"x2":"x2","1/2":"1/2","min":350,"max":700000},"defaultBet":3500,"steps":[]},"USD":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":200},"defaultBet":1,"steps":[]},"USDT":{"quickBets":{"x2":"x2","1/2":"1/2","min":0.1,"max":200},"defaultBet":1,"steps":[]},"UZS":{"quickBets":{"x2":"x2","1/2":"1/2","min":1000,"max":2000000},"defaultBet":10000,"steps":[]},"VND":{"quickBets":{"x2":"x2","1/2":"1/2","min":2500,"max":5000000},"defaultBet":25000,"steps":[]},"XAF":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":150000},"defaultBet":500,"steps":[]},"XOF":{"quickBets":{"x2":"x2","1/2":"1/2","min":50,"max":9999},"defaultBet":500,"steps":[]},"ZMW":{"quickBets":{"x2":"x2","1/2":"1/2","min":1,"max":4000},"defaultBet":20,"steps":[]}},
        presets: [{"presetValue":1,"isDefault":false},{"presetValue":3,"isDefault":true},{"presetValue":5,"isDefault":false},{"presetValue":7,"isDefault":false}],
        rates: [{"presetValue":1,"rates":[0.99,1.04,1.09,1.14,1.19,1.26,1.33,1.4,1.49,1.59,1.71,1.84,1.99,2.17,2.39,2.65,2.98,3.41,3.98,4.78,5.97,7.96,11.94,23.88]},{"presetValue":3,"rates":[1.09,1.24,1.43,1.65,1.93,2.27,2.69,3.23,3.92,4.83,6.03,7.68,9.98,13.31,18.3,26.15,39.22,62.76,109.83,219.65,549.13,2196.5]},{"presetValue":5,"rates":[1.19,1.51,1.93,2.49,3.27,4.36,5.92,8.2,11.62,16.9,25.34,39.42,64.06,109.83,201.35,402.69,906.06,1937.37,2968.69,4000]},{"presetValue":7,"rates":[1.32,1.86,2.68,3.93,5.89,9.11,14.43,23.6,40.13,71.34,133.76,267.52,579.63,1463.71,2347.78,3231.85,4115.93,5000]}],
        roundsCount: 25
      };
    }
  })(),
  // Global history from original backend
  globalHistory: (() => {
    try {
      const sessionsPath = path.join(ROOT, 'prod-rnd-backend-php-orchestra.100hp.app', 'mines', 'sessions-f80470a8c46bf.html');
      const data = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
      return data.data || [];
    } catch {
      return [];
    }
  })()
};

// Get or create user data
function getUserData(userId) {
  if (!Store.users.has(userId)) {
    // Try to load from original user data
    try {
      const userPath = path.join(ROOT, 'prod-rnd-backend-php-orchestra.100hp.app', 'mines', 'user.html');
      const originalUser = JSON.parse(fs.readFileSync(userPath, 'utf8'));
      Store.users.set(userId, {
        ...originalUser,
        currency: 'RUB', // Force RUB currency
        sessionId: null,
        balance: 1000.00 // Set balance to 1000 RUB
      });
    } catch {
      // Default user data
      Store.users.set(userId, {
        language: 'en',
        currency: 'RUB',
        sessionId: null,
        balance: 1000.00,
        name: 'Player',
        avatar: '',
        exchangeRate: 1
      });
    }
  }
  return Store.users.get(userId);
}

function getRates(preset) {
  const e = (Store.settings.rates||[]).find(r=>r.presetValue===preset);
  return e ? e.rates.slice() : [];
}

function randomBombs(traps) {
  const set = new Set();
  while (set.size < Math.min(traps,25)) {
    const col = Math.floor(Math.random()*5); const row = Math.floor(Math.random()*5);
    set.add(`${col},${row}`);
  }
  const expectedChoices = [];
  for (let r=0;r<5;r++) for (let c=0;c<5;c++) expectedChoices.push({ value:{col:c,row:r}, category: set.has(`${c},${r}`)?1:0 });
  return { bombs:set, expectedChoices };
}

function bombMatrixFromSet(bombs) {
  const m = Array.from({length:5},()=>Array(5).fill(0));
  for (let r=0;r<5;r++) for (let c=0;c<5;c++) { if (bombs.has(`${c},${r}`)) m[r][c]=1; }
  return m;
}

function generateSaltAndHash(bombs) {
  const left = Math.random().toString(16).slice(2);
  const right = Math.random().toString(16).slice(2);
  const matrix = bombMatrixFromSet(bombs);
  const salt = `${left}|${JSON.stringify(matrix)}|${right}`;
  const hash = crypto.createHash('sha256').update(salt).digest('hex');
  return { salt, hash };
}

function buildSession(amount, presetValue, userData) {
  const id = Math.random().toString(36).slice(2)+Date.now().toString(36);
  const { bombs, expectedChoices } = randomBombs(presetValue||3);
  const { salt, hash } = generateSaltAndHash(bombs);
  const coeffs = getRates(presetValue||3);
  return {
    id, state:'Active', bet:amount, hash, salt, lastRound:0, coefficient:0, availableCashout:0,
    startDate:new Date().toISOString(), endDate:'', currency:userData.currency,
    gameData:{ presetValue:presetValue||3, coefficients:coeffs, userChoices:[], expectedChoices, currentRoundId:0, rounds:[{id:0,amount:0,availableCash:0,odd:1}] },
    _internal:{ bombs }
  };
}

function finishRound(session, click, userData, userId){
  const key = `${click.col},${click.row}`; 
  const isBomb = session._internal.bombs.has(key);
  const next = session.lastRound + 1; 
  const coeff = session.gameData.coefficients[Math.max(0,next-1)] || session.coefficient || 0;
  
  // Add user choice to history
  session.gameData.userChoices.push({ value:{col:click.col,row:click.row}, category: isBomb?1:0 });
  session.lastRound = next;
  session.coefficient = isBomb ? session.coefficient : coeff;
  session.gameData.currentRoundId = next;
  session.gameData.rounds.push({ id: next, amount: session.bet, availableCash: Math.round(session.bet * (isBomb? session.coefficient : coeff)), odd: session.coefficient });
  
  if (isBomb) { 
    // BOMB HIT - LOSS
    session.state='Loss'; 
    session.availableCashout=0; 
    session.endDate=new Date().toISOString();
    
    // Move finished session to user's history
    if (!userData.history) userData.history = [];
    userData.history.unshift(publicSession(session));
    userData.activeSession = null;
    userData.sessionId = null;
  }
  else { 
    // SAFE CELL - UPDATE AVAILABLE CASHOUT
    session.availableCashout = Math.round(session.bet * session.coefficient);
    
    // Check if reached max rounds (auto-win)
    if (next >= session.gameData.coefficients.length){ 
      session.state='Win'; 
      session.endDate=new Date().toISOString(); 
      if (!session._internal.paid) {
        userData.balance = Math.round((userData.balance + session.availableCashout) * 100) / 100;
        session._internal.paid = true;
        // Send real-time balance update
        sendSSEToUser(userId, { type: 'balance_update', balance: userData.balance, currency: userData.currency });
      }
    }
  }
}

function cashout(userData, userId){ 
  const s=userData.activeSession; 
  if(!s) return;
  if(s.state==='Active'&&s.availableCashout>0){ 
    userData.balance = Math.round((userData.balance + s.availableCashout) * 100) / 100; 
    s.state='Win'; 
    s.endDate=new Date().toISOString(); 
    // Send real-time balance update
    sendSSEToUser(userId, { type: 'balance_update', balance: userData.balance, currency: userData.currency });
  }
  if (!userData.history) userData.history = [];
  userData.history.unshift(publicSession(s));
  userData.activeSession=null; 
  userData.sessionId=null;
}

function publicSession(s){ if(!s) return {}; const {_internal,...rest}=s; return rest; }

// Send SSE message to all connected clients
function sendSSEToAll(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  Store.sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      // Remove disconnected clients
      Store.sseClients.delete(client);
    }
  });
}

// Send SSE message to specific user
function sendSSEToUser(userId, data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  // Find clients for this specific user
  Store.sseClients.forEach(client => {
    if (client._userId === userId) {
      try {
        client.write(message);
      } catch (e) {
        // Remove disconnected clients
        Store.sseClients.delete(client);
      }
    }
  });
}

// Get user ID from request (using IP + User-Agent as unique identifier)
function getUserId(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return crypto.createHash('md5').update(ip + userAgent).digest('hex').substring(0, 8);
}

// Move a finished (non-Active) session to history and clear references,
// so a page reload does not resurrect the previous game.
function archiveAndClearIfFinished(userData){
  const s = userData.activeSession;
  if (!s) return;
  if (s.state && s.state !== 'Active') {
    const ended = publicSession(s);
    if (!userData.history.find(h => h.id === ended.id)) {
      userData.history.unshift(ended);
    }
    userData.activeSession = null;
    userData.sessionId = null;
  }
}

// -------- API handler --------
function handleApi(req,res){
  return new Promise((resolve) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const p = url.pathname; const m = req.method;
    const userId = getUserId(req);
    const userData = getUserData(userId);
    
    if(p==='/mines/user'&&m==='GET'){ 
      archiveAndClearIfFinished(userData);
      send(res,200,userData,{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }); 
      return resolve(true); 
    }
    
    if(p==='/mines/balance'&&m==='GET'){ 
      send(res,200,{ balance: userData.balance, currency: userData.currency },{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }); 
      return resolve(true);
    }
    
    if(p==='/mines/sse'&&m==='GET'){
      // Server-Sent Events endpoint for real-time balance updates
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });
      
      // Mark this client with user ID
      res._userId = userId;
      
      // Send initial balance
      res.write(`data: ${JSON.stringify({ type: 'balance_update', balance: userData.balance, currency: userData.currency })}\n\n`);
      
      // Add client to SSE clients set
      Store.sseClients.add(res);
      
      // Remove client when connection closes
      req.on('close', () => {
        Store.sseClients.delete(res);
      });
      
      return resolve(true);
    }
    
    if(p==='/mines/settings'&&m==='GET'){ 
      send(res,200,Store.settings,{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }); 
        return resolve(true);
    }
    
    if(p==='/mines/sessions'&&m==='GET'){
      // Return user's personal history + global history for live feed
      const userHistory = userData.history || [];
      const combinedHistory = [...userHistory, ...Store.globalHistory].slice(0, 30);
      send(res,200,{ limit:30, offset:0, data:combinedHistory },{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
      return resolve(true);
    }
    
    if(p.startsWith('/mines/sessions')&&m==='GET'){
      // Handle sessions with query parameters - return user's history
      const userHistory = userData.history || [];
      send(res,200,{ limit:30, offset:0, data:userHistory },{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
      return resolve(true);
    }
    
    if(p==='/mines/session'&&m==='POST'){
      readJson(req, body=>{
        const amount=Number(body.amount||0), preset=Number(body.presetValue||3);
        const qb = Store.settings.bets[userData.currency]?.quickBets || { min:1,max:100 };
        
        // If there is a finished session lingering (Loss/Win), archive and clear it to allow new game
        if (userData.activeSession && userData.activeSession.state !== 'Active') {
          const ended = publicSession(userData.activeSession);
          if (!userData.history.find(s=>s.id===ended.id)) { 
            userData.history.unshift(ended); 
          }
          userData.activeSession = null;
          userData.sessionId = null;
        }
        
        if(amount<qb.min) { send(res,400,{ error:{ type:'smallBid', header:'Rate below the minimum', message:'Rate below the minimum' }},{ 'Content-Type':'application/json' }); return resolve(true);}
        if(amount>qb.max) { send(res,400,{ error:{ type:'highBid', header:'Rate above the maximum', message:'Rate above the maximum' }},{ 'Content-Type':'application/json' }); return resolve(true);}
        if(amount>userData.balance) { send(res,400,{ error:{ type:'insufficientFunds', header:'Insufficient funds', message:'Insufficient funds' }},{ 'Content-Type':'application/json' }); return resolve(true);}
        if(userData.activeSession) { send(res,400,{ error:{ type:'activeSessionExists', header:'Active session already exists', message:'Active session already exists' }},{ 'Content-Type':'application/json' }); return resolve(true);}
        userData.balance -= amount; 
        userData.activeSession = buildSession(amount, preset, userData);
        userData.sessionId = userData.activeSession.id;
        send(res,200,publicSession(userData.activeSession),{ 'Content-Type':'application/json' });
        return resolve(true);
      });
      return;
    }
    
    if(p==='/mines/round'&&m==='PUT'){
      readJson(req, body=>{
        if(!userData.activeSession) {
          const neutral = {
            userChoices: [],
            state: 'Not started',
            availableCashout: 0,
            coefficient: 0,
            lastRound: 0,
            gameData: {
              currentRoundId: 0,
              availableCashout: false,
              rounds: [],
              coefficients: [],
              expectedChoices: []
            }
          };
          send(res,200,neutral,{ 'Content-Type':'application/json' });
          return resolve(true);
        }
        const click={ col:Number(body.col), row:Number(body.row) };
        const dup = userData.activeSession.gameData.userChoices.some(c=>c.value.col===click.col&&c.value.row===click.row);
        if(dup) { send(res,400,{ error:{ type:'duplicateRound', message:'Round with this column and row already exists' }},{ 'Content-Type':'application/json' }); return resolve(true);} 
        const sessionBefore = userData.activeSession;
        finishRound(userData.activeSession, click, userData, userId);
        
        // If session was finished (bomb hit), return the finished session
        if (!userData.activeSession && sessionBefore) {
          const finishedSession = publicSession(sessionBefore);
          const payload = {
            userChoices: finishedSession.gameData.userChoices,
            state: finishedSession.state,
            availableCashout: 0,
            coefficient: finishedSession.coefficient || 0,
            lastRound: finishedSession.lastRound || 0,
            gameData: {
              currentRoundId: finishedSession.gameData.currentRoundId,
              availableCashout: false,
              rounds: finishedSession.gameData.rounds,
              coefficients: finishedSession.gameData.coefficients,
              expectedChoices: finishedSession.gameData.expectedChoices
            }
          };
          send(res,200,payload,{ 'Content-Type':'application/json' });
          return resolve(true);
        }
        
        // If session is still active, return current state
        const s = userData.activeSession;
        const payload = {
          userChoices: s.gameData.userChoices,
          state: s.state,
          availableCashout: s.availableCashout || 0,
          coefficient: s.coefficient || 0,
          lastRound: s.lastRound || 0,
          gameData: {
            currentRoundId: s.gameData.currentRoundId,
            availableCashout: s.availableCashout > 0,
            rounds: s.gameData.rounds,
            coefficients: s.gameData.coefficients,
            expectedChoices: s.gameData.expectedChoices
          }
        };
        send(res,200,payload,{ 'Content-Type':'application/json' });
        return resolve(true);
      });
      return;
    }
    
    if(/^\/mines\/session\//.test(p)&&m==='PUT'){ 
      cashout(userData, userId); 
      send(res,200,userData.history?.[0]||{},{ 'Content-Type':'application/json' }); 
      return resolve(true); 
    }
    
    if(p==='/mines/cashout'&&m==='POST'){
      if(!userData.activeSession) {
        send(res,400,{ error:{ type:'noActiveSession', message:'No active session to cashout' }},{ 'Content-Type':'application/json' });
        return resolve(true);
      }
      if(userData.activeSession.availableCashout <= 0) {
        send(res,400,{ error:{ type:'noCashoutAvailable', message:'No cashout available' }},{ 'Content-Type':'application/json' });
        return resolve(true);
      }
      cashout(userData, userId);
      send(res,200,{ success: true, balance: userData.balance },{ 'Content-Type':'application/json' });
      return resolve(true);
    }
    
    if(p==='/mines/debug/state'&&m==='GET'){
      const debug = {
        user: userData,
        activeSession: userData.activeSession ? {
          id: userData.activeSession.id,
          state: userData.activeSession.state,
          coefficient: userData.activeSession.coefficient,
          availableCashout: userData.activeSession.availableCashout,
          lastRound: userData.activeSession.lastRound,
          coefficients: userData.activeSession.gameData?.coefficients,
          userChoices: userData.activeSession.gameData?.userChoices
        } : null
      };
      send(res,200,debug,{ 'Content-Type':'application/json' });
      return resolve(true);
    }
    
    if(p==='/mines/debug/topup'&&m==='POST'){
      readJson(req, body=>{
        const amount = Number(body.amount||0);
        const max = 20000;
        if(!Number.isFinite(amount) || amount<=0){ 
          send(res,400,{ error:{ type:'badAmount', message:'Amount must be positive number' }},{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }); 
          return resolve(true);
        } 
        if(amount>max){ 
          send(res,400,{ error:{ type:'tooHigh', message:`Max topup is ${max}` }},{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }); 
          return resolve(true);
        } 
        const before = userData.balance;
        userData.balance = Math.round((userData.balance + amount)*100)/100;
        const delta = Math.round((userData.balance - before)*100)/100;
        send(res,200,{ ok:true, credited: delta, balance: userData.balance, currency: userData.currency },{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
        // Send real-time balance update to this specific user
        sendSSEToUser(userId, { type: 'balance_update', balance: userData.balance, currency: userData.currency });
        return resolve(true);
      });
      return;
    }
    
    send(res,404,'API endpoint not found');
    return resolve(true);
  });
}

// Main handler
async function requestHandler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const p = url.pathname;
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }
    
    // Handle static files
    if (p.startsWith('/static/') || p === '/favicon.svg' || p === '/manifest.json') {
      try {
        const filePath = path.join(process.cwd(), 'public', p);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath);
          const contentType = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.woff2': 'font/woff2',
            '.woff': 'font/woff',
            '.mp3': 'audio/mpeg',
            '.json': 'application/json'
          }[ext] || 'application/octet-stream';
          
          const content = fs.readFileSync(filePath);
          send(res, 200, content, { 'Content-Type': contentType });
        } else {
          // For missing JS chunks, return empty module to prevent errors
          if (p.includes('.chunk.js')) {
            send(res, 200, '// Empty chunk', { 'Content-Type': 'application/javascript' });
          } else if (p.includes('.woff2') || p.includes('.woff')) {
            // For missing fonts, return empty response
            send(res, 200, '', { 'Content-Type': 'font/woff2' });
          } else {
            send(res, 404, 'File not found');
          }
        }
      } catch (error) {
        send(res, 500, 'Error reading file');
      }
    } else if (p.startsWith('/socket.io/')) {
      // Handle socket.io requests
      send(res, 200, '{}', { 'Content-Type': 'application/json' });
    } else if (p.startsWith('/mines/')) {
      if (p.includes('/mines/user') || p.includes('/mines/settings') || p.includes('/mines/session') || p.includes('/mines/round') || p.includes('/mines/sessions')) {
        await handleApi(req, res);
      } else {
        try {
          const gameHtml = fs.readFileSync(path.join(process.cwd(), 'public', 'index.html'), 'utf8');
          send(res, 200, gameHtml, { 'Content-Type': 'text/html; charset=utf-8' });
        } catch (error) {
          send(res, 500, 'Game not found');
        }
      }
    } else if (p === '/' || p === '/index.html') {
      res.writeHead(302, { Location: '/mines/' });
      res.end();
    } else {
      send(res,404,'Not found');
    }
  } catch (e) {
    console.error('Error:', e);
    send(res,500,'Internal Server Error');
  }
}

module.exports = requestHandler;
