/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import axios from "axios";
import { RxCross1 } from "react-icons/rx";

const PdfList = ({ refresh }) => {
  const [pdfData, setPdfData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPdfData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_LOCALHOST}/pdfs`,
        { withCredentials: true }
      );
      setPdfData(data);
    } catch (err) {
      setError("Failed to fetch PDF data");
      console.error("Error fetching PDF data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfData();
  }, [refresh]); // Re-fetch data when refresh changes

  const removePdf = async (id) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_LOCALHOST}/pdfs/${id}`
      );
      if (response.status === 200) {
        setPdfData(pdfData.filter((pdf) => pdf._id !== id));
      }
    } catch (error) {
      console.log("Error deleting PDF:", error.message);
    }
  };

  const truncateFileName = (fileName, maxLength) =>
    fileName.length > maxLength
      ? `${fileName.slice(0, maxLength)}...`
      : fileName;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-2">
        <h2 className="text-lg font-semibold">Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 mt-10">
      <h1 className="text-xl font-bold text-white text-center mb-4">
        Uploaded PDFs
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-600">
          <tbody className="bg-neutral-600 divide-y divide-gray-500">
            {pdfData.length > 0 ? (
              pdfData.reverse().map((pdf) => (
                <tr key={pdf._id}>
                  <td className="py-2 flex justify-between items-center px-4 text-gray-300">
                    {truncateFileName(pdf.fileName, 20)}
                    <RxCross1
                      onClick={() => removePdf(pdf._id)}
                      className="hover:text-white cursor-pointer"
                      size={12}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 px-4 text-gray-300 text-center" colSpan="1">
                  No PDFs available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PdfList;
