import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/storage/local_storage_service.dart';
import '../../application/student_providers.dart';
import '../widgets/student_widgets.dart';

class StudentNotificationsPage extends ConsumerWidget {
  const StudentNotificationsPage({super.key});

  String _fmtDateShort(String? iso) {
    if (iso == null) return '';
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return DateFormat('dd/MM/yyyy').format(d.toLocal());
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(notificationsProvider);
        await ref.read(notificationsProvider.future);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Notifications', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text('Messages système et état non lu.'),
          const SizedBox(height: 16),
          AsyncSection(
            value: notifAsync,
            onRetry: () => ref.invalidate(notificationsProvider),
            builder: (items) {
              final unread = items.where((n) => !n.lu).length;
              return SehilyCard(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
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
                              color: SehilyColors.green.withValues(alpha: 0.12),
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
                              Icon(Icons.check, size: 16, color: SehilyColors.coral),
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
                    const SizedBox(height: 12),
                    if (items.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Aucune notification.', textAlign: TextAlign.center),
                      )
                    else
                      ...items.map(
                        (n) => _NotificationRow(
                          titre: n.titre,
                          message: n.message,
                          date: _fmtDateShort(n.date),
                          lu: n.lu,
                          onMarkRead: n.lu
                              ? null
                              : () async {
                                  await ref.read(localStorageServiceProvider).markNotificationAsRead(n.id);
                                  ref.invalidate(notificationsProvider);
                                },
                        ),
                      ),
                  ],
                ),
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
    return Opacity(
      opacity: lu ? 0.5 : 1,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: lu ? Colors.white : SehilyColors.cream,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.black.withValues(alpha: lu ? 0.05 : 0.08)),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (!lu)
                Container(
                  width: 4,
                  decoration: BoxDecoration(
                    color: SehilyColors.coral,
                    borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
                  ),
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 5, right: 8),
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: lu ? Colors.grey.shade400 : SehilyColors.coral,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              titre,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: lu ? Colors.black54 : SehilyColors.petrol,
                              ),
                            ),
                          ),
                          Text(date, style: const TextStyle(fontSize: 12, color: Colors.black45)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Padding(
                        padding: const EdgeInsets.only(left: 16),
                        child: Text(
                          humanizeNotificationMessage(message),
                          style: TextStyle(
                            fontSize: 14,
                            color: lu ? Colors.black45 : Colors.black87,
                            height: 1.35,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.only(left: 16),
                        child: lu
                            ? const Text('✓ Lu', style: TextStyle(fontSize: 13, color: SehilyColors.green, fontWeight: FontWeight.w500))
                            : GestureDetector(
                                onTap: onMarkRead,
                                child: const Text(
                                  'Marquer lu →',
                                  style: TextStyle(
                                    color: SehilyColors.coral,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
