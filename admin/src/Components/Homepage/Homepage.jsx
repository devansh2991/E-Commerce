import React from 'react'
import "./Homepage.css"

const Homepage = () => {
  const adminName = "Admin";

  return (
    <div className="homepage">
      <h1 className="greeting">Welcome, {adminName}!</h1>
    </div>
  )
}

export default Homepage
