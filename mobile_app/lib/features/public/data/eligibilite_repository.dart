import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../domain/eligibility_result.dart';

final eligibiliteRepositoryProvider = Provider<EligibiliteRepository>((ref) {
  return EligibiliteRepository(ref.watch(dioProvider));
});

class EligibiliteRepository {
  EligibiliteRepository(this._dio);

  final Dio _dio;

  Future<EligibilityResult> evaluate({
    required String nni,
    required String matricule,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.publicEligibilite,
      data: {
        'nni': nni.trim(),
        'matricule': matricule.trim(),
      },
      options: Options(extra: const {'skipAuth': true}),
    );
    return EligibilityResult.fromJson(response.data ?? const {});
  }
}
