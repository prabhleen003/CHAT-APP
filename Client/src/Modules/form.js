import React, { useState } from "react";
import Input from "../Compnents/input";
import Button from "../Compnents/button";
import { useNavigate } from "react-router-dom";

function Form({ IsSignInPage = false }) {
  const [data, setdata] = useState({
    ...(!IsSignInPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = `http://localhost:9000/api/${
        IsSignInPage ? "login" : "register"
      }`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data, null, 2),
      });

      if (res.status === 200) {
        navigate("/users/signin");
      }

      if (res.status === 400) {
        alert("Invalid credentials here");
      } else if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      } else {
        const resdata = await res.json();

        if (resdata.token) {
          localStorage.setItem("user:token", resdata.token);
          localStorage.setItem("user:detail", JSON.stringify(resdata.user));

          navigate("/");
        }
      }
    } catch (error) {
      console.error(`Error during fetch: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray h-screen flex justify-center items-center w-full h-screen overflow-hidden">
      <div className="bg-white w-[450px] shadow-lg rounded-lg  flex flex-col justify-center items-center mt-8 mb-8">
        <div className="text-4xl font-extrabold mb-2">
          Wellcome{IsSignInPage && "Back"}
        </div>

        <div className="text-xl font-light mb-9">
          {IsSignInPage
            ? "Sign in to get explored"
            : "Signup know to get startted"}
        </div>
        <form
          className="flex flex-col items-center w-full"
          onSubmit={(e) => handleSubmit(e)}
        >
          {!IsSignInPage && (
            <Input
              label="Full Name"
              name="name"
              type="text "
              placeholder="Enter your full name"
              className="mb-6 "
              value={data.fullName}
              onChange={(e) => setdata({ ...data, fullName: e.target.value })}
            />
          )}
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            className="mb-6"
            value={data.email}
            onChange={(e) => setdata({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            className="mb-14"
            value={data.password}
            onChange={(e) => setdata({ ...data, password: e.target.value })}
          />

          <Button
            label={IsSignInPage ? "Sign In" : "SignUp"}
            className="   mb-4"
            type="submit"
          />
        </form>
        <div>
          {IsSignInPage ? "Donot have an account" : "Already have an account "}
          <span
            className="text-primary cursor-pointer underline"
            onClick={() =>
              navigate(`/users/${IsSignInPage ? "signup" : "signin"}`)
            }
          >
            {IsSignInPage ? "SignUp" : "SignIn"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
