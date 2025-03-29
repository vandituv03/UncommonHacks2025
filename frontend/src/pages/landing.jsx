import React, { useEffect } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import * as THREE from 'three';
import './landing.css';

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

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.x += 0.0005;
      particles.rotation.y += 0.0005;
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
    window.location.href = '/home';
  };

  const handleOpenApp = () => {
    window.location.href = '/home';
  };

  return (
    <>
      <canvas className="three-canvas" />

      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <i className="bi bi-music-note-beamed" />
            <h1>JukeBid+Loyal</h1>
          </div>
          <Button onClick={handleLogin} className="login-button">
            <i className="bi bi-person-circle" />
            Login
          </Button>
        </div>
      </nav>

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
          <p>Join JukeBid+Loyal today and transform your music experience.</p>
          <Button onClick={handleOpenApp} className="cta-button">
            Open JukeBid+Loyal App
          </Button>
        </section>
      </main>

      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <i className="bi bi-music-note-beamed" />
            <span>JukeBid+Loyal</span>
          </div>
          <div className="footer-center">
            <p>© 2023 JukeBid+Loyal. All rights reserved.</p>
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
