import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/storage/local_storage_service.dart';
import '../../application/student_providers.dart';
import '../widgets/student_widgets.dart';

const _cardMuted = Color(0xFFF4F6F5);

String _relativeTime(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final dt = DateTime.tryParse(iso);
  if (dt == null) return iso;
  final local = dt.toLocal();
  final diff = DateTime.now().difference(local);
  if (diff.inMinutes < 1) return 'À l\'instant';
  if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
  if (diff.inHours < 24) return 'Il y a ${diff.inHours} h';
  if (diff.inDays == 1) return 'Hier à ${DateFormat('HH:mm').format(local)}';
  if (diff.inDays < 7) return 'Il y a ${diff.inDays} jours';
  return DateFormat('dd/MM/yyyy').format(local);
}

({IconData icon, Color bg, Color fg}) _notifStyle(String titre, String message) {
  final text = '${titre.toUpperCase()} ${message.toUpperCase()}';
  if (text.contains('PAIEMENT') || text.contains('PAY') || text.contains('VIREMENT')) {
    return (icon: Icons.account_balance_wallet_outlined, bg: SehilyColors.mintBg, fg: SehilyColors.green);
  }
  if (text.contains('DOSSIER') || text.contains('DOCUMENT') || text.contains('PIECE')) {
    return (icon: Icons.description_outlined, bg: const Color(0xFFE3F2FD), fg: const Color(0xFF1565C0));
  }
  if (text.contains('RECLAM') || text.contains('ACTION') || text.contains('COMPLEMENT')) {
    return (icon: Icons.schedule_outlined, bg: SehilyColors.pendingBg, fg: SehilyColors.pending);
  }
  return (icon: Icons.notifications_outlined, bg: SehilyColors.coralBg, fg: SehilyColors.coral);
}

class StudentNotificationsPage extends ConsumerWidget {
  const StudentNotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(notificationsProvider);
        await ref.read(notificationsProvider.future);
      },
      color: SehilyColors.green,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Text(
            'Messages système et état non lu.',
            style: TextStyle(
              fontSize: 14,
              color: SehilyColors.textSecondary,
              fontWeight: FontWeight.w500,
              height: 1.55,
            ),
          ),
          const SizedBox(height: 16),
          AsyncSection(
            value: notifAsync,
            onRetry: () => ref.invalidate(notificationsProvider),
            builder: (items) {
              final unread = items.where((n) => !n.lu).length;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: _cardMuted,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        if (unread > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: SehilyColors.coral.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '$unread non lue${unread > 1 ? 's' : ''}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: SehilyColors.coral,
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: SehilyColors.mintBg,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'À jour',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: SehilyColors.green),
                            ),
                          ),
                        const Spacer(),
                        GestureDetector(
                          onTap: items.isEmpty
                              ? null
                              : () async {
                                  final storage = ref.read(localStorageServiceProvider);
                                  await storage.markAllNotificationsAsRead(items.map((e) => e.id).toList());
                                  ref.invalidate(notificationsProvider);
                                },
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.done_all, size: 16, color: SehilyColors.coral),
                              SizedBox(width: 4),
                              Text(
                                'Tout marquer lu',
                                style: TextStyle(color: SehilyColors.coral, fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (items.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: _cardMuted,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Text(
                        'Aucune notification.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                      ),
                    )
                  else
                    ...items.map(
                      (n) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _NotificationRow(
                          titre: n.titre,
                          message: n.message,
                          date: _relativeTime(n.date),
                          lu: n.lu,
                          onMarkRead: n.lu
                              ? null
                              : () async {
                                  await ref.read(localStorageServiceProvider).markNotificationAsRead(n.id);
                                  ref.invalidate(notificationsProvider);
                                },
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({
    required this.titre,
    required this.message,
    required this.date,
    required this.lu,
    this.onMarkRead,
  });

  final String titre;
  final String message;
  final String date;
  final bool lu;
  final VoidCallback? onMarkRead;

  @override
  Widget build(BuildContext context) {
    final style = _notifStyle(titre, message);

    return Material(
      color: lu ? Colors.white : _cardMuted,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onMarkRead,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: lu ? Colors.black.withValues(alpha: 0.06) : SehilyColors.green.withValues(alpha: 0.12),
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: style.bg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(style.icon, color: style.fg, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            titre,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              height: 1.5,
                              color: lu ? SehilyColors.textSecondary : SehilyColors.petrol,
                            ),
                          ),
                        ),
                        if (date.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            date,
                            style: TextStyle(
                              fontSize: 11,
                              height: 1.45,
                              color: SehilyColors.textMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      humanizeNotificationMessage(message),
                      style: TextStyle(
                        fontSize: 13,
                        color: lu ? SehilyColors.textMuted : SehilyColors.textSecondary,
                        height: 1.65,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: lu ? SehilyColors.mintBg : SehilyColors.pendingBg,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            lu ? 'Lu' : 'Non lu',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: lu ? SehilyColors.green : SehilyColors.pending,
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (!lu)
                          const Text(
                            'Marquer lu →',
                            style: TextStyle(
                              color: SehilyColors.coral,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        Icon(
                          Icons.chevron_right,
                          size: 18,
                          color: SehilyColors.petrol.withValues(alpha: 0.35),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
