import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getDeviceId } from "@/lib/deviceId";

export default function ServerError() {
  const location = useLocation();
  const [urlTaps, setUrlTaps] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const tapUrl = () => {
    if (revealed) return;
    setUrlTaps((t) => Math.min(t + 1, 9));
  };

  const tapDns = () => {
    if (!revealed && urlTaps >= 9) setRevealed(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <p className="font-mono text-black text-sm md:text-base px-2 pt-2 select-none">
        {`<<ERROR> SERVER NOT RESPONDING `}
        <span onClick={tapDns}>DNS </span>
        <span onClick={tapUrl}>TEJUSBHASIN.INFO</span>
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