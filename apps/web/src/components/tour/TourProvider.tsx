"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { MandatoryTourTarget } from "@api-hub/core";
import { getTour, MANDATORY_TOUR, type TourStep } from "@/lib/tours";
import { advanceMandatoryTour } from "@/lib/tour-actions";

type StartOpts = { mandatory?: boolean };
type TourContextValue = {
  /** Tela obrigatória atual, ou null quando a pessoa já concluiu o tour obrigatório. */
  mandatory: MandatoryTourTarget | null;
  /** Chave (rota) do tour em andamento no momento, se houver. */
  activeTour: string | null;
  startTour: (routeKey: string, opts?: StartOpts) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour precisa ser usado dentro de <TourProvider>.");
  return ctx;
}

const FALLBACK_STEPS: TourStep[] = [{ title: "Esta tela", description: "Ainda não escrevemos um tour detalhado para esta tela." }];

export function TourProvider({ mandatory: mandatoryFromServer, children }: { mandatory: MandatoryTourTarget | null; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mandatory, setMandatory] = useState(mandatoryFromServer);
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const driverRef = useRef<Driver | null>(null);
  const startingRef = useRef(false);
  const advancingRef = useRef(false);
  // Guarda o valor mais recente de `mandatory` para os callbacks do driver.js, que são
  // criados uma vez por tour e não devem recriar o driver a cada re-render.
  const mandatoryRef = useRef(mandatoryFromServer);
  mandatoryRef.current = mandatory;

  // Absorve o estado vindo do servidor depois de um router.refresh() (ex.: ao concluir o tour).
  useEffect(() => setMandatory(mandatoryFromServer), [mandatoryFromServer]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const startTour = useCallback(
    (routeKey: string, opts?: StartOpts) => {
      const isMandatory = !!opts?.mandatory;
      // Ocupado por toda a duração do início (inclusive a espera pelo elemento), não só pelo
      // primeiro tick — evita que dois efeitos concorrentes iniciem dois tours ao mesmo tempo.
      if (isMandatory) {
        if (startingRef.current) return;
        startingRef.current = true;
      }
      void (async () => {
        try {
          const def = isMandatory ? MANDATORY_TOUR : getTour(routeKey);
          const steps = def?.steps.length ? def.steps : FALLBACK_STEPS;

          driverRef.current?.destroy();
          driverRef.current = null;

          // Algumas telas (ex.: Mapa de ligações, que carrega React Flow + dagre) ainda estão
          // montando o DOM no momento em que este efeito roda. Sem esperar o primeiro elemento
          // existir, o driver.js tentava posicionar o popover num elemento inexistente e nada
          // aparecia — e como a referência já tinha sido marcada como "em andamento", o tour
          // obrigatório nunca mais tentava de novo, deixando a pessoa presa na tela.
          const firstSelector = steps[0]?.selector;
          if (firstSelector) {
            const start = Date.now();
            // 4s dá folga para telas com bundles maiores (ex.: Mapa de ligações, com React Flow
            // + dagre) em dev, onde o hot-reload não-minificado demora mais para montar.
            while (!document.querySelector(firstSelector) && Date.now() - start < 4000) {
              await new Promise((r) => requestAnimationFrame(() => r(undefined)));
            }
          }

          const { driver } = await import("driver.js");
          const currentMandatory = mandatoryRef.current;

          // Trava local contra recursão: driver.js chama onDestroyStarted também para um
          // destroy() programático nosso (ex.: ao concluir o último passo), não só para
          // ESC/clique fora. Sem isso, onDestroyStarted chamaria destroy() de novo.
          let destroyed = false;
          const finish = (dr: Driver) => {
            if (destroyed) return;
            destroyed = true;
            dr.destroy();
          };

          const d = driver({
            steps: steps.map((s) => ({ element: s.selector, popover: { title: s.title, description: s.description, side: s.side } })),
            popoverClass: "hub-tour",
            showProgress: steps.length > 1,
            progressText:
              isMandatory && currentMandatory && currentMandatory.total > 1
                ? `Tela ${currentMandatory.index + 1} de ${currentMandatory.total} · {{current}} de {{total}}`
                : "{{current}} de {{total}}",
            nextBtnText: "Próximo →",
            prevBtnText: "← Anterior",
            doneBtnText: isMandatory ? (currentMandatory?.isLast ? "Concluir tour" : "Próxima tela →") : "Fechar",
            overlayOpacity: 0.55,
            stagePadding: 6,
            stageRadius: 8,
            smoothScroll: true,
            allowClose: !isMandatory,
            showButtons: isMandatory ? ["next", "previous"] : ["next", "previous", "close"],
            disableActiveInteraction: isMandatory,
            // Passos cujo elemento não existir (ex.: "primeiro time" sem nenhum time cadastrado
            // ainda) são pulados em vez de travar o tour inteiro.
            skipMissingElement: true,
            onNextClick: (_el, _step, { driver: dr }) => {
              if (!dr.isLastStep()) {
                dr.moveNext();
                return;
              }
              if (!isMandatory) {
                finish(dr);
                return;
              }
              if (advancingRef.current) return;
              advancingRef.current = true;
              void (async () => {
                try {
                  const r = await advanceMandatoryTour(routeKey);
                  finish(dr);
                  if (r.status === "done") {
                    setMandatory(null);
                    setToast('Tour concluído! Use o botão "?" em qualquer tela para rever.');
                    router.refresh();
                  } else {
                    setMandatory({ route: r.route, index: r.index, total: r.total, isLast: r.isLast });
                    router.push(r.route);
                  }
                } catch {
                  setToast("Não foi possível salvar seu progresso. Tente de novo.");
                } finally {
                  advancingRef.current = false;
                }
              })();
            },
            onDestroyStarted: (_el, _step, { driver: dr }) => {
              // Fora do modo obrigatório: ESC, X ou clique fora fecham normalmente.
              // No modo obrigatório: essas ações não fazem nada — só "Próximo"/"Concluir" avança.
              if (!isMandatory) finish(dr);
            },
            onDestroyed: () => {
              driverRef.current = null;
              setActiveTour(null);
            },
          });

          d.drive();
          driverRef.current = d;
          setActiveTour(routeKey);
        } catch (err) {
          console.error("Falha ao iniciar o tour:", err);
          driverRef.current = null;
          setActiveTour(null);
          if (isMandatory) setToast("Não deu para abrir o tour guiado desta tela. Recarregue a página para tentar de novo.");
        } finally {
          if (isMandatory) startingRef.current = false;
        }
      })();
    },
    [router],
  );

  // Guarda no cliente: um layout compartilhado não roda de novo em navegação client-side
  // (router.push/Link), então esta é a rede de segurança para quem sai da tela obrigatória
  // sem passar pela ação de avanço (URL digitada, botão voltar do navegador).
  useEffect(() => {
    if (mandatory && pathname !== mandatory.route) router.replace(mandatory.route);
  }, [pathname, mandatory, router]);

  // Início automático do tour obrigatório ao chegar na tela certa. `startTour` decide sozinho
  // (via startingRef) se já há um início em andamento para não disparar dois em paralelo.
  useEffect(() => {
    if (mandatory && pathname === mandatory.route && !driverRef.current) startTour(mandatory.route, { mandatory: true });
  }, [pathname, mandatory, startTour]);

  // Ao trocar de rota, um tour não obrigatório em andamento é fechado (o obrigatório nunca é
  // fechado por aqui — só pela conclusão do próprio passo, que já navega para a rota certa).
  useEffect(() => {
    return () => {
      if (driverRef.current && !mandatoryRef.current) driverRef.current.destroy();
    };
    // Obrigatório não entra na lista: ele usa mandatoryRef e não deve fechar ao trocar de rota.
  }, [pathname]);

  return (
    <TourContext.Provider value={{ mandatory, activeTour, startTour }}>
      {children}
      {toast && (
        <div role="status" className="fixed bottom-20 right-5 z-50 max-w-xs rounded-control border border-line bg-sheet px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </TourContext.Provider>
  );
}
