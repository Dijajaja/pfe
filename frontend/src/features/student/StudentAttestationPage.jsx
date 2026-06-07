import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Download, Smartphone } from "lucide-react";

import { studentApi } from "../api/webFeaturesApi";
import { LoadingSkeleton } from "../../components/ui/LoadingSkeleton";
import { useAppToast } from "../../components/ui/AppToastProvider";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  ATTESTATION_AMOUNT,
  PAYMENT_METHODS,
  SEHILY_MERCHANT_CODE,
} from "../../lib/attestationConstants";
import { generateAttestationPdf } from "../../lib/generateAttestationPdf";
import { StatutDossier, StatutPaiement } from "../../lib/statuts";

const TX_CODE_RE = /^\d{4}$/;

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function StudentAttestationPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { pushError, pushSuccess } = useAppToast();

  const [method, setMethod] = useState("");
  const [telephone, setTelephone] = useState("");
  const [codeTransaction, setCodeTransaction] = useState("");

  const statusQuery = useQuery({
    queryKey: ["student", "attestation"],
    queryFn: studentApi.getAttestationStatus,
  });

  const confirmMutation = useMutation({
    mutationFn: studentApi.confirmAttestationPayment,
    onSuccess: (data) => {
      pushSuccess(data?.message || t("attestationPaymentSuccess"));
      queryClient.setQueryData(["student", "attestation"], data);
      queryClient.invalidateQueries({ queryKey: ["student", "attestation"] });
      setCodeTransaction("");
    },
    onError: (err) => {
      if (err?.response?.data?.already_paid) {
        queryClient.invalidateQueries({ queryKey: ["student", "attestation"] });
      }
      pushError(getApiErrorMessage(err, t("attestationPaymentError")));
    },
  });

  const status = statusQuery.data;
  const eligible = Boolean(status?.eligible);
  const paid = Boolean(status?.paiement_attestation);
  const montantAttestation = status?.montant_attestation ?? ATTESTATION_AMOUNT;
  const codeCommercant = status?.code_commercant ?? SEHILY_MERCHANT_CODE;
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method);

  const canSubmit = useMemo(() => {
    const phone = normalizePhone(telephone);
    return Boolean(method && phone.length >= 8 && TX_CODE_RE.test(codeTransaction.trim()));
  }, [method, telephone, codeTransaction]);

  function handleConfirm(e) {
    e.preventDefault();
    if (!canSubmit) return;
    confirmMutation.mutate({
      methode: method,
      telephone: normalizePhone(telephone),
      code_transaction: codeTransaction.trim(),
    });
  }

  async function handlePrint() {
    if (!status) return;
    try {
      await generateAttestationPdf({
        nomComplet: status.etudiant?.nom_complet,
        nni: status.etudiant?.nni,
        etablissement: status.etudiant?.etablissement,
        filiere: status.etudiant?.filiere,
        niveau: status.dossier?.niveau,
        anneeUniversitaire: status.dossier?.annee_universitaire,
        montantBourse: status.dossier?.montant_bourse,
        reference: status.attestation?.reference,
      });
    } catch {
      pushError(t("attestationPdfError"));
    }
  }

  if (statusQuery.isLoading) return <LoadingSkeleton lines={8} />;
  if (statusQuery.error) {
    return <div className="alert alert-danger">{getApiErrorMessage(statusQuery.error, t("attestationLoadError"))}</div>;
  }

  return (
    <div className="row g-4 student-attestation-page">
      <div className="col-12">
        <h1 className="h4 mb-1">{t("attestationPageTitle")}</h1>
        <p className="text-muted mb-0">{t("attestationPageSubtitle")}</p>
      </div>

      {!eligible ? (
        <div className="col-12">
          <div className="sehily-surface p-4 attestation-block attestation-block--locked">
            <h2 className="h6 fw-bold mb-3">{t("attestationNotEligibleTitle")}</h2>
            <ul className="attestation-checklist mb-0">
              <li className={status?.statut_dossier === StatutDossier.VALIDE ? "is-ok" : "is-pending"}>
                {status?.statut_dossier === StatutDossier.VALIDE ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <span className="attestation-check-dot" />
                )}
                {t("attestationCondStatutDossier", {
                  current: status?.statut_dossier ?? "—",
                  required: StatutDossier.VALIDE,
                })}
              </li>
              <li className={status?.statut_paiement === StatutPaiement.EFFECTUE ? "is-ok" : "is-pending"}>
                {status?.statut_paiement === StatutPaiement.EFFECTUE ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <span className="attestation-check-dot" />
                )}
                {t("attestationCondStatutPaiement", {
                  current: status?.statut_paiement ?? "—",
                  required: StatutPaiement.EFFECTUE,
                })}
              </li>
            </ul>
            <Link to="/app/student/dashboard" className="btn btn-sm sehily-btn-secondary mt-3">
              {t("attestationBackDashboard")}
            </Link>
          </div>
        </div>
      ) : null}

      {eligible && paid ? (
        <div className="col-12">
          <div className="sehily-surface p-4 attestation-block attestation-block--success text-center">
            <CheckCircle2 size={48} className="attestation-success-icon mb-3" strokeWidth={1.5} />
            <h2 className="h5 fw-bold mb-2">{t("attestationPaymentSuccess")}</h2>
            <p className="text-muted mb-1">{t("attestationReadyHint")}</p>
            {status?.attestation?.reference ? (
              <p className="small text-muted mb-4">
                {t("attestationRefLabel")}: <strong>{status.attestation.reference}</strong>
              </p>
            ) : null}
            <button type="button" className="btn sehily-btn-primary d-inline-flex align-items-center gap-2" onClick={handlePrint}>
              <Download size={18} />
              {t("attestationPrintBtn")}
            </button>
          </div>
        </div>
      ) : null}

      {eligible && !paid ? (
        <>
          <div className="col-12">
            <div className="sehily-surface p-4 attestation-block">
              <div className="attestation-step-label">{t("attestationStep1")}</div>
              <h2 className="h6 fw-bold mb-3">{t("attestationChooseMethod")}</h2>
              <div className="attestation-methods-row">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`attestation-method-card ${method === m.id ? "is-selected" : ""}`}
                    onClick={() => setMethod(m.id)}
                    aria-pressed={method === m.id}
                  >
                    <span className="attestation-method-icon" style={{ backgroundColor: `${m.color}22`, color: m.color }}>
                      <Smartphone size={22} />
                    </span>
                    <span className="fw-bold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedMethod ? (
            <div className="col-12">
              <div className="sehily-surface p-4 attestation-block">
                <div className="attestation-step-label">{t("attestationStep2")}</div>
                <h2 className="h6 fw-bold mb-3">{t("attestationInstructionsTitle", { method: selectedMethod.label })}</h2>
                <ol className="attestation-instructions mb-0">
                  <li>{t("attestationInstrOpenApp", { method: selectedMethod.label })}</li>
                  <li>{t("attestationInstrPayments")}</li>
                  <li>
                    {t("attestationInstrMerchant")}{" "}
                    <strong className="attestation-merchant-code">{codeCommercant}</strong>
                  </li>
                  <li>
                    {t("attestationInstrAmount")} <strong>{montantAttestation} MRU</strong>
                  </li>
                  <li>{t("attestationInstrPin")}</li>
                  <li>{t("attestationInstrNoteCode")}</li>
                </ol>
              </div>
            </div>
          ) : null}

          {selectedMethod ? (
            <div className="col-12">
              <div className="sehily-surface p-4 attestation-block">
                <div className="attestation-step-label">{t("attestationStep3")}</div>
                <h2 className="h6 fw-bold mb-3">{t("attestationConfirmTitle")}</h2>
                <form className="attestation-confirm-form" onSubmit={handleConfirm}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="attestation-phone">
                      {t("attestationPhoneLabel")}
                    </label>
                    <input
                      id="attestation-phone"
                      className="form-control"
                      inputMode="tel"
                      placeholder="Ex: 22222222"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="attestation-code">
                      {t("attestationCodeLabel")}
                    </label>
                    <input
                      id="attestation-code"
                      className="form-control"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      value={codeTransaction}
                      onChange={(e) => setCodeTransaction(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                    />
                    <div className="form-text">{t("attestationCodeHint")}</div>
                  </div>
                  <button
                    type="submit"
                    className="btn sehily-btn-primary"
                    disabled={!canSubmit || confirmMutation.isPending}
                  >
                    {confirmMutation.isPending ? t("attestationConfirming") : t("attestationConfirmBtn")}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
