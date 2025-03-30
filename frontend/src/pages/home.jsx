import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import './homepage.css';
import logo from '../assets/logo.png';

function Home() {
  const [user, setUser] = useState(null);
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
    fetchUser();
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

  const fetchUser = async () => {
    try {
      const res = await fetch('http://localhost:3000/profile', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      setUser(data);
      setPoints(data.Loyalty_Points || 0);
    } catch (err) {
      console.error("❌ Error fetching user profile:", err);
    }
  };

  const handleLikeClick = () => setLikes(likes + 1);

  const handleClaimBonus = () => {
    setPoints(points + 100);
    setBonusClaimed(true);
  };

  const handleDeleteSong = (index) => {
    if (!user?.ifAdmin) return;
    console.log(`Deleting song at index: ${index}`);
    setSongQueue(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSongRequest = async (type) => {
    if (!searchTerm.trim()) return alert("Please enter a song name!");
  
    try {
      const res = await fetch(`http://localhost:3000/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          search: searchTerm,
          type: type, // 'free' or 'bid'
        }),
      });
  
      if (!res.ok) throw new Error('Failed to submit request');
      const data = await res.json();
      console.log("✅ Song request submitted:", data);
      alert(`Song ${type === "bid" ? "bid" : "requested for free"} successfully!`);
    } catch (err) {
      console.error("❌ Error submitting song request:", err);
      alert("Failed to submit song request");
    }
  };
  

  return (
    <>
      <canvas className="three-canvas" />
      <nav className="navbar">
        <div className="navbar-logo-wrapper">
          <img src={logo} alt="JukeBid Logo" className="logo-image" />
          <div className="logo-blur" />
        </div>
        <div className="navbar-buttons">
          <span style={{ color: "#facc15", fontWeight: "bold" }}>
            <i className="bi bi-coin" /> {points} points
          </span>
          {user ? (
            <button>
              <img src={user.picture} alt={user.name} style={{ width: 30, borderRadius: '50%', marginRight: 8 }} />
              {user.name}
            </button>
          ) : (
            <button disabled>Loading...</button>
          )}

          {user?.ifAdmin && (
            <button
              onClick={() => {
                window.location.href = 'http://localhost:3000/spotifylogin';
              }}
            >
              <i className="bi bi-shield-lock" /> Login to Spotify
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">

          <section className="search-box">
            <input
              type="text"
              className="input"
              placeholder="Search for a song..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="search-buttons">
              <button
                className="primary-btn"
                onClick={() => handleSongRequest("free")}
              >
                <i className="bi bi-music-note" /> Request for Free
              </button>

              <button
                className="secondary-btn"
                onClick={() => handleSongRequest("bid")}
              >
                <i className="bi bi-lightning" /> Bid with Points (Min: 100)
              </button>
            </div>

            <p className="note-text">
              Popular songs require higher bids - <strong>current minimum: 100 points</strong>
            </p>
          </section>



        <div className="card-grid">
          <div className="column">
            <section className="now-playing-box">
              <h2 className="neon-text">Now Playing</h2>
              <div className="song-card">
                <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7" alt="Now Playing" />
                <div className="song-details">
                  <h3>Shape of You</h3>
                  <p>Ed Sheeran</p>
                  <p className="requested-by">Requested by @alex</p>
                  <button onClick={handleLikeClick} className="primary-btn">
                    <i className="bi bi-heart-fill" /> {likes}
                  </button>
                </div>
              </div>
            </section>

            <section className="queue-box">
              <h2 className="neon-text">Queue <span className="timer">Next song plays in: 2:15</span></h2>
              <div className="queue-list">
                {songQueue.map((song, idx) => (
                  <div className="song-card" key={idx}>
                    <img src={`https://source.unsplash.com/random/48x48?sig=${idx}`} alt={song.title} />
                    <div className="song-details">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                    </div>
                    <div className="right-info">
                      <p className="points">{song.points} pts</p>
                      <p>@{song.user}</p>
                      <div><i className="bi bi-heart-fill text-red-400" /> {song.likes}</div>
                    </div>
                    {user?.ifAdmin && (
                      <i
                        className="bi bi-trash delete-icon"
                        onClick={() => handleDeleteSong(idx)}
                        style={{ cursor: 'pointer' }}
                      ></i>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="column">
            <section className="stats-box">
              <h2 className="neon-text">Your Stats</h2>
              <div className="stats-content">
                <p>Total Points: <span className="value">{points}</span></p>
                <p>Songs Submitted: <span className="value">23</span></p>
                <p>Likes Received: <span className="value">156</span></p>
                <p>Check-in Streak: <span className="value">5 days 🔥</span></p>
              </div>
              <button
                onClick={handleClaimBonus}
                className="secondary-btn"
                disabled={bonusClaimed}
              >
                <i className="bi bi-gift" /> {bonusClaimed ? "Bonus Claimed! +100" : "Claim Daily Bonus"}
              </button>
            </section>

            <section className="leaderboard-box">
              <h2 className="neon-text">Leaderboard</h2>
              <div className="leaderboard-content">
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