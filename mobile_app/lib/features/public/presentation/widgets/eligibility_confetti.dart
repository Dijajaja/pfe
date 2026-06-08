import 'dart:math';

import 'package:flutter/material.dart';

/// Confetti plein écran — burst court puis disparition.
class EligibilityConfetti extends StatefulWidget {
  const EligibilityConfetti({
    super.key,
    required this.burstId,
    this.onFinished,
  });

  final int burstId;
  final VoidCallback? onFinished;

  @override
  State<EligibilityConfetti> createState() => _EligibilityConfettiState();
}

class _EligibilityConfettiState extends State<EligibilityConfetti> with SingleTickerProviderStateMixin {
  static const _colors = [
    Color(0xFF00E676),
    Color(0xFF00BCD4),
    Color(0xFFFFEB3B),
    Color(0xFFE91E63),
    Color(0xFF9C27B0),
    Color(0xFFFF5722),
    Color(0xFF76FF03),
    Color(0xFF40C4FF),
    Color(0xFFFFD600),
    Color(0xFF7C4DFF),
    Color(0xFFFF1744),
    Color(0xFF18FFFF),
  ];

  late final AnimationController _controller;
  late List<_ConfettiPiece> _pieces;

  @override
  void initState() {
    super.initState();
    _pieces = _buildPieces(widget.burstId);
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..forward().whenComplete(() {
        if (mounted) widget.onFinished?.call();
      });
  }

  @override
  void didUpdateWidget(covariant EligibilityConfetti oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.burstId != widget.burstId) {
      _pieces = _buildPieces(widget.burstId);
      _controller
        ..reset()
        ..forward().whenComplete(() {
          if (mounted) widget.onFinished?.call();
        });
    }
  }

  List<_ConfettiPiece> _buildPieces(int seed) {
    final rng = Random(seed * 7919 + 104729);
    return List.generate(80, (i) {
      final isCircle = rng.nextDouble() > 0.42;
      final w = isCircle ? rng.nextDouble() * 8 + 5 : rng.nextDouble() * 12 + 10;
      final h = isCircle ? w : rng.nextDouble() * 5 + 4;
      return _ConfettiPiece(
        left: rng.nextDouble(),
        startTop: rng.nextDouble() * 0.15 - 0.2,
        delay: rng.nextDouble() * 0.25,
        duration: rng.nextDouble() * 0.9 + 1.4,
        width: w,
        height: h,
        color: _colors[(rng.nextInt(1000) + i) % _colors.length],
        rotation: rng.nextDouble() * 360,
        isCircle: isCircle,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final fadeOut = _controller.value > 0.85 ? (1 - (_controller.value - 0.85) / 0.15).clamp(0.0, 1.0) : 1.0;
          return Opacity(
            opacity: fadeOut,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final h = constraints.maxHeight;
                final w = constraints.maxWidth;
                return Stack(
                  clipBehavior: Clip.none,
                  children: _pieces.map((p) {
                    final t = ((_controller.value - p.delay) / p.duration).clamp(0.0, 1.0);
                    if (t <= 0) return const SizedBox.shrink();
                    final top = (p.startTop + t * 1.35) * h;
                    final drift = sin((t + p.left) * pi * 5) * 22;
                    return Positioned(
                      left: p.left * w + drift,
                      top: top,
                      child: Transform.rotate(
                        angle: (p.rotation + t * 540) * pi / 180,
                        child: Container(
                          width: p.width,
                          height: p.height,
                          decoration: BoxDecoration(
                            color: p.color,
                            shape: p.isCircle ? BoxShape.circle : BoxShape.rectangle,
                            borderRadius: p.isCircle ? null : BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _ConfettiPiece {
  const _ConfettiPiece({
    required this.left,
    required this.startTop,
    required this.delay,
    required this.duration,
    required this.width,
    required this.height,
    required this.color,
    required this.rotation,
    required this.isCircle,
  });

  final double left;
  final double startTop;
  final double delay;
  final double duration;
  final double width;
  final double height;
  final Color color;
  final double rotation;
  final bool isCircle;
}
