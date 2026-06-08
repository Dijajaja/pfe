import 'dart:async';

import 'package:dio/dio.dart';

import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';

typedef SessionExpiredCallback = void Function();

/// Ajoute le Bearer token et tente un refresh automatique sur 401.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required SecureStorageService secureStorage,
    required Dio dio,
    required SessionExpiredCallback onSessionExpired,
  })  : _secureStorage = secureStorage,
        _dio = dio,
        _onSessionExpired = onSessionExpired;

  final SecureStorageService _secureStorage;
  final Dio _dio;
  final SessionExpiredCallback _onSessionExpired;

  Completer<bool>? _refreshCompleter;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.extra['skipAuth'] == true) {
      handler.next(options);
      return;
    }

    final access = await _secureStorage.readAccessToken();
    if (access != null && access.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $access';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final status = err.response?.statusCode;
    final path = err.requestOptions.path;
    final isRefreshCall = path.contains(ApiEndpoints.authRefresh);
    final isLoginCall = path.contains(ApiEndpoints.authLogin);

    if (status != 401 || isRefreshCall || isLoginCall || err.requestOptions.extra['retried'] == true) {
      handler.next(err);
      return;
    }

    final refreshed = await _refreshAccessToken();
    if (!refreshed) {
      await _secureStorage.clearSession();
      _onSessionExpired();
      handler.next(err);
      return;
    }

    try {
      final access = await _secureStorage.readAccessToken();
      final retryOptions = err.requestOptions;
      retryOptions.headers['Authorization'] = 'Bearer $access';
      retryOptions.extra['retried'] = true;
      final response = await _dio.fetch<dynamic>(retryOptions);
      handler.resolve(response);
    } catch (e) {
      if (e is DioException) {
        handler.next(e);
      } else {
        handler.next(err);
      }
    }
  }

  Future<bool> _refreshAccessToken() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    _refreshCompleter = Completer<bool>();
    try {
      final refreshToken = await _secureStorage.readRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        _refreshCompleter!.complete(false);
        return false;
      }

      final response = await _dio.post<Map<String, dynamic>>(
        ApiEndpoints.authRefresh,
        data: {'refresh': refreshToken},
        options: Options(extra: const {'skipAuth': true}),
      );

      final body = response.data ?? const {};
      final access = (body['access'] ?? '').toString();
      final refresh = (body['refresh'] ?? refreshToken).toString();
      if (access.isEmpty) {
        _refreshCompleter!.complete(false);
        return false;
      }

      await _secureStorage.saveTokens(accessToken: access, refreshToken: refresh);
      _refreshCompleter!.complete(true);
      return true;
    } catch (_) {
      _refreshCompleter!.complete(false);
      return false;
    } finally {
      _refreshCompleter = null;
    }
  }
}
