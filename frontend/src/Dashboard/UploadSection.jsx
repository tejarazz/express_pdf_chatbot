import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import PdfToText from "react-pdftotext";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";
import PdfList from "./PdfList"; // Adjust the import path of PdfList

const UploadSection = () => {
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const [fileName, setFileName] = useState(""); // State to hold the file name
  const [refresh, setRefresh] = useState(false); // State to trigger re-fetch in PdfList

  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      console.log("Uploaded PDF:", file);
      setFileName(file.name);
      PdfToText(file)
        .then((text) => {
          setExtractedText(text);
        })
        .catch((error) => {
          console.error("Error extracting text:", error);
        });
    });
  }, []);

  const handleUpload = async () => {
    const userId = Cookies.get("userId"); // Retrieve the userId from the cookie

    if (!userId) {
      toast.error("User not authenticated."); // Show toast error
      return; // Prevent upload if userId is not available
    }

    setLoading(true); // Set loading state to true
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/upload`,
        {
          text: extractedText,
          userId,
          fileName,
        }
      );
      console.log(response.status);
      toast.success("Text uploaded and vectorized successfully!");
      setExtractedText("");
      setFileName(""); // Clear the file name after upload
      setRefresh((prev) => !prev); // Trigger refresh state change to update PdfList
    } catch (error) {
      console.error("Error uploading text:", error);
      toast.error("Failed to upload text.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  return (
    <div>
      <Toaster />
      <div
        {...getRootProps()}
        className={`bg-neutral-800 p-4 h-32 mt-16 cursor-pointer border-2 border-dashed border-gray-500 flex items-center justify-center ${
          isDragActive ? "bg-neutral-600" : "bg-neutral-800"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-white">Drop the PDF here...</p>
        ) : (
          <p className="text-white">
            Drag & drop a PDF file here, or click to select
          </p>
        )}
      </div>
      {fileName && <p className="mt-2 text-white">Uploaded File: {fileName}</p>}
      <div className="mt-4">
        <button
          className={`mt-2 w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading && (
            <div className="animate-spin mr-2 h-5 w-5 border-4 border-white border-t-transparent rounded-full"></div>
          )}
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* PdfList component with refresh prop */}
      <PdfList refresh={refresh} />
    </div>
  );
};

export default UploadSection;
