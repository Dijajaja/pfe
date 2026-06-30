import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  ClipboardList,
  HelpCircle,
  MessageCircle,
  Wallet,
  X,
} from "lucide-react";

import { useEffectiveRole } from "../../app/session";
import { studentApi } from "../../features/api/webFeaturesApi";
import {
  buildStudentHelpContext,
  CHATBOT_MENUS,
  getRootChatbotMessage,
  resolveChatbotStep,
  ROOT_MENU_ICONS,
} from "../../lib/studentHelpChatbot";

const ROOT_ICONS = {
  clipboard: ClipboardList,
  check: BadgeCheck,
  wallet: Wallet,
  help: HelpCircle,
};

function ChatbotMessage({ text }) {
  const lines = (text || "").split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isTitle = trimmed.endsWith(":") && !trimmed.startsWith("•");
        return (
          <p key={i} className={isTitle ? "student-help-chatbot__line-title mb-1" : "mb-1"}>
            {line || "\u00a0"}
          </p>
        );
      })}
    </>
  );
}

export function StudentHelpChatbot() {
  const [open, setOpen] = useState(false);
  const [stepId, setStepId] = useState("root");
  const { user } = useEffectiveRole();

  const dossiersQuery = useQuery({
    queryKey: ["student", "dossiers"],
    queryFn: () => studentApi.listDossiers(),
    enabled: open,
  });

  const attestationQuery = useQuery({
    queryKey: ["student", "attestation"],
    queryFn: studentApi.getAttestationStatus,
    enabled: open,
  });

  const ctx = useMemo(() => {
    const dossier = dossiersQuery.data?.results?.[0] || null;
    return buildStudentHelpContext({
      dossier,
      attestation: attestationQuery.data,
      user,
    });
  }, [dossiersQuery.data, attestationQuery.data, user]);

  const displayStep = useMemo(() => {
    if (stepId === "root" || stepId.startsWith("menu-")) {
      return CHATBOT_MENUS[stepId] || CHATBOT_MENUS.root;
    }
    return resolveChatbotStep(stepId, ctx);
  }, [stepId, ctx]);

  const isRoot = stepId === "root";
  const message = isRoot ? getRootChatbotMessage(user) : displayStep.message;

  function closeChat() {
    setOpen(false);
    setStepId("root");
  }

  function handleButtonClick(btn) {
    setStepId(btn.id === "back-root" ? "root" : btn.id);
  }

  return (
    <div className="student-help-chatbot" aria-live="polite">
      {open ? (
        <div className="student-help-chatbot__panel" role="dialog" aria-label="Assistant Sehily">
          <div className={`student-help-chatbot__header${isRoot ? " student-help-chatbot__header--home" : ""}`}>
            {isRoot ? (
              <>
                <div className="student-help-chatbot__avatar" aria-hidden="true">
                  🤖
                </div>
                <div className="student-help-chatbot__header-text">
                  <div className="student-help-chatbot__title">Assistant Sehily</div>
                  <div className="student-help-chatbot__online">
                    <span className="student-help-chatbot__online-dot" aria-hidden="true" />
                    En ligne
                  </div>
                </div>
              </>
            ) : (
              <div className="student-help-chatbot__header-text">
                <div className="student-help-chatbot__title">Assistant Sehily</div>
                <div className="student-help-chatbot__subtitle">Aide étudiant · boutons guidés</div>
              </div>
            )}
            <button type="button" className="student-help-chatbot__close" aria-label="Fermer" onClick={closeChat}>
              <X size={18} />
            </button>
          </div>

          <div className={`student-help-chatbot__body${isRoot ? " student-help-chatbot__body--home" : ""}`}>
            <div
              className={`student-help-chatbot__bubble${
                isRoot ? " student-help-chatbot__bubble--home" : " student-help-chatbot__bubble--bot"
              }`}
            >
              <ChatbotMessage text={message} />
            </div>

            {(dossiersQuery.isLoading || attestationQuery.isLoading) &&
            stepId !== "root" &&
            !stepId.startsWith("menu-") ? (
              <div className="student-help-chatbot__loading small text-muted">Chargement de vos données…</div>
            ) : null}

            <div className={`student-help-chatbot__actions${isRoot ? " student-help-chatbot__actions--home" : ""}`}>
              {(displayStep.buttons || []).map((btn) => {
                if (btn.link) {
                  return (
                    <Link key={btn.id} to={btn.link} className="student-help-chatbot__btn" onClick={closeChat}>
                      {btn.label}
                    </Link>
                  );
                }

                if (isRoot) {
                  const iconKey = ROOT_MENU_ICONS[btn.id];
                  const Icon = ROOT_ICONS[iconKey] || HelpCircle;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      className="student-help-chatbot__menu-card"
                      onClick={() => handleButtonClick(btn)}
                    >
                      <span className={`student-help-chatbot__menu-icon student-help-chatbot__menu-icon--${iconKey}`}>
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <span className="student-help-chatbot__menu-label">{btn.label}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={btn.id}
                    type="button"
                    className="student-help-chatbot__btn student-help-chatbot__btn--pill"
                    onClick={() => handleButtonClick(btn)}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="student-help-chatbot__fab"
        aria-expanded={open}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant Sehily"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
