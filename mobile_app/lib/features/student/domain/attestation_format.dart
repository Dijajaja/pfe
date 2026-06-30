import '../../auth/data/mauritanie_universite.dart';

/// Utilitaires de formatage pour l'attestation PDF.
abstract final class AttestationFormat {
  static String abbreviateEtablissement(String? value) {
    return getEtablissementAbbreviation(value);
  }
}
