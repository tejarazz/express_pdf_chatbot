import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { RiChatNewFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { BsThreeDots } from "react-icons/bs";
import PdfSelectionModal from "./PdfSelectionModal";

const FilesBar = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/chats`, // Fetch chats from /chats route
        { withCredentials: true }
      );
      setChatHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, []);

  const fetchPdfs = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/pdfs`, // Fetch PDFs
        { withCredentials: true }
      );
      setPdfs(response.data || []);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory(); // Fetch chat history when component mounts
  }, [fetchChatHistory]);

  const handleChatClick = (chatId) => {
    setSelectedChatId(chatId);
    Cookies.set("chatId", chatId);
    navigate(`/dashboard/${chatId}`);
  };

  const handleNewChat = () => {
    fetchPdfs(); // Refresh PDFs before opening the modal
    setIsModalOpen(true);
  };

  const handleSelectPdf = async (fileName) => {
    const newChatId = Date.now(); // Generate a new chat ID

    try {
      // Use the new /create_chat route to create a new chat
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/create_chat`, // Updated route for creating chat
        { chatId: newChatId, fileName },
        { withCredentials: true }
      );

      const { chatId, fileName: backendFileName } = response.data;
      const newChat = { chatId, fileName: backendFileName, questions: [] };

      setChatHistory((prevHistory) => [newChat, ...prevHistory]);
      navigate(`/dashboard/${newChatId}`);
    } catch (error) {
      console.error("Error creating new chat:", error.message);
    }

    setIsModalOpen(false); // Close the modal after selecting PDF
  };

  const handleDeleteChat = async (chatId) => {
    try {
      // Use the delete route if needed in the backend
      await axios.delete(`${import.meta.env.VITE_LOCALHOST}/chats/${chatId}`, {
        withCredentials: true,
      });
      setChatHistory((prevHistory) =>
        prevHistory.filter((chat) => chat.chatId !== chatId)
      );
      setDropdownOpenId(null);

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
                        onClick={(e) => e.stopPropagation()}
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

      {isModalOpen && (
        <PdfSelectionModal
          pdfs={pdfs}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectPdf}
        />
      )}
    </div>
  );
};

export default FilesBar;
