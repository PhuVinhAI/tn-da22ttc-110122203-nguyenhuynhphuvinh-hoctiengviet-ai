import 'package:flutter/foundation.dart';

@immutable
class ConversationSummary {
  const ConversationSummary({
    required this.id,
    required this.title,
    required this.updatedAt,
  });

  final String id;
  final String title;
  final DateTime updatedAt;

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    return ConversationSummary(
      id: json['id'] as String,
      title: (json['title'] as String?) ?? '',
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  String get displayTitle => title.isEmpty ? 'New conversation' : title;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConversationSummary &&
          id == other.id &&
          title == other.title &&
          updatedAt == other.updatedAt;

  @override
  int get hashCode => Object.hash(id, title, updatedAt);

  @override
  String toString() =>
      'ConversationSummary(id: $id, title: $title, updatedAt: $updatedAt)';
}

@immutable
class ConversationMessage {
  const ConversationMessage({
    required this.id,
    required this.role,
    required this.content,
    this.interrupted = false,
  });

  final String id;
  final String role;
  final String content;
  final bool interrupted;

  factory ConversationMessage.fromJson(Map<String, dynamic> json) {
    return ConversationMessage(
      id: json['id'] as String,
      role: json['role'] as String,
      content: (json['content'] as String?) ?? '',
      interrupted: (json['interrupted'] as bool?) ?? false,
    );
  }

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
  bool get isTool => role == 'tool';
  bool get hasVisibleContent => content.trim().isNotEmpty;
  bool get isVisibleInConversationHistory =>
      isUser || (isAssistant && (hasVisibleContent || interrupted));

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConversationMessage &&
          id == other.id &&
          role == other.role &&
          content == other.content &&
          interrupted == other.interrupted;

  @override
  int get hashCode => Object.hash(id, role, content, interrupted);
}
