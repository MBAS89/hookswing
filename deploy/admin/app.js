const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3002;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me-in-production';
const ENV_PATH = process.env.ENV_PATH || path.join(__dirname, '../hookswing/.env');
const PROJECT_DIR = process.env.PROJECT_DIR || '/opt/projects/hookswing/deploy/hookswing';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simple password middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Also accept password via query param for browser access
function requireAuthFlexible(req, res, next) {
  const password = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Env Admin — Login</title></head>
      <body style="font-family:sans-serif;max-width:400px;margin:100px auto;padding:20px">
        <h2>🔐 Env Admin Login</h2>
        <form method="GET" action="/admin/env">
          <input type="password" name="password" placeholder="Admin password" style="width:100%;padding:10px;margin:10px 0" required>
          <button type="submit" style="width:100%;padding:10px">Login</button>
        </form>
      </body>
      </html>
    `);
  }
  req.password = password;
  next();
}

function parseEnv(content) {
  const vars = [];
  const lines = content.split('\n');
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      vars.push({ type: 'comment', value: line });
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      vars.push({ type: 'raw', value: line });
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1);
    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars.push({ type: 'var', key, value, raw: line });
  }
  return vars;
}

function buildEnv(vars) {
  return vars.map(v => {
    if (v.type === 'var') return `${v.key}=${v.value}`;
    return v.value;
  }).join('\n') + '\n';
}

function getHtml(vars, password, message = '', error = '') {
  const rows = vars.map((v, i) => {
    if (v.type === 'comment') {
      return `<tr><td colspan="3"><input type="text" name="c_${i}" value="${escapeHtml(v.value)}" style="width:100%;background:#f5f5f5;border:none;padding:8px;font-family:monospace;color:#666" placeholder="# comment"></td></tr>`;
    }
    if (v.type === 'raw') {
      return `<tr><td colspan="3"><input type="text" name="r_${i}" value="${escapeHtml(v.value)}" style="width:100%;border:none;padding:8px;font-family:monospace"></td></tr>`;
    }
    const isSecret = v.key.toLowerCase().includes('password') || v.key.toLowerCase().includes('secret') || v.key.toLowerCase().includes('key');
    const inputType = isSecret ? 'password' : 'text';
    return `
      <tr data-index="${i}">
        <td style="width:30%"><input type="text" name="k_${i}" value="${escapeHtml(v.key)}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-weight:600" placeholder="KEY_NAME"></td>
        <td style="width:65%"><input type="${inputType}" name="v_${i}" value="${escapeHtml(v.value)}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px" placeholder="value"></td>
        <td style="width:5%;text-align:center"><button type="button" onclick="deleteRow(this)" style="background:#ff4444;color:white;border:none;border-radius:4px;padding:6px 10px;cursor:pointer">×</button></td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HookSwing Env Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    h1 { margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
    .alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    td { padding: 4px; }
    input { font-family: monospace; font-size: 14px; }
    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-warning:hover { background: #d97706; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
    .env-path { font-family: monospace; font-size: 12px; color: #666; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
    .add-btn { width: 100%; padding: 10px; border: 2px dashed #cbd5e1; background: transparent; color: #64748b; border-radius: 6px; cursor: pointer; margin-top: 8px; }
    .add-btn:hover { border-color: #2563eb; color: #2563eb; }
  </style>
</head>
<body>
  <h1>⚙️ HookSwing Env Admin</h1>
  <p class="subtitle">Manage environment variables for your production deployment</p>
  
  ${message ? `<div class="alert success">${escapeHtml(message)}</div>` : ''}
  ${error ? `<div class="alert error">${escapeHtml(error)}</div>` : ''}
  
  <div class="card">
    <p><strong>Env file:</strong> <span class="env-path">${escapeHtml(ENV_PATH)}</span></p>
    
    <form method="POST" action="/admin/env/save?password=${escapeHtml(password)}">
      <table id="envTable">
        <tbody>
          ${rows}
        </tbody>
      </table>
      <button type="button" class="add-btn" onclick="addRow()">+ Add new variable</button>
      
      <div class="actions">
        <button type="submit" class="btn btn-primary">💾 Save Changes</button>
        <button type="submit" formaction="/admin/env/save-and-restart?password=${escapeHtml(password)}" class="btn btn-success">💾 Save & Restart API</button>
      </div>
    </form>
    
    <form method="POST" action="/admin/env/restart?password=${escapeHtml(password)}" style="margin-top:16px">
      <button type="submit" class="btn btn-warning" onclick="return confirm('Restart the API container?')">🔄 Restart API Only</button>
    </form>
  </div>
  
  <script>
    let nextIndex = ${vars.length};
    function addRow() {
      const tbody = document.querySelector('#envTable tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = \`
        <td style="width:30%"><input type="text" name="k_\${nextIndex}" value="" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-weight:600" placeholder="KEY_NAME"></td>
        <td style="width:65%"><input type="text" name="v_\${nextIndex}" value="" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px" placeholder="value"></td>
        <td style="width:5%;text-align:center"><button type="button" onclick="deleteRow(this)" style="background:#ff4444;color:white;border:none;border-radius:4px;padding:6px 10px;cursor:pointer">×</button></td>
      \`;
      tbody.appendChild(tr);
      nextIndex++;
    }
    function deleteRow(btn) {
      btn.closest('tr').remove();
    }
  </script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Routes
app.get('/admin/env', requireAuthFlexible, (req, res) => {
  try {
    const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const vars = parseEnv(content);
    res.send(getHtml(vars, req.password));
  } catch (err) {
    res.status(500).send(`Error reading env file: ${err.message}`);
  }
});

app.post('/admin/env/save', requireAuthFlexible, (req, res) => {
  try {
    const body = req.body;
    const vars = [];
    const indices = Object.keys(body)
      .filter(k => k.startsWith('k_') || k.startsWith('v_') || k.startsWith('c_') || k.startsWith('r_'))
      .map(k => parseInt(k.split('_')[1]))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);

    for (const idx of indices) {
      if (body[`c_${idx}`] !== undefined) {
        vars.push({ type: 'comment', value: body[`c_${idx}`] });
      } else if (body[`r_${idx}`] !== undefined) {
        vars.push({ type: 'raw', value: body[`r_${idx}`] });
      } else if (body[`k_${idx}`] !== undefined) {
        const key = body[`k_${idx}`].trim();
        const value = body[`v_${idx}`] || '';
        if (key) {
          vars.push({ type: 'var', key, value, raw: `${key}=${value}` });
        }
      }
    }

    fs.writeFileSync(ENV_PATH, buildEnv(vars));
    
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    const newVars = parseEnv(content);
    res.send(getHtml(newVars, req.password, 'Environment variables saved successfully!'));
  } catch (err) {
    res.status(500).send(`Error saving env file: ${err.message}`);
  }
});

app.post('/admin/env/save-and-restart', requireAuthFlexible, (req, res) => {
  try {
    const body = req.body;
    const vars = [];
    const indices = Object.keys(body)
      .filter(k => k.startsWith('k_') || k.startsWith('v_') || k.startsWith('c_') || k.startsWith('r_'))
      .map(k => parseInt(k.split('_')[1]))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b);

    for (const idx of indices) {
      if (body[`c_${idx}`] !== undefined) {
        vars.push({ type: 'comment', value: body[`c_${idx}`] });
      } else if (body[`r_${idx}`] !== undefined) {
        vars.push({ type: 'raw', value: body[`r_${idx}`] });
      } else if (body[`k_${idx}`] !== undefined) {
        const key = body[`k_${idx}`].trim();
        const value = body[`v_${idx}`] || '';
        if (key) {
          vars.push({ type: 'var', key, value, raw: `${key}=${value}` });
        }
      }
    }

    fs.writeFileSync(ENV_PATH, buildEnv(vars));

    exec(`cd ${PROJECT_DIR} && docker compose -f docker-compose.prod.yml restart api`, (error, stdout, stderr) => {
      const content = fs.readFileSync(ENV_PATH, 'utf8');
      const newVars = parseEnv(content);
      if (error) {
        return res.send(getHtml(newVars, req.password, '', `Saved but restart failed: ${stderr || error.message}`));
      }
      res.send(getHtml(newVars, req.password, 'Saved & API restarted successfully!'));
    });
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

app.post('/admin/env/restart', requireAuthFlexible, (req, res) => {
  exec(`cd ${PROJECT_DIR} && docker compose -f docker-compose.prod.yml restart api`, (error, stdout, stderr) => {
    const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const vars = parseEnv(content);
    if (error) {
      return res.send(getHtml(vars, req.password, '', `Restart failed: ${stderr || error.message}`));
    }
    res.send(getHtml(vars, req.password, 'API restarted successfully!'));
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Env Admin running at http://127.0.0.1:${PORT}/admin/env`);
  console.log(`Managing: ${ENV_PATH}`);
});
