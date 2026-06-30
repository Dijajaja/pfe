import 'dart:typed_data';

import 'package:flutter/services.dart' show rootBundle;
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import 'attestation_format.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const _darkGreen  = PdfColor.fromInt(0xFF1B4D3E);
const _teal       = PdfColor.fromInt(0xFF2E7D6B);
const _bgGrey     = PdfColor.fromInt(0xFFF4F7F6);
const _border     = PdfColor.fromInt(0xFFD1DDD9);
const _textDark   = PdfColor.fromInt(0xFF1A2E28);
const _textMid    = PdfColor.fromInt(0xFF5A7A70);
const _lightGreen = PdfColor.fromInt(0xFF90C4B8);
const _white      = PdfColor.fromInt(0xFFFFFFFF);
const _bodyText   = PdfColor.fromInt(0xFF444444);

// ── Data class ────────────────────────────────────────────────────────────────
class AttestationPdfData {
  const AttestationPdfData({
    this.nomComplet,
    this.nni,
    this.etablissement,
    this.filiere,
    this.niveau,
    this.anneeUniversitaire,
    this.montantBourse,
    this.reference,
    this.dateEmission,
  });

  final String? nomComplet;
  final String? nni;
  final String? etablissement;
  final String? filiere;
  final String? niveau;
  final String? anneeUniversitaire;
  final double? montantBourse;
  final String? reference;
  final String? dateEmission;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
Future<Uint8List?> _loadAsset(String path) async {
  try {
    final d = await rootBundle.load(path);
    return d.buffer.asUint8List();
  } catch (_) {
    return null;
  }
}

String _safe(String? v) =>
    (v == null || v.trim().isEmpty) ? '\u2014' : v.trim();

String _formatDate(String? iso) {
  if (iso != null && iso.trim().isNotEmpty) {
    final dt = DateTime.tryParse(iso);
    if (dt != null) {
      return DateFormat('dd MMMM yyyy', 'fr_FR').format(dt.toLocal());
    }
  }
  return DateFormat('dd MMMM yyyy', 'fr_FR').format(DateTime.now());
}

String _formatMontant(double? amount) {
  final n = (amount ?? 0).round();
  final s = n.toString();
  final buf = StringBuffer();
  for (int i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
    buf.write(s[i]);
  }
  return '$buf MRU';
}

// ── Widgets PDF ───────────────────────────────────────────────────────────────

pw.Widget _labelValue(pw.Font boldFont, String label, String value) {
  return pw.Column(
    crossAxisAlignment: pw.CrossAxisAlignment.start,
    children: [
      pw.Text(
        label.toUpperCase(),
        style: pw.TextStyle(color: _textMid, fontSize: 7),
      ),
      pw.SizedBox(height: 3),
      pw.Text(
        value,
        style: pw.TextStyle(
          font: boldFont,
          color: _textDark,
          fontSize: 10,
        ),
      ),
    ],
  );
}

pw.Widget _studentGrid(pw.Font boldFont, {
  required String nom,
  required String nni,
  required String filiere,
  required String etablissement,
  required String niveau,
  required String annee,
}) {
  final divH = pw.Container(height: 0.4, color: _border);

  pw.Widget row(String l1, String v1, String l2, String v2) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Expanded(child: _labelValue(boldFont, l1, v1)),
          pw.Container(width: 0.4, color: _border),
          pw.SizedBox(width: 10),
          pw.Expanded(child: _labelValue(boldFont, l2, v2)),
        ],
      ),
    );
  }

  return pw.Container(
    decoration: pw.BoxDecoration(
      color: _bgGrey,
      border: pw.Border.all(color: _border, width: 0.4),
      borderRadius: pw.BorderRadius.circular(6),
    ),
    child: pw.Column(
      children: [
        row('Nom complet', nom, '\u00c9tablissement', etablissement),
        divH,
        row('Num\u00e9ro NNI', nni, 'Niveau acad\u00e9mique', niveau),
        divH,
        row('Fili\u00e8re', filiere, 'Ann\u00e9e universitaire', annee),
      ],
    ),
  );
}

pw.Widget _montantBox(pw.Font boldFont, String montant) {
  return pw.Container(
    width: double.infinity,
    padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    decoration: pw.BoxDecoration(
      color: _darkGreen,
      borderRadius: pw.BorderRadius.circular(6),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          'MONTANT MENSUEL DE LA BOURSE',
          style: pw.TextStyle(color: _lightGreen, fontSize: 7.5),
        ),
        pw.SizedBox(height: 6),
        pw.Text(
          montant,
          style: pw.TextStyle(font: boldFont, color: _white, fontSize: 22),
        ),
      ],
    ),
  );
}

