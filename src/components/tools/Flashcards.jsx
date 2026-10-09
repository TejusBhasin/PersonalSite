import { useMemo, useState } from "react";
import { Plus, Shuffle, Trash2, Pencil, Check, X } from "lucide-react";
import { inputCls, labelCls, cardCls, btnCls, ghostBtnCls, loadLS, saveLS } from "@/lib/toolUi";

const uid = () => Date.now() + Math.random().toString(36).slice(2, 6);

export default function Flashcards() {
  const [decks, setDecks] = useState(() => loadLS("flashcard-decks", []));
  const [view, setView] = useState({ type: "list" });

  const persist = (next) => {
    setDecks(next);
    saveLS("flashcard-decks", next);
  };

  // ---------- deck list ----------
  if (view.type === "list") {
    return (
      <div className="space-y-5">
        <NewDeckForm onAdd={(name) => persist([...decks, { id: uid(), name, cards: [] }])} />
        {decks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No decks yet. Create one above to start studying.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {decks.map((d) => (
              <div key={d.id} className={cardCls + " flex items-center justify-between gap-3"}>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.cards.length} card{d.cards.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setView({ type: "deck", deckId: d.id })} className={ghostBtnCls} disabled={false}>Open</button>
                  <button
                    onClick={() => { if (confirmDelete()) persist(decks.filter((x) => x.id !== d.id)); }}
                    className="text-foreground/30 hover:text-red-600 transition-colors"
                    title="Delete deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Decks are stored on this device only.</p>
      </div>
    );
  }

  const deck = decks.find((d) => d.id === view.deckId);
  if (!deck) {
    setView({ type: "list" });
    return null;
  }
  const updateDeck = (fn) => persist(decks.map((d) => (d.id === deck.id ? fn(d) : d)));

  // ---------- study session ----------
  if (view.type === "study") {
    const queue = view.queue;
    if (queue.length === 0) {
      return (
        <div className={cardCls + " text-center py-10"}>
          <p className="text-xl font-black mb-2">Session complete!</p>
          <p className="text-sm text-muted-foreground mb-5">You worked through every card in {deck.name}.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setView({ type: "deck", deckId: deck.id })} className={btnCls}>Back to deck</button>
          </div>
        </div>
      );
    }
    const card = queue[0];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{deck.name} · {queue.length} left</p>
          <button onClick={() => setView({ type: "deck", deckId: deck.id })} className={ghostBtnCls + " !text-xs"}>Exit session</button>
        </div>
        <button
          onClick={() => setView({ ...view, flipped: !view.flipped })}
          className={cardCls + " w-full text-center min-h-[220px] flex flex-col items-center justify-center hover:border-foreground/40 transition-colors"}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{view.flipped ? "Back" : "Front"} — tap to flip</p>
          <p className="text-lg font-bold whitespace-pre-wrap">{view.flipped ? card.back : card.front}</p>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView({ ...view, queue: [...queue.slice(1), card], flipped: false })}
            className="border border-border/60 bg-card rounded-xl py-3 text-sm font-bold text-orange-600 hover:border-orange-400 transition-colors"
          >
            Again
          </button>
          <button
            onClick={() => setView({ ...view, queue: queue.slice(1), flipped: false })}
            className="border border-border/60 bg-card rounded-xl py-3 text-sm font-bold text-green-700 hover:border-green-400 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // ---------- deck editor ----------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{deck.name}</h2>
          <p className="text-xs text-muted-foreground">{deck.cards.length} card{deck.cards.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setView({
                type: "study",
                queue: deck.cards.length ? [...deck.cards].sort(() => Math.random() - 0.5) : [],
                flipped: false,
              })
            }
            className={btnCls + " inline-flex items-center gap-1.5"}
            disabled={!deck.cards.length}
          >
            <Shuffle className="w-4 h-4" /> Study
          </button>
          <button onClick={() => setView({ type: "list" })} className={ghostBtnCls}>All decks</button>
        </div>
      </div>

      <AddCardForm onAdd={(front, back) => updateDeck((d) => ({ ...d, cards: [...d.cards, { id: uid(), front, back }] }))} />

      {deck.cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cards yet. Add your first card above.</p>
      ) : (
        <div className="space-y-2">
          {deck.cards.map((c) => (
            <CardRow
              key={c.id}
              card={c}
              onSave={(front, back) => updateDeck((d) => ({ ...d, cards: d.cards.map((x) => (x.id === c.id ? { ...x, front, back } : x)) }))}
              onDelete={() => updateDeck((d) => ({ ...d, cards: d.cards.filter((x) => x.id !== c.id) }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function confirmDelete() {
  return window.confirm("Delete this deck and all its cards?");
}

function NewDeckForm({ onAdd }) {
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New deck name, e.g. US History midterm" className={inputCls} />
      <button
        onClick={() => { if (name.trim()) { onAdd(name.trim()); setName(""); } }}
        className={btnCls + " inline-flex items-center gap-1.5 shrink-0"}
      >
        <Plus className="w-4 h-4" /> Deck
      </button>
    </div>
  );
}

function AddCardForm({ onAdd }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const add = () => {
    if (!front.trim() || !back.trim()) return;
    onAdd(front.trim(), back.trim());
    setFront("");
    setBack("");
  };
  return (
    <div className={cardCls}>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Front (question)</label>
          <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} className={inputCls + " resize-y"} />
        </div>
        <div>
          <label className={labelCls}>Back (answer)</label>
          <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} className={inputCls + " resize-y"} />
        </div>
      </div>
      <button onClick={add} className={btnCls + " mt-3 inline-flex items-center gap-1.5"}>
        <Plus className="w-4 h-4" /> Add card
      </button>
    </div>
  );
}

function CardRow({ card, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3">
      {editing ? (
        <div className="space-y-2">
          <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} className={inputCls + " resize-y"} />
          <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} className={inputCls + " resize-y"} />
          <div className="flex gap-2">
            <button onClick={() => { onSave(front, back); setEditing(false); }} className={ghostBtnCls + " inline-flex items-center gap-1"}>
              <Check className="w-3.5 h-3.5 text-green-600" /> Save
            </button>
            <button onClick={() => { setFront(card.front); setBack(card.back); setEditing(false); }} className={ghostBtnCls + " inline-flex items-center gap-1"}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{card.front}</p>
            <p className="text-xs text-muted-foreground truncate">{card.back}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => setEditing(true)} className="text-foreground/40 hover:text-foreground transition-colors" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="text-foreground/40 hover:text-red-600 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}