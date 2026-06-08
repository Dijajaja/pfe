import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../student/presentation/widgets/student_widgets.dart';
import 'widgets/public_page_scaffold.dart';

class PublicLandingPage extends StatelessWidget {
  const PublicLandingPage({super.key});

  static const _steps = [
    ('Vérification éligibilité', 'Entrez vos informations pour vérifier si vous êtes éligible à la bourse.', Icons.search),
    ('Créer un compte', 'Si vous êtes éligible, créez votre compte en quelques minutes.', Icons.person_add_outlined),
    ('Dossier déposé', 'Remplissez le formulaire et téléversez vos pièces justificatives.', Icons.folder_outlined),
    ('Traitement', 'Votre dossier est étudié et validé par les équipes du CNOU.', Icons.home_outlined),
    ('Paiement', 'Une fois validé, le paiement est effectué par notre partenaire.', Icons.payments_outlined),
  ];

  static const _features = [
    (Icons.bolt_outlined, 'Plus rapide', 'Des démarches simplifiées pour un traitement accéléré.'),
    (Icons.shield_outlined, 'Plus sûr', 'Sécurité et confidentialité de vos données garanties.'),
    (Icons.place_outlined, 'Plus transparent', 'Suivez l\'avancement de votre dossier en temps réel.'),
    (Icons.language_outlined, 'Accessible partout', 'Utilisez la plateforme depuis tous vos appareils.'),
  ];

  static const _stats = [
    (Icons.groups_outlined, '10 000+', 'Étudiants'),
    (Icons.description_outlined, '25 000+', 'Dossiers'),
    (Icons.sentiment_satisfied_alt_outlined, '95%', 'Satisfaction'),
    (Icons.flight_takeoff_outlined, '-80%', 'Déplacements'),
  ];

  static const _statusGuides = [
    ('Éligible', 'Vous répondez aux critères requis. Vous pouvez créer un compte et déposer votre dossier.', SehilyColors.green),
    ('En attente', 'Votre dossier est en cours de vérification par nos équipes techniques.', Color(0xFFE65100)),
    ('Non éligible', 'Votre profil ne répond pas aux critères. Consultez la raison détaillée sur votre espace.', SehilyColors.coral),
  ];

