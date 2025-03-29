import { useEffect, useState } from 'react';

function App() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/profile', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  return (
    <div>
      <h1>Auth0 + Express + Vite</h1>
      {profile ? (
        <>
          <p>Welcome, {profile.name}</p>
          <a href="http://localhost:3000/logout">Log out</a>
        </>
      ) : (
        <a href="http://localhost:3000/login">Log in</a>
      )}
    </div>
  );
}

export default App;
