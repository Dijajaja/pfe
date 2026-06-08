import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

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
  });

  final String? nomComplet;
  final String? nni;
  final String? etablissement;
  final String? filiere;
  final String? niveau;
  final String? anneeUniversitaire;
  final double? montantBourse;
  final String? reference;
}

Future<void> generateAndShareAttestationPdf(AttestationPdfData data) async {
  final doc = pw.Document();
  const petrol = PdfColor.fromInt(0xFF1B4D4A);
  const green = PdfColor.fromInt(0xFF2E7D72);
  const coral = PdfColor.fromInt(0xFFC9614A);
  const cream = PdfColor.fromInt(0xFFFAF7F2);

  final ref = data.reference?.trim().isNotEmpty == true ? data.reference! : 'ATT-${DateTime.now().millisecondsSinceEpoch}';
  final emission = DateFormat('dd MMMM yyyy', 'fr_FR').format(DateTime.now());

  doc.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(0),
      build: (context) {
        return pw.Container(
          color: cream,
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              pw.Container(
                color: petrol,
                padding: const pw.EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('SEHILY', style: pw.TextStyle(color: PdfColors.white, fontSize: 22, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Bourses universitaires, simplifiées',
                        style: const pw.TextStyle(color: PdfColors.white, fontSize: 9)),
                  ],
                ),
              ),
              pw.Padding(
                padding: const pw.EdgeInsets.all(24),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Center(
                      child: pw.Text('ATTESTATION DE BOURSE',
                          style: pw.TextStyle(color: petrol, fontSize: 18, fontWeight: pw.FontWeight.bold)),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Divider(color: green, thickness: 1),
                    pw.SizedBox(height: 16),
                    ...[
                      ['Nom complet', _safe(data.nomComplet)],
                      ['Numéro NNI', _safe(data.nni)],
                      ['Établissement', _safe(data.etablissement)],
                      ['Filière', _safe(data.filiere)],
                      ['Niveau académique', _safe(data.niveau)],
                      ['Année universitaire', _safe(data.anneeUniversitaire)],
                      ['Montant mensuel de la bourse', '${(data.montantBourse ?? 0).round()} MRU'],
                    ].map(
                      (row) => pw.Padding(
                        padding: const pw.EdgeInsets.only(bottom: 12),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Text(row[0], style: pw.TextStyle(color: green, fontSize: 9, fontWeight: pw.FontWeight.bold)),
                            pw.Text(row[1], style: pw.TextStyle(color: petrol, fontSize: 11)),
                          ],
                        ),
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text('Date d\'émission', style: pw.TextStyle(color: green, fontSize: 9, fontWeight: pw.FontWeight.bold)),
                    pw.Text(emission, style: pw.TextStyle(color: petrol, fontSize: 11)),
                    pw.SizedBox(height: 12),
                    pw.Text('Référence', style: pw.TextStyle(color: green, fontSize: 9, fontWeight: pw.FontWeight.bold)),
                    pw.Text(ref, style: pw.TextStyle(color: petrol, fontSize: 10)),
                    pw.SizedBox(height: 20),
                    pw.Divider(color: coral),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'Centre National des Œuvres Universitaires (CNOU) — Nouakchott, République Islamique de Mauritanie. '
                      'Document généré électroniquement par la plateforme Sehily. Toute falsification est passible de sanctions.',
                      style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    ),
  );

  await Printing.layoutPdf(onLayout: (_) async => doc.save());
}

String _safe(String? value) {
  if (value == null || value.trim().isEmpty) return '—';
  return value.trim();
}
