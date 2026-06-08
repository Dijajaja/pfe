import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../domain/student_models.dart';

final studentRepositoryProvider = Provider<StudentRepository>((ref) {
  return StudentRepository(ref.watch(dioProvider));
});

class StudentRepository {
  StudentRepository(this._dio);

  final Dio _dio;

  List<T> _parseList<T>(dynamic data, T Function(Map<String, dynamic>) fromJson) {
    if (data is List) {
      return data.map((e) => fromJson(e as Map<String, dynamic>)).toList();
    }
    if (data is Map<String, dynamic> && data['results'] is List) {
      return (data['results'] as List)
          .map((e) => fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<AnneeUniversitaire>> listAnneesActives() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.anneesUniversitaires);
    return _parseList(response.data, AnneeUniversitaire.fromJson)
        .where((a) => a.actif)
        .toList();
  }

  Future<List<DossierBourse>> listDossiers() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.demande);
    return _parseList(response.data, DossierBourse.fromJson);
  }

  Future<DossierBourse> createDossier(Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>(ApiEndpoints.demande, data: payload);
    return DossierBourse.fromJson(response.data ?? const {});
  }

  Future<DossierBourse> updateDossier(int id, Map<String, dynamic> payload) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      ApiEndpoints.demandeDetail(id),
      data: payload,
    );
    return DossierBourse.fromJson(response.data ?? const {});
  }

  Future<void> uploadDocument({
    required int dossierId,
    required String typePiece,
    required String filePath,
    required String fileName,
  }) async {
    final form = FormData.fromMap({
      'dossier': dossierId,
      'type_piece': typePiece,
      'fichier': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    await _dio.post(ApiEndpoints.documentsUpload, data: form);
  }

  Future<List<PaiementEtudiant>> listPaiements() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.etudiantPaiements);
    return _parseList(response.data, PaiementEtudiant.fromJson);
  }

  Future<List<Reclamation>> listReclamations() async {
    final response = await _dio.get<dynamic>(ApiEndpoints.etudiantReclamations);
    return _parseList(response.data, Reclamation.fromJson);
  }

  Future<Reclamation> createReclamation({required String objet, required String description}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.etudiantReclamations,
      data: {'objet': objet, 'description': description},
    );
    return Reclamation.fromJson(response.data ?? const {});
  }

  Future<Reclamation> updateReclamation(int id, {required String objet, required String description}) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      ApiEndpoints.etudiantReclamationDetail(id),
      data: {'objet': objet, 'description': description},
    );
    return Reclamation.fromJson(response.data ?? const {});
  }

  Future<void> deleteReclamation(int id) async {
    await _dio.delete(ApiEndpoints.etudiantReclamationDetail(id));
  }

  Future<AttestationStatus> getAttestationStatus() async {
    final response = await _dio.get<Map<String, dynamic>>(ApiEndpoints.etudiantAttestation);
    return AttestationStatus.fromJson(response.data ?? const {});
  }

  Future<AttestationStatus> confirmAttestationPayment({
    required String methode,
    required String telephone,
    required String codeTransaction,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.etudiantAttestationPaiement,
      data: {
        'methode': methode,
        'telephone': telephone,
        'code_transaction': codeTransaction,
      },
    );
    return AttestationStatus.fromJson(response.data ?? const {});
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _dio.get<Map<String, dynamic>>(ApiEndpoints.authMe);
    return response.data ?? const {};
  }

  List<SuiviEntry> buildSuiviHistory({
    required List<DossierBourse> dossiers,
    required List<Reclamation> reclamations,
  }) {
    final rows = <SuiviEntry>[];
    for (final d in dossiers) {
      rows.add(
        SuiviEntry(
          id: 'd-${d.id}',
          date: d.modifieLe ?? d.creeLe,
          statut: d.statut,
          auteur: 'Admin',
          commentaire: d.commentaireAdmin?.trim().isNotEmpty == true
              ? d.commentaireAdmin!
              : 'Mise à jour dossier',
        ),
      );
    }
    for (final r in reclamations) {
      rows.add(
        SuiviEntry(
          id: 'r-${r.id}',
          date: r.dateMaj ?? r.dateCreation,
          statut: 'RECLAMATION:${r.statut}',
          auteur: 'Support',
          commentaire: r.objet,
        ),
      );
    }
    rows.sort((a, b) {
      final da = DateTime.tryParse(a.date ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      final db = DateTime.tryParse(b.date ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      return db.compareTo(da);
    });
    return rows;
  }

  List<StudentNotificationItem> buildNotifications({
    required List<DossierBourse> dossiers,
    required List<PaiementEtudiant> paiements,
    required List<Reclamation> reclamations,
  }) {
    final items = <StudentNotificationItem>[];
    for (final d in dossiers) {
      items.add(
        StudentNotificationItem(
          id: 'd-${d.id}',
          titre: 'Mise à jour dossier',
          message: 'Votre dossier est au statut ${d.statut}.',
          date: d.modifieLe ?? d.creeLe,
        ),
      );
    }
    for (final p in paiements) {
      items.add(
        StudentNotificationItem(
          id: 'p-${p.id}',
          titre: 'Mise à jour paiement',
          message: 'Paiement #${p.id} — statut : ${p.statut}.',
          date: p.dateOperation,
          lu: p.statut.toUpperCase() == 'EFFECTUE',
        ),
      );
    }
    for (final r in reclamations.where((r) => r.statut != 'TRAITEE')) {
      items.add(
        StudentNotificationItem(
          id: 'rec-${r.id}',
          titre: 'Réclamation',
          message: '${r.objet} (${r.statut})',
          date: r.dateMaj ?? r.dateCreation,
        ),
      );
    }
    items.sort((a, b) {
      final da = DateTime.tryParse(a.date ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      final db = DateTime.tryParse(b.date ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);
      return db.compareTo(da);
    });
    return items.take(30).toList();
  }
}
