import UploadSection from "./UploadSection";
import UserProfile from "./UserProfile";

const UploadsBar = () => {
  return (
    <div className="overflow-y-auto max-h-screen w-[17%] py-4 px-2 bg-neutral-800">
      <UserProfile />
      <UploadSection />
    </div>
  );
};

export default UploadsBar;
