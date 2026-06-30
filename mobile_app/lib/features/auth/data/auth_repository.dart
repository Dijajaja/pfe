import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
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

  Future<void> requestPasswordReset(String email) async {
    await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.authPasswordReset,
      data: {'email': email.trim()},
    );
  }

  Future<Map<String, dynamic>> fetchMe() async {
    final response = await _dio.get<Map<String, dynamic>>(ApiEndpoints.authMe);
    return response.data ?? const {};
  }

  Future<AuthTokens> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.authLogin,
      data: {'email': email.trim(), 'password': password},
    );
    return _tokensFromJson(response.data ?? const {});
  }

  Future<AuthTokens> register({
    required String email,
    required String password,
    required String passwordConfirm,
    required String telephone,
    required String nni,
    required String matricule,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.authRegister,
      data: {
        'email': email.trim(),
        'password': password,
        'password_confirm': passwordConfirm,
        'telephone': telephone.trim(),
        'nni': nni.trim(),
        'matricule': matricule.trim(),
      },
    );
    return login(email: email.trim(), password: password);
  }

  Future<AuthTokens> refresh(String refreshToken) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.authRefresh,
      data: {'refresh': refreshToken},
    );

    final body = response.data ?? const {};
    final access = (body['access'] ?? '').toString();
    final refresh = (body['refresh'] ?? refreshToken).toString();
    if (access.isEmpty) {
      throw Exception('Refresh token invalide');
    }
    return AuthTokens(access: access, refresh: refresh);
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
