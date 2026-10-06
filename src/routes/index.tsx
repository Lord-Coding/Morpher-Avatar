import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { BloubAvatar } from "@/components/bloub/BloubAvatar";
import { EXPRESSIONS, type ExpressionId } from "@/components/bloub/expressions";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { generateMood } from "@/lib/mood.functions";
import { Sparkles } from "lucide-react";
import { SHAPES, type ShapeId } from "@/lib/bloub-shapes";
import { COLORS } from "@/lib/bloub-colors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Morpher — avatar SVG animé" },
      {
        name: "description",
        content:
          "Générez un avatar SVG animé : morphing de forme fluide, 17 expressions, palette de couleurs, export PNG ou SVG.",
      },
      { property: "og:title", content: "Morpher — avatar SVG animé" },
      {
        property: "og:description",
        content:
            "Générez un avatar SVG animé : morphing de forme fluide, 17 expressions, palette de couleurs, export PNG ou SVG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [shape, setShape] = useState<ShapeId>("cercle");
  const [expression, setExpression] = useState<ExpressionId>("attentif");
  const [colorId, setColorId] = useState(COLORS[0]!.id);
  const [status, setStatus] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [tempo, setTempo] = useState(1);
  const [wobble, setWobble] = useState(1);
  const [blinkEvery, setBlinkEvery] = useState(3500);
  const [mood, setMood] = useState("");
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodMsg, setMoodMsg] = useState("");
  const [moodError, setMoodError] = useState(false);
  const [gifSize, setGifSize] = useState(512);
  const [gifSeconds, setGifSeconds] = useState(2);
  const runMood = useServerFn(generateMood);

  const applyMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (moodLoading || mood.trim().length < 2) return;
    setMoodLoading(true);
    setMoodError(false);
    setMoodMsg("Génération des réglages…");
    try {
      const r = await runMood({ data: { mood } });
      if (!r.ok) {
        setMoodError(true);
        setMoodMsg(r.error);
        return;
      }
      const st = r.settings;
      setShape(st.shape as ShapeId);
      setExpression(st.expression as ExpressionId);
      setColorId(st.color);
      setTempo(st.tempo);
      setWobble(st.wobble);
      setBlinkEvery(st.blinkEvery);
      setMoodMsg(st.summary || "Réglages appliqués.");
    } catch {
      setMoodError(true);
      setMoodMsg("Génération impossible, réessayez.");
    } finally {
      setMoodLoading(false);
    }
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);
  const expressionsRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef<HTMLDivElement>(null);

  const color = COLORS.find((c) => c.id === colorId) ?? COLORS[0]!;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("bloub-theme");
    const dark = savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("bloub-theme", next ? "dark" : "light");
  };

  const moveSelection = <T extends string>(
    options: readonly { id: T }[],
    current: T,
    direction: -1 | 1,
    select: (id: T) => void,
    viewport: RefObject<HTMLDivElement | null>,
  ) => {
    const currentIndex = options.findIndex((option) => option.id === current);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    select(next.id);
    viewport.current
      ?.querySelector<HTMLElement>(`[data-option="${next.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const serialize = () => {
    const node = svgRef.current;
    if (!node) return null;
    return new XMLSerializer().serializeToString(node);
  };

  const download = (href: string, ext: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = `bloub-${shape}-${expression}.${ext}`;
    a.click();
  };

  const exportSvg = () => {
    const markup = serialize();
    if (!markup) return;
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
    download(url, "svg");
    URL.revokeObjectURL(url);
    setStatus("SVG exporté.");
  };

  const exportPng = () => {
    const markup = serialize();
    if (!markup) return;
    const img = new Image();
    const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 1024, 1024);
      download(canvas.toDataURL("image/png"), "png");
      setStatus("PNG exporté en 1024 × 1024.");
    };
    img.onerror = () => setStatus("Export PNG impossible dans ce navigateur.");
    img.src = url;
  };

  const exportGif = async () => {
    if (capturing) return;
    const node = svgRef.current;
    if (!node) return;
    setCapturing(true);
    setStatus("Capture de l'animation…");
    try {
      const [{ default: GIF }, workerUrl] = await Promise.all([
        import("gif.js"),
        import("gif.js/dist/gif.worker.js?url").then((m) => m.default),
      ]);
      const size = gifSize;
      const frameDelay = 80;
      const frameCount = Math.round((gifSeconds * 1000) / frameDelay);
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: size,
        height: size,
        workerScript: workerUrl,
      });
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      const captureFrame = () =>
        new Promise<void>((resolve, reject) => {
          const markup = new XMLSerializer().serializeToString(node);
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            gif.addFrame(ctx, { copy: true, delay: frameDelay });
            resolve();
          };
          img.onerror = () => reject(new Error("frame"));
          img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(markup)))}`;
        });

      for (let i = 0; i < frameCount; i++) {
        await captureFrame();
        setStatus(`Capture de l'animation… ${i + 1}/${frameCount}`);
        await new Promise((r) => setTimeout(r, frameDelay));
      }

      setStatus("Encodage du GIF…");
      const blob = await new Promise<Blob>((resolve, reject) => {
        gif.on("finished", (b: Blob) => resolve(b));
        gif.on("abort", () => reject(new Error("abort")));
        gif.render();
      });
      const url = URL.createObjectURL(blob);
      download(url, "gif");
      URL.revokeObjectURL(url);
      setStatus("GIF animé exporté.");
    } catch {
      setStatus("Export GIF impossible dans ce navigateur.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-5">
          <span className="text-lg font-semibold" aria-label="Morpher">
            Morpher
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full bg-card"
            aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
            title={isDark ? "Mode clair" : "Mode sombre"}
            onClick={toggleTheme}
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl gap-5 px-4 py-5 sm:px-5 sm:py-6 min-[860px]:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] min-[860px]:items-center">
        {/* Scène */}
        <section
          aria-label="Aperçu de l'avatar"
          className="flex min-h-[52vh] min-w-0 flex-col items-center justify-center gap-5 sm:gap-7 min-[860px]:min-h-0"
        >
          <BloubAvatar
            ref={svgRef}
            shape={shape}
            expression={expression}
            color={color.body}
            ink={color.ink}
            size={300}
            tempo={tempo}
            wobble={wobble}
            blinkEvery={blinkEvery}
            className="h-auto w-[min(68vw,260px)] sm:w-[min(42vw,300px)] min-[860px]:w-[min(34vw,360px)]"
          />
          <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" className="btn-base btn-primary" onClick={exportPng}>
              Exporter en PNG
            </button>
            <button type="button" className="btn-base btn-ghost" onClick={exportSvg}>
              Exporter en SVG
            </button>
            <button
              type="button"
              className="btn-base btn-ghost"
              onClick={exportGif}
              disabled={capturing}
            >
              {capturing ? "Capture…" : "Exporter en GIF"}
            </button>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium">
              Taille du GIF
              <select
                className="h-10 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={gifSize}
                disabled={capturing}
                onChange={(e) => setGifSize(Number(e.target.value))}
              >
                {[256, 512, 768, 1024].map((v) => (
                  <option key={v} value={v}>{v} × {v}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Durée du GIF
              <select
                className="h-10 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={gifSeconds}
                disabled={capturing}
                onChange={(e) => setGifSeconds(Number(e.target.value))}
              >
                {[1, 2, 3, 5, 8].map((v) => (
                  <option key={v} value={v}>{v} s</option>
                ))}
              </select>
            </label>
          </div>
          <p aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
            {status}
          </p>
        </section>

        {/* Panneau de contrôle */}
        <aside className="surface-card grid h-fit min-w-0 grid-cols-1 gap-6 p-4 sm:p-5 min-[860px]:sticky min-[860px]:top-5">
          <form onSubmit={applyMood} className="grid gap-2">
            <label htmlFor="mood" className="text-sm font-semibold">Ambiance (IA)</label>
            <textarea
              id="mood"
              rows={2}
              maxLength={300}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Ex. : calme et rêveur, un matin de pluie"
              aria-invalid={moodError || undefined}
              className="resize-none rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid]:border-destructive"
            />
            <button
              type="submit"
              className="btn-base btn-primary inline-flex items-center justify-center gap-2"
              disabled={moodLoading || mood.trim().length < 2}
            >
              <Sparkles aria-hidden="true" className="size-4" />
              {moodLoading ? "Génération…" : "Générer les réglages"}
            </button>
            <p aria-live="polite" className={`min-h-5 text-xs ${moodError ? "text-destructive" : "text-muted-foreground"}`}>
              {moodMsg}
            </p>
          </form>

          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold">Forme</legend>
            <div className="carousel-shell">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Forme précédente"
                title="Forme précédente"
                onClick={() => moveSelection(SHAPES, shape, -1, setShape, shapesRef)}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <div ref={shapesRef} className="carousel-viewport" aria-label="Choix de forme">
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="tile carousel-item"
                  data-option={s.id}
                  aria-pressed={shape === s.id}
                  onClick={() => setShape(s.id)}
                >
                  <BloubAvatar
                    shape={s.id}
                    expression={expression}
                    color={color.body}
                    ink={color.ink}
                    size={44}
                    still
                  />
                  <span className="tile-label">{s.label}</span>
                </button>
              ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Forme suivante"
                title="Forme suivante"
                onClick={() => moveSelection(SHAPES, shape, 1, setShape, shapesRef)}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold">Expression</legend>
            <div className="carousel-shell">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Expression précédente"
                title="Expression précédente"
                onClick={() =>
                  moveSelection(EXPRESSIONS, expression, -1, setExpression, expressionsRef)
                }
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <div
                ref={expressionsRef}
                className="carousel-viewport"
                aria-label="Choix d'expression"
              >
              {EXPRESSIONS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="tile carousel-item"
                  data-option={e.id}
                  aria-pressed={expression === e.id}
                  onClick={() => setExpression(e.id)}
                >
                  <BloubAvatar
                    shape={shape}
                    expression={e.id}
                    color={color.body}
                    ink={color.ink}
                    size={44}
                    still
                  />
                  <span className="tile-label">{e.label}</span>
                </button>
              ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Expression suivante"
                title="Expression suivante"
                onClick={() =>
                  moveSelection(EXPRESSIONS, expression, 1, setExpression, expressionsRef)
                }
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="mb-3 text-sm font-semibold">Couleur</legend>
            <div className="carousel-shell">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Couleur précédente"
                title="Couleur précédente"
                onClick={() => moveSelection(COLORS, colorId, -1, setColorId, colorsRef)}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <div ref={colorsRef} className="carousel-viewport" aria-label="Choix de couleur">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="color-item carousel-item"
                  data-option={c.id}
                  aria-pressed={colorId === c.id}
                  onClick={() => setColorId(c.id)}
                >
                  <span className="swatch" style={{ ["--swatch" as string]: c.body }} />
                  <span className="tile-label">{c.label}</span>
                </button>
              ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="carousel-control"
                aria-label="Couleur suivante"
                title="Couleur suivante"
                onClick={() => moveSelection(COLORS, colorId, 1, setColorId, colorsRef)}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </fieldset>
        </aside>
      </div>
    </main>
  );
}
