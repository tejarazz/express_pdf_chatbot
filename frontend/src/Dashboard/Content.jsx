import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { FaCircleArrowUp } from "react-icons/fa6";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams, useNavigate } from "react-router-dom";

const Content = () => {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      const chatId = urlChatId || Cookies.get("chatId");

      // If no chatId, exit early to avoid redundant ID generation
      if (!chatId) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_LOCALHOST}/chat_history/${chatId}`
        );
        setChatHistory(response.data.questions || []);
      } catch (error) {
        console.error("Error fetching chat history:", error.message);
      }
    };

    fetchChatHistory();
  }, [urlChatId, navigate]);

  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    const userId = Cookies.get("userId");
    const chatId = urlChatId || Cookies.get("chatId");

    if (!userId || !chatId) {
      return;
    }

    // Check if the question is empty and do not show toast
    if (!question.trim()) {
      return; // Do nothing if the question is empty
    }

    setLoading(true);
    setHasSubmitted(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/ask_question`,
        {
          question,
          userId,
          chatId,
        }
      );
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { question, aiResponse: response.data.aiResponse },
      ]);
      setQuestion("");
    } catch (error) {
      if (hasSubmitted) {
        console.error("Error submitting question:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  return (
    <div className="h-screen w-[66%] bg-neutral-700 text-neutral-200 overflow-y-scroll flex flex-col items-center pb-28 pt-5 px-10 space-y-5">
      <div className="px-5 py-4 w-full max-w-3xl">
        {chatHistory.map((chat, index) => (
          <div key={index} className="my-4">
            <div className="font-bold text-lg text-neutral-300">Question:</div>
            <div className="bg-neutral-800 rounded-md p-4 px-6 my-2 text-neutral-200">
              {chat.question}
            </div>
            <div className="font-bold text-lg text-neutral-300">
              AI Response:
            </div>
            <div className="bg-neutral-800 rounded-md p-3 my-2 text-neutral-200">
              <Markdown
                className="prose prose-invert p-4 leading-relaxed"
                remarkPlugins={[remarkGfm]}
              >
                {chat.aiResponse}
              </Markdown>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form
        onSubmit={handleQuestionSubmit}
        className="w-[700px] fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-neutral-800 px-5 py-3 rounded-full flex items-center space-x-4 shadow-md"
      >
        <input
          type="text"
          placeholder="Type your question..."
          className="flex-grow outline-none bg-transparent text-neutral-200 placeholder-neutral-400"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          className="flex justify-center items-center rounded-full transition-colors"
        >
          {loading ? (
            <div className="w-8 h-8 border-4 border-t-4 border-neutral-200 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaCircleArrowUp className="text-neutral-200 w-8 h-8" />
          )}
        </button>
      </form>
    </div>
  );
};

export default Content;
