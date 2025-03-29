// import React, { useEffect, useState } from 'react';
// import { Button } from "../components/ui/button";
// import { Card } from "../components/ui/card";
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// const App = () => {
//   useEffect(() => {
//     initThreeScene();
//   }, []);

//   const initThreeScene = () => {
//     const canvas = document.querySelector('.three-canvas');
//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//     const renderer = new THREE.WebGLRenderer({
//       canvas,
//       alpha: true,
//       antialias: true
//     });

//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setClearColor(0x000000, 0);

//     const particlesGeometry = new THREE.BufferGeometry();
//     const particlesCount = 1000;
    
//     const positions = new Float32Array(particlesCount * 3);
//     const colors = new Float32Array(particlesCount * 3);
    
//     for (let i = 0; i < particlesCount * 3; i += 3) {
//       positions[i] = (Math.random() - 0.5) * 10;
//       positions[i+1] = (Math.random() - 0.5) * 10;
//       positions[i+2] = (Math.random() - 0.5) * 10;
      
//       colors[i] = Math.random() * 0.5 + 0.5;
//       colors[i+1] = Math.random() * 0.3;
//       colors[i+2] = Math.random() * 0.5 + 0.5;
//     }
    
//     particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
//     const particlesMaterial = new THREE.PointsMaterial({
//       size: 0.015,
//       transparent: true,
//       opacity: 0.8,
//       vertexColors: true,
//     });
    
//     const particles = new THREE.Points(particlesGeometry, particlesMaterial);
//     scene.add(particles);

//     camera.position.z = 5;
    
//     const animate = () => {
//       requestAnimationFrame(animate);
//       particles.rotation.x += 0.0005;
//       particles.rotation.y += 0.0005;
//       renderer.render(scene, camera);
//     };

//     animate();

//     window.addEventListener('resize', () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     });
//   };

//   const handleLogin = () => {
//     window.location.href = '/app';
//   };

//   const handleOpenApp = () => {
//     window.location.href = '/app';
//   };

//   return (
//     <>
//       <canvas className="three-canvas fixed top-0 left-0 w-full h-full z-[-1] opacity-50" />

//       <nav className="card-bg shadow-md fixed w-full z-50 px-6 py-4">
//         <div className="max-w-7xl mx-auto flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <i className="bi bi-music-note-beamed text-xl text-purple-400" />
//             <h1 className="text-2xl font-bold text-purple-300">JukeBid+Loyal</h1>
//           </div>
//           <Button
//             onClick={handleLogin}
//             className="rounded-full border border-purple-500 px-4 py-1 text-purple-300 hover:bg-purple-700"
//           >
//             <i className="bi bi-person-circle mr-2" />
//             Login
//           </Button>
//         </div>
//       </nav>

//       <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-28 flex flex-col items-center text-center space-y-32">
//         <div className="flex flex-col md:flex-row items-center justify-between gap-12 w-full">
//           <div className="md:w-1/2 text-center md:text-left">
//             <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white glow-text leading-tight tracking-tight">
//               Control the Music,<br />Earn Rewards
//             </h1>
//             <p className="text-lg text-purple-200">
//               Request songs, place bids, and earn loyalty points at your favorite café.
//             </p>
//           </div>

//           <Card className="md:w-1/2 w-full max-w-md card-bg p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg text-purple-300 font-semibold">Now Playing</h2>
//               <div className="flex items-center gap-1 text-purple-400 text-sm">
//                 <i className="bi bi-soundwave" />
//                 Live
//               </div>
//             </div>

//             <div className="flex gap-4 mb-6">
//               <div className="w-24 h-24 bg-gradient-to-br from-purple-800 to-purple-600 rounded-lg shadow-lg overflow-hidden">
//                 <img
//                   src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
//                   alt="Album cover"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-semibold text-white">Shape of You</h3>
//                 <p className="text-purple-200">Ed Sheeran</p>
//                 <Button
//                   variant="outline"
//                   className="flex items-center space-x-1 bg-red-900 bg-opacity-30 mt-2 text-red-400"
//                 >
//                   <i className="bi bi-heart-fill" />
//                   <span>128</span>
//                 </Button>
//               </div>
//             </div>
//           </Card>
//         </div>

//         <div className="w-full">
//           <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 glow-text">How It Works</h2>
//           <div className="grid grid-cols-3 md:grid-cols-3 gap-8 px-4">
//             <div className="feature-card">
//               <div className="feature-icon">
//                 <i className="bi bi-search text-white text-xl" />
//               </div>
//               <h3 className="text-white font-semibold text-lg mb-2">Find Songs</h3>
//               <p className="text-purple-200 text-sm">
//                 Search your favorite tracks across platforms like Spotify, YouTube, and Apple Music.
//               </p>
//             </div>

//             <div className="feature-card">
//               <div className="feature-icon">
//                 <i className="bi bi-lightning-charge-fill text-white text-xl" />
//               </div>
//               <h3 className="text-white font-semibold text-lg mb-2">Bid & Request</h3>
//               <p className="text-purple-200 text-sm">
//                 Increase your bid to get your song played faster or submit it for free.
//               </p>
//             </div>

//             <div className="feature-card">
//               <div className="feature-icon">
//                 <i className="bi bi-coin text-white text-xl" />
//               </div>
//               <h3 className="text-white font-semibold text-lg mb-2" justify="center">Earn Rewards</h3>
//               <p className="text-purple-200 text-sm">
//                 Earn loyalty points and unlock exclusive access with every interaction.
//               </p>
//             </div>
//           </div>

//           <div className="mt-20 text-center">
//             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white glow-text" justify="center">
//               Ready to Get Started?
//             </h2>
//             <p className="text-lg text-purple-200 mb-8 max-w-2xl mx-auto" justify="center">
//               Join JukeBid+Loyal today and transform your music experience.
//             </p>
//             <Button
//               onClick={handleOpenApp}
//               className="px-10 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white text-lg font-semibold shadow-xl transition-transform hover:scale-105"
//             >
//               Open JukeBid+Loyal App
//             </Button>
//           </div>
//         </div> 
//       </main>
//     </>
//   );
// };

// export default App;

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
    </>
  );
};

export default Landing;

