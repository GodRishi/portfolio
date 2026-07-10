export class CodeCanvasManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.isLight = document.documentElement.classList.contains('light');
    
    // Position pointer off-screen initially
    this.mouse = { x: -2000, y: -2000 };
    this.targetMouse = { x: -2000, y: -2000 };
    this.scrollY = 0;
    this.isPaused = false;

    this.snippets = [
      "import os, sys, time, json",
      "from sklearn.ensemble import RandomForestClassifier",
      "import tensorflow as tf",
      "import torch",
      "import torch.nn as nn",
      "",
      "class AntiGravityOptimizer(object):",
      "    def __init__(self, learning_rate=0.01, beta=0.9):",
      "        self.lr = learning_rate",
      "        self.beta = beta",
      "        self.weights = np.random.randn(128, 64) * 0.01",
      "        self.bias = np.zeros((1, 64))",
      "        self.v_w = np.zeros_like(self.weights)",
      "        self.v_b = np.zeros_like(self.bias)",
      "",
      "    def forward(self, inputs):",
      "        self.inputs = inputs",
      "        return np.dot(inputs, self.weights) + self.bias",
      "",
      "    def optimize(self, d_loss):",
      "        # Calculate gradients using backpropagation",
      "        dw = np.dot(self.inputs.T, d_loss)",
      "        db = np.sum(d_loss, axis=0, keepdims=True)",
      "        ",
      "        # Update velocities with momentum",
      "        self.v_w = self.beta * self.v_w + (1 - self.beta) * dw",
      "        self.v_b = self.beta * self.v_b + (1 - self.beta) * db",
      "        ",
      "        # Apply gradients to parameter weights",
      "        self.weights -= self.lr * self.v_w",
      "        self.bias -= self.lr * self.v_b",
      "",
      "def scrape_competitor_metrics(target_url):",
      "    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}",
      "    try:",
      "        response = requests.get(target_url, headers=headers, timeout=5)",
      "        if response.status_code == 200:",
      "            soup = BeautifulSoup(response.text, 'html.parser')",
      "            metrics = {}",
      "            for tag in soup.find_all('div', class_='metric-chip'):",
      "                metrics[tag.get('id')] = float(tag.text.strip())",
      "            return metrics",
      "    except Exception as err:",
      "        print(f'Pipeline error scraping {target_url}: {err}')",
      "        return None",
      "",
      "@app.route('/api/v1/leads/secure', methods=['POST'])",
      "def secure_direct_pipeline():",
      "    payload = request.get_json()",
      "    if not payload or 'email' not in payload:",
      "        return jsonify({'status': 'BAD_REQUEST', 'code': 400}), 400",
      "    ",
      "    # Verify lead authority token",
      "    if db.verify_auth_token(payload.get('token')):",
      "        db.insert_lead(payload['email'], budget=payload.get('budget', '5k-10k'))",
      "        return jsonify({'status': 'SUCCESS', 'code': 200})",
      "    return jsonify({'status': 'UNAUTHORIZED', 'code': 401}), 401",
      "",
      "class WebGLShaderBuffer(nn.Module):",
      "    def __init__(self, in_features=128, out_features=64):",
      "        super(WebGLShaderBuffer, self).__init__()",
      "        self.fc = nn.Linear(in_features, out_features)",
      "        self.relu = nn.ReLU()",
      "        self.dropout = nn.Dropout(0.1)",
      "        self.output = nn.Linear(out_features, 1)",
      "        ",
      "    def forward(self, x):",
      "        x = self.dropout(self.relu(self.fc(x)))",
      "        return torch.sigmoid(self.output(x))"
    ];

    this.codeObjects = [];
    this.lineHeight = 24; 
    this.colWidth = 650;  
    
    this.init();
    this.addEventListeners();
    this.animate();
  }

  init() {
    this.resizeCanvas();
    this.setupCodeObjects();
    this.updateColors();
    this.lastWidth = window.innerWidth;
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupCodeObjects() {
    this.codeObjects = [];
    this.ctx.font = `13px "JetBrains Mono", monospace`;

    const numCols = Math.ceil(this.canvas.width / this.colWidth) + 1;
    const numRows = Math.ceil(this.canvas.height / this.lineHeight) + 4;
    this.totalHeight = numRows * this.lineHeight;

    for (let col = 0; col < numCols; col++) {
      for (let row = 0; row < numRows; row++) {
        const index = (col * 20 + row) % this.snippets.length;
        const text = this.snippets[index];
        
        const x = col * this.colWidth + 70;
        const y = row * this.lineHeight;

        this.codeObjects.push({
          text: text,
          originalText: text,
          x: x,
          y: y,
          col: col,
          row: row,
          width: this.ctx.measureText(text).width,
          lineNum: String(row + 1).padStart(2, '0'),
          scrambleTicks: 0
        });
      }
    }
  }

  updateColors() {
    if (this.isLight) {
      this.bgColor = '#f5f5f5';
      this.baseTextColor = 'rgba(0, 0, 0, 0.18)'; 
      this.lineNumColor = 'rgba(112, 0, 255, 0.14)';
      this.guideLineColor = 'rgba(0, 0, 0, 0.04)';
      
      this.glowStart = '#ff0055'; 
      this.glowMid = '#7000ff';   
      this.bgGlowColor = 'rgba(255, 0, 85, 0.08)';
    } else {
      this.bgColor = '#050505';
      this.baseTextColor = 'rgba(255, 255, 255, 0.22)';
      this.lineNumColor = 'rgba(0, 255, 102, 0.18)';
      this.guideLineColor = 'rgba(255, 255, 255, 0.03)';
      
      this.glowStart = '#00ff66'; 
      this.glowMid = '#00f0ff';   
      this.bgGlowColor = 'rgba(0, 255, 102, 0.12)';
    }
  }

  addEventListeners() {
    // Mobile Resize Guard: ignores height-only shifts caused by address bar hide/show
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== this.lastWidth) {
        this.lastWidth = currentWidth;
        this.resizeCanvas();
        this.setupCodeObjects();
      } else {
        // Height-only resize: expand canvas drawing buffer without scrambling code coordinates
        this.canvas.height = window.innerHeight;
      }
    });

    // Mouse Listeners
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = e.clientX;
      this.targetMouse.y = e.clientY;
    });

    // Touch Screen Spotlight Bindings for mobile/tablets
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.targetMouse.x = e.touches[0].clientX;
        this.targetMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.targetMouse.x = e.touches[0].clientX;
        this.targetMouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      // De-authenticate pointer by throwing coordinates offscreen
      this.targetMouse.x = -2000;
      this.targetMouse.y = -2000;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
    }, { passive: true });
  }

  updateTheme(isLight) {
    this.isLight = isLight;
    this.updateColors();
  }

  scrambleCode() {
    this.codeObjects.forEach(obj => {
      obj.scrambleTicks = 30;
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.15;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.15;

    this.ctx.fillStyle = this.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Skip drawing spotlight effects if pointer is far off-screen
    const hasPointer = this.mouse.x > -1000 && this.mouse.y > -1000;

    // 1. Draw Mouse Glow Background Spotlight
    if (hasPointer) {
      const glowRadius = 220;
      const bgGlow = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, glowRadius
      );
      bgGlow.addColorStop(0, this.bgGlowColor);
      bgGlow.addColorStop(0.5, this.isLight ? 'rgba(112, 0, 255, 0.02)' : 'rgba(0, 240, 255, 0.03)');
      bgGlow.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.fillStyle = bgGlow;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 2. Draw vertical VS Code column guides
    this.ctx.strokeStyle = this.guideLineColor;
    this.ctx.lineWidth = 1;
    const numCols = Math.ceil(this.canvas.width / this.colWidth) + 1;
    for (let col = 0; col < numCols; col++) {
      const guideX = col * this.colWidth + 25;
      this.ctx.beginPath();
      this.ctx.moveTo(guideX, 0);
      this.ctx.lineTo(guideX, this.canvas.height);
      this.ctx.stroke();
    }

    // 3. Draw Pass One: All Code lines horizontally in readable base colors
    this.ctx.font = 'bold 13px "JetBrains Mono", monospace';
    this.ctx.textBaseline = 'middle';

    const scrollOffset = -this.scrollY * 0.2; 

    this.codeObjects.forEach(obj => {
      if (!this.isPaused) {
        obj.y -= 0.3; 
      }

      if (obj.y + scrollOffset < -40) {
        obj.y += this.totalHeight;
      }
      if (obj.y + scrollOffset > this.canvas.height + 40) {
        obj.y -= this.totalHeight;
      }

      const drawY = obj.y + scrollOffset;

      // Scramble ticks logic
      let textToDraw = obj.text;
      if (obj.scrambleTicks > 0) {
        obj.scrambleTicks--;
        if (obj.scrambleTicks === 0) {
          obj.text = obj.originalText;
        } else {
          const chars = "abcdefghijklmnopqrstuvwxyz{}<>[];:=-+*%01";
          obj.text = obj.originalText.split('').map(c => {
            if (c === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
        }
        textToDraw = obj.text;
      }

      // Draw Line Numbers
      this.ctx.fillStyle = this.lineNumColor;
      this.ctx.fillText(obj.lineNum, obj.x - 45, drawY);

      // Draw Code base text
      this.ctx.fillStyle = this.baseTextColor;
      this.ctx.fillText(textToDraw, obj.x, drawY);
    });

    // 4. Draw Pass Two: Glowing spotlight overlay (Optimized with Squared Distance)
    if (hasPointer) {
      const textRadius = 160;
      const textGlow = this.ctx.createRadialGradient(
        this.mouse.x, this.mouse.y, 0,
        this.mouse.x, this.mouse.y, textRadius
      );
      textGlow.addColorStop(0, this.glowStart);
      textGlow.addColorStop(0.6, this.glowMid);
      textGlow.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.fillStyle = textGlow;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.glowStart;

      // Pre-compute squared check boundary
      const radiusLimit = textRadius;
      const radiusLimitSq = radiusLimit * radiusLimit;

      this.codeObjects.forEach(obj => {
        const drawY = obj.y + scrollOffset;

        // X/Y offsets from mouse
        const dx = obj.x + obj.width / 2 - this.mouse.x;
        const dy = drawY - this.mouse.y;
        
        // Performance Gain: Calculate squared distance to bypass Math.sqrt calls
        const distSq = dx * dx + dy * dy;

        // Check intersection with squared boundary
        if (distSq < radiusLimitSq + (obj.width * obj.width) / 4) {
          this.ctx.fillText(obj.text, obj.x, drawY);
        }
      });

      this.ctx.shadowBlur = 0;
    }
  }
}
