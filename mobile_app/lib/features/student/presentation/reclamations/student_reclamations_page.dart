import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/network/api_errors.dart';
import '../../application/student_providers.dart';
import '../../data/student_repository.dart';
import '../../domain/dossier_validation.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

const _cardMuted = Color(0xFFF4F6F5);

InputDecoration _fieldDeco({String? hintText}) {
  return InputDecoration(
    filled: true,
    fillColor: Colors.white,
    hintText: hintText,
    hintStyle: const TextStyle(
      color: SehilyColors.textMuted,
      fontWeight: FontWeight.w500,
      fontSize: 14,
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.black.withValues(alpha: 0.1)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: SehilyColors.green, width: 1.5),
    ),
  );
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: SehilyColors.textSecondary,
        ),
      ),
    );
  }
}

class StudentReclamationsPage extends ConsumerStatefulWidget {
  const StudentReclamationsPage({super.key});

  @override
  ConsumerState<StudentReclamationsPage> createState() => _StudentReclamationsPageState();
}

class _StudentReclamationsPageState extends ConsumerState<StudentReclamationsPage> {
  final _objetCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  Reclamation? _editing;
  bool _busy = false;

  @override
  void dispose() {
    _objetCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_objetCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty) return;
    setState(() => _busy = true);
    final repo = ref.read(studentRepositoryProvider);
    try {
      if (_editing != null) {
        await repo.updateReclamation(_editing!.id,
            objet: _objetCtrl.text.trim(), description: _descCtrl.text.trim());
      } else {
        await repo.createReclamation(objet: _objetCtrl.text.trim(), description: _descCtrl.text.trim());
      }
      _objetCtrl.clear();
      _descCtrl.clear();
      setState(() => _editing = null);
      invalidateStudentData(ref);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    } finally {
      setState(() => _busy = false);
    }
  }

  Future<void> _delete(Reclamation r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer ?'),
        content: const Text('Cette action est définitive.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(studentRepositoryProvider).deleteReclamation(r.id);
      invalidateStudentData(ref);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final recAsync = ref.watch(reclamationsProvider);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Text(
          'Déposez une réclamation ou consultez l\'historique.',
          style: TextStyle(fontSize: 14, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500, height: 1.4),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: _cardMuted,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _editing == null ? 'Nouvelle réclamation' : 'Modifier la réclamation',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: SehilyColors.petrol),
              ),
              if (_editing == null) ...[
                const SizedBox(height: 10),
                Text(
                  'Décrivez votre problème en détail',
                  style: TextStyle(
                    fontSize: 13,
                    color: SehilyColors.textSecondary,
                    height: 1.45,
                  ),
                ),
              ],
              const SizedBox(height: 22),
              const _FieldLabel('OBJET *'),
              TextField(
                controller: _objetCtrl,
                decoration: _fieldDeco(hintText: 'Ex: Problème de paiement'),
              ),
              const SizedBox(height: 22),
              const _FieldLabel('DESCRIPTION *'),
              TextField(
                controller: _descCtrl,
                maxLines: 4,
                decoration: _fieldDeco(hintText: 'Expliquez votre situation en détail.......'),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  if (_editing != null)
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () {
                              setState(() {
                                _editing = null;
                                _objetCtrl.clear();
                                _descCtrl.clear();
                              });
                            },
                      child: const Text('Annuler'),
                    ),
                  const Spacer(),
                  FilledButton(
                    onPressed: _busy ? null : _send,
                    style: FilledButton.styleFrom(
                      backgroundColor: SehilyColors.coral,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                    child: _busy
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(_editing == null ? 'Envoyer' : 'Enregistrer'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        AsyncSection(
          value: recAsync,
          onRetry: () => ref.invalidate(reclamationsProvider),
          builder: (rows) {
            if (rows.isEmpty) {
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      SehilyColors.cream,
                      SehilyColors.coralBg,
                      SehilyColors.pendingBg.withValues(alpha: 0.35),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: SehilyColors.coral.withValues(alpha: 0.15)),
                ),
                child: Column(
                  children: [
                    const Text(
                      'Aucune réclamation pour le moment',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: SehilyColors.petrol,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Utilisez le formulaire ci-dessus pour nous signaler un problème. Notre équipe vous répondra dans les meilleurs délais.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: SehilyColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              );
            }
            return Column(
              children: rows
                  .map(
                    (r) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _ReclamationCard(
                        reclamation: r,
                        onEdit: canEditReclamation(r.statut)
                            ? () {
                                setState(() {
                                  _editing = r;
                                  _objetCtrl.text = r.objet;
                                  _descCtrl.text = r.description;
                                });
                              }
                            : null,
                        onDelete: canDeleteReclamation(r.statut) ? () => _delete(r) : null,
                      ),
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _ReclamationCard extends StatelessWidget {
  const _ReclamationCard({
    required this.reclamation,
    this.onEdit,
    this.onDelete,
  });

  final Reclamation reclamation;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(reclamation.dateCreation);
    final dateStr = date != null
        ? DateFormat('dd/MM/yyyy').format(date.toLocal())
        : reclamation.dateCreation;
    final refLabel = 'REC-${date?.year ?? DateTime.now().year}-${reclamation.id.toString().padLeft(3, '0')}';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      refLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: SehilyColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      reclamation.objet,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: SehilyColors.petrol,
                      ),
                    ),
                  ],
                ),
              ),
              StatusBadge(status: reclamation.statut),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            reclamation.description,
            style: TextStyle(
              fontSize: 13,
              color: SehilyColors.textSecondary,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Icon(Icons.calendar_today_outlined, size: 13, color: SehilyColors.textMuted),
              const SizedBox(width: 4),
              Text(dateStr, style: TextStyle(fontSize: 12, color: SehilyColors.textMuted, fontWeight: FontWeight.w500)),
              const Spacer(),
              if (onEdit != null)
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  color: SehilyColors.green,
                  onPressed: onEdit,
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              if (onDelete != null)
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20, color: SehilyColors.coral),
                  onPressed: onDelete,
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
