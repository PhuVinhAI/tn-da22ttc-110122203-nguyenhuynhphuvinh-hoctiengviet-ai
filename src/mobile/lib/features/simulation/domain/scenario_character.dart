class ScenarioCharacter {
  const ScenarioCharacter({
    required this.id,
    required this.name,
    required this.role,
    required this.personality,
    required this.speechStyle,
    this.avatarKey,
    required this.isPlayable,
  });

  factory ScenarioCharacter.fromJson(Map<String, dynamic> json) {
    return ScenarioCharacter(
      id: json['id'] as String,
      name: json['name'] as String,
      role: json['role'] as String? ?? '',
      personality: json['personality'] as String? ?? '',
      speechStyle: json['speechStyle'] as String? ?? '',
      avatarKey: json['avatarKey'] as String?,
      isPlayable: json['isPlayable'] as bool? ?? true,
    );
  }

  final String id;
  final String name;
  final String role;
  final String personality;
  final String speechStyle;
  final String? avatarKey;
  final bool isPlayable;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'role': role,
        'personality': personality,
        'speechStyle': speechStyle,
        'avatarKey': avatarKey,
        'isPlayable': isPlayable,
      };
}
