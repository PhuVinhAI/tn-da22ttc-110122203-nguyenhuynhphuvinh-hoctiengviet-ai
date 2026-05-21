import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import '../../domain/correction.dart';

class CorrectionTextSpanBuilder {
  CorrectionTextSpanBuilder._();

  static List<TextSpan> build({
    required String text,
    required List<Correction> corrections,
    required Color errorColor,
    required Color warningColor,
    required TextStyle baseStyle,
    required void Function(int correctionIndex)? onCorrectionTap,
  }) {
    if (text.isEmpty) return [];

    if (corrections.isEmpty) {
      return [_plainSpan(text, baseStyle)];
    }

    final sorted = List<Correction>.from(corrections)
      ..sort((a, b) => a.startIndex.compareTo(b.startIndex));

    final merged = _mergeOverlapping(sorted, errorColor, warningColor);

    final spans = <TextSpan>[];
    int cursor = 0;

    for (final range in merged) {
      if (range.start > cursor) {
        spans.add(_plainSpan(text.substring(cursor, range.start), baseStyle));
      }
      spans.add(_correctedSpan(
        text.substring(range.start, range.end),
        range.color,
        baseStyle,
        onCorrectionTap,
        range.correctionIndex,
      ));
      cursor = range.end;
    }

    if (cursor < text.length) {
      spans.add(_plainSpan(text.substring(cursor), baseStyle));
    }

    return spans;
  }

  static List<_MergedRange> _mergeOverlapping(
    List<Correction> sorted,
    Color errorColor,
    Color warningColor,
  ) {
    final result = <_MergedRange>[];

    int start = sorted.first.startIndex;
    int end = sorted.first.endIndex;
    Color color = sorted.first.severity == 'error' ? errorColor : warningColor;
    int correctionIndex = 0;

    for (int i = 1; i < sorted.length; i++) {
      final c = sorted[i];
      final cColor = c.severity == 'error' ? errorColor : warningColor;

      if (c.startIndex <= end) {
        end = end > c.endIndex ? end : c.endIndex;
        if (cColor == errorColor) color = errorColor;
      } else {
        result.add(_MergedRange(start, end, color, correctionIndex));
        start = c.startIndex;
        end = c.endIndex;
        color = cColor;
        correctionIndex = i;
      }
    }

    result.add(_MergedRange(start, end, color, correctionIndex));

    return result;
  }

  static TextSpan _plainSpan(String text, TextStyle baseStyle) {
    return TextSpan(
      text: text,
      style: baseStyle.copyWith(decoration: TextDecoration.none),
    );
  }

  static TextSpan _correctedSpan(
    String text,
    Color decorationColor,
    TextStyle baseStyle,
    void Function(int)? onTap,
    int correctionIndex,
  ) {
    TapGestureRecognizer? recognizer;
    if (onTap != null) {
      recognizer = TapGestureRecognizer()..onTap = () => onTap(correctionIndex);
    }

    return TextSpan(
      text: text,
      style: baseStyle.copyWith(
        decoration: TextDecoration.underline,
        decorationColor: decorationColor,
        decorationThickness: 2,
      ),
      recognizer: recognizer,
    );
  }
}

class _MergedRange {
  const _MergedRange(this.start, this.end, this.color, this.correctionIndex);

  final int start;
  final int end;
  final Color color;
  final int correctionIndex;
}
