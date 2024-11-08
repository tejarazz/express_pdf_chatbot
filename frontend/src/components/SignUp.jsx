import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const SignUp = () => {
  const [formData, setformData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prev) => ({ ...prev, [name]: value }));
  };
  const navigate = useNavigate();
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/signup", {
        ...formData,
      });
      setformData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
      toast.success("User created successfully");
      navigate("/login");
      console.log(response.data);
    } catch (error) {
      console.log(error);
      toast.error("User already exists");
    }
  };

  return (
    <div
      className="w-screen h-screen flex justify-center items-center "
      id="signup"
    >
      <Toaster />
      <div className="rounded-lg h-[620px] w-[380px] lg:w-[450px] p-10 bg-white shadow-3xl ">
        <form onSubmit={handleSubmit}>
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
            Welcome
          </h1>
          <div className="my-5 flex flex-col">
            <label htmlFor="email" className="text-gray-700 font-semibold mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter First Name"
              required
              className="border-2 border-gray-300 p-3 rounded-md outline-none"
            />
          </div>
          <div className="my-5 flex flex-col">
            <label htmlFor="email" className="text-gray-700 font-semibold mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter Last Name"
              required
              className="border-2 border-gray-300 p-3 rounded-md outline-none"
            />
          </div>
          <div className="my-5 flex flex-col">
            <label htmlFor="email" className="text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
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
              value={formData.password}
              onChange={handleChange}
              id="password"
              placeholder="Enter password"
              required
              className="border-2 border-gray-300 p-3 rounded-md outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 w-full rounded-md hover:bg-blue-600 transition duration-200"
          >
            Sign Up
          </button>
          <p className="text-center mt-5 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-500 hover:text-blue-600 font-semibold"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