  static const _faqs = [
    ('Qui peut bénéficier de la bourse ?', 'Tous les étudiants répondant aux critères sociaux et académiques définis par le CNOU.'),
    ('Quels documents sont nécessaires pour le dossier ?', 'Pièce d\'identité, certificat de scolarité, relevés de notes et justificatifs de revenus selon votre profil.'),
    ('Combien de temps prend le traitement du dossier ?', 'Le délai moyen est de 15 à 30 jours ouvrables selon la période de l\'année.'),
    ('Comment savoir si mon paiement est effectué ?', 'Le statut « Payé » apparaîtra dans votre espace personnel après confirmation du partenaire de paiement.'),
  ];

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HeroSection(onEligibility: () => context.push('/eligibilite'), onLogin: () => context.push('/login')),
          const SizedBox(height: 28),
          _SectionHeader(title: 'Comment ça marche ?', subtitle: 'Un processus 100% digitalisé'),
          const SizedBox(height: 12),
          ...List.generate(_steps.length, (i) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _StepCard(index: i + 1, title: _steps[i].$1, text: _steps[i].$2, icon: _steps[i].$3),
              )),
          const SizedBox(height: 28),
          _SectionHeader(title: 'Pourquoi choisir Sehily ?', subtitle: null),
          const SizedBox(height: 8),
          const Text(
            'Nous avons repensé la gestion des bourses pour offrir une expérience digitale fluide, éliminant les barrières administratives traditionnelles.',
            style: TextStyle(height: 1.45),
          ),
          const SizedBox(height: 12),
          ...['Innovation digitale au service de l\'éducation', 'Traitement automatisé des données', 'Accès direct aux partenaires de paiement']
              .map((b) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, size: 18, color: SehilyColors.green.withValues(alpha: 0.85)),
                        const SizedBox(width: 8),
                        Expanded(child: Text(b, style: const TextStyle(fontWeight: FontWeight.w600))),
                      ],
                    ),
                  )),
          const SizedBox(height: 12),
          ..._features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SehilyCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(f.$1, color: SehilyColors.petrol, size: 28),
                      const SizedBox(height: 10),
                      Text(f.$2, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol)),
                      const SizedBox(height: 6),
                      Text(f.$3, style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.7), height: 1.35)),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: SehilyColors.petrol,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: _stats
                  .map(
                    (s) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                            ),
                            child: Icon(s.$1, color: Colors.white),
                          ),
                          const SizedBox(width: 14),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)),
                              Text(s.$3.toUpperCase(), style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 11, letterSpacing: 0.5)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 28),
          _SectionHeader(title: 'Comprendre les statuts', subtitle: null),
          const SizedBox(height: 12),
          ..._statusGuides.map(
            (g) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SehilyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: g.$3.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(g.$1, style: TextStyle(color: g.$3, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                    const SizedBox(height: 10),
                    Text(g.$2, style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.75), height: 1.4)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          _SectionHeader(title: 'Questions fréquentes', subtitle: null),
          const SizedBox(height: 8),
          ..._faqs.map(
            (faq) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: SehilyCard(
                padding: EdgeInsets.zero,
                child: Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    title: Text(faq.$1, style: const TextStyle(fontWeight: FontWeight.w600, color: SehilyColors.petrol)),
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(faq.$2, style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.7), height: 1.4)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SehilyCard(
            child: Column(
              children: [
                Icon(Icons.help_outline, size: 36, color: SehilyColors.green.withValues(alpha: 0.85)),
                const SizedBox(height: 10),
                const Text('Besoin d\'aide ?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: SehilyColors.petrol)),
                const SizedBox(height: 8),
                Text(
                  'Nos équipes sont disponibles pour répondre à toutes vos questions par téléphone ou email.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.7)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Plateforme officielle de gestion des bourses universitaires en Mauritanie. Simplifier, sécuriser, accompagner.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: SehilyColors.petrol.withValues(alpha: 0.6), height: 1.4),
          ),
          const SizedBox(height: 8),
          Text(
            '© 2026 Sehily — Tous droits réservés.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: SehilyColors.petrol.withValues(alpha: 0.5)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.subtitle});
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.65))),
        ],
      ],
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.onEligibility, required this.onLogin});
  final VoidCallback onEligibility;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: SehilyColors.petrol,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: SehilyColors.petrol.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white.withValues(alpha: 0.24)),
            ),
            child: const Text(
              'NOUVEAU : SUIVI DE DOSSIER EN TEMPS RÉEL',
              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.3),
            ),
          ),
          const SizedBox(height: 16),
          RichText(
            text: const TextSpan(
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, height: 1.15),
              children: [
                TextSpan(text: 'Votre bourse,\n'),
                TextSpan(text: 'notre engagement', style: TextStyle(color: Color(0xFF9FE1CB), fontStyle: FontStyle.italic)),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Une plateforme digitale moderne pour simplifier vos démarches et vous accompagner à chaque étape du succès universitaire.',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.82), fontSize: 15, height: 1.4),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.96),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Row(
              children: [
                Icon(Icons.check_circle, color: SehilyColors.petrol, size: 28),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Vérifiez votre éligibilité', style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol)),
                      SizedBox(height: 2),
                      Text('C\'est rapide, sans engagement et sécurisé.', style: TextStyle(fontSize: 13, color: Colors.black54)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const _PhoneMockup(),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onEligibility,
            icon: const Icon(Icons.arrow_forward),
            label: const Text('Vérifier mon éligibilité'),
            style: FilledButton.styleFrom(
              backgroundColor: SehilyColors.coral,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: onLogin,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: BorderSide(color: SehilyColors.green.withValues(alpha: 0.8)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Se connecter'),
          ),
          const SizedBox(height: 16),
          Row(
            children: const [
              Expanded(child: _HeroKpi(icon: Icons.bolt_outlined, title: 'Gain de temps', sub: 'Moins de déplacements')),
              SizedBox(width: 8),
              Expanded(child: _HeroKpi(icon: Icons.lock_outline, title: 'Sécurisé', sub: 'Données protégées')),
              SizedBox(width: 8),
              Expanded(child: _HeroKpi(icon: Icons.notifications_outlined, title: 'Notifications', sub: 'Suivi en temps réel')),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroKpi extends StatelessWidget {
  const _HeroKpi({required this.icon, required this.title, required this.sub});
  final IconData icon;
  final String title;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
        color: Colors.white.withValues(alpha: 0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF9FE1CB)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
          Text(sub, style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 9), maxLines: 2),
        ],
      ),
    );
  }
}

class _PhoneMockup extends StatelessWidget {
  const _PhoneMockup();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 4),
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 24, 14, 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bonjour,', style: TextStyle(fontSize: 11, color: Colors.black45)),
            const Text('Diary Ba', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.black12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('STATUT DU DOSSIER', style: TextStyle(fontSize: 9, color: Colors.black45, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Éligible', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('ACTIF', style: TextStyle(fontSize: 9, color: SehilyColors.petrol, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.black12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PROGRESSION', style: TextStyle(fontSize: 9, color: Colors.black45, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(
                      4,
                      (i) => Expanded(
                        child: Container(
                          height: 4,
                          margin: EdgeInsets.only(right: i < 3 ? 4 : 0),
                          decoration: BoxDecoration(
                            color: i < 2 ? SehilyColors.petrol : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Align(
                    alignment: Alignment.centerRight,
                    child: Text('Traitement: 50%', style: TextStyle(fontSize: 9, color: SehilyColors.petrol, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: SehilyColors.green.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Dépôt du dossier', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: SehilyColors.petrol)),
            ),
            const SizedBox(height: 6),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: SehilyColors.petrol,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Suivre mes paiements', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  const _StepCard({required this.index, required this.title, required this.text, required this.icon});
  final int index;
  final String title;
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SehilyCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: SehilyColors.petrol, borderRadius: BorderRadius.circular(8)),
            child: Text('$index', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 18, color: SehilyColors.green),
                    const SizedBox(width: 6),
                    Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol))),
                  ],
                ),
                const SizedBox(height: 6),
                Text(text, style: TextStyle(fontSize: 13, color: SehilyColors.petrol.withValues(alpha: 0.7), height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
