import 'package:dio/dio.dart';

String apiErrorMessage(Object error, [String fallback = 'Une erreur est survenue.']) {
  if (error is DioException) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Serveur injoignable. Vérifiez : Django sur 0.0.0.0:8000, même Wi‑Fi, IP correcte (192.168.x.x).';
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'Impossible de joindre le serveur. Vérifiez le Wi‑Fi et l\'IP (API_BASE_URL).';
    }

    final status = error.response?.statusCode;
    if (status == 401) {
      return 'Session expirée. Reconnectez-vous.';
    }
    if (status == 403) {
      return 'Accès refusé.';
    }

    final data = error.response?.data;
    if (data is Map) {
      final detail = data['detail'];
      if (detail is String && detail.isNotEmpty) return detail;
      if (detail is List && detail.isNotEmpty) return detail.first.toString();
      for (final value in data.values) {
        if (value is List && value.isNotEmpty) return value.first.toString();
        if (value is String && value.isNotEmpty) return value;
      }
    }
    if (data is String && data.trim().isNotEmpty) return data;
    return error.message ?? fallback;
  }
  return error.toString();
}
