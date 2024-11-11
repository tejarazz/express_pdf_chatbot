import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import PdfToText from "react-pdftotext";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import PdfList from "./PdfList"; // Adjust the import path of PdfList if necessary

const UploadSection = () => {
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const [fileName, setFileName] = useState(""); // State to hold the file name
  const [refresh, setRefresh] = useState(false); // State to trigger re-fetch in PdfList

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      console.log("Uploaded PDF:", file);
      setFileName(file.name); // Store file name
      // Convert PDF to text
      PdfToText(file)
        .then((text) => {
          setExtractedText(text); // Store extracted text
        })
        .catch((error) => {
          console.error("Error extracting text:", error);
          toast.error("Failed to extract text from PDF."); // Show toast error
        });
    });
  }, []);

  // Handle upload to the server
  const handleUpload = async () => {
    if (!extractedText || !fileName) {
      toast.error("Please upload a PDF file first.");
      return;
    }

    setLoading(true); // Set loading state
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST}/upload`,
        {
          text: extractedText,
          fileName,
        },
        { withCredentials: true }
      );

      console.log(response.status);
      toast.success("Text uploaded and vectorized successfully!");
      setExtractedText(""); // Clear extracted text after upload
      setFileName(""); // Clear file name after upload
      setRefresh((prev) => !prev); // Trigger refresh to update PdfList
    } catch (error) {
      console.error("Error uploading text:", error);
      toast.error("Failed to upload text.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Set up Dropzone properties
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    multiple: false,
  });

  return (
    <div>
      <Toaster /> {/* Toaster for notifications */}
      {/* Dropzone area */}
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
      {/* Display uploaded file name */}
      {fileName && <p className="mt-2 text-white">Uploaded File: {fileName}</p>}
      {/* Upload button */}
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
