import 'package:flutter/material.dart';

import 'student_widgets.dart';

/// Logo SEHILY pour l'AppBar (image + texte blanc sur fond pétrole).
class SehilyAppBarTitle extends StatelessWidget {
  const SehilyAppBarTitle({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/images/sehily-logo.png',
          height: 28,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Icon(Icons.school, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 8),
        const Text(
          'SEHILY',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}

/// Conteneur gradient partagé (Paiements, Suivi, etc.).
class SehilyHighlightCard extends StatelessWidget {
  const SehilyHighlightCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            SehilyColors.cream,
            SehilyColors.creamGreenSoft,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SehilyColors.green.withValues(alpha: 0.12)),
        boxShadow: [
          BoxShadow(
            color: SehilyColors.green.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

/// Carte KPI « Total reçu » comme la maquette Paiements.
class SehilyTotalRecuCard extends StatelessWidget {
  const SehilyTotalRecuCard({super.key, required this.amountMru});

  final double amountMru;

  @override
  Widget build(BuildContext context) {
    final formatted = amountMru.toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]} ',
        );
    return SehilyHighlightCard(
      child: Column(
        children: [
          const Text(
            'Total reçu',
            style: TextStyle(color: Colors.black54, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            '$formatted MRU',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: SehilyColors.petrol,
              fontWeight: FontWeight.bold,
              fontSize: 32,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }
}
