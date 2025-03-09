import React, { Children } from "react";
import Form from "./Modules/form";
import Dashboard from "./Modules/dashboard";
import { Routes, Route, Navigate } from "react-router-dom";

const ProtectedRoutes = ({ children, auth = false }) => {
  const isLoggedIn = localStorage.getItem("user:token") !== null;

  if (!isLoggedIn && auth) {
    return <Navigate to="/users/signin" />;
  } else if (
    isLoggedIn &&
    ["/users/signin", "/users/signup"].includes(window.location.pathname)
  ) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoutes auth={true}>
            <Dashboard />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/users/signin"
        element={
          <ProtectedRoutes>
            <Form IsSignInPage={true} />
          </ProtectedRoutes>
        }
      />
      <Route
        path="/users/signup"
        element={
          <ProtectedRoutes>
            <Form IsSignInPage={false} />
          </ProtectedRoutes>
        }
      />
    </Routes>
  );
}

export default App;
