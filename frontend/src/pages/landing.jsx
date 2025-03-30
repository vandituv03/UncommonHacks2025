import React, { useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import * as THREE from 'three';
import ShapeBlur from '../components/ui/ShapeBlur';
import './landing.css';
import logo from '../assets/logo.png';

const Landing = () => {
  useEffect(() => {
    initThreeScene();
  }, []);

  const initThreeScene = () => {
    const canvas = document.querySelector('.three-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      colors[i] = Math.random() * 0.5 + 0.5;
      colors[i + 1] = Math.random() * 0.3;
      colors[i + 2] = Math.random() * 0.5 + 0.5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const spheres = [];
    const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x220044 });
    for (let i = 0; i < 5; i++) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), sphereMaterial);
      sphere.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6);
      spheres.push(sphere);
      scene.add(sphere);
    }

    const rings = [];
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xc084fc, wireframe: true });
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1 + i * 0.5, 0.02, 16, 100), ringMaterial);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.position.set(0, 0, -2 + i);
      rings.push(ring);
      scene.add(ring);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xff00ff, 1, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    camera.position.z = 5;

    const mouse = { x: 0, y: 0 };
    document.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.0005;

      spheres.forEach((sphere, index) => {
        sphere.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
        sphere.rotation.y += 0.002;
      });

      rings.forEach((ring, index) => {
        ring.rotation.x += 0.001 + index * 0.0005;
        ring.rotation.y += 0.001;
      });

      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/login';
  };

  const handleOpenApp = () => {
    window.location.href = '/home';
  };

  return (
    <>
      {/* 🌌 Background layers */}
      <canvas className="three-canvas" />
      <div className="background-glow-overlay" />

      {/* 🧭 Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo-wrapper with-blur">
            <ShapeBlur className="logo-blur" />
            <img src={logo} alt="JukeBid Logo" className="logo-image" />
          </div>

          <Button onClick={handleLogin} className="login-button">
            <i className="bi bi-person-circle" />
            Login
          </Button>
        </div>
      </nav>

      {/* 🌊 Top Wave */}
      <div className="navbar-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,0 L0,0 Z" fill="#9333ea" />
        </svg>
      </div>

      {/* 🎯 Main Content */}
      <main className="main-content">
        <div className="hero-section">
          <div className="hero-text">
            <h1>Control the Music,<br />Earn Rewards</h1>
            <p>Request songs, place bids, and earn loyalty points at your favorite café.</p>
          </div>
        </div>

        <section className="features-section">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-search" />
              </div>
              <h3>Find Songs</h3>
              <p>Search your favorite tracks across platforms like Spotify, YouTube, and Apple Music.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-lightning-charge-fill" />
              </div>
              <h3>Bid & Request</h3>
              <p>Increase your bid to get your song played faster or submit it for free.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="bi bi-coin" />
              </div>
              <h3>Earn Rewards</h3>
              <p>Earn loyalty points and unlock exclusive access with every interaction.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>Join JukeBid today and transform your music experience.</p>
          <Button onClick={handleOpenApp} className="cta-button">
            Open JukeBid App
          </Button>
        </section>
      </main>

      {/* 🦶 Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <i className="bi bi-music-note-beamed" />
            <span>JukeBid</span>
          </div>
          <div className="footer-center">
            <p>© 2023 JukeBid. All rights reserved.</p>
          </div>
          <div className="footer-right">
            <a href="#"><i className="bi bi-twitter" /></a>
            <a href="#"><i className="bi bi-instagram" /></a>
            <a href="#"><i className="bi bi-facebook" /></a>
            <a href="#"><i className="bi bi-github" /></a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;
