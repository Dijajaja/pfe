import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../student/presentation/widgets/student_widgets.dart';
import 'widgets/public_page_scaffold.dart';

class PublicLandingPage extends StatelessWidget {
  const PublicLandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _HeroSection(
            onEligibility: () => context.push('/eligibilite'),
            onLogin: () => context.push('/login'),
          ),
          const SizedBox(height: 32),
          const _LandingFooter(),
        ],
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.onEligibility, required this.onLogin});

  final VoidCallback onEligibility;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        RichText(
          text: const TextSpan(
            style: TextStyle(color: SehilyColors.petrol, fontSize: 28, fontWeight: FontWeight.bold, height: 1.15),
            children: [
              TextSpan(text: 'Votre bourse,\n'),
              TextSpan(
                text: 'notre engagement',
                style: TextStyle(color: SehilyColors.green, fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Une plateforme digitale moderne pour simplifier vos démarches et vous accompagner à chaque étape du succès universitaire.',
          style: TextStyle(color: SehilyColors.textSecondary, fontSize: 15, height: 1.45),
        ),
        const SizedBox(height: 20),
        SehilyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: SehilyColors.mintBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(Icons.shield_outlined, color: SehilyColors.green.withValues(alpha: 0.85), size: 28),
                        Positioned(
                          bottom: 9,
                          child: Icon(Icons.check, color: SehilyColors.green, size: 14),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Vérifiez votre éligibilité',
                          style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol, fontSize: 16),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'C\'est rapide, gratuit et sécurisé.',
                          style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onEligibility,
                icon: const Icon(Icons.arrow_forward, size: 18),
                label: const Text('Vérifier mon éligibilité'),
              ),
              const SizedBox(height: 28),
              OutlinedButton(
                onPressed: onLogin,
                style: OutlinedButton.styleFrom(
                  foregroundColor: SehilyColors.petrol,
                  side: BorderSide(color: Colors.black.withValues(alpha: 0.12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.person_outline, size: 18),
                    SizedBox(width: 8),
                    Text('Se connecter'),
                    SizedBox(width: 8),
                    Icon(Icons.arrow_forward, size: 16, color: SehilyColors.textMuted),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Row(
          children: [
            Expanded(child: _HeroKpi(icon: Icons.access_time, title: 'Gain de temps', sub: 'Moins de déplacements')),
            SizedBox(width: 8),
            Expanded(child: _HeroKpi(icon: Icons.shield_outlined, title: 'Sécurité', sub: 'Données protégées')),
            SizedBox(width: 8),
            Expanded(child: _HeroKpi(icon: Icons.trending_up, title: 'Suivi', sub: 'En temps réel')),
          ],
        ),
      ],
    );
  }
}

class _LandingFooter extends StatelessWidget {
  const _LandingFooter();

  @override
  Widget build(BuildContext context) {
    final accent = SehilyColors.green.withValues(alpha: 0.85);
    final muted = SehilyColors.textSecondary;

    return Column(
      children: [
        Text(
          'Plateforme officielle de gestion des\nbourses universitaires en Mauritanie.\nSimplifier, sécuriser, accompagner.',
          textAlign: TextAlign.center,
          style: TextStyle(color: accent, fontSize: 13, height: 1.55),
        ),
        const SizedBox(height: 28),
        Text(
          '© 2026 SEHILY - TOUS DROITS RÉSERVÉS.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: muted,
            fontSize: 10,
            letterSpacing: 0.4,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'DÉVELOPPÉ POUR LA RÉUSSITE DE NOS ÉTUDIANTS.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: muted,
            fontSize: 10,
            letterSpacing: 0.4,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
      ],
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
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: SehilyColors.green),
          const SizedBox(height: 6),
          Text(title, style: const TextStyle(color: SehilyColors.petrol, fontWeight: FontWeight.bold, fontSize: 11)),
          Text(sub, style: TextStyle(color: SehilyColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w500), maxLines: 2),
        ],
      ),
    );
  }
}
