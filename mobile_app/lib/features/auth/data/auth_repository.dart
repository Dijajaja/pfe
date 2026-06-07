import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../domain/auth_tokens.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(secureStorageServiceProvider),
  );
});

class AuthRepository {
  AuthRepository(this._dio, this._secureStorage);

  final Dio _dio;
  final SecureStorageService _secureStorage;

  Future<AuthTokens> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login/',
      data: {'email': email, 'password': password},
    );
    return _tokensFromJson(response.data ?? const {});
  }

  Future<AuthTokens> register({
    required String email,
    required String password,
    String? matricule,
    String? etablissement,
    String? filiere,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      '/auth/register/',
      data: {
        'email': email,
        'password': password,
        if (matricule != null) 'matricule': matricule,
        if (etablissement != null) 'etablissement': etablissement,
        if (filiere != null) 'filiere': filiere,
      },
    );
    // Option: auto-login right after register.
    return login(email: email, password: password);
  }

  Future<AuthTokens> refresh(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh/',
      data: {'refresh': refreshToken},
    );

    final body = response.data ?? const {};
    final access = (body['access'] ?? '').toString();
    if (access.isEmpty) {
      throw Exception('Refresh token invalide');
    }
    return AuthTokens(access: access, refresh: refreshToken);
  }

  Future<void> persistTokens(AuthTokens tokens) async {
    await _secureStorage.saveTokens(
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
    );
  }

  Future<void> logout() => _secureStorage.clearSession();

  Future<bool> hasValidSession() async {
    final access = await _secureStorage.readAccessToken();
    if (access == null || access.isEmpty) return false;
    return !_isExpired(access);
  }

  Future<bool> tryRefreshSession() async {
    final refreshToken = await _secureStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final tokens = await refresh(refreshToken);
      await persistTokens(tokens);
      return true;
    } catch (_) {
      await _secureStorage.clearSession();
      return false;
    }
  }

  AuthTokens _tokensFromJson(Map<String, dynamic> json) {
    final access = (json['access'] ?? '').toString();
    final refresh = (json['refresh'] ?? '').toString();
    if (access.isEmpty || refresh.isEmpty) {
      throw Exception('Réponse auth invalide');
    }
    return AuthTokens(access: access, refresh: refresh);
  }

  bool _isExpired(String token) {
    try {
      return JwtDecoder.isExpired(token);
    } catch (_) {
      return true;
    }
  }
}

