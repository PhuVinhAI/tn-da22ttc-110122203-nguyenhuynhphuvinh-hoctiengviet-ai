class Correction {
  const Correction({
    required this.original,
    required this.corrected,
    required this.type,
    required this.severity,
    required this.startIndex,
    required this.endIndex,
  });

  factory Correction.fromJson(Map<String, dynamic> json) {
    return Correction(
      original: json['original'] as String? ?? '',
      corrected: json['corrected'] as String? ?? '',
      type: json['type'] as String? ?? '',
      severity: json['severity'] as String? ?? '',
      startIndex: (json['startIndex'] as num?)?.toInt() ?? 0,
      endIndex: (json['endIndex'] as num?)?.toInt() ?? 0,
    );
  }

  final String original;
  final String corrected;
  final String type;
  final String severity;
  final int startIndex;
  final int endIndex;

  Map<String, dynamic> toJson() => {
        'original': original,
        'corrected': corrected,
        'type': type,
        'severity': severity,
        'startIndex': startIndex,
        'endIndex': endIndex,
      };
}
