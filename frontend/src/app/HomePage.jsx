import { Link } from "react-router-dom";
import { FiBell, FiCheckCircle, FiClock, FiCreditCard, FiFileText, FiMapPin, FiSearch, FiShield, FiUserPlus, FiXCircle, FiZap } from "react-icons/fi";

import demarches from "../assets/demarches.png";

export function HomePage() {
  return (
    <div className="public-home">
      <section className="public-hero mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-xl-5">
            <span className="public-chip mb-3">Plateforme nationale des bourses universitaires</span>
            <h1 className="public-hero-title mb-3">Gérez votre bourse universitaire en toute simplicité</h1>
            <p className="text-muted mb-4">
              Vérifiez votre éligibilité, déposez votre dossier et suivez chaque étape du traitement jusqu’au paiement,
              sans déplacement inutile.
            </p>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <Link className="btn sehily-btn-primary" to="/eligibilite">
                Vérifier mon éligibilité
              </Link>
              <Link className="btn sehily-btn-secondary" to="/auth/login">
                Se connecter
              </Link>
            </div>
            <div className="row g-2">
              <div className="col-12 col-sm-4">
                <div className="public-status-card public-status-card--ok">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <FiCheckCircle />
                    <strong>Éligible</strong>
                  </div>
                  <div className="small">Vous pouvez déposer votre dossier.</div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="public-status-card public-status-card--danger">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <FiXCircle />
                    <strong>Rejeté</strong>
                  </div>
                  <div className="small">Motif affiché pour correction.</div>
                </div>
              </div>
              <div className="col-12 col-sm-4">
                <div className="public-status-card public-status-card--warn">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <FiClock />
                    <strong>En attente</strong>
                  </div>
                  <div className="small">Votre dossier est en traitement.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-7">
            <div className="public-hero-visual">
              <div className="fw-bold h4 mb-2">Plateforme Sehily</div>
              <div className="text-muted small mb-3">
                Vérification d’éligibilité → création de compte → dépôt du dossier → traitement CNOU → paiement partenaire.
              </div>
              <img src={demarches} alt="Illustration du processus Sehily" className="img-fluid rounded-4 mb-3" />
              <div className="public-hero-metrics">
                <span className="sehily-badge sehily-badge--ok">Suivi en temps réel</span>
                <span className="sehily-badge sehily-badge--warn">Processus sécurisé</span>
                <span className="sehily-badge sehily-badge--ok">Paiement traçable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mb-4 public-fade-up">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <h2 className="h4 m-0">Comment ça marche ?</h2>
          <a className="sehily-link" href="#faq">Voir la FAQ</a>
        </div>
        <div className="row g-3">
          {[
            { icon: FiSearch, title: "Vérifier éligibilité", text: "Entrez vos informations pour savoir si vous pouvez déposer." },
            { icon: FiUserPlus, title: "Créer compte", text: "Créez votre compte personnel sécurisé en quelques étapes." },
            { icon: FiFileText, title: "Déposer dossier", text: "Téléversez vos pièces et soumettez votre demande." },
            { icon: FiShield, title: "Suivre traitement", text: "Consultez l’état du dossier et les décisions CNOU." },
            { icon: FiCreditCard, title: "Recevoir paiement", text: "Une fois validé, le paiement est traité par partenaire." },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="col-12 col-sm-6 col-xl">
                <div className="public-step-card h-100" style={{ animationDelay: `${index * 70}ms` }}>
                  <span className="public-step-number">{index + 1}</span>
                  <span className="public-step-icon">
                    <Icon size={18} />
                  </span>
                  <div className="fw-semibold mb-1">{step.title}</div>
                  <div className="small text-muted">{step.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-4 public-fade-up">
        <h2 className="h4 mb-3">Pourquoi utiliser Sehily ?</h2>
        <div className="row g-3">
          {[
            { icon: FiMapPin, title: "Moins de déplacements", text: "Toutes vos démarches sont centralisées en ligne." },
            { icon: FiZap, title: "Traitement rapide", text: "Les dossiers sont instruits plus vite grâce au flux digital." },
            { icon: FiShield, title: "Transparence", text: "Chaque étape est visible et historisée côté étudiant et CNOU." },
            { icon: FiBell, title: "Notifications", text: "Recevez des alertes dès qu’un statut évolue." },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="col-12 col-md-6 col-xl-3">
                <div className="public-benefit-card h-100" style={{ animationDelay: `${index * 70}ms` }}>
                  <span className="public-benefit-icon">
                    <Icon size={18} />
                  </span>
                  <div className="fw-semibold mb-1">{item.title}</div>
                  <div className="small text-muted">{item.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-4 public-fade-up">
        <h2 className="h4 mb-3">Comprendre les statuts</h2>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="public-status-detail public-status-detail--ok">
              <span className="sehily-badge sehily-badge--ok mb-2">Éligible</span>
              <div className="small text-muted">Votre profil répond aux critères requis. Vous pouvez déposer votre dossier.</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="public-status-detail public-status-detail--danger">
              <span className="sehily-badge sehily-badge--danger mb-2">Rejeté</span>
              <div className="small text-muted">Votre dossier ne respecte pas certains critères. Consultez la raison indiquée.</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="public-status-detail public-status-detail--warn">
              <span className="sehily-badge sehily-badge--warn mb-2">En attente</span>
              <div className="small text-muted">Votre dossier est en cours de traitement par les équipes CNOU.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mb-4 public-fade-up">
        <h2 className="h4 mb-3">Questions fréquentes</h2>
        <div className="accordion public-faq" id="publicFaq">
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faqOne" aria-expanded="true" aria-controls="faqOne">
                Qui peut bénéficier de la bourse ?
              </button>
            </h2>
            <div id="faqOne" className="accordion-collapse collapse show" data-bs-parent="#publicFaq">
              <div className="accordion-body small text-muted">
                Les critères dépendent du profil étudiant et des règles officielles de l’année universitaire en cours.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqTwo" aria-expanded="false" aria-controls="faqTwo">
                Quels documents sont nécessaires pour le dossier ?
              </button>
            </h2>
            <div id="faqTwo" className="accordion-collapse collapse" data-bs-parent="#publicFaq">
              <div className="accordion-body small text-muted">
                Les pièces demandées sont affichées au moment du dépôt selon votre type de demande.
              </div>
            </div>
          </div>
          <div className="accordion-item">
            <h2 className="accordion-header">
              <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqThree" aria-expanded="false" aria-controls="faqThree">
                Combien de temps prend le traitement ?
              </button>
            </h2>
            <div id="faqThree" className="accordion-collapse collapse" data-bs-parent="#publicFaq">
              <div className="accordion-body small text-muted">
                Le délai varie selon le volume de dossiers. Vous suivez l’avancement en temps réel dans votre espace.
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="public-footer public-fade-up">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="fw-bold mb-2">Sehily</div>
            <div className="small text-white-50">Plateforme digitale de gestion des bourses universitaires.</div>
          </div>
          <div className="col-12 col-md-3">
            <div className="fw-semibold mb-2">Support</div>
            <div className="small text-white-50">Centre d’aide</div>
            <div className="small text-white-50">Contactez-nous</div>
            <div className="small text-white-50">Mentions légales</div>
          </div>
          <div className="col-12 col-md-3">
            <div className="fw-semibold mb-2">Contact</div>
            <div className="small text-white-50">contact@sehily.mr</div>
            <div className="small text-white-50">+222 45 25 30 16</div>
            <div className="small text-white-50">Nouakchott, Mauritanie</div>
          </div>
          <div className="col-12 col-md-2">
            <div className="fw-semibold mb-2">Langue</div>
            <div className="small text-white-50">FR | AR</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

