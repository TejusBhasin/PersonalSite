export default function Ytdlp() {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-background">
      <iframe
        src="https://streamarch.base44.app/"
        title="StreamArch"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}