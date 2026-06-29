import 'correction.dart';

class MessageFeedback {
  const MessageFeedback({
    required this.corrections,
    this.review,
    required this.reviewAvailable,
  });

  factory MessageFeedback.fromJson(Map<String, dynamic> json) {
    return MessageFeedback(
      corrections: (json['corrections'] as List<dynamic>?)
              ?.map((e) => Correction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      review: json['review'] as String?,
      reviewAvailable: json['reviewAvailable'] as bool? ?? false,
    );
  }

  final List<Correction> corrections;
  final String? review;
  final bool reviewAvailable;

  Map<String, dynamic> toJson() => {
        'corrections': corrections.map((e) => e.toJson()).toList(),
        'review': review,
        'reviewAvailable': reviewAvailable,
      };
}
