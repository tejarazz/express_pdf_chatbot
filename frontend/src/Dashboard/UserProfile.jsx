import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_LOCALHOST}/user`,
          {
            withCredentials: true,
          }
        );

        if (response.status === 200) {
          // Set username only if firstName and lastName are available
          setUsername(
            response.data.firstName && response.data.lastName
              ? response.data.firstName + " " + response.data.lastName
              : "User"
          );
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false); // Stop loading once data is fetched or error occurs
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-end items-center">
        <div className=""></div>
      </div>
    );
  }

  // Get initials from the username
  const initials = username
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      // Call backend to handle logout and clear the cookie
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/logout`,
        {
          withCredentials: true, // Ensure cookies are sent with the request
        }
      );

      if (response.status === 200) {
        console.log("Logout successful");
        // No need to manually remove cookies here
        Cookies.remove("chatId");
        navigate("/"); // Redirect to login page
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error.message || error);
    }
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
