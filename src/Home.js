import React, { useEffect, useState } from "react"
import logo from "./logo.svg"
import "./App.css"

import { FrontendApi, Configuration, Session, Identity } from "@ory/client"

// Get your Ory url from .env
// Or localhost for local development
const basePath = process.env.REACT_APP_ORY_URL || "http://localhost:5000"
const ory = new FrontendApi(
  new Configuration({
    basePath,
    baseOptions: {
      withCredentials: true,
    },
  }),
)

function Home() {
  const [session, setSession] = useState(Session)
  const [logoutUrl, setLogoutUrl] = useState("")

  // Returns either the email or the username depending on the user's Identity Schema
  const getUserName = (identity) =>
    identity.traits.email || identity.traits.username


  // Second, gather session data, if the user is not logged in, redirect to login
  useEffect(() => {
    ory
      .toSession()
      .then(({ data }) => {
        // User has a session!
        setSession(data)
        ory.createBrowserLogoutFlow().then(({ data }) => {
          // Get also the logout url
          const tempURL = new URL(data.logout_url)
          console.log("Logout URL", tempURL);
          const newURL = `${tempURL.pathname}${tempURL.search}`
          setLogoutUrl(newURL)
        })
      })
      .catch((err) => {
        // Redirect to login page
        console.error(err)
        console.log("Redirecting to login");
        window.location.replace(`/login`)
      })
  }, [])

  if (!session) {
    // Still loading
    return <h1>Loading...</h1>
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to Ory,{" "}
          {
            getUserName(session?.identity)
          }
          .
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        {
          // Our logout link
          <a href={logoutUrl}>Logout</a>
        }
      </header>
    </div>
  )
}

export default Home