pw.Widget _metaBox(pw.Font boldFont, String label, String value) {
  return pw.Expanded(
    child: pw.Container(
      padding: const pw.EdgeInsets.all(10),
      decoration: pw.BoxDecoration(
        color: _bgGrey,
        border: pw.Border.all(color: _border, width: 0.4),
        borderRadius: pw.BorderRadius.circular(4),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            label.toUpperCase(),
            style: pw.TextStyle(color: _textMid, fontSize: 7),
          ),
          pw.SizedBox(height: 4),
          pw.Text(
            value,
            style: pw.TextStyle(font: boldFont, color: _textDark, fontSize: 10),
          ),
        ],
      ),
    ),
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
Future<void> generateAndShareAttestationPdf(AttestationPdfData data) async {
  await initializeDateFormatting('fr_FR');

  final logoBytes = await _loadAsset('assets/images/sehily-logo.png') ??
      await _loadAsset('assets/images/app_icon.png');

  final baseFont = await PdfGoogleFonts.notoSansRegular();
  final boldFont = await PdfGoogleFonts.notoSansBold();
  final theme = pw.ThemeData.withFont(base: baseFont, bold: boldFont);

  final ref = (data.reference?.trim().isNotEmpty == true)
      ? data.reference!.trim()
      : 'ATT-${DateTime.now().millisecondsSinceEpoch}';

  final montant  = _formatMontant(data.montantBourse);
  final emission = _formatDate(data.dateEmission);
  final etabAbbr = AttestationFormat.abbreviateEtablissement(data.etablissement);
  const hPad = 36.0;

  final doc = pw.Document();
  doc.addPage(
    pw.Page(
      pageTheme: pw.PageTheme(
        pageFormat: PdfPageFormat.a4,
        margin: pw.EdgeInsets.zero,
        theme: theme,
      ),
      build: (context) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // ── 1. EN-TÊTE (pleine largeur) ─────────────────────────────────
          pw.Container(
            width: double.infinity,
            color: _darkGreen,
            padding: const pw.EdgeInsets.symmetric(horizontal: 28, vertical: 12),
            child: pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                if (logoBytes != null)
                  pw.Image(pw.MemoryImage(logoBytes), width: 40, height: 40, fit: pw.BoxFit.contain)
                else
                  pw.SizedBox(width: 40, height: 40),
                pw.SizedBox(width: 14),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  children: [
                    pw.Text(
                      'SEHILY',
                      style: pw.TextStyle(font: boldFont, color: _white, fontSize: 18),
                    ),
                    pw.Text(
                      'Bourses universitaires, simplifi\u00e9es',
                      style: pw.TextStyle(color: _lightGreen, fontSize: 8),
                    ),
                  ],
                ),
              ],
            ),
          ),

          pw.SizedBox(height: 22),

          // ── Contenu avec padding horizontal ──────────────────────────────
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(horizontal: hPad),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.center,
              children: [
                // ── 2. TITRE ────────────────────────────────────────────
                pw.Text(
                  'ATTESTATION DE BOURSE',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(font: boldFont, color: _textDark, fontSize: 18),
                ),
                pw.SizedBox(height: 6),
                pw.Container(height: 0.8, color: _teal),
                pw.SizedBox(height: 6),
                pw.Text(
                  'Centre National des \u0152uvres Universitaires \u2014 CNOU',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(color: _textMid, fontSize: 8),
                ),
                pw.SizedBox(height: 10),
                pw.Text(
                  'Nous attestons que l\'\u00e9tudiant(e) ci-dessous b\u00e9n\u00e9ficie d\'une bourse universitaire',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(color: _bodyText, fontSize: 9.5),
                ),
                pw.SizedBox(height: 4),
                pw.Text(
                  'pour l\'ann\u00e9e acad\u00e9mique indiqu\u00e9e.',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(color: _bodyText, fontSize: 9.5),
                ),
                pw.SizedBox(height: 16),

                // ── 3. GRILLE ÉTUDIANT ───────────────────────────────────
                _studentGrid(
                  boldFont,
                  nom:           _safe(data.nomComplet),
                  nni:           _safe(data.nni),
                  filiere:       _safe(data.filiere),
                  etablissement: etabAbbr,
                  niveau:        _safe(data.niveau),
                  annee:         _safe(data.anneeUniversitaire),
                ),
                pw.SizedBox(height: 14),

                // ── 4. MONTANT ───────────────────────────────────────────
                _montantBox(boldFont, montant),
                pw.SizedBox(height: 14),

                // ── 5. DATE & RÉFÉRENCE ──────────────────────────────────
                pw.Row(
                  children: [
                    _metaBox(boldFont, 'Date d\'\u00e9mission', emission),
                    pw.SizedBox(width: 10),
                    _metaBox(boldFont, 'R\u00e9f\u00e9rence', ref),
                  ],
                ),
                pw.SizedBox(height: 24),

                // ── 6. PIED DE PAGE ──────────────────────────────────────
                pw.Container(height: 0.4, color: _border),
                pw.SizedBox(height: 8),
                pw.Text(
                  'Centre National des \u0152uvres Universitaires \u2014 Nouakchott, R\u00e9publique Islamique de Mauritanie',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(color: _textMid, fontSize: 8),
                ),
                pw.SizedBox(height: 4),
                pw.Text(
                  'Document g\u00e9n\u00e9r\u00e9 \u00e9lectroniquement par la plateforme Sehily.',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(color: _textMid, fontSize: 8),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );

  await Printing.layoutPdf(onLayout: (_) async => doc.save());
}
