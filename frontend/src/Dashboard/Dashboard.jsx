import FilesBar from "./FilesBar";
import Content from "./Content";
import UploadsBar from "./UploadsBar";
import { useParams } from "react-router-dom";

const Dashboard = () => {
  const { chatId } = useParams();
  return (
    <div className="flex ">
      <FilesBar />
      <Content chatId={chatId} />
      <UploadsBar />
    </div>
  );
};

export default Dashboard;
