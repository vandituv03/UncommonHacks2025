import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import './homepage.css';
import logo from '../assets/logo.png';

function Home() {
  const [spotifyLoggedIn, setSpotifyLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(1250);
  const [likes, setLikes] = useState(0);
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nowPlaying, setNowPlaying] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [songQueue, setSongQueue] = useState([
    { title: "Blinding Lights", artist: "The Weeknd", points: 500, user: "user123", likes: 42 },
    { title: "Stay", artist: "The Kid LAROI, Justin Bieber", points: 320, user: "maria55", likes: 18 }
  ]);

  useEffect(() => {
    initThreeScene();
    fetchSpotifyStatus();
    fetchUser();
    fetchLeaderboard();
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch("http://localhost:3000/queue");
      const data = await res.json();
      setSongQueue(data);
    } catch (err) {
      console.error("❌ Error fetching song queue:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("http://localhost:3000/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("❌ Error fetching leaderboard:", err);
    }
  };

  const generateCircleTexture = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
    
      const ctx = canvas.getContext('2d');
      const center = size / 2;
    
      ctx.beginPath();
      ctx.arc(center, center, center, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };
    
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
  
      const circleTexture = generateCircleTexture();
  
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      map: circleTexture,
      transparent: true,
      alphaTest: 0.5,       // helps cut off square edges
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
      scene.add(ambientLight);
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

  const fetchSpotifyStatus = async () => {
    try {
      const res = await fetch("http://localhost:3000/spotify-status", {
        method: "GET",
        credentials: "include",
      });
  
      const data = await res.json();
      console.log(data);
      setSpotifyLoggedIn(data.loggedIn);
      if (data.loggedIn) {
        console.log("true");
      }
    } catch (err) {
      console.error("❌ Error checking Spotify status:", err);
    }
  };

  const fetchNowPlaying = async () => {
    try {
      const res = await fetch("http://localhost:3000/gettracks", {
        method: "GET",
        credentials: "include",
      });
  
      if (res.status === 204) {
        setNowPlaying(null); // nothing playing
        return;
      }
  
      const data = await res.json();
      setNowPlaying(data); // { track, artist, albumArt }
    } catch (err) {
      console.error("❌ Error fetching now playing:", err);
      setNowPlaying(null);
    }
  };

  useEffect(() => {
    if (spotifyLoggedIn) {
      fetchNowPlaying();
  
      const interval = setInterval(fetchNowPlaying, 10000);
      return () => clearInterval(interval);
    }
  }, [spotifyLoggedIn]);

  useEffect(() => {
    const interval = setInterval(fetchQueue, 10000); // 10 sec
    return () => clearInterval(interval);
  }, []);

  const handleLikeClick = async () => {
    setPoints(points + 10);
    setLikes(likes + 1);
    try {
      const res = await fetch("http://localhost:3000/addpoints", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: user.email,
          points: 10 }), // how much to add
      });
      console.log("Sending like from:", user?.email);
      if (!res.ok) throw new Error("Failed to update points");
      console.log("✅ Points updated successfully");
    } catch (err) {
      console.error("❌ Error updating points:", err);

    }
  }

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
      setSearchTerm("");   // clear the input box
      fetchQueue();        // refresh queue from backend

    } catch (err) {
      console.error("❌ Error submitting song request:", err);
      alert("Failed to submit song request");
    }
  };
  

  return (
    <>
      <canvas className="three-canvas" />
      <div className="background-glow-overlay" />
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
              <i className="bi bi-person-circle" style={{ fontSize: 24, marginRight: 8 }}></i>
              {user.name}
            </button>
          ) : (
            <button disabled>Loading...</button>
          )}

          {user?.ifAdmin && (
            <button
              onClick={() => {
                if (!spotifyLoggedIn) {
                  window.location.href = 'http://localhost:3000/spotifylogin';
                }
              }}
              disabled={spotifyLoggedIn}
            >
              <i className="bi bi-shield-lock" style={{ fontSize: 24, marginRight: 8 }} /> {spotifyLoggedIn ? "Device Connected" : "Login to Spotify"}
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
          {nowPlaying ? (
              <section className="now-playing-box">
              <h2 className="neon-text">Now Playing</h2>
              <div className="song-card">
                <img
                  src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7"
                  alt="Now Playing"
                />
                <div className="song-details">
                  <h3>{nowPlaying.track}</h3>
                  <p>{nowPlaying.artist}</p>

                </div>
                <div className="like-button-wrapper">
                  <button onClick={handleLikeClick} className="primary-btn">
                    <i className="bi bi-heart-fill" /> {likes}
                  </button>
                </div>
              </div>
            </section>
              ) : (
                <section className="now-playing-box empty">
                  <h2 className="neon-text">Now Playing</h2>
                  <p>No track currently playing.</p>
                </section>
              )}

            <section className="queue-box">
              <h2 className="neon-text">Up Next...</h2>
              <div className="queue-list">
                {songQueue.map((song, idx) => (
                  <div className="song-card" key={idx}>
                    <div className="song-details">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
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
              {!bonusClaimed && (
              <button
                onClick={handleClaimBonus}
                className="secondary-btn"
              >
                <i className="bi bi-gift" /> Claim Daily Bonus
              </button>
            )}
            </section>

            <section className="leaderboard-box">
            <h2 className="neon-text">Leaderboard</h2>
            <div className="leaderboard-content">
              {leaderboard.map((user, index) => (
                <p key={user._id}>
                  {index === 0 && "🥇 "}
                  {index === 1 && "🥈 "}
                  {index === 2 && "🥉 "}
                  {index > 2 && `${index + 1}. `}
                  @{user.name?.toLowerCase().replace(/\s/g, "_")} -{" "}
                  <span className="value">{user.Loyalty_Points} pts</span>
                </p>
              ))}
            </div>
          </section>
          </div>
        </div>
      </main>
    </>
  );
}

export default Home;