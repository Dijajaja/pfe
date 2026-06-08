import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_service.dart';
import '../data/student_repository.dart';
import '../domain/student_models.dart';

final dossiersProvider = FutureProvider.autoDispose<List<DossierBourse>>((ref) async {
  return ref.watch(studentRepositoryProvider).listDossiers();
});

final anneesProvider = FutureProvider.autoDispose<List<AnneeUniversitaire>>((ref) async {
  return ref.watch(studentRepositoryProvider).listAnneesActives();
});

final paiementsProvider = FutureProvider.autoDispose<List<PaiementEtudiant>>((ref) async {
  return ref.watch(studentRepositoryProvider).listPaiements();
});

final reclamationsProvider = FutureProvider.autoDispose<List<Reclamation>>((ref) async {
  return ref.watch(studentRepositoryProvider).listReclamations();
});

final attestationProvider = FutureProvider.autoDispose<AttestationStatus>((ref) async {
  return ref.watch(studentRepositoryProvider).getAttestationStatus();
});

final suiviProvider = FutureProvider.autoDispose<List<SuiviEntry>>((ref) async {
  final repo = ref.watch(studentRepositoryProvider);
  final dossiers = await repo.listDossiers();
  final reclamations = await repo.listReclamations();
  return repo.buildSuiviHistory(dossiers: dossiers, reclamations: reclamations);
});

final profileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.watch(studentRepositoryProvider).getProfile();
});

final notificationsProvider = FutureProvider.autoDispose<List<StudentNotificationItem>>((ref) async {
  final repo = ref.watch(studentRepositoryProvider);
  final storage = ref.watch(localStorageServiceProvider);
  final dossiers = await repo.listDossiers();
  final paiements = await repo.listPaiements();
  final reclamations = await repo.listReclamations();
  final readIds = await storage.readNotificationReadIds();
  final built = repo.buildNotifications(
    dossiers: dossiers,
    paiements: paiements,
    reclamations: reclamations,
  );
  return built
      .map((n) => n.copyWith(lu: readIds.contains(n.id) || n.lu))
      .toList();
});

void invalidateStudentData(WidgetRef ref) {
  ref.invalidate(dossiersProvider);
  ref.invalidate(paiementsProvider);
  ref.invalidate(reclamationsProvider);
  ref.invalidate(attestationProvider);
  ref.invalidate(suiviProvider);
  ref.invalidate(notificationsProvider);
}
