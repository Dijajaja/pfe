import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'widgets/public_page_scaffold.dart';

class PublicLandingPage extends StatelessWidget {
  const PublicLandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PublicPageScaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFEFF7F5),
              Color(0xFFF5FAF8),
              Color(0xFFEAF4F0),
            ],
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
          children: [
            const _AnimatedSection(delay: 0, child: _HeroHeadline()),
            const SizedBox(height: 28),
            _AnimatedSection(
              delay: 80,
              child: _HeroSection(
                onEligibility: () => context.push('/eligibilite'),
                onLogin: () => context.push('/login'),
              ),
            ),
            const SizedBox(height: 24),
            const _AnimatedSection(delay: 160, child: _KpiRow()),
            const SizedBox(height: 36),
            const _AnimatedSection(delay: 220, child: _OfficialBanner()),
            const SizedBox(height: 32),
            const _LandingFooter(),
          ],
        ),
      ),
    );
  }
}

// ─── Headline ────────────────────────────────────────────────────────────────

class _HeroHeadline extends StatelessWidget {
  const _HeroHeadline();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 170,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // ── Chapeau 3D positionné en haut à droite ──
          Positioned(
            top: -10,
            right: -20,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Image du chapeau — fond noir supprimé via ColorFilter.matrix
                Transform.rotate(
                  angle: -0.21,
                  child: ColorFiltered(
                    colorFilter: const ColorFilter.matrix(<double>[
                      1, 0, 0, 0, 0, // R
                      0, 1, 0, 0, 0, // G
                      0, 0, 1, 0, 0, // B
                      // A = 3×(R+G+B) − ε : noir → 0, toute couleur → 1
                      3, 3, 3, 0, -0.01,
                    ]),
                    child: Image.asset(
                      'assets/graduation-cap.png',
                      width: 165,
                    ),
                  ),
                ),
                // Badge check flottant au-dessus du chapeau
                Positioned(
                  top: 8,
                  left: 20,
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2E7D72),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2E7D72).withValues(alpha: 0.45),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.check,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Texte (max 60% de largeur pour ne pas chevaucher l'image) ──
          Positioned(
            top: 10,
            left: 0,
            right: 170,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: const TextSpan(
                    style: TextStyle(
                      color: Color(0xFF1B4D4A),
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      height: 1.18,
                      letterSpacing: -0.5,
                    ),
                    children: [
                      TextSpan(text: 'Votre bourse,\n'),
                      TextSpan(
                        text: 'notre\nengagement',
                        style: TextStyle(
                          color: Color(0xFF2E7D72),
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Une plateforme digitale moderne pour simplifier vos démarches.',
                  style: TextStyle(
                    color: Color(0xFF3A5552),
                    fontSize: 13,
                    height: 1.55,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── CTA Card ────────────────────────────────────────────────────────────────

class _HeroSection extends StatelessWidget {
  const _HeroSection({required this.onEligibility, required this.onLogin});

  final VoidCallback onEligibility;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return _GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF2E7D72).withValues(alpha: 0.18),
                      const Color(0xFF2E7D72).withValues(alpha: 0.08),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.verified_user_outlined, color: Color(0xFF2E7D72), size: 26),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Vérifiez votre éligibilité',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1B4D4A),
                        fontSize: 16,
                        height: 1.2,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'C\'est rapide, gratuit et sécurisé.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF3A5552),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _PressableButton(
            onPressed: onEligibility,
            child: FilledButton.icon(
              onPressed: onEligibility,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2E7D72),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
                shadowColor: Colors.transparent,
              ),
              icon: const Icon(Icons.fact_check_outlined, size: 18),
              label: const Text(
                'Vérifier mon éligibilité',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
          ),
          const SizedBox(height: 10),
          _PressableButton(
            onPressed: onLogin,
            child: OutlinedButton(
                    onPressed: onLogin,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF1B4D4A),
                      side: const BorderSide(color: Color(0xFF2E7D72), width: 1.2),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.person_outline, size: 17, color: Color(0xFF2E7D72)),
                        SizedBox(width: 8),
                        Text(
                          'Se connecter',
                          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward, size: 15, color: Color(0xFF2E7D72)),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────

class _KpiRow extends StatelessWidget {
  const _KpiRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(child: _KpiCard(icon: Icons.timer_outlined, title: 'Gain de temps', sub: 'Moins de déplacements')),
        SizedBox(width: 10),
        Expanded(child: _KpiCard(icon: Icons.shield_outlined, title: 'Sécurité', sub: 'Données protégées')),
        SizedBox(width: 10),
        Expanded(child: _KpiCard(icon: Icons.trending_up, title: 'Suivi', sub: 'En temps réel')),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.icon, required this.title, required this.sub});

  final IconData icon;
  final String title;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.62),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.7), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2E7D72).withValues(alpha: 0.07),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: const Color(0xFF2E7D72).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 17, color: const Color(0xFF2E7D72)),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF1B4D4A),
                  fontWeight: FontWeight.w700,
                  fontSize: 11.5,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                sub,
                style: const TextStyle(
                  color: Color(0xFF3A5552),
                  fontSize: 10,
                  fontWeight: FontWeight.w400,
                  height: 1.4,
                ),
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Official banner ──────────────────────────────────────────────────────────

class _OfficialBanner extends StatelessWidget {
  const _OfficialBanner();

  @override
  Widget build(BuildContext context) {
    return _GlassCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF2E7D72).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.workspace_premium_outlined, color: Color(0xFF2E7D72), size: 24),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Plateforme officielle de gestion des bourses universitaires en Mauritanie.',
                  style: TextStyle(
                    color: Color(0xFF1B4D4A),
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Simplifier, sécuriser, accompagner.',
                  style: TextStyle(
                    color: Color(0xFF3A5552),
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Footer ───────────────────────────────────────────────────────────────────

class _LandingFooter extends StatelessWidget {
  const _LandingFooter();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Divider(color: Color(0x142E7D72), thickness: 1),
        SizedBox(height: 14),
        Text(
          '© 2026 SEHILY — Plateforme officielle des bourses de Mauritanie.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF7A9E9C), fontSize: 11.5, height: 1.45, fontWeight: FontWeight.w400),
        ),
      ],
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

/// Carte glassmorphism réutilisable.
class _GlassCard extends StatelessWidget {
  const _GlassCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.72),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.8), width: 1.4),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2E7D72).withValues(alpha: 0.08),
                blurRadius: 24,
                spreadRadius: 0,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Effet de pression sur les boutons (scale + opacité).
class _PressableButton extends StatefulWidget {
  const _PressableButton({required this.onPressed, required this.child});

  final VoidCallback onPressed;
  final Widget child;

  @override
  State<_PressableButton> createState() => _PressableButtonState();
}

class _PressableButtonState extends State<_PressableButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 90));
    _scale = Tween<double>(begin: 1.0, end: 0.965).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) => _ctrl.reverse(),
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}

/// Animation d'entrée fade + slide vers le haut.
class _AnimatedSection extends StatefulWidget {
  const _AnimatedSection({required this.child, this.delay = 0});

  final Widget child;
  final int delay;

  @override
  State<_AnimatedSection> createState() => _AnimatedSectionState();
}

class _AnimatedSectionState extends State<_AnimatedSection>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}
