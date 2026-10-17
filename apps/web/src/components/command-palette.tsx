"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { rankCommands } from "@api-hub/core/command-search";
import type { CreateShortcut } from "@api-hub/core/create-shortcuts";
import { searchServices, type ServiceHit } from "@/app/(hub)/_search/actions";
import { useTour } from "@/components/tour/TourProvider";
import { goTo } from "@/components/go-to";
import "./command-palette.css";

/** Item do menu lateral que a pessoa pode abrir ("Ir para"). Vem do layout, já filtrado por permissão. */
export type PaletteNavItem = { href: string; label: string };

type Option = { key: string; section: SectionId; label: string; detail?: string; href: string };
type SectionId = "go" | "service" | "create";

const SECTION_TITLE: Record<SectionId, string> = { go: "Ir para", service: "Serviços", create: "Criar" };
// Quanto esperar a pessoa parar de digitar antes de consultar o servidor.
const SEARCH_DELAY_MS = 180;
const MIN_SERVICE_QUERY = 2;

const isApple = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

function SearchIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} shrink-0 text-muted`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line bg-paper px-1 py-0.5 font-sans text-[10px] font-medium leading-none text-muted">{children}</kbd>;
}

/**
 * Busca global ⌘K (p. 13 e p. 17 da auditoria de UX de 02/10/2026): um ponto de entrada para ir a
 * uma tela, achar um serviço ou abrir um cadastro. Abre por Ctrl+K / ⌘K e pelo botão "Buscar" da
 * barra lateral.
 *
 * - Seções: "Ir para" (menu que a pessoa vê), "Serviços" (Server Action; mesma visibilidade do
 *   catálogo, RN-30) e "Criar" (só os atalhos que a pessoa pode usar). As permissões chegam prontas
 *   do layout; aqui não há checagem de acesso, e cada tela de destino revalida no servidor.
 * - Acessibilidade: <dialog> modal (o fundo fica inerte e o foco fica preso na paleta; Tab não sai
 *   do campo), campo `combobox` com `aria-activedescendant` apontando para o item ativo da `listbox`,
 *   Esc fecha e o foco volta para quem abriu. O resumo dos resultados é anunciado numa região `status`.
 * - Teclado: ↑ ↓ trocam o item, Enter abre, Esc fecha.
 */
export function CommandPalette({ nav, create }: { nav: PaletteNavItem[]; create: CreateShortcut[] }) {
  const router = useRouter();
  const { mandatory, activeTour } = useTour();
  // Durante um tour (inclusive o obrigatório do primeiro acesso) a paleta fica desligada, como o botão "?".
  const disabled = !!mandatory || !!activeTour;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pressedOnBackdrop = useRef(false);
  const requestSeq = useRef(0);
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hits, setHits] = useState<ServiceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");

  // Depois de montar: o servidor não sabe se o aparelho é um Mac, e mostrar a tecla errada pior que esperar.
  useEffect(() => { if (isApple()) setShortcut("⌘K"); }, []);

  const openPalette = useCallback((from?: HTMLElement) => {
    if (disabled) return;
    opener.current = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setQuery("");
    setActiveKey(null);
    setHits([]);
    setSearching(false);
    setSearchFailed(false);
    setOpen(true);
  }, [disabled]);

  // Fecha na hora (o foco volta a quem abriu de forma síncrona, antes de qualquer navegação).
  const closePalette = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setOpen(false);
  }, []);

  // O estado `open` é a fonte da verdade; o <dialog> só o acompanha.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Ctrl+K / ⌘K abre (ou fecha) de qualquer lugar.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== "k") return;
      if (open) {
        e.preventDefault();
        closePalette();
        return;
      }
      // Não abre por cima de outro modal (um formulário com texto digitado, por exemplo) nem durante um tour.
      if (disabled || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      openPalette();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, disabled, openPalette, closePalette]);

  // Busca de serviços: espera a pessoa parar de digitar e descarta resposta de uma busca que já ficou para trás.
  useEffect(() => {
    const seq = ++requestSeq.current;
    const q = query.trim();
    if (!open || q.length < MIN_SERVICE_QUERY) {
      setHits([]);
      setSearching(false);
      setSearchFailed(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchServices(q);
        if (seq !== requestSeq.current) return;
        setHits(found);
        setSearchFailed(false);
      } catch {
        if (seq !== requestSeq.current) return;
        setHits([]);
        setSearchFailed(true);
      } finally {
        if (seq === requestSeq.current) setSearching(false);
      }
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  const options = useMemo<Option[]>(() => {
    const go = rankCommands(nav, query).map((n): Option => ({ key: `go:${n.href}`, section: "go", label: n.label, href: n.href }));
    const services = query.trim().length >= MIN_SERVICE_QUERY
      ? hits.map((h): Option => ({
        key: `service:${h.slug}`,
        section: "service",
        label: h.name,
        detail: [h.teamName ?? "Sem time", h.endpoint].filter(Boolean).join(" · "),
        href: `/services/${h.slug}`,
      }))
      : [];
    const made = rankCommands(create, query).map((c): Option => ({ key: `create:${c.id}`, section: "create", label: c.label, href: c.href }));
    return [...go, ...services, ...made];
  }, [nav, create, hits, query]);

  const activeIndex = Math.max(0, options.findIndex((o) => o.key === activeKey));
  const optionId = (i: number) => `${listId}-option-${i}`;
  const activeId = options[activeIndex] ? optionId(activeIndex) : undefined;

  // Mantém o item ativo à vista quando as setas passam do que cabe na tela.
  useEffect(() => {
    if (open && activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  const move = (step: number) => {
    if (options.length === 0) return;
    const next = (activeIndex + step + options.length) % options.length;
    setActiveKey(options[next]!.key);
  };

  const activate = (option: Option | undefined) => {
    if (!option) return;
    closePalette();
    goTo(router, option.href);
  };

  const sections = (["go", "service", "create"] as const)
    .map((id) => ({ id, items: options.map((o, index) => ({ o, index })).filter(({ o }) => o.section === id) }))
    .filter((s) => s.items.length > 0);

  const trimmed = query.trim();
  const serviceSearch = trimmed.length >= MIN_SERVICE_QUERY;
  let statusText = "";
  if (searchFailed) statusText = "Não foi possível buscar serviços agora. Tente de novo.";
  else if (searching) statusText = "Buscando serviços…";
  else if (options.length === 0 && trimmed) statusText = `Nenhum resultado para “${trimmed}”.`;
  else if (trimmed) statusText = `${options.length} ${options.length === 1 ? "resultado" : "resultados"}`;
  // Resultado normal só é lido pelo leitor de tela; o que muda o que a pessoa vê (buscando, erro, vazio) aparece.
  const statusVisible = searchFailed || searching || (options.length === 0 && !!trimmed);

  return (
    <>
      <button
        type="button"
        data-tour="global-search"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={(e) => openPalette(e.currentTarget)}
        className="flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-control border border-line bg-paper px-2.5 text-left text-sm text-muted transition hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SearchIcon />
        <span className="min-w-0 flex-1 truncate">Buscar</span>
        <span aria-hidden><Kbd>{shortcut}</Kbd></span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Busca global"
        className="hub-palette"
        // Só fecha se o clique também começou no fundo: selecionar texto no campo e soltar fora não pode fechar.
        onPointerDown={(e) => { pressedOnBackdrop.current = e.target === e.currentTarget; }}
        onClick={(e) => {
          const fromBackdrop = e.target === e.currentTarget && pressedOnBackdrop.current;
          pressedOnBackdrop.current = false;
          if (fromBackdrop) closePalette();
        }}
        // Esc (cancel nativo) já fecha o diálogo; aqui só o estado e o foco acompanham.
        onClose={() => {
          setOpen(false);
          const from = opener.current;
          opener.current = null;
          // O navegador devolve o foco a quem abriu; isto cobre o caso de ele ter ido para o <body> (Safari).
          if (from?.isConnected && (!document.activeElement || document.activeElement === document.body)) from.focus();
        }}
      >
        <div className="hub-palette-search">
          <SearchIcon className="size-[18px]" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Buscar serviços, telas e ações"
            aria-autocomplete="list"
            aria-expanded={options.length > 0}
            aria-controls={`${listId}-list`}
            aria-activedescendant={activeId}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Buscar serviço, tela ou ação…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveKey(null); }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
              else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
              else if (e.key === "Enter") { e.preventDefault(); activate(options[activeIndex]); }
              // Foco preso: Tab não leva o foco para fora da paleta (o campo é o único controle focável).
              else if (e.key === "Tab") e.preventDefault();
            }}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className="hub-palette-scroll">
          <div id={`${listId}-list`} role="listbox" aria-label="Resultados da busca" hidden={options.length === 0}>
            {sections.map((section) => (
              <div key={section.id} role="group" aria-labelledby={`${listId}-${section.id}`} className="pb-1">
                <div id={`${listId}-${section.id}`} role="presentation" className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                  {SECTION_TITLE[section.id]}
                </div>
                {section.items.map(({ o, index }) => (
                  <div
                    key={o.key}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    // Mouse: o foco nunca sai do campo (senão as setas param de valer), só o item ativo muda.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseMove={() => { if (o.key !== options[activeIndex]?.key) setActiveKey(o.key); }}
                    onClick={() => activate(o)}
                    className={`flex cursor-pointer items-baseline gap-3 rounded-control px-3 py-2 text-sm ${index === activeIndex ? "bg-accent/10 shadow-[inset_3px_0_0_var(--color-accent)]" : ""}`}
                  >
                    <span className="min-w-0 truncate font-medium">{o.label}</span>
                    {o.detail && <span className="min-w-0 flex-1 truncate text-xs text-muted">{o.detail}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Sempre no DOM: uma região de aviso só é lida se já existia quando o texto mudou. */}
          <p role="status" aria-live="polite" className={statusVisible ? `px-3 py-3 text-sm ${searchFailed ? "text-danger" : "text-muted"}` : "sr-only"}>
            {statusText}
          </p>
        </div>

        <div className="hub-palette-footer" aria-hidden>
          <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar</span>
          <span><Kbd>Enter</Kbd> abrir</span>
          <span><Kbd>Esc</Kbd> fechar</span>
          {!serviceSearch && <span className="ml-auto hidden sm:inline">Digite 2 letras para buscar serviços</span>}
        </div>
      </dialog>
    </>
  );
}
