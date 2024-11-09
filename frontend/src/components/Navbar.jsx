const Navbar = () => {
  return (
    <div className="pt-10 lg:px-14 px-3">
      <div className="w-full bg-black/60 lg:px-10 px-5 h-16 lg:h-20 flex justify-between rounded-full items-center">
        <div className="flex gap-2 items-center">
          <img src="logo.webp" className="w-8 h-8 rounded-full" alt="" />
          <h1 className="lg:text-2xl">DocuMate</h1>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
