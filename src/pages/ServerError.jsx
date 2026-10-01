import { useLocation } from "react-router-dom";

export default function ServerError() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <p className="font-mono text-black text-sm md:text-base px-2 pt-2 select-none">
        {`<<ERROR> SERVER NOT RESPONDING DNS TEJUSBHASIN.INFO${location.pathname} >`}
      </p>
    </div>
  );
}