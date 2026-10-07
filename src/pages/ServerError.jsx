import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDeviceId } from "@/lib/deviceId";

export default function ServerError() {
  const location = useLocation();
  const [urlTaps, setUrlTaps] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ""; };
  }, []);

  const tapUrl = () => {
    if (revealed) return;
    setUrlTaps((t) => Math.min(t + 1, 9));
  };

  const tapDns = () => {
    if (!revealed && urlTaps >= 9) setRevealed(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden">
      <p className="font-mono text-black text-sm md:text-base px-2 pt-2 select-none">
        {`<<ERROR> SERVER NOT RESPONDING `}
        <span onClick={tapDns} className="inline-block py-4 -my-4 touch-manipulation cursor-default">DNS</span>
        {" "}
        <span onClick={tapUrl} className="inline-block py-4 -my-4 touch-manipulation cursor-default">TEJUSBHASIN.INFO</span>
        {`${location.pathname} >`}
      </p>
      {revealed && (
        <p className="font-mono text-black text-xs px-2 pt-2 select-none">
          Model Number: {getDeviceId()}
        </p>
      )}
    </div>
  );
}