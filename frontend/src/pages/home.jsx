import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import './homepage.css';


function Home() {
  const [points, setPoints] = useState(1250);
  const [likes, setLikes] = useState(128);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [songQueue, setSongQueue] = useState([
    { title: "Blinding Lights", artist: "The Weeknd", points: 500, user: "user123", likes: 42 },
    { title: "Stay", artist: "The Kid LAROI, Justin Bieber", points: 320, user: "maria55", likes: 18 }
  ]);

  useEffect(() => {
    initThreeScene();
  }, []);

  const initThreeScene = () => {
    const canvas = document.querySelector('.three-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

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
    const particlesMaterial = new THREE.PointsMaterial({ size: 0.015, transparent: true, opacity: 0.8, vertexColors: true });
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
  };

  const handleLikeClick = () => setLikes(likes + 1);
  const handleClaimBonus = () => {
    setPoints(points + 100);
    setBonusClaimed(true);
  };

  return (
    <>
      <canvas className="three-canvas" />
      <nav className="navbar">
        <div className="navbar-logo">
          <i className="bi bi-music-note-beamed" />
          <h1>JukeBid+Loyal</h1>
        </div>
        <div className="navbar-buttons">
          <span style={{ color: "#facc15", fontWeight: "bold" }}>
            <i className="bi bi-coin" /> {points} points
          </span>
          <button>John Doe</button>
          <button><i className="bi bi-shield-lock" /> Admin</button>
        </div>
      </nav>

      <main className="main-content">
        <section className="card">
          <input
            type="text"
            className="input"
            placeholder="Search for a song..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
            <button className="primary-btn"><i className="bi bi-music-note" /> Request for Free</button>
            <button className="secondary-btn"><i className="bi bi-lightning" /> Bid with Points (Min: 100)</button>
          </div>
          <p style={{ color: "#facc15", fontSize: "0.9rem" }}>
            Popular songs require higher bids - <strong>current minimum: 100 points</strong>
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginTop: "2rem" }}>
          <div>
            <section className="card">
              <h2 className="neon-text">Now Playing</h2>
              <div className="song-card">
                <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7" alt="Now Playing" />
                <div className="song-details">
                  <h3>Shape of You</h3>
                  <p>Ed Sheeran</p>
                  <p style={{ color: "#facc15" }}>Requested by @alex</p>
                  <button onClick={handleLikeClick} className="primary-btn" style={{ marginTop: "0.5rem", padding: "0.3rem 0.75rem", fontSize: "0.9rem" }}>
                    <i className="bi bi-heart-fill" /> {likes}
                  </button>
                </div>
              </div>
            </section>

            <section className="card" style={{ marginTop: "1.5rem" }}>
              <h2 className="neon-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Queue</span>
                <span style={{ fontWeight: 'normal', fontSize: '0.9rem', color: '#facc15' }}>Next song plays in: 2:15</span>
              </h2>
              <div className="space-y-3">
                {songQueue.map((song, idx) => (
                  <div className="song-card" key={idx}>
                    <img src={`https://source.unsplash.com/random/48x48?sig=${idx}`} alt={song.title} />
                    <div className="song-details">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#facc15", fontWeight: "bold" }}>{song.points} pts</p>
                      <p>@{song.user}</p>
                      <div><i className="bi bi-heart-fill text-red-400" /> {song.likes}</div>
                    </div>
                    <div>
                      <i className="bi bi-trash" style={{ color: "#f87171", cursor: "pointer" }}></i>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div>
            <section className="card stats-section">
              <h2 className="neon-text">Your Stats</h2>
              <div style={{ marginTop: '1rem' }}>
                <p>Total Points: <span className="value">{points}</span></p>
                <p>Songs Submitted: <span className="value">23</span></p>
                <p>Likes Received: <span className="value">156</span></p>
                <p>Check-in Streak: <span className="value">5 days 🔥</span></p>
              </div>
              <button
                onClick={handleClaimBonus}
                className="secondary-btn"
                style={{ marginTop: "1rem" }}
                disabled={bonusClaimed}
              >
                <i className="bi bi-gift" /> {bonusClaimed ? "Bonus Claimed! +100" : "Claim Daily Bonus"}
              </button>
            </section>

            <section className="card leaderboard-section" style={{ marginTop: "1.5rem" }}>
              <h2 className="neon-text">Leaderboard</h2>
              <div style={{ marginTop: '1rem' }}>
                <p>🥇 @sarah - <span className="value">2,450 pts</span></p>
                <p>🥈 @mike_dj - <span className="value">1,785 pts</span></p>
                <p>🥉 @john_doe - <span className="value">1,250 pts</span></p>
                <p>4. @lisa_m - <span className="value">980 pts</span></p>
                <p>5. @terry42 - <span className="value">720 pts</span></p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;
