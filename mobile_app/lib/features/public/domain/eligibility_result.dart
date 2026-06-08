class EligibilityResult {
  const EligibilityResult({
    required this.ok,
    this.code,
    this.i18nKey,
    this.i18nParams,
  });

  final bool ok;
  final String? code;
  final String? i18nKey;
  final Map<String, dynamic>? i18nParams;

  factory EligibilityResult.fromJson(Map<String, dynamic> json) {
    return EligibilityResult(
      ok: json['ok'] == true || json['eligible'] == true,
      code: json['code']?.toString(),
      i18nKey: json['i18nKey']?.toString(),
      i18nParams: json['i18nParams'] is Map
          ? Map<String, dynamic>.from(json['i18nParams'] as Map)
          : null,
    );
  }
}
