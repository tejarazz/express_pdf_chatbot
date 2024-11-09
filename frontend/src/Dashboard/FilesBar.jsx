import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { RiChatNewFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import PdfSelectionModal from "./PdfSelectionModal"; // Import PdfSelectionModal component

const FilesBar = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [pdfs, setPdfs] = useState([]); // State to store uploaded PDFs
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
  const userId = Cookies.get("userId");
  const navigate = useNavigate();

  // Fetch chat history on component mount or when userId changes
  const fetchChatHistory = useCallback(async () => {
    if (!userId) {
      console.error("User ID not found in cookies");
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/chats/${userId}`
      );
      setChatHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, [userId]);

  // Fetch PDFs when component mounts or userId changes
  const fetchPdfs = useCallback(async () => {
    if (!userId) {
      console.error("User ID not found in cookies");
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/pdfs`,
        {
          withCredentials: true, // Ensure to send cookies if needed
        }
      );
      setPdfs(response.data || []); // Update the state with the PDFs data
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchChatHistory();
    fetchPdfs(); // Fetch PDFs when component mounts
  }, [fetchChatHistory, fetchPdfs]);

  const handleChatClick = (chatId) => {
    setSelectedChatId(chatId);
    Cookies.set("chatId", chatId);
    navigate(`/dashboard/${chatId}`);
  };

  const handleNewChat = () => {
    // Re-fetch PDFs and then open the modal when "New Chat" is clicked
    fetchPdfs();
    setIsModalOpen(true);
  };

  const handleSelectPdf = async (fileName) => {
    const newChatId = Date.now();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/chats`,
        {
          userId,
          chatId: newChatId,
          fileName, // Make sure the fileName matches what you need
        }
      );

      const { chatId, fileName: backendFileName } = response.data;

      const newChat = { chatId, fileName: backendFileName, questions: [] };

      setChatHistory((prevHistory) => [newChat, ...prevHistory]); // Update state after creating a new chat
      navigate(`/dashboard/${newChatId}`);
    } catch (error) {
      console.error("Error creating new chat:", error.message);
    }

    setIsModalOpen(false);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_LOCALHOST}/chats/${chatId}`);
      setChatHistory((prevHistory) =>
        prevHistory.filter((chat) => chat.chatId !== chatId)
      ); // Update state immediately after deleting a chat
      setDropdownOpenId(null); // Close the dropdown after deletion

      // If the deleted chat was the selected one, clear the selection
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        Cookies.remove("chatId");
      }
    } catch (error) {
      console.error("Error deleting chat:", error.message);
    }
  };

  const toggleDropdown = (chatId) => {
    setDropdownOpenId((prevId) => (prevId === chatId ? null : chatId));
  };

  const displayedChatHistory = [...chatHistory].reverse();

  return (
    <div className="overflow-y-auto max-h-screen w-[17%] py-4 px-2 text-white bg-neutral-800">
      <div
        className="hover:bg-neutral-700 flex items-center justify-between p-2 rounded-lg cursor-pointer"
        onClick={handleNewChat}
      >
        <h1>New Chat</h1>
        <RiChatNewFill />
      </div>
      <div className="mt-5">
        <h5 className="text-xs font-bold px-2">Chat History</h5>
        <div className="mt-1">
          {displayedChatHistory.length > 0 ? (
            displayedChatHistory.map((chat) => {
              const latestQuestion =
                chat.questions.length > 0
                  ? chat.questions[chat.questions.length - 1].question
                  : "No questions available";

              return (
                <div
                  key={chat.chatId}
                  onClick={() => handleChatClick(chat.chatId)}
                  className={`group hover:bg-neutral-700 p-2 flex justify-between items-center rounded-lg cursor-pointer ${
                    selectedChatId === chat.chatId ? "bg-neutral-600" : ""
                  }`}
                >
                  <h3 className="text-sm w-[80%] truncate">{latestQuestion}</h3>
                  <div className="relative">
                    <BsThreeDots
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(chat.chatId);
                      }}
                      className="cursor-pointer"
                    />
                    {dropdownOpenId === chat.chatId && (
                      <div
                        className="absolute right-0 top-8 bg-neutral-700 text-white rounded-md shadow-lg p-1 w-24 z-20"
                        onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing immediately
                      >
                        <button
                          onClick={() => handleDeleteChat(chat.chatId)}
                          className="text-sm w-full text-left px-2 py-1 hover:bg-red-600 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-500">No chat history available.</p>
          )}
        </div>
      </div>

      {/* Display Modal for PDF selection */}
      {isModalOpen && (
        <PdfSelectionModal
          pdfs={pdfs} // Directly pass pdfs as prop
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectPdf}
        />
      )}
    </div>
  );
};

export default FilesBar;
