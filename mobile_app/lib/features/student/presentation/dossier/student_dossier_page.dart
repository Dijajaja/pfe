import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_errors.dart';
import '../../application/student_providers.dart';
import '../../data/student_repository.dart';
import '../../domain/dossier_validation.dart';
import '../../domain/student_models.dart';
import '../widgets/student_widgets.dart';

const _pieceTypes = {
  'CNI': 'CNI (carte d\'identité / scan)',
  'BAC': 'Baccalauréat',
  'INSCRIPTION': 'Attestation d\'inscription',
  'RELEVE': 'Relevé',
};

class StudentDossierPage extends ConsumerStatefulWidget {
  const StudentDossierPage({super.key});

  @override
  ConsumerState<StudentDossierPage> createState() => _StudentDossierPageState();
}

class _StudentDossierPageState extends ConsumerState<StudentDossierPage> {
  final _cniCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _niveau = 'L1';
  String _typePiece = 'CNI';
  final List<PlatformFile> _pendingFiles = [];
  bool _submitting = false;
  String? _feedback;

  @override
  void dispose() {
    _cniCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _loadFromDossier(DossierBourse? dossier) {
    if (dossier == null) return;
    if (_cniCtrl.text.isEmpty) _cniCtrl.text = dossier.numeroCni;
    if (_phoneCtrl.text.isEmpty) _phoneCtrl.text = dossier.telephone;
    _niveau = dossier.niveau;
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
      allowMultiple: true,
    );
    if (result != null) {
      setState(() => _pendingFiles.addAll(result.files));
    }
  }

  Future<void> _submit(DossierBourse? existing, int? anneeId) async {
    final check = validateDossierSubmission(
      numeroCni: _cniCtrl.text,
      telephone: _phoneCtrl.text,
      niveau: _niveau,
      anneeUniversitaireId: anneeId ?? existing?.anneeUniversitaire,
      existingDocumentsCount: existing?.documents.length ?? 0,
      pendingFilesCount: _pendingFiles.length,
    );
    if (!check.ok) {
      setState(() => _feedback = 'Complétez : ${check.missing.join(', ')}.');
      return;
    }

    setState(() {
      _submitting = true;
      _feedback = null;
    });
    final repo = ref.read(studentRepositoryProvider);
    try {
      final fields = {
        if (anneeId != null) 'annee_universitaire': anneeId,
        'numero_cni': _cniCtrl.text.trim(),
        'telephone': _phoneCtrl.text.trim(),
        'niveau': _niveau,
      };
      DossierBourse target;
      if (existing != null) {
        target = await repo.updateDossier(existing.id, fields);
      } else {
        target = await repo.createDossier(fields);
      }
      for (final f in _pendingFiles) {
        if (f.path == null) continue;
        await repo.uploadDocument(
          dossierId: target.id,
          typePiece: _typePiece,
          filePath: f.path!,
          fileName: f.name,
        );
      }
      await repo.updateDossier(target.id, {'statut': 'SOUMIS'});
      invalidateStudentData(ref);
      setState(() {
        _pendingFiles.clear();
        _feedback = 'Dossier soumis avec succès.';
      });
    } catch (e) {
      setState(() => _feedback = apiErrorMessage(e, 'Erreur lors de la soumission.'));
    } finally {
      setState(() => _submitting = false);
    }
  }

  String _headerEmail(DossierBourse? dossier) {
    final fromDossier = dossier?.etudiantEmail?.trim();
    if (fromDossier != null && fromDossier.isNotEmpty) return fromDossier;
    final profile = ref.watch(profileProvider).valueOrNull;
    final email = profile?['email']?.toString().trim();
    return (email != null && email.isNotEmpty) ? email : '—';
  }

