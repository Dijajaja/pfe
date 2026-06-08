import 'package:flutter/material.dart';

const attestationAmount = 50.0;
const sehilyMerchantCode = '006140';

class AttestationPaymentMethod {
  const AttestationPaymentMethod({required this.id, required this.label, required this.color});

  final String id;
  final String label;
  final Color color;
}

const attestationPaymentMethods = [
  AttestationPaymentMethod(id: 'BANKILY', label: 'Bankily', color: Color(0xFF00BCD4)),
  AttestationPaymentMethod(id: 'MASRVI', label: 'Masrvi', color: Color(0xFF2E7D72)),
  AttestationPaymentMethod(id: 'SEDAD', label: 'Sedad', color: Color(0xFFC9614A)),
];
