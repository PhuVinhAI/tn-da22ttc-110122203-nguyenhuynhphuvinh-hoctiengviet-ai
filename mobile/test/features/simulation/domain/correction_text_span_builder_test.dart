import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:linvnix/features/simulation/domain/correction.dart';
import 'package:linvnix/features/simulation/presentation/widgets/correction_text_span_builder.dart';

void main() {
  group('CorrectionTextSpanBuilder', () {
    test('no corrections returns single plain TextSpan', () {
      final spans = CorrectionTextSpanBuilder.build(
        text: 'Hello world',
        corrections: const [],
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(1));
      final span = spans.first;
      expect(span.text, 'Hello world');
      expect(span.style?.decoration, TextDecoration.none);
    });

    test('single error correction creates underlined span with error color', () {
      const corrections = [
        Correction(
          original: 'Helo',
          corrected: 'Hello',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 4,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Helo world',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));

      final correctedSpan = spans.first;
      expect(correctedSpan.text, 'Helo');
      expect(correctedSpan.style?.decoration, TextDecoration.underline);
      expect(correctedSpan.style?.decorationColor, Colors.red);
      expect(correctedSpan.style?.decorationThickness, 2);

      final normalSpan = spans.last;
      expect(normalSpan.text, ' world');
      expect(normalSpan.style?.decoration, TextDecoration.none);
    });

    test('single warning correction creates underlined span with warning color', () {
      const corrections = [
        Correction(
          original: 'helo',
          corrected: 'hello',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 0,
          endIndex: 4,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'helo there',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));

      final correctedSpan = spans.first;
      expect(correctedSpan.text, 'helo');
      expect(correctedSpan.style?.decoration, TextDecoration.underline);
      expect(correctedSpan.style?.decorationColor, Colors.amber);
      expect(correctedSpan.style?.decorationThickness, 2);
    });

    test('overlapping corrections are merged into single span with error color', () {
      const corrections = [
        Correction(
          original: 'Hel',
          corrected: 'Hello',
          type: 'SPELLING',
          severity: 'warning',
          startIndex: 0,
          endIndex: 3,
        ),
        Correction(
          original: 'lo',
          corrected: 'llo',
          type: 'GRAMMAR',
          severity: 'error',
          startIndex: 2,
          endIndex: 4,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Hello world',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));

      final mergedSpan = spans.first;
      expect(mergedSpan.text, 'Hell');
      expect(mergedSpan.style?.decoration, TextDecoration.underline);
      expect(mergedSpan.style?.decorationColor, Colors.red);

      final normalSpan = spans.last;
      expect(normalSpan.text, 'o world');
    });

    test('correction at start of text', () {
      const corrections = [
        Correction(
          original: 'Ab',
          corrected: 'A',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 2,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Abc def',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));
      expect((spans[0]).text, 'Ab');
      expect((spans[1]).text, 'c def');
    });

    test('correction at end of text', () {
      const corrections = [
        Correction(
          original: 'ef',
          corrected: 'f',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 5,
          endIndex: 7,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Abc def',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));
      expect((spans[0]).text, 'Abc d');
      expect((spans[1]).text, 'ef');
    });

    test('adjacent corrections are kept separate', () {
      const corrections = [
        Correction(
          original: 'Ab',
          corrected: 'A',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 2,
        ),
        Correction(
          original: 'd',
          corrected: 'D',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 3,
          endIndex: 4,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Abcd ef',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(4));
      expect((spans[0]).text, 'Ab');
      expect((spans[0]).style?.decorationColor, Colors.red);
      expect((spans[1]).text, 'c');
      expect((spans[1]).style?.decoration, TextDecoration.none);
      expect((spans[2]).text, 'd');
      expect((spans[2]).style?.decorationColor, Colors.amber);
      expect((spans[3]).text, ' ef');
    });

    test('empty text returns empty span list', () {
      final spans = CorrectionTextSpanBuilder.build(
        text: '',
        corrections: const [],
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, isEmpty);
    });

    test('mixed severities across multiple corrections', () {
      const corrections = [
        Correction(
          original: 'toi',
          corrected: 'tôi',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 3,
        ),
        Correction(
          original: 'viet',
          corrected: 'viết',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 8,
          endIndex: 12,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'toi ban viet nam',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(4));
      expect((spans[0]).text, 'toi');
      expect((spans[0]).style?.decorationColor, Colors.red);
      expect((spans[1]).text, ' ban ');
      expect((spans[1]).style?.decoration, TextDecoration.none);
      expect((spans[2]).text, 'viet');
      expect((spans[2]).style?.decorationColor, Colors.amber);
      expect((spans[3]).text, ' nam');
      expect((spans[3]).style?.decoration, TextDecoration.none);
    });

    test('onCorrectionTap is attached to corrected spans', () {
      const corrections = [
        Correction(
          original: 'err',
          corrected: 'ok',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 3,
        ),
      ];

      int? tappedIndex;
      final spans = CorrectionTextSpanBuilder.build(
        text: 'err rest',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: (index) => tappedIndex = index,
      );

      final correctedSpan = spans.first;
      expect(correctedSpan.recognizer, isNotNull);
      expect(correctedSpan.recognizer, isA<TapGestureRecognizer>());

      expect(tappedIndex, isNull);
      (correctedSpan.recognizer as TapGestureRecognizer).onTap!();
      expect(tappedIndex, 0);

      final normalSpan = spans.last;
      expect(normalSpan.recognizer, isNull);
    });

    test('corrections sorted by startIndex', () {
      const corrections = [
        Correction(
          original: 'nam',
          corrected: 'Nam',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 8,
          endIndex: 11,
        ),
        Correction(
          original: 'toi',
          corrected: 'tôi',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 3,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'toi ban nam',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(3));
      expect((spans[0]).text, 'toi');
      expect((spans[0]).style?.decorationColor, Colors.red);
      expect((spans[1]).text, ' ban ');
      expect((spans[1]).style?.decoration, TextDecoration.none);
      expect((spans[2]).text, 'nam');
      expect((spans[2]).style?.decorationColor, Colors.amber);
    });

    test('fully overlapping corrections merge to larger range', () {
      const corrections = [
        Correction(
          original: 'Hello',
          corrected: 'Hi',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 5,
        ),
        Correction(
          original: 'el',
          corrected: 'i',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 1,
          endIndex: 3,
        ),
      ];

      final spans = CorrectionTextSpanBuilder.build(
        text: 'Hello world',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: null,
      );

      expect(spans, hasLength(2));
      expect((spans[0]).text, 'Hello');
      expect((spans[0]).style?.decorationColor, Colors.red);
      expect((spans[1]).text, ' world');
    });

    test('onCorrectionTap callback receives correction index after merge', () {
      const corrections = [
        Correction(
          original: 'ab',
          corrected: 'a',
          type: 'SPELLING',
          severity: 'error',
          startIndex: 0,
          endIndex: 2,
        ),
        Correction(
          original: 'bc',
          corrected: 'b',
          type: 'GRAMMAR',
          severity: 'warning',
          startIndex: 1,
          endIndex: 3,
        ),
      ];

      int? tappedIndex;
      final spans = CorrectionTextSpanBuilder.build(
        text: 'abcd',
        corrections: corrections,
        errorColor: Colors.red,
        warningColor: Colors.amber,
        baseStyle: const TextStyle(fontSize: 14),
        onCorrectionTap: (index) => tappedIndex = index,
      );

      final mergedSpan = spans.first;
      (mergedSpan.recognizer as TapGestureRecognizer).onTap!();
      expect(tappedIndex, 0);
    });
  });
}
