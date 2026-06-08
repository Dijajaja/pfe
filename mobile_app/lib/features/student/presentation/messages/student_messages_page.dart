import 'package:flutter/material.dart';

import '../widgets/student_widgets.dart';

class StudentMessagesPage extends StatelessWidget {
  const StudentMessagesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Messagerie', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(
          'Échangez avec le support CNOU depuis votre espace étudiant.',
          style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.65)),
        ),
        const SizedBox(height: 16),
        SehilyCard(
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: SehilyColors.green.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.inbox_outlined, size: 36, color: SehilyColors.green),
              ),
              const SizedBox(height: 16),
              const Text(
                'Aucun message pour le moment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: SehilyColors.petrol),
              ),
              const SizedBox(height: 8),
              Text(
                'La messagerie intégrée arrive prochainement. En attendant, utilisez les réclamations pour contacter le support.',
                textAlign: TextAlign.center,
                style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.7), height: 1.4),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: null,
                icon: const Icon(Icons.message_outlined, size: 18),
                label: const Text('Nouveau message'),
              ),
              const SizedBox(height: 8),
              Text(
                'Fonctionnalité en cours de déploiement.',
                style: TextStyle(fontSize: 12, color: SehilyColors.petrol.withValues(alpha: 0.5)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SehilyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.checklist, color: SehilyColors.petrol, size: 20),
                  SizedBox(width: 8),
                  Text('Prochainement', style: TextStyle(fontWeight: FontWeight.bold, color: SehilyColors.petrol)),
                ],
              ),
              const SizedBox(height: 12),
              ...[
                'Conversations avec le support CNOU',
                'Notifications de réponse en temps réel',
                'Historique des échanges lié au dossier',
              ].map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(color: SehilyColors.green, fontWeight: FontWeight.bold)),
                      Expanded(child: Text(item, style: TextStyle(color: SehilyColors.petrol.withValues(alpha: 0.8)))),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
