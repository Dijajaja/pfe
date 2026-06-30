import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../application/student_providers.dart';
import '../../domain/student_help_chatbot.dart';
import 'student_widgets.dart';

class _RootMenuIcon {
  const _RootMenuIcon({required this.icon, required this.bg, required this.fg});

  final IconData icon;
  final Color bg;
  final Color fg;
}

const _rootMenuIcons = <String, _RootMenuIcon>{
  'menu-dossier': _RootMenuIcon(
    icon: Icons.assignment_outlined,
    bg: Color(0xFFE8F5F0),
    fg: SehilyColors.petrol,
  ),
  'menu-eligibilite': _RootMenuIcon(
    icon: Icons.check_box_outlined,
    bg: Color(0xFFE8F8EE),
    fg: Color(0xFF15803D),
  ),
  'menu-attestation': _RootMenuIcon(
    icon: Icons.account_balance_wallet_outlined,
    bg: Color(0xFFFFF4DE),
    fg: Color(0xFFB45309),
  ),
  'menu-autre': _RootMenuIcon(
    icon: Icons.help_outline,
    bg: Color(0xFFFEECEC),
    fg: Color(0xFFB91C1C),
  ),
};

class StudentHelpChatbot extends ConsumerStatefulWidget {
  const StudentHelpChatbot({super.key});

  @override
  ConsumerState<StudentHelpChatbot> createState() => _StudentHelpChatbotState();
}

