import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_service.dart';
import '../domain/eligibility_result.dart';

class EligibilityGateState {
  const EligibilityGateState({
    this.loaded = false,
    this.verified = false,
    this.lastResult,
  });

  final bool loaded;
  final bool verified;
  final EligibilityResult? lastResult;

  EligibilityGateState copyWith({
    bool? loaded,
    bool? verified,
    EligibilityResult? lastResult,
    bool clearResult = false,
  }) {
    return EligibilityGateState(
      loaded: loaded ?? this.loaded,
      verified: verified ?? this.verified,
      lastResult: clearResult ? null : (lastResult ?? this.lastResult),
    );
  }
}

final eligibilityGateProvider =
    StateNotifierProvider<EligibilityGateNotifier, EligibilityGateState>((ref) {
  return EligibilityGateNotifier(ref)..load();
});

class EligibilityGateNotifier extends StateNotifier<EligibilityGateState> {
  EligibilityGateNotifier(this._ref) : super(const EligibilityGateState());

  final Ref _ref;

  Future<void> load() async {
    final storage = _ref.read(localStorageServiceProvider);
    final verified = await storage.isEligibilityVerified();
    state = state.copyWith(loaded: true, verified: verified);
  }

  Future<void> markVerified(EligibilityResult result) async {
    await _ref.read(localStorageServiceProvider).setEligibilityVerified(true);
    state = state.copyWith(verified: true, lastResult: result);
  }

  Future<void> clear() async {
    await _ref.read(localStorageServiceProvider).clearEligibilityVerified();
    state = state.copyWith(verified: false, clearResult: true);
  }
}
