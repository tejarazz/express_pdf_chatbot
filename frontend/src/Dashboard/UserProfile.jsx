import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(""); // State for storing the username

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user data when the component mounts
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_LOCALHOST}/user`,
          {
            withCredentials: true,
          }
        );

        if (response.status === 200) {
          setUsername(response.data.firstName + " " + response.data.lastName); // Set the username from response
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Get initials from the username
  const initials = username
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_LOCALHOST}/logout`,
      {
        withCredentials: true,
      }
    );

    // Handle response
    if (response.status === 200) {
      console.log("Logout successful");
    }

    // Clear the cookies from the client side
    Cookies.remove("token");
    Cookies.remove("userId");
    Cookies.remove("chatId");
    Cookies.remove("fileName");

    // Redirect to login page
    navigate("/");
  };

  return (
    <div className="relative justify-end flex items-center">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white bg-neutral-700 rounded-full hover:bg-neutral-600 focus:outline-none transition duration-200"
      >
        {initials || "?"}
      </button>
      {isOpen && (
        <div className="absolute top-12 right-0 z-10 mt-2 w-48 shadow-lg transition duration-200 transform opacity-100 scale-100">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="block w-full h-full px-4 py-2 text-sm rounded-lg text-white bg-neutral-700 hover:bg-neutral-500 transition duration-150 ease-in-out"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