  @override
  Widget build(BuildContext context) {
    final dossiersAsync = ref.watch(dossiersProvider);
    final anneesAsync = ref.watch(anneesProvider);

    return AsyncSection(
      value: dossiersAsync,
      onRetry: () => ref.invalidate(dossiersProvider),
      builder: (dossiers) {
        final dossier = dossiers.isNotEmpty ? dossiers.first : null;
        _loadFromDossier(dossier);
        final editable = dossier == null || canSubmitDossierStatut(dossier.statut);
        final anneeId = dossier?.anneeUniversitaire ??
            anneesAsync.maybeWhen(data: (a) => a.isNotEmpty ? a.first.id : null, orElse: () => null);
        final check = validateDossierSubmission(
          numeroCni: _cniCtrl.text,
          telephone: _phoneCtrl.text,
          niveau: _niveau,
          anneeUniversitaireId: anneeId,
          existingDocumentsCount: dossier?.documents.length ?? 0,
          pendingFilesCount: _pendingFiles.length,
        );
        final totalFiles = (dossier?.documents.length ?? 0) + _pendingFiles.length;
        final headerEmail = _headerEmail(dossier);

        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Renseignez tous les champs obligatoires et déposez au moins une pièce justificative pour pouvoir soumettre.',
              style: TextStyle(color: SehilyColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: SehilyColors.green.withValues(alpha: 0.18)),
                boxShadow: [
                  BoxShadow(
                    color: SehilyColors.petrol.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
                    color: SehilyColors.petrol,
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.folder_outlined, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'Dossier étudiant',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 17),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Flexible(
                          child: Align(
                            alignment: Alignment.centerRight,
                            child: Container(
                              margin: const EdgeInsets.only(right: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                              ),
                              child: Text(
                                headerEmail,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontSize: 11),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const _SectionTitle('Informations personnelles'),
                        const SizedBox(height: 12),
                        _InfoField(
                          icon: Icons.badge_outlined,
                          label: 'CNI *',
                          child: TextField(
                            controller: _cniCtrl,
                            enabled: editable,
                            decoration: const InputDecoration(
                              hintText: 'Numéro de la carte d\'identité',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _InfoField(
                          icon: Icons.phone_outlined,
                          label: 'Numéro de téléphone *',
                          child: TextField(
                            controller: _phoneCtrl,
                            enabled: editable,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              hintText: 'Ex. 45 XX XX XX',
                              isDense: true,
                              border: OutlineInputBorder(),
                            ),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(height: 12),
                        _InfoField(
                          icon: Icons.school_outlined,
                          label: 'Niveau d\'étude *',
                          child: DropdownButtonFormField<String>(
                            value: _niveau,
                            decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                            items: const [
                              DropdownMenuItem(value: 'L1', child: Text('L1')),
                              DropdownMenuItem(value: 'L2', child: Text('L2')),
                              DropdownMenuItem(value: 'L3', child: Text('L3')),
                            ],
                            onChanged: editable ? (v) => setState(() => _niveau = v ?? 'L1') : null,
                          ),
                        ),
                        const SizedBox(height: 20),
                        const _SectionTitle('Pièce justificative *'),
                        const SizedBox(height: 8),
                        Text('Type de document', style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          value: _typePiece,
                          decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                          items: _pieceTypes.entries
                              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                              .toList(),
                          onChanged: editable ? (v) => setState(() => _typePiece = v ?? 'CNI') : null,
                        ),
                        const SizedBox(height: 12),
                        Opacity(
                          opacity: editable ? 1 : 0.55,
                          child: IgnorePointer(
                            ignoring: !editable,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.black26, width: 1.2, strokeAlign: BorderSide.strokeAlignInside),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.upload_outlined, size: 28, color: SehilyColors.textSecondary),
                                  const SizedBox(height: 8),
                                  const Text('Déposer le fichier', style: TextStyle(fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 4),
                                  Text('Glissez-déposez ici', style: TextStyle(fontSize: 13, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500)),
                                  const SizedBox(height: 2),
                                  Text('PDF / JPG / PNG — max 5 MB', style: TextStyle(fontSize: 12, color: SehilyColors.textMuted, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Opacity(
                          opacity: editable ? 1 : 0.55,
                          child: IgnorePointer(
                            ignoring: !editable,
                            child: OutlinedButton(
                              onPressed: _pickFiles,
                              child: const Text('Choisir des fichiers'),
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          totalFiles == 0
                              ? 'Aucun fichier sélectionné'
                              : '$totalFiles fichier${totalFiles > 1 ? 's' : ''} au total',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                        ),
                        if (dossier != null && dossier.documents.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          ...dossier.documents.map(
                            (d) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '${d.nomFichier ?? d.typePiece} (${d.typePiece} — déjà déposé)',
                                style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ),
                        ],
                        if (_pendingFiles.isNotEmpty)
                          ..._pendingFiles.map(
                            (f) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '${f.name} (en attente)',
                                style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ),
                        if (!check.ok && editable)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              'Champs manquants : ${check.missing.join(', ')}.',
                              style: const TextStyle(color: SehilyColors.coral, fontSize: 13),
                            ),
                          ),
                        if (_feedback != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(_feedback!, style: const TextStyle(color: SehilyColors.petrol)),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.black.withValues(alpha: 0.06))),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text.rich(
                          TextSpan(
                            style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, fontWeight: FontWeight.w500),
                            children: const [
                              TextSpan(text: 'Formats acceptés : '),
                              TextSpan(text: 'PDF, JPG, PNG', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: editable && check.ok && !_submitting
                              ? () => _submit(dossier, anneeId)
                              : null,
                          style: FilledButton.styleFrom(
                            backgroundColor: SehilyColors.coral,
                            disabledBackgroundColor: Colors.grey.shade300,
                          ),
                          child: _submitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('Soumettre'),
                                    SizedBox(width: 8),
                                    Icon(Icons.arrow_forward, size: 18),
                                  ],
                                ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (!editable) ...[
              const SizedBox(height: 16),
              SehilyAlertBanner(
                headline: 'Ce dossier a déjà été soumis —',
                subline: 'statut ${dossier!.statut} : les modifications ne sont plus possibles depuis cette page.',
              ),
            ],
          ],
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.6,
        color: SehilyColors.textSecondary,
      ),
    );
  }
}

class _InfoField extends StatelessWidget {
  const _InfoField({required this.icon, required this.label, required this.child});

  final IconData icon;
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: SehilyColors.cream,
            shape: BoxShape.circle,
            border: Border.all(color: SehilyColors.green.withValues(alpha: 0.15)),
          ),
          child: Icon(icon, size: 18, color: SehilyColors.petrol),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                label.toUpperCase(),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: SehilyColors.textSecondary),
              ),
              const SizedBox(height: 6),
              child,
            ],
          ),
        ),
      ],
    );
  }
}
