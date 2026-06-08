import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/network/api_errors.dart';
import '../../application/student_providers.dart';
import '../../data/student_repository.dart';
import '../../domain/dossier_validation.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

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
      padding: const EdgeInsets.all(16),
      children: [
        Text('Réclamations', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        SehilyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_editing == null ? 'Nouvelle réclamation' : 'Modifier la réclamation',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(controller: _objetCtrl, decoration: const InputDecoration(labelText: 'Objet *')),
              const SizedBox(height: 8),
              TextField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'Description *'),
              ),
              const SizedBox(height: 12),
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
                    child: Text(_editing == null ? 'Envoyer' : 'Enregistrer'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AsyncSection(
          value: recAsync,
          onRetry: () => ref.invalidate(reclamationsProvider),
          builder: (rows) {
            if (rows.isEmpty) return const SehilyCard(child: Text('Aucune réclamation.'));
            return Column(
              children: rows
                  .map(
                    (r) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: SehilyCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(child: Text(r.objet, style: const TextStyle(fontWeight: FontWeight.bold))),
                                StatusBadge(status: r.statut),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(r.description),
                            Text(DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(r.dateCreation).toLocal()),
                                style: const TextStyle(fontSize: 12, color: Colors.black54)),
                            if (canEditReclamation(r.statut) || canDeleteReclamation(r.statut))
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (canEditReclamation(r.statut))
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined),
                                      onPressed: () {
                                        setState(() {
                                          _editing = r;
                                          _objetCtrl.text = r.objet;
                                          _descCtrl.text = r.description;
                                        });
                                      },
                                    ),
                                  if (canDeleteReclamation(r.statut))
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, color: Color(0xFFC9614A)),
                                      onPressed: () => _delete(r),
                                    ),
                                ],
                              ),
                          ],
                        ),
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
