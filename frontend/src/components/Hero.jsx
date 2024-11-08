import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="pt-12 lg:pt-20 h-screen lg:h-[calc(100vh-120px)] w-full  text-white">
      <div className="text-center px-6 lg:px-16 mb-10 lg:mb-16">
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight">
          Chat with Your PDFs
        </h1>
        <h2 className="text-3xl lg:text-5xl pt-2 font-extrabold tracking-tight text-blue-500">
          Retrieve Insights Instantly
        </h2>
      </div>

      <div className="w-full flex flex-col-reverse lg:flex-row justify-between items-center px-6 lg:px-20 text-white">
        <div className="flex-1 lg:pr-12 text-center lg:text-left">
          <p className="text-base lg:text-lg mb-8 lg:mb-10 max-w-lg mx-auto lg:mx-0 text-gray-200 leading-relaxed">
            Use our AI PDF chatbot to ask questions and get precise answers
            directly from your document, skipping the hassle of reading through
            the entire file. Advanced semantic search delivers quick, accurate
            responses every time.
          </p>
          <Link
            to="/login"
            className="px-8 w-full lg:w-auto py-3 bg-blue-600 rounded-full hover:bg-blue-700 transition duration-300 shadow-lg font-semibold text-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="mb-8 lg:mb-0 lg:pl-8 flex justify-center lg:justify-end">
          <div className="relative">
            <img
              src="hero.webp"
              alt="Illustration of AI PDF Chatbot"
              className="w-[340px] h-[220px] lg:w-[400px] lg:h-[280px] object-cover rounded-lg shadow-xl transform hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-25 rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
