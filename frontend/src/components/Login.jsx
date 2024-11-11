import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setformData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/login`,
        formData,
        { withCredentials: true } // This ensures cookies are sent with the request
      );

      if (response.data.message === "Login successful") {
        // Navigate to the dashboard
        navigate("/dashboard");
      } else {
        console.log("Login error:", response.data.message);
      }
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data?.message || error.message
      );
    }
  };

  return (
    <div
      className="w-screen h-screen flex justify-center items-center"
      id="login"
    >
      <div className="rounded-lg h-[420px] w-[380px] lg:w-[450px] p-10 bg-white shadow-3xl">
        <form onSubmit={handleSubmit} aria-label="login form" role="form">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
            Welcome Back!
          </h1>
          <div className="my-5 flex flex-col">
            <label htmlFor="email" className="text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              placeholder="Enter email"
              onChange={handleChange}
              required
              className="border-2 border-gray-300 p-3 rounded-md outline-none"
            />
          </div>
          <div className="my-5 flex flex-col">
            <label
              htmlFor="password"
              className="text-gray-700 font-semibold mb-1"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              className="border-2 border-gray-300 p-3 rounded-md outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 w-full rounded-md hover:bg-blue-600 transition duration-200"
          >
            Login
          </button>
          <p className="text-center mt-5 text-gray-600">
            Dont have an account?
            <Link
              to="/signup"
              className="text-blue-500 ml-1 hover:text-blue-600 font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
