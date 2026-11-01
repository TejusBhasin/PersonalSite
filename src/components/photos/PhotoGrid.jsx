import Watermark from "@/components/photos/Watermark";

const block = (e) => e.preventDefault();

export default function PhotoGrid({ photos, onOpen }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {photos.map((photo, i) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onOpen(i)}
          onContextMenu={block}
          className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-card"
        >
          <img
            src={photo.thumb}
            alt={photo.name}
            draggable={false}
            loading="lazy"
            onDragStart={block}
            onContextMenu={block}
            className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <Watermark variant="grid" />
        </button>
      ))}
    </div>
  );
}