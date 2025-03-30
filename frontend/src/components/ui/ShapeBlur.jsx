import { useRef, useEffect } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 v_texcoord;
  void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      v_texcoord = uv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 v_texcoord;

  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_pixelRatio;

  uniform float u_shapeSize;
  uniform float u_roundness;
  uniform float u_borderSize;
  uniform float u_circleSize;
  uniform float u_circleEdge;

  #define PI 3.1415926535897932384626433832795
  #define TWO_PI 6.2831853071795864769252867665590

  vec2 coord(in vec2 p) {
      p = p / u_resolution.xy;
      if (u_resolution.x > u_resolution.y) {
          p.x *= u_resolution.x / u_resolution.y;
          p.x += (u_resolution.y - u_resolution.x) / u_resolution.y / 2.0;
      } else {
          p.y *= u_resolution.y / u_resolution.x;
          p.y += (u_resolution.x - u_resolution.y) / u_resolution.x / 2.0;
      }
      p -= 0.5;
      p *= vec2(-1.0, 1.0);
      return p;
  }

  #define st0 coord(gl_FragCoord.xy)
  #define mx coord(u_mouse * u_pixelRatio)

  float sdRoundRect(vec2 p, vec2 b, float r) {
      vec2 d = abs(p - 0.5) * 4.2 - b + vec2(r);
      return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  float sdCircle(in vec2 st, in vec2 center) {
      return length(st - center) * 2.0;
  }

  float sdPoly(in vec2 p, in float w, in int sides) {
      float a = atan(p.x, p.y) + PI;
      float r = TWO_PI / float(sides);
      float d = cos(floor(0.5 + a / r) * r - a) * length(max(abs(p) * 1.0, 0.0));
      return d * 2.0 - w;
  }

  float fill(float x, float size, float edge) {
      return 1.0 - smoothstep(size - edge, size + edge, x);
  }

  float strokeAA(float x, float size, float w, float edge) {
      float afwidth = length(vec2(dFdx(x), dFdy(x))) * 0.70710678;
      float d = smoothstep(size - edge - afwidth, size + edge + afwidth, x + w * 0.5)
              - smoothstep(size - edge - afwidth, size + edge + afwidth, x - w * 0.5);
      return clamp(d, 0.0, 1.0);
  }

  void main() {
      vec2 st = st0 + 0.5;
      vec2 posMouse = mx * vec2(1., -1.) + 0.5;

      float size = u_shapeSize;
      float roundness = u_roundness;
      float borderSize = u_borderSize;
      float circleSize = u_circleSize;
      float circleEdge = u_circleEdge;

      float sdfCircle = fill(sdCircle(st, posMouse), circleSize, circleEdge);

      float sdf = sdRoundRect(st, vec2(size), roundness);
      sdf = strokeAA(sdf, 0.0, borderSize, sdfCircle) * 4.0;

      vec3 color = vec3(0.58, 0.2, 0.91) * sdf; // purple glow
      float glow = 1.6;
      gl_FragColor = vec4(color * glow, clamp(sdf * 2.0, 0.0, 1.0));
  }
`;

const ShapeBlur = ({
  className = "",
  pixelRatioProp = 2,
  shapeSize = 1.2,
  roundness = 0.4,
  borderSize = 0.05,
  circleSize = 0.3,
  circleEdge = 0.5,
}) => {
  const mountRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;
    let animationFrameId;
    let time = 0,
      lastTime = 0;

    const vMouse = new THREE.Vector2();
    const vMouseDamp = new THREE.Vector2();
    const vResolution = new THREE.Vector2();

    let w = 1,
      h = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const geo = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_mouse: { value: vMouseDamp },
        u_resolution: { value: vResolution },
        u_pixelRatio: { value: pixelRatioProp },
        u_shapeSize: { value: shapeSize },
        u_roundness: { value: roundness },
        u_borderSize: { value: borderSize },
        u_circleSize: { value: circleSize },
        u_circleEdge: { value: circleEdge },
      },
      transparent: true,
    });

    const quad = new THREE.Mesh(geo, material);
    scene.add(quad);

    const onPointerMove = (e) => {
      const rect = mount.getBoundingClientRect();
      vMouse.set(e.clientX - rect.left, e.clientY - rect.top);
    };

    document.addEventListener("mousemove", onPointerMove);

    const resize = () => {
      const container = mountRef.current;
      w = container.clientWidth;
      h = container.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);

      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);

      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();

      quad.scale.set(w, h, 1);
      vResolution.set(w, h).multiplyScalar(dpr);
      material.uniforms.u_pixelRatio.value = dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    const ro = new ResizeObserver(() => resize());
    if (mountRef.current) ro.observe(mountRef.current);

    const update = () => {
      time = performance.now() * 0.001;
      const dt = time - lastTime;
      lastTime = time;

      ["x", "y"].forEach((k) => {
        vMouseDamp[k] = THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 8, dt);
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(update);
    };
    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      document.removeEventListener("mousemove", onPointerMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [
    pixelRatioProp,
    shapeSize,
    roundness,
    borderSize,
    circleSize,
    circleEdge,
  ]);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
};

export default ShapeBlur;
