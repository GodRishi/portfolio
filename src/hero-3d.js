import * as THREE from 'three';

export class Hero3DManager {
  constructor(containerId = 'hero-3d-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.isLight = document.documentElement.classList.contains('light');
    this.isTabHidden = false;
    this.isVisible = true;
    this.activeShape = 'geodesic'; // 'geodesic' | 'torusKnot' | 'crystalCore'

    // Prefers-reduced-motion check
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = reducedMotionQuery.matches;
    reducedMotionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });

    // Coordinates, Physics & Drag Inertia State
    this.mouse = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.lastMouseMoveTime = performance.now();

    // Pointer Drag & Throw Physics
    this.isPointerDown = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };
    this.dragMomentum = { x: 0, y: 0 };
    this.dragDistance = 0;

    // Rotation Lerp State
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.autoRotationY = 0;

    // Scale & Position
    this.targetScale = 1.0;
    this.currentScale = 1.0;
    this.baseScale = 1.15;
    this.basePositionX = 1.6;
    this.shapeMorphScale = 1.0;

    // Raycasting & Particle Burst Systems
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 0.35;
    this.shockwaveParticles = [];
    this.clock = new THREE.Clock();

    this.init();
  }

  getPrimaryColorHex() {
    return this.isLight ? '#ff0055' : '#00ff66'; // Neon Pink (Light) / Neon Green (Dark)
  }

  getSecondaryColorHex() {
    return this.isLight ? '#7000ff' : '#00f0ff'; // Electric Purple (Light) / Electric Cyan (Dark)
  }

  init() {
    try {
      // 1. Scene & Camera Setup
      this.scene = new THREE.Scene();

      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      this.camera.position.set(0, 0, 8.5);

      // 2. WebGL Renderer Setup
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });

      this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(width, height);
      this.renderer.setClearColor(0x000000, 0);

      // Clear container and append canvas
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);

      // 3. Build Background Spatial Grid & Main 3D Object Group
      this.buildBackgroundSpatialGrid();
      this.buildAssembly();

      // 4. Dual-Tone Specular Lighting
      this.setupLighting();

      // 5. Register Event Listeners (Pointer, Drag, Resize, Raycast)
      this.addEventListeners();

      // 6. Render Loop
      requestAnimationFrame((timestamp) => this.animate(timestamp));
    } catch (err) {
      console.warn('WebGL initialization failed, applying fallback:', err);
      this.renderFallback();
    }
  }

  buildBackgroundSpatialGrid() {
    // Spatial Ambient Warp Grid in Background
    const count = 160;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const primaryColor = new THREE.Color(this.getPrimaryColorHex());
    const secondaryColor = new THREE.Color(this.getSecondaryColorHex());

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = -4.0 - Math.random() * 8.0;

      const pColor = Math.random() > 0.5 ? primaryColor : secondaryColor;
      colors[i * 3]     = pColor.r;
      colors[i * 3 + 1] = pColor.g;
      colors[i * 3 + 2] = pColor.b;
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    gridGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const ctx = particleCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    this.gridMat = new THREE.PointsMaterial({
      size: 0.14,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      alphaTest: 0.1,
      sizeAttenuation: true
    });

    this.gridGroup = new THREE.Points(gridGeo, this.gridMat);
    this.scene.add(this.gridGroup);
  }

  buildAssembly() {
    if (this.heroGroup) {
      this.scene.remove(this.heroGroup);
    }

    this.heroGroup = new THREE.Group();
    const primaryColor = new THREE.Color(this.getPrimaryColorHex());
    const secondaryColor = new THREE.Color(this.getSecondaryColorHex());

    // ─── Dedicated Crystal Core Geometry ─────────────────────────────────────
    this.outerGeo = new THREE.DodecahedronGeometry(2.3, 0);
    this.innerGeo = new THREE.TetrahedronGeometry(1.4, 1);

    // ─── Layer 1: Base Sharp Wireframe Cage ─────────────────────────────────────
    const wireframeGeo = new THREE.WireframeGeometry(this.outerGeo);
    this.wireframeMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.88
    });
    this.outerWireframe = new THREE.LineSegments(wireframeGeo, this.wireframeMat);
    this.heroGroup.add(this.outerWireframe);

    // ─── Layer 1B: Outer Additive Glow Aura Wireframe ───────────────────────────
    this.auraWireframeMat = new THREE.LineBasicMaterial({
      color: primaryColor,
      linewidth: 2.0,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.outerAuraWireframe = new THREE.LineSegments(wireframeGeo, this.auraWireframeMat);
    this.outerAuraWireframe.scale.set(1.03, 1.03, 1.03);
    this.heroGroup.add(this.outerAuraWireframe);

    // ─── Layer 2: Vertex Node Dots ──────────────────────────────────────────────
    const posAttr = this.outerGeo.getAttribute('position');
    const vertexPositions = [];
    const tempVec = new THREE.Vector3();
    const uniquePointsMap = new Set();

    for (let i = 0; i < posAttr.count; i++) {
      tempVec.fromBufferAttribute(posAttr, i);
      const key = `${tempVec.x.toFixed(3)},${tempVec.y.toFixed(3)},${tempVec.z.toFixed(3)}`;
      if (!uniquePointsMap.has(key)) {
        uniquePointsMap.add(key);
        vertexPositions.push(tempVec.x, tempVec.y, tempVec.z);
      }
    }

    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertexPositions, 3));

    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 32;
    dotCanvas.height = 32;
    const dotCtx = dotCanvas.getContext('2d');
    dotCtx.fillStyle = '#ffffff';
    dotCtx.beginPath();
    dotCtx.arc(16, 16, 12, 0, Math.PI * 2);
    dotCtx.fill();
    const dotTexture = new THREE.CanvasTexture(dotCanvas);
    this.dotTexture = dotTexture;

    this.dotsMat = new THREE.PointsMaterial({
      color: primaryColor,
      size: 0.32,
      map: dotTexture,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.1,
      sizeAttenuation: true
    });
    this.vertexDots = new THREE.Points(dotsGeo, this.dotsMat);
    this.heroGroup.add(this.vertexDots);

    // ─── Layer 3: Counter-Rotating Liquid Glass Core ───────────────────────────
    this.innerCoreGroup = new THREE.Group();

    this.innerMat = new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.8,
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });
    this.innerMesh = new THREE.Mesh(this.innerGeo, this.innerMat);
    this.innerCoreGroup.add(this.innerMesh);

    const innerWireGeo = new THREE.WireframeGeometry(this.innerGeo);
    this.innerWireMat = new THREE.LineBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.5,
      linewidth: 1
    });
    this.innerWireframe = new THREE.LineSegments(innerWireGeo, this.innerWireMat);
    this.innerCoreGroup.add(this.innerWireframe);

    this.heroGroup.add(this.innerCoreGroup);

    // ─── Layer 4: Orbital Particle Swarm ────────────────────────────────────────
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.0 + Math.random() * 2.4;

      particlePositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      const pColor = Math.random() > 0.5 ? primaryColor : secondaryColor;
      particleColors[i * 3]     = pColor.r;
      particleColors[i * 3 + 1] = pColor.g;
      particleColors[i * 3 + 2] = pColor.b;
    }

    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    cloudGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    this.cloudMat = new THREE.PointsMaterial({
      size: 0.18,
      map: dotTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      alphaTest: 0.1,
      sizeAttenuation: true
    });

    this.particleCloud = new THREE.Points(cloudGeo, this.cloudMat);
    this.heroGroup.add(this.particleCloud);

    // Dynamic Hover Connecting Beam Group
    this.beamGroup = new THREE.Group();
    this.heroGroup.add(this.beamGroup);

    // Scale positioning
    this.updateScale();
    this.scene.add(this.heroGroup);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambientLight);

    // Primary PointLight (Follows Cursor / Raycast Vertex)
    this.primaryLight = new THREE.PointLight(
      new THREE.Color(this.getPrimaryColorHex()),
      4.0,
      20,
      1.5
    );
    this.primaryLight.position.set(0, 0, 5);
    this.scene.add(this.primaryLight);

    // Secondary PointLight (Opposite Rim Specular Light)
    this.secondaryLight = new THREE.PointLight(
      new THREE.Color(this.getSecondaryColorHex()),
      3.0,
      18,
      1.5
    );
    this.secondaryLight.position.set(-4, -3, -2);
    this.scene.add(this.secondaryLight);
  }

  setGeometryShape(shapeType) {
    if (this.activeShape === shapeType || this.isTransitioning) return;
    this.activeShape = shapeType;
    this.isTransitioning = true;

    // Trigger shape morph scale collapse and re-expand
    let morphTime = 0;
    const morphInterval = setInterval(() => {
      morphTime += 0.08;
      if (morphTime < 0.5) {
        this.shapeMorphScale = Math.max(0.15, 1 - morphTime * 1.7);
      } else {
        if (this.isTransitioning) {
          this.buildAssembly();
          this.triggerShockwave(new THREE.Vector3(0, 0, 0));
          this.isTransitioning = false;
        }
        this.shapeMorphScale = Math.min(1.0, (morphTime - 0.5) * 2.0);
        if (morphTime >= 1.0) {
          this.shapeMorphScale = 1.0;
          clearInterval(morphInterval);
        }
      }
    }, 16);
  }

  triggerShockwave(originVec) {
    const burstCount = 65;
    const positions = new Float32Array(burstCount * 3);
    const velocities = [];

    const primaryColor = new THREE.Color(this.getPrimaryColorHex());
    const secondaryColor = new THREE.Color(this.getSecondaryColorHex());

    for (let i = 0; i < burstCount; i++) {
      positions[i * 3]     = originVec.x;
      positions[i * 3 + 1] = originVec.y;
      positions[i * 3 + 2] = originVec.z;

      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = 0.12 + Math.random() * 0.18;
      velocities.push(dir.multiplyScalar(speed));
    }

    const shockGeo = new THREE.BufferGeometry();
    shockGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const shockMat = new THREE.PointsMaterial({
      color: Math.random() > 0.5 ? primaryColor : secondaryColor,
      size: 0.35,
      map: this.dotTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const shockPoints = new THREE.Points(shockGeo, shockMat);
    this.scene.add(shockPoints);

    this.shockwaveParticles.push({
      mesh: shockPoints,
      velocities: velocities,
      life: 1.0
    });

    // Light flash flare impulse
    if (this.primaryLight) {
      this.primaryLight.intensity = 12.0;
    }
  }

  updateScale() {
    if (!this.heroGroup) return;
    const width = window.innerWidth;

    if (width < 600) {
      this.baseScale = 0.72;
      this.basePositionX = 0;
    } else if (width < 1024) {
      this.baseScale = 0.85;
      this.basePositionX = 0.4;
    } else {
      this.baseScale = 1.15;
      this.basePositionX = 1.6;
    }

    this.heroGroup.position.x = this.basePositionX;
    const currentFinalScale = this.baseScale * this.currentScale * this.shapeMorphScale;
    this.heroGroup.scale.set(currentFinalScale, currentFinalScale, currentFinalScale);
  }

  updateTheme(isLight) {
    this.isLight = isLight;
    const primaryColor = new THREE.Color(this.getPrimaryColorHex());
    const secondaryColor = new THREE.Color(this.getSecondaryColorHex());

    if (this.wireframeMat) this.wireframeMat.color = primaryColor;
    if (this.auraWireframeMat) this.auraWireframeMat.color = primaryColor;
    if (this.innerMat) this.innerMat.color = primaryColor;
    if (this.innerWireMat) this.innerWireMat.color = secondaryColor;
    if (this.dotsMat) this.dotsMat.color = primaryColor;
    if (this.primaryLight) this.primaryLight.color = primaryColor;
    if (this.secondaryLight) this.secondaryLight.color = secondaryColor;
  }

  addEventListeners() {
    // Visibility API auto-pausing
    document.addEventListener('visibilitychange', () => {
      this.isTabHidden = document.hidden;
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      this.observer.observe(this.container);
    }

    const heroSection = document.getElementById('hero-section') || window;

    // Pointer Down (Drag & Grab Start)
    this.container.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.dragDistance = 0;
      this.container.style.cursor = 'grabbing';
    });

    // Pointer Move (Mouse & Drag Tracking)
    window.addEventListener('pointermove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const newMouseX = (relativeX / rect.width) * 2 - 1;
      const newMouseY = -(relativeY / rect.height) * 2 + 1;

      this.targetMouse.x = newMouseX;
      this.targetMouse.y = newMouseY;

      if (this.isPointerDown) {
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;

        this.dragDistance += Math.abs(dx) + Math.abs(dy);

        // Direct rotation impulse from dragging
        this.autoRotationY += dx * 0.012;
        this.targetRotation.x += dy * 0.012;

        this.dragVelocity.x = dx * 0.008;
        this.dragVelocity.y = dy * 0.008;

        this.lastPointer = { x: e.clientX, y: e.clientY };
      }

      // Hover scale pulse
      const distFromCenter = Math.sqrt(newMouseX * newMouseX + newMouseY * newMouseY);
      if (!this.isPointerDown) {
        this.targetScale = distFromCenter < 0.95 ? 1.15 : 1.0;
      }
    }, { passive: true });

    // Pointer Up (Release / Click Detector)
    window.addEventListener('pointerup', (e) => {
      if (this.isPointerDown) {
        this.isPointerDown = false;
        this.container.style.cursor = 'grab';

        // Check if pointer movement was minimal -> Trigger Click Shockwave!
        if (this.dragDistance < 10) {
          const rect = this.container.getBoundingClientRect();
          if (
            e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom
          ) {
            this.triggerShockwave(new THREE.Vector3(0, 0, 0));
          }
        } else {
          // Transfer drag velocity to inertia momentum
          this.dragMomentum.x = this.dragVelocity.x;
          this.dragMomentum.y = this.dragVelocity.y;
        }
      }
    });

    heroSection.addEventListener('mouseleave', () => {
      this.targetMouse.x = 0;
      this.targetMouse.y = 0;
      this.targetScale = 1.0;
      this.isPointerDown = false;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.updateScale();
    }, { passive: true });
  }

  animate() {
    requestAnimationFrame((timestamp) => this.animate(timestamp));

    if (this.isTabHidden || !this.isVisible) return;

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Lerp Coordinates & Physics Friction Decay
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

    this.currentScale += (this.targetScale - this.currentScale) * 0.07;
    const finalScale = this.baseScale * this.currentScale * this.shapeMorphScale;
    this.heroGroup.scale.set(finalScale, finalScale, finalScale);

    // Apply drag inertia momentum friction decay
    this.dragMomentum.x *= 0.94;
    this.dragMomentum.y *= 0.94;

    this.autoRotationY += this.dragMomentum.x;
    this.targetRotation.x += this.dragMomentum.y;

    // 2. Motion Execution
    if (!this.prefersReducedMotion) {
      this.autoRotationY += delta * 0.22;

      // Inner Core Counter-Rotation
      if (this.innerCoreGroup) {
        this.innerCoreGroup.rotation.y -= delta * 0.55;
        this.innerCoreGroup.rotation.x += delta * 0.35;
      }

      // Orbital Swarm Rotation
      if (this.particleCloud) {
        this.particleCloud.rotation.y += delta * 0.15;
        this.particleCloud.rotation.z = Math.sin(elapsedTime * 0.5) * 0.12;
      }

      // Floating Bobbing Sine Wave
      const bobY = Math.sin(elapsedTime * 1.35) * 0.22;
      const magneticY = this.mouse.y * 0.45;
      this.heroGroup.position.y = bobY + magneticY;

      // Magnetic Cursor X Translation Drift
      const magneticX = this.basePositionX + this.mouse.x * 0.55;
      this.heroGroup.position.x += (magneticX - this.heroGroup.position.x) * 0.08;

      // Dynamic Mouse Tilt Lerping
      this.targetRotation.x = Math.max(-1.2, Math.min(1.2, this.targetRotation.x));
      this.targetRotation.y = this.mouse.x * 0.95;

      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

      this.heroGroup.rotation.x = this.currentRotation.x;
      this.heroGroup.rotation.y = this.autoRotationY + this.currentRotation.y;
    }

    // 3. Background Spatial Grid Motion
    if (this.gridGroup) {
      this.gridGroup.rotation.y = this.mouse.x * 0.08;
      this.gridGroup.rotation.x = -this.mouse.y * 0.08;
    }

    // 4. Update Particle Shockwave Burst Systems
    for (let i = this.shockwaveParticles.length - 1; i >= 0; i--) {
      const shock = this.shockwaveParticles[i];
      shock.life -= delta * 1.3;

      if (shock.life <= 0) {
        this.scene.remove(shock.mesh);
        shock.mesh.geometry.dispose();
        shock.mesh.material.dispose();
        this.shockwaveParticles.splice(i, 1);
      } else {
        shock.mesh.material.opacity = shock.life;
        const posAttr = shock.mesh.geometry.getAttribute('position');

        for (let j = 0; j < shock.velocities.length; j++) {
          const v = shock.velocities[j];
          posAttr.setXYZ(
            j,
            posAttr.getX(j) + v.x,
            posAttr.getY(j) + v.y,
            posAttr.getZ(j) + v.z
          );
        }
        posAttr.needsUpdate = true;
      }
    }

    // 5. Dynamic Specular Light Following & Intensity Decay
    this.primaryLight.position.x = this.mouse.x * 6.0;
    this.primaryLight.position.y = this.mouse.y * 5.0;
    this.primaryLight.position.z = 4.5;

    const dist = Math.sqrt(this.mouse.x * this.mouse.x + this.mouse.y * this.mouse.y);
    const proximityFactor = 1 - Math.min(dist, 1);

    // Decay light intensity back to normal 4.0 after flash
    const baseTargetIntensity = 4.0 + proximityFactor * 3.5;
    this.primaryLight.intensity += (baseTargetIntensity - this.primaryLight.intensity) * 0.1;

    if (this.dotsMat) {
      this.dotsMat.size = 0.32 + proximityFactor * 0.16;
    }

    // 6. Node Raycasting Highlight Check
    this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
    if (this.vertexDots) {
      const intersects = this.raycaster.intersectObject(this.vertexDots);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        if (this.dotsMat) this.dotsMat.size = 0.52;
        this.primaryLight.position.copy(point);
      }
    }

    // 7. Render Frame
    this.renderer.render(this.scene, this.camera);
  }

  renderFallback() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="hero-3d-fallback" style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.15;
      ">
        <svg width="240" height="240" viewBox="0 0 100 100" fill="none" stroke="${this.getPrimaryColorHex()}" stroke-width="1.5">
          <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
          <line x1="50" y1="5" x2="50" y2="95" />
          <line x1="10" y1="25" x2="90" y2="75" />
          <line x1="10" y1="75" x2="90" y2="25" />
        </svg>
      </div>
    `;
  }
}