class _StudentHelpChatbotState extends ConsumerState<StudentHelpChatbot> {
  Future<void> _openSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: false,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.35),
      builder: (sheetContext) {
        return _ChatbotSheet(
          onClose: () => Navigator.of(sheetContext).pop(),
          onNavigate: (route) {
            Navigator.of(sheetContext).pop();
            context.go(route);
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 16,
      bottom: 16,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _openSheet,
          borderRadius: BorderRadius.circular(999),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: SehilyColors.coral,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: SehilyColors.coral.withValues(alpha: 0.35),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 26),
              ),
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  width: 11,
                  height: 11,
                  decoration: BoxDecoration(
                    color: SehilyColors.coral,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatbotSheet extends ConsumerStatefulWidget {
  const _ChatbotSheet({
    required this.onClose,
    required this.onNavigate,
  });

  final VoidCallback onClose;
  final ValueChanged<String> onNavigate;

  @override
  ConsumerState<_ChatbotSheet> createState() => _ChatbotSheetState();
}

class _ChatbotSheetState extends ConsumerState<_ChatbotSheet> {
  String _stepId = 'root';

  void _setStep(String id) => setState(() => _stepId = id);

  StudentHelpContext _buildContext() {
    final dossiers = ref.watch(dossiersProvider).valueOrNull ?? const [];
    final att = ref.watch(attestationProvider).valueOrNull;
    final profile = ref.watch(profileProvider).valueOrNull;
    final dossier = dossiers.isNotEmpty ? dossiers.first : null;
    final profil = profile?['profil_etudiant'];
    final wilaya = profil is Map ? profil['wilaya']?.toString() : null;
    final etablissement = profil is Map ? profil['etablissement']?.toString() : null;
    final filiere = profil is Map ? profil['filiere']?.toString() : null;

    return buildStudentHelpContext(
      dossierStatut: dossier?.statut ?? att?.statutDossier,
      statutPaiement: dossier?.statutPaiement ?? att?.statutPaiement,
      niveau: dossier?.niveau ?? att?.niveau,
      wilaya: wilaya,
      etablissement: etablissement,
      filiere: filiere,
      dossierValide: att?.dossierValide ?? dossier?.statut == 'VALIDE',
      virementConfirme: att?.virementConfirme ?? dossier?.statutPaiement == 'EFFECTUE',
      paiementAttestation: att?.paiementAttestation ?? false,
      montantAttestation: att?.montantAttestation ?? 50,
      hasDossier: dossier != null,
    );
  }

  String? _studentPrenom() {
    final profile = ref.watch(profileProvider).valueOrNull;
    final pe = profile?['profil_etudiant'];
    if (pe is Map && pe['prenom'] != null) {
      return pe['prenom'].toString();
    }
    return profile?['first_name']?.toString();
  }

  StudentHelpStep _displayStep(String stepId, StudentHelpContext ctx) {
    if (stepId == 'root' || stepId.startsWith('menu-')) {
      return chatbotMenus[stepId] ?? chatbotMenus['root']!;
    }
    return resolveChatbotStep(stepId, ctx);
  }

  Widget _messageText(String text, {required bool isRootView}) {
    final lines = text.split('\n');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < lines.length; i++)
          Padding(
            padding: EdgeInsets.only(bottom: i < lines.length - 1 ? 6 : 0),
            child: Text(
              lines[i].isEmpty ? ' ' : lines[i],
              style: TextStyle(
                fontSize: 14,
                height: 1.55,
                color: isRootView ? const Color(0xFF2A3D3A) : SehilyColors.petrol,
                fontWeight: lines[i].trim().endsWith(':') && !lines[i].trim().startsWith('•')
                    ? FontWeight.w700
                    : FontWeight.w400,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBody({
    required BuildContext context,
    required bool isRoot,
    required String message,
    required StudentHelpStep step,
    required bool loading,
  }) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.88),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isRoot ? Colors.white : SehilyColors.cream,
              borderRadius: BorderRadius.circular(16),
              border: isRoot ? null : Border.all(color: SehilyColors.mint.withValues(alpha: 0.65)),
              boxShadow: isRoot
                  ? [
                      BoxShadow(
                        color: SehilyColors.petrol.withValues(alpha: 0.08),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: _messageText(message, isRootView: isRoot),
          ),
        ),
        if (loading) ...[
          const SizedBox(height: 8),
          const Text(
            'Chargement de vos données…',
            style: TextStyle(fontSize: 12, color: SehilyColors.textSecondary, height: 1.4),
          ),
        ],
        SizedBox(height: isRoot ? 12 : 14),
        ...step.buttons.map((btn) {
          if (isRoot) {
            final iconMeta = _rootMenuIcons[btn.id] ?? _rootMenuIcons['menu-autre']!;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.white,
                elevation: 2,
                shadowColor: SehilyColors.petrol.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _setStep(btn.id),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: iconMeta.bg,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(iconMeta.icon, size: 21, color: iconMeta.fg),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            btn.label,
                            style: const TextStyle(
                              fontSize: 16,
                              height: 1.35,
                              fontWeight: FontWeight.w700,
                              color: SehilyColors.petrol,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }

          final isBack = btn.id == 'back-root';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: OutlinedButton(
              onPressed: () {
                if (btn.route != null) {
                  widget.onNavigate(btn.route!);
                  return;
                }
                _setStep(isBack ? 'root' : btn.id);
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: isBack ? SehilyColors.petrol : SehilyColors.coral,
                backgroundColor: Colors.white,
                side: BorderSide(color: SehilyColors.mint.withValues(alpha: 0.75)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
              child: Text(
                btn.label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  height: 1.35,
                  fontWeight: FontWeight.w600,
                  color: isBack ? SehilyColors.petrol : SehilyColors.coral,
                ),
              ),
            ),
          );
        }),
      ],
    );

    if (isRoot) {
      return ColoredBox(
        color: const Color(0xFFF7F6F2),
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 14, 16, 12 + MediaQuery.paddingOf(context).bottom),
          child: content,
        ),
      );
    }

    return ColoredBox(
      color: Colors.white,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
        children: [content],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ctx = _buildContext();
    final step = _displayStep(_stepId, ctx);
    final isRoot = _stepId == 'root';
    final message = isRoot ? getRootChatbotMessage(_studentPrenom()) : step.message;
    final loading = (_stepId != 'root' && !_stepId.startsWith('menu-')) &&
        (ref.watch(dossiersProvider).isLoading || ref.watch(attestationProvider).isLoading);
    final maxSheetHeight = MediaQuery.sizeOf(context).height * 0.88;

    return Padding(
      padding: EdgeInsets.only(top: MediaQuery.paddingOf(context).top + 8),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxSheetHeight),
          child: Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Color(0xFFF7F6F2),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: isRoot ? MainAxisSize.min : MainAxisSize.max,
              children: [
              Container(
                padding: EdgeInsets.fromLTRB(isRoot ? 16 : 18, 16, 8, 16),
                color: SehilyColors.petrol,
                child: Row(
                  children: [
                    if (isRoot) ...[
                      Container(
                        width: 44,
                        height: 44,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: SehilyColors.mint.withValues(alpha: 0.55),
                          shape: BoxShape.circle,
                        ),
                        child: const Text('🤖', style: TextStyle(fontSize: 22)),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Assistant Sehily',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                            ),
                          ),
                          const SizedBox(height: 3),
                          if (isRoot)
                            Row(
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF4ADE80),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'En ligne',
                                  style: TextStyle(
                                    color: SehilyColors.mint.withValues(alpha: 0.95),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            )
                          else
                            const Text(
                              'Aide étudiant · boutons guidés',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: widget.onClose,
                      icon: const Icon(Icons.close, color: Colors.white, size: 22),
                    ),
                  ],
                ),
              ),
              if (isRoot)
                _buildBody(
                  context: context,
                  isRoot: true,
                  message: message,
                  step: step,
                  loading: loading,
                )
              else
                Expanded(
                  child: _buildBody(
                    context: context,
                    isRoot: false,
                    message: message,
                    step: step,
                    loading: loading,
                  ),
                ),
            ],
          ),
        ),
      ),
      ),
    );
  }
}
