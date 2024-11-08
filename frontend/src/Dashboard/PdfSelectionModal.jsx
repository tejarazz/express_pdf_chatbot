/* eslint-disable react/prop-types */

const PdfSelectionModal = ({ pdfs, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-xl w-full shadow-lg ">
        <h3 className="font-semibold text-xl text-gray-800 mb-4">
          Select a PDF
        </h3>
        <div className="mt-2 space-y-2">
          {pdfs.length > 0 ? (
            pdfs.map((pdf) => (
              <div
                key={pdf._id}
                onClick={() => onSelect(pdf.fileName)}
                className="p-3 cursor-pointer hover:bg-neutral-100 rounded-lg transition ease-in-out duration-200 transform hover:scale-105"
              >
                <h4 className="text-lg font-medium text-gray-700">
                  {pdf.fileName}
                </h4>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No PDFs uploaded yet.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-neutral-600 text-white px-6 py-2 rounded-full font-medium text-sm hover:bg-neutral-700 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfSelectionModal;
