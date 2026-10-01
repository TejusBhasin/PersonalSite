import LegalLinks from "@/components/LegalLinks";

const ERROR_TEXT = "<<ERROR> SERVER NOT RESPONDING DNS TEJUSBHASIN.INFO 23.567.246.12.9 >";

export default function ServerError() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <p className="font-mono text-black text-sm md:text-base px-2 pt-2 select-none">
        {ERROR_TEXT}
      </p>
      <div className="mt-auto pb-2 flex justify-center">
        <LegalLinks />
      </div>
    </div>
  );
